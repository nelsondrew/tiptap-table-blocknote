import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'
import rison from 'rison';
import { SupersetClient } from '@superset-ui/core';

import MentionList from './MentionList.jsx'
import './styles.css'

export default {
    items: ({ query }) => {
        return [
          {
            name: "TOTAL HEADCOUNT",
            query: "Select count(DISTINCT IFF(\"Status\"='Active'  or \"Status\"='Leave Of Absence',\"Id\",NULL)) AS \"Total Headcount\" from TR_EMPLOYEE_SF_DS WHERE CHECK_DATE IN ( SELECT IFF( IFF('2025-01-01T23:59:59'!='None',DATEADD(DAY,-1,CAST('2025-01-01T23:59:59' AS DATE)),NULL)  < CAST(wfa_hris_data_last_sync_date_time AS DATE),IFF('2025-01-01T23:59:59'!='None',DATEADD(DAY,-1,CAST('2025-01-01T23:59:59' AS DATE)),NULL),CAST(wfa_hris_data_last_sync_date_time AS DATE))  as End_Date from pa_am_core_org_meta_sf_ds where true and Check_Date in (select max(Check_Date) from pa_am_core_org_meta_sf_ds WHERE(true)))"
          },
          {
            name: "NEW HIRES",
            query: `Select count(DISTINCT IFF("Status"='Active'  or "Status"='Leave Of Absence',"Id",NULL)) AS "Total Headcount",
COUNT (DISTINCT CASE WHEN ((termination_date is null or  hire_date!=termination_date) and Hire_Date>='2024-01-01T00:00:00' and Hire_Date<'2025-01-01T23:59:59') THEN "Id" ELSE NULL END) AS "New Hires",
COUNT(DISTINCT CASE WHEN (Termination_Date>='2024-01-01T00:00:00' and Termination_Date<'2025-01-01T23:59:59' )THEN ID ELSE NULL END) AS "Total Terminations"
from 
    TR_EMPLOYEE_SF_DS
WHERE CHECK_DATE IN (

        SELECT IFF( IFF('2025-01-01T23:59:59'!='None',DATEADD(DAY,-1,CAST('2025-01-01T23:59:59' AS DATE)),NULL)  < CAST(wfa_hris_data_last_sync_date_time AS DATE),IFF('2025-01-01T23:59:59'!='None',DATEADD(DAY,-1,CAST('2025-01-01T23:59:59' AS DATE)),NULL),CAST(wfa_hris_data_last_sync_date_time AS DATE))  as End_Date
                    from pa_am_core_org_meta_sf_ds
                    where true

                        and Check_Date in
                        (select max(Check_Date)
                        from pa_am_core_org_meta_sf_ds
                        WHERE(
                            true
                            )))`,
          },
          {
            name: "TOTAL PEOPLE INVESTMENT",
            query: `SELECT SUM(IFF(Status in ('Active','Leave Of Absence'),"Target_Rewards_With_Retirements_In_Base",0)) AS "Total People Investment"
from TR_EMPLOYEE_SF_DS WHERE CHECK_DATE IN (SELECT IFF( IFF('2025-01-01T23:59:59'!='None',DATEADD(DAY,-1,CAST('2025-01-01T23:59:59' AS DATE)),NULL)  < CAST(wfa_hris_data_last_sync_date_time AS DATE),IFF('2025-01-01T23:59:59'!='None',DATEADD(DAY,-1,CAST('2025-01-01T23:59:59' AS DATE)),NULL),CAST(wfa_hris_data_last_sync_date_time AS DATE))  as End_Date
                    from pa_am_core_org_meta_sf_ds
                    where true

                        and Check_Date in
                        (select max(Check_Date)
                        from pa_am_core_org_meta_sf_ds
                        WHERE(true)))`
          },
          {
            name: "PER EMPLOYEE AVERAGE",
            query: `SELECT coalesce(DIV0(SUM(IFF(Status in ('Active','Leave Of Absence') ,"Target_Rewards_With_Retirements_In_Base",0)),COUNT(DISTINCT IFF(Status in ('Active','Leave Of Absence')  and "Target_Rewards_With_Retirements_In_Base"!=0,Id,NULL))),0) AS "Per Employee Average" from TR_EMPLOYEE_SF_DS WHERE CHECK_DATE IN (
        SELECT IFF( IFF('2025-01-01T23:59:59'!='None',DATEADD(DAY,-1,CAST('2025-01-01T23:59:59' AS DATE)),NULL)  < CAST(wfa_hris_data_last_sync_date_time AS DATE),IFF('2025-01-01T23:59:59'!='None',DATEADD(DAY,-1,CAST('2025-01-01T23:59:59' AS DATE)),NULL),CAST(wfa_hris_data_last_sync_date_time AS DATE))  as End_Date
                    from pa_am_core_org_meta_sf_ds
                    where true

                        and Check_Date in
                        (select max(Check_Date)
                        from pa_am_core_org_meta_sf_ds
                        WHERE(true)))`
          }

        ]
        // let queryParams = {
        //     "page":0, "page_size":10, "list_count":true,
        //     "filters":[
        //         {"col":"sqlmetric","opr":"metric_all_text","value":query},
        //     ],
        // }
        // queryParams = rison.encode_uri(queryParams);
        // const endPoint = `/api/v1/metrics_catalog/?q=${queryParams}&guide_type=All`;
        // return SupersetClient.get({
        //     endpoint: endPoint,
        // })
        // .then(({ json = {} }) => {
        //     return json.result.map(({id, chart_id, sqlmetric}) => {
        //         return {
        //             id,
        //             name: sqlmetric.metric_name,
        //             sliceId: chart_id,
        //         }
        //     });
        // });
    },
    
    
     

  render: () => {
    let component
    let popup

    return {
      onStart: props => {
        component = new ReactRenderer(MentionList, {
          props,
          editor: props.editor,
        })

        if (!props.clientRect) {
          return
        }

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        })
      },


      onUpdate(props) {
        component.updateProps(props)

        if (!props.clientRect) {
          return
        }

        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        })
      },

      onKeyDown(props) {
        if (props.event.key === 'Escape') {
          popup[0].hide()

          return true
        }

        return component.ref?.onKeyDown(props)
      },

      onExit() {
        popup[0].destroy()
        component.destroy()
      },
    }
  },
}
