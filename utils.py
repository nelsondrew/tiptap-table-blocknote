# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.

import json
import logging
import os
from typing import Any

from sqlalchemy.exc import SQLAlchemyError

from superset import db, security_manager
from superset.commands.exceptions import ImportFailedError
from superset.daos.exceptions import DAOCreateFailedError
from superset.models.dashboard import Dashboard, EntityOrgMap
from superset.utils.core import get_user


#customisation
from typing import Dict, Set
from enum import Enum

from flask import g
from sqlalchemy.orm import Session

from superset import appbuilder
from superset.constants import DashboardType, DashboardVizType
from superset.views.utils import is_owner
from superset.views.base import is_user_admin
from superset.commands.dashboard.exceptions import DashboardAccessDeniedError, DashboardOverriteForbiddenError, DashboardCreateForbiddenError
from superset.constants import ADMIN_USER

logger = logging.getLogger(__name__)
aws_env = os.environ["ENVIRONMENT"]


JSON_KEYS = {"position": "position_json", "metadata": "json_metadata"}


def find_chart_uuids(position: dict[str, Any]) -> set[str]:
    return set(build_uuid_to_id_map(position))


def find_native_filter_datasets(metadata: dict[str, Any]) -> set[str]:
    uuids: set[str] = set()
    for native_filter in metadata.get("native_filter_configuration", []):
        targets = native_filter.get("targets", [])
        for target in targets:
            dataset_uuid = target.get("datasetUuid")
            if dataset_uuid:
                uuids.add(dataset_uuid)
    return uuids


def build_uuid_to_id_map(position: dict[str, Any]) -> dict[str, int]:
    return {
        child["meta"]["uuid"]: child["meta"]["chartId"]
        for child in position.values()
        if (
            isinstance(child, dict)
            and "type" in child.keys()
            and child["type"] == "CHART"
            and "uuid" in child["meta"]
        )
    }


def update_inline_metrics_ids(
    inline_metrics_data: dict[str, Any],
) -> dict[str, Any]:
    """
    Update inline metrics data to use new metric IDs and datasource IDs during dashboard import.

    Uses metric UUIDs to find the corresponding metrics in the target environment,
    following the same pattern as charts and datasets. Also updates metric ID references
    within payloads to ensure compatibility with the new metric ID format support.

    Args:
        inline_metrics_data: The inlineMetricsData from dashboard metadata

    Returns:
        Updated inline metrics data with new metric IDs and datasource IDs
    """
    if not inline_metrics_data:
        return inline_metrics_data

    from superset.connectors.sqla.models import SqlMetric, SqlaTable
    from superset.models.metrics_catalog import MetricsCatalog

    # Extract UUIDs from the uuid field in each metric data
    metric_uuids = []
    for key, metric_data in inline_metrics_data.items():
        if isinstance(metric_data, dict) and "uuid" in metric_data:
            metric_uuids.append(str(metric_data["uuid"]))

    # Single query to get all metrics by UUIDs
    metrics_map = {}
    try:
        metrics = db.session.query(SqlMetric).filter(SqlMetric.uuid.in_(metric_uuids)).all()
        # Build a map: uuid -> metric object
        metrics_map = {str(metric.uuid): metric for metric in metrics}
    except Exception as ex:
        logger.error(f"Error querying metrics by UUIDs: {ex}")
        return inline_metrics_data

    # Build a comprehensive metric mapping for ID updates within payloads
    # This will be used to update metric references in the payload data
    all_metrics_map = {}
    try:
        # Get all datasets referenced in the inline metrics
        dataset_ids = set()
        for metric_data in inline_metrics_data.values():
            if isinstance(metric_data, dict):
                # Handle both field names: datasetId (new format) and datasource_id (old format)
                dataset_id = metric_data.get("datasetId") or metric_data.get("datasource_id")
                if dataset_id:
                    dataset_ids.add(dataset_id)

        if dataset_ids:
            # Get all metrics for these datasets to build comprehensive mapping
            all_metrics = db.session.query(SqlMetric).filter(SqlMetric.table_id.in_(dataset_ids)).all()
            # Build maps: old_id -> new_metric_object and old_name -> new_metric_object
            all_metrics_map = {
                metric.id: metric for metric in all_metrics
            }

    except Exception as ex:
        logger.error(f"Error building comprehensive metrics map: {ex}")

    # Query metric catalog information for additional mapping
    metric_catalog_map = {}
    try:
        if metric_uuids:
            # Get metric catalog entries for these metrics
            catalog_entries = db.session.query(MetricsCatalog).join(
                SqlMetric, MetricsCatalog.metric_id == SqlMetric.id
            ).filter(SqlMetric.uuid.in_(metric_uuids)).all()
            
            # Build map: metric_uuid -> catalog_info
            for entry in catalog_entries:
                metric_uuid = str(entry.sqlmetric.uuid)
                metric_catalog_map[metric_uuid] = {
                    'catalog_id': entry.id,
                    'slice_id': entry.chart_id
                }
    except Exception as ex:
        logger.error(f"Error querying metric catalog entries: {ex}")

    updated_metrics = {}

    for key, metric_data in inline_metrics_data.items():
        if not isinstance(metric_data, dict):
            continue

        updated_metric = metric_data.copy()
        
        # Extract the UUID from the uuid field
        metric_uuid = str(metric_data.get("uuid", ""))
        if not metric_uuid:
            logger.warning(f"No uuid field found in metric data for key {key}")
            updated_metrics[key] = updated_metric
            continue
            
        # Get the metric from our map
        metric = metrics_map.get(metric_uuid)
        if metric:
            # Update metric ID and datasource ID with values from target environment
            updated_metric["id"] = metric.id
            updated_metric["datasetId"] = metric.table_id  # Use datasetId for consistency
            updated_metric["datasource_id"] = metric.table_id  # Keep both for backward compatibility
            
            # Update metric catalog information if available
            catalog_info = metric_catalog_map.get(metric_uuid)
            if catalog_info:
                updated_metric["metric_catalog_id"] = catalog_info['catalog_id']
                updated_metric["slice_id"] = catalog_info['slice_id']
            else:
                logger.info(f"no metric catalog entry for inline metric UUID: {metric_uuid}")
                
                # # Update the metric data with the new catalog information
                # updated_metric["metric_catalog_id"] = None
                # updated_metric["slice_id"] = None



            # Update payload datasource references
            if "payload" in updated_metric and isinstance(updated_metric["payload"], dict):
                payload = updated_metric["payload"]

                # Update payload.datasource.id
                if "datasource" in payload and isinstance(payload["datasource"], dict):
                    payload["datasource"]["id"] = metric.table_id

                # Update payload.form_data.datasource (format: "datasource_id__table")
                if "form_data" in payload and isinstance(payload["form_data"], dict):
                    if "datasource" in payload["form_data"]:
                        payload["form_data"]["datasource"] = f"{metric.table_id}__table"

                # Update metric ID references within payload
                # This handles the new metric ID format support: {old_id: "name"} -> {new_id: "name"}
                updated_metric["payload"] = _update_metric_ids_in_payload(
                    payload, all_metrics_map, metric.table_id
                )
        else:
            logger.warning(f"Metric with UUID {metric_uuid} not found in target environment. ")

        # Keep the original key
        updated_metrics[key] = updated_metric

    return updated_metrics


def _update_metric_ids_in_payload(
    payload: dict[str, Any],
    metrics_map: dict[int, Any],
    target_dataset_id: int
) -> dict[str, Any]:
    """
    Update metric ID references within a payload to use new metric IDs.

    Handles the new metric ID format support:
    - Direct ID format: 123 -> new_id
    - ID dictionary format: {123: "name"} -> {new_id: "name"}
    - String format: "name" -> unchanged

    Args:
        payload: The payload dictionary to update
        metrics_map: Map of old_metric_id -> metric_object
        target_dataset_id: The target dataset ID for validation

    Returns:
        Updated payload with new metric IDs
    """
    updated_payload = payload.copy()

    # Update metrics in queries array
    if "queries" in updated_payload:
        for query in updated_payload["queries"]:
            if isinstance(query, dict) and "metrics" in query:
                query["metrics"] = _update_metrics_list(
                    query["metrics"], metrics_map, target_dataset_id
                )

    # Update metrics in form_data
    if "form_data" in updated_payload and isinstance(updated_payload["form_data"], dict):
        form_data = updated_payload["form_data"]
        if "metrics" in form_data:
            form_data["metrics"] = _update_metrics_list(
                form_data["metrics"], metrics_map, target_dataset_id
            )

    return updated_payload


def _update_metrics_list(
    metrics: list[Any],
    metrics_map: dict[int, Any],
    target_dataset_id: int
) -> list[Any]:
    """
    Update a list of metrics to use new metric IDs.

    Args:
        metrics: List of metrics in various formats
        metrics_map: Map of old_metric_id -> metric_object
        target_dataset_id: The target dataset ID for validation

    Returns:
        Updated metrics list with new IDs
    """
    if not isinstance(metrics, list):
        return metrics

    updated_metrics = []

    for metric in metrics:
        if isinstance(metric, int):
            # Direct ID format: 123 -> new_id
            old_metric = metrics_map.get(metric)
            if old_metric and old_metric.table_id == target_dataset_id:
                # Find the corresponding metric in the target dataset
                try:
                    from superset.connectors.sqla.models import SqlMetric
                    new_metric = db.session.query(SqlMetric).filter(
                        SqlMetric.table_id == target_dataset_id,
                        SqlMetric.metric_name == old_metric.metric_name
                    ).first()
                    if new_metric:
                        updated_metrics.append(new_metric.id)
                    else:
                        # Fallback to string format if new metric not found
                        updated_metrics.append(old_metric.metric_name)
                except Exception:
                    # Fallback to string format on error
                    updated_metrics.append(old_metric.metric_name)
            else:
                # Keep original if not found or wrong dataset
                updated_metrics.append(metric)

        elif isinstance(metric, dict) and len(metric) == 1:
            # ID dictionary format: {123: "name"} or {"123": "name"} -> {new_id: "name"}
            old_key = next(iter(metric.keys()))
            metric_name = metric[old_key]

            # Handle both integer and string keys (JSON serialization converts int keys to strings)
            old_id = None
            if isinstance(old_key, int):
                old_id = old_key
            elif isinstance(old_key, str) and old_key.isdigit():
                old_id = int(old_key)

            if old_id is not None:
                old_metric = metrics_map.get(old_id)
                if old_metric and old_metric.table_id == target_dataset_id:
                    # Find the corresponding metric in the target dataset
                    try:
                        from superset.connectors.sqla.models import SqlMetric
                        new_metric = db.session.query(SqlMetric).filter(
                            SqlMetric.table_id == target_dataset_id,
                            SqlMetric.metric_name == old_metric.metric_name
                        ).first()
                        if new_metric:
                            updated_metrics.append({new_metric.id: metric_name})
                        else:
                            # Fallback to string format if new metric not found
                            updated_metrics.append(old_metric.metric_name)
                    except Exception:
                        # Fallback to string format on error
                        updated_metrics.append(old_metric.metric_name)
                else:
                    # Keep original if not found or wrong dataset
                    updated_metrics.append(metric)
            else:
                # Not an ID dictionary, keep as-is
                updated_metrics.append(metric)
        else:
            # String format or other formats: keep as-is
            updated_metrics.append(metric)

    return updated_metrics


def update_editor_json_chart_ids(
    editor_json: dict[str, Any] | list[Any] | None,
    id_map: dict[int, int],
) -> dict[str, Any] | list[Any] | None:
    """
    Recursively update chart IDs in TipTap editor JSON structure.

    This function traverses the nested content structure of a TipTap editor JSON
    and updates chart IDs in chart nodes using the provided ID mapping.

    Args:
        editor_json: The editor JSON structure (can be dict, list, or None)
        id_map: Dictionary mapping old chart IDs to new chart IDs

    Returns:
        Updated editor JSON with new chart IDs
    """
    # Base cases: handle None, non-dict/non-list types
    if editor_json is None:
        return None

    if isinstance(editor_json, list):
        # Recursively process list items
        return [update_editor_json_chart_ids(item, id_map) for item in editor_json]

    if not isinstance(editor_json, dict):
        return editor_json

    # Create a shallow copy to avoid mutating the original
    updated_json = editor_json.copy()

    # Check if this is a chart node and update its chartId
    if (
        updated_json.get("type") == "chart"
        and "attrs" in updated_json
        and isinstance(updated_json["attrs"], dict)
        and "chartData" in updated_json["attrs"]
        and isinstance(updated_json["attrs"]["chartData"], dict)
        and "chartId" in updated_json["attrs"]["chartData"]
    ):
        old_chart_id = updated_json["attrs"]["chartData"]["chartId"]
        if old_chart_id in id_map:
            # Create new attrs and chartData to avoid mutation
            updated_json["attrs"] = updated_json["attrs"].copy()
            updated_json["attrs"]["chartData"] = updated_json["attrs"]["chartData"].copy()
            updated_json["attrs"]["chartData"]["chartId"] = id_map[old_chart_id]
            logger.info(
                f"Updated editorJson chart ID: {old_chart_id} -> {id_map[old_chart_id]}"
            )

    # Recursively process content array if it exists
    if "content" in updated_json:
        if isinstance(updated_json["content"], list):
            updated_json["content"] = [
                update_editor_json_chart_ids(node, id_map)
                for node in updated_json["content"]
            ]
        elif updated_json["content"] is not None:
            # Content exists but is not a list (edge case)
            updated_json["content"] = update_editor_json_chart_ids(
                updated_json["content"], id_map
            )

    # Also check for nested structures in attrs (e.g., flexDiv might have nested content)
    if "attrs" in updated_json and isinstance(updated_json["attrs"], dict):
        updated_json["attrs"] = update_editor_json_chart_ids(updated_json["attrs"], id_map)

    return updated_json


def update_id_refs(  # pylint: disable=too-many-locals
    config: dict[str, Any],
    chart_ids: dict[str, int],
    dataset_info: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    """Update dashboard metadata to use new IDs"""
    fixed = config.copy()

    # build map old_id => new_id
    old_ids = build_uuid_to_id_map(fixed["position"])
    id_map = {
        old_id: chart_ids[uuid] for uuid, old_id in old_ids.items() if uuid in chart_ids
    }

    # fix metadata
    metadata = fixed.get("metadata", {})
    if "timed_refresh_immune_slices" in metadata:
        metadata["timed_refresh_immune_slices"] = [
            id_map[old_id] for old_id in metadata["timed_refresh_immune_slices"]
        ]

    if "filter_scopes" in metadata:
        # in filter_scopes the key is the chart ID as a string; we need to update
        # them to be the new ID as a string:
        metadata["filter_scopes"] = {
            str(id_map[int(old_id)]): columns
            for old_id, columns in metadata["filter_scopes"].items()
            if int(old_id) in id_map
        }

        # now update columns to use new IDs:
        for columns in metadata["filter_scopes"].values():
            for attributes in columns.values():
                attributes["immune"] = [
                    id_map[old_id]
                    for old_id in attributes["immune"]
                    if old_id in id_map
                ]

    if "expanded_slices" in metadata:
        metadata["expanded_slices"] = {
            str(id_map[int(old_id)]): value
            for old_id, value in metadata["expanded_slices"].items()
        }

    if "default_filters" in metadata:
        default_filters = (
            json.loads(metadata["default_filters"])
            if isinstance(metadata["default_filters"], str)
            else metadata["default_filters"]
        )
        metadata["default_filters"] = json.dumps(
            {
                str(id_map[int(old_id)]): value
                for old_id, value in default_filters.items()
                if int(old_id) in id_map
            }
        )

    if "linking_data" in metadata:  #customisation
        metadata["linking_data"] = {
            str(id_map[int(old_id)]): value
            for old_id, value in metadata["linking_data"].items()
            if old_id.isdigit() and int(old_id) in id_map
        }

    # fix position
    position = fixed.get("position", {})
    for child in position.values():
        if (
            isinstance(child, dict)
            and "type" in child.keys()
            and child["type"] == "CHART"
            and "uuid" in child["meta"]
            and child["meta"]["uuid"] in chart_ids
        ):
            child["meta"]["chartId"] = chart_ids[child["meta"]["uuid"]]

    # fix native filter references
    native_filter_configuration = fixed.get("metadata", {}).get(
        "native_filter_configuration", []
    )
    for native_filter in native_filter_configuration:
        targets = native_filter.get("targets", [])
        for target in targets:
            dataset_uuid = target.pop("datasetUuid", None)
            if dataset_uuid:
                target["datasetId"] = dataset_info[dataset_uuid]["datasource_id"]

        scope_excluded = native_filter.get("scope", {}).get("excluded", [])
        if scope_excluded:
            native_filter["scope"]["excluded"] = [
                id_map[old_id] for old_id in scope_excluded if old_id in id_map
            ]

        # Update UUIDs in Charts Scope for native filters
        chart_in_scope = native_filter.get("chartsInScope", [])
        if chart_in_scope:
            native_filter["chartsInScope"] = [
                id_map[old_id] for old_id in chart_in_scope if old_id in id_map
            ]

    #customisation
    # fix chart_configuration references
    # TODO refactor based on symmetric data    # pylint: disable=W0511
    if 'chart_configuration' in metadata:
        # in chart_configuration the key is the chart ID as a string; we need to update
        # them to be the new ID as a string:
        metadata["chart_configuration"] = {
            str(id_map[int(old_id)]): columns
            for old_id, columns in metadata["chart_configuration"].items()
            if int(old_id) in id_map
        }

        # now update columns to use new IDs:
        for filter_map in metadata["chart_configuration"].values():
            if "id" in filter_map and int(filter_map["id"]) in id_map:
                filter_map["id"] = id_map[int(filter_map["id"])]
            if "crossFilters" in filter_map:
                if "chartsInScope" in filter_map["crossFilters"]:
                    filter_map["crossFilters"]["chartsInScope"] = [
                        id_map[old_id]
                        for old_id in filter_map["crossFilters"]["chartsInScope"]
                        if old_id in id_map
                    ]
                if "scope" in filter_map["crossFilters"]:
                    if "excluded" in filter_map["crossFilters"]["scope"]:
                        filter_map["crossFilters"]["scope"]["excluded"] = [
                            id_map[old_id]
                            for old_id in filter_map["crossFilters"]["scope"]["excluded"]
                            if old_id in id_map
                        ]

    # fix inline metrics references for PAGES dashboards
    if "inlineMetricsData" in metadata:
        metadata["inlineMetricsData"] = update_inline_metrics_ids(
            metadata["inlineMetricsData"]
        )

    # fix editorJson chart IDs in PAGES components
    position = fixed.get("position", {})
    for key, value in position.items():
        if (
            isinstance(value, dict)
            and value.get("type") == "PAGES"
            and "meta" in value
            and isinstance(value["meta"], dict)
            and "editorJson" in value["meta"]
        ):
            logger.info(f"Updating editorJson chart IDs in PAGES position key: {key}")
            value["meta"]["editorJson"] = update_editor_json_chart_ids(
                value["meta"]["editorJson"], id_map
            )

    return fixed


def import_dashboard(
    config: dict[str, Any],
    overwrite: bool = False,
    ignore_permissions: bool = False,
    dash_type: Enum = DashboardType.DEFAULT,  #customisation
) -> Dashboard:
    can_write = ignore_permissions or security_manager.can_access(
        "can_write",
        "Dashboard",
    )
    existing = db.session.query(Dashboard).filter_by(uuid=config["uuid"]).first()
    if existing:
        if overwrite and can_write and get_user():
            if not security_manager.can_access_dashboard(existing):
                raise DashboardOverriteForbiddenError()
        elif not overwrite or not can_write:
            return existing
        
        if hasattr(g, "user") and g.user:
            if not (is_owner(existing, g.user) or is_user_admin()):
                raise DashboardAccessDeniedError()
        config["id"] = existing.id
    elif not can_write:
        raise DashboardCreateForbiddenError()
    # TODO (betodealmeida): move this logic to import_from_dict
    config = config.copy()

    # removed in https://github.com/apache/superset/pull/23228
    if "metadata" in config and "show_native_filters" in config["metadata"]:
        del config["metadata"]["show_native_filters"]

    for key, new_name in JSON_KEYS.items():
        if config.get(key) is not None:
            value = config.pop(key)
            try:
                config[new_name] = json.dumps(value)
            except TypeError:
                logger.info("Unable to encode `%s` field: %s", key, value)

    # ADDING ORG_MAPPING AS PART OF BROKER CHANGES AND OPTIMISATION
    try:
        if config.get("dash_viz_type") == "PAGES" and dash_type == DashboardType.STORY_BOARD\
                and config.get("is_template", False) == True:
            config["is_template"] = True
        else:
            config["is_template"] = False
        dashboard = Dashboard.import_from_dict(config, recursive=False)
        if dashboard.id is None:
            db.session.flush()
        if not existing and dash_type == DashboardType.DEFAULT:
            instance_type = os.environ.get("SUPERSET_INSTANCE_TYPE", "local")
            if instance_type == "pp-pa-superset-hrx":
                dashboard_org_mapping = EntityOrgMap()
                dashboard_org_mapping.org_id = g.user.get_org_id()
                dashboard_org_mapping.class_name = 'Dashboard'
                dashboard_org_mapping.obj_id = dashboard.id

                db.session.add(dashboard_org_mapping)
                db.session.commit()
    except SQLAlchemyError as ex:  # pragma: no cover
        db.session.rollback()
        raise DAOCreateFailedError(exception=ex) from ex

    #customisation
    dashboard.dash_type = dash_type
    admin_user = appbuilder.sm.find_user(username=ADMIN_USER)
    if (
        dash_type == DashboardType.STORY_BOARD
        or (admin_user and dashboard.created_by_fk == admin_user.id)
    ):
            dashboard.owners.clear()
            dashboard.owners.append(admin_user)
            dashboard.changed_by_fk = admin_user.id
            dashboard.published = False
    elif dash_type == DashboardType.DEFAULT:
        if user := get_user():
            dashboard.owners.append(user)
    else:
        raise Exception(  # pylint: disable=broad-exception-raised
            "Unknown type of dashboard not allowed"
        )

    return dashboard
