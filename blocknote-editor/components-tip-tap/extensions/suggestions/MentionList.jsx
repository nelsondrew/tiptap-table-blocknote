import './MentionList.css'

import React, {
  forwardRef, useEffect, useImperativeHandle,
  useState,
} from 'react'
import { useSelector} from 'react-redux';

import {
    getChartDataRequest,
} from 'src/components/Chart/chartAction';

import {
    chart as initChart
} from 'src/components/Chart/chartReducer';
import { applyDefaultFormData } from 'src/explore/store';
import { SupersetClient } from '@superset-ui/core';

export default forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const sliceEntities = useSelector(state => state?.sliceEntities);


  // Fetch items when props.items changes
  useEffect(() => {
    if (props.items && typeof props.items.then === 'function') {
      setLoading(true);
      props.items.then((resolvedItems) => {
        setItems(resolvedItems);
        setLoading(false);
      });
    } else {
      setItems(props.items || []);
      setLoading(false);
    }
  }, [props.items]);


  const selectItem = index => {
    const item = items[index]
    if (item) {
        const selectedSlice = sliceEntities?.slices[item.sliceId];

        const endPoint = `/sql_json`;
        return SupersetClient.post({
            endpoint: endPoint,
            jsonPayload: {
              "database_id": 3,
              "json": true,
              "runAsync": false,
              "schema": "am_org_63da27bb0f6b68904dcc7b63",
              "sql": item.query,
              "sql_editor_id": "1656",
              "tab": "Untitled Query 17",
              "tmp_table_name": "",
              "select_as_cta": false,
              "ctas_method": "TABLE",
              "expand_data": true
          },
        }).then(({ json = {} }) => {
          const res = json.data[0]
          if(res.length == 0) {
            return;
          }
          props.command({ id: res[item.name].toFixed(2), label: item.name });
      });


        // if(selectedSlice == null) {
        //     props.command({label: "Invalid metric"});
        //     return
        // }
        // const form_data = {
        //     ...selectedSlice.form_data,
        //     slice_id: item.sliceId,
        // };
        // const newChart = {
        //     ...initChart,
        //     id: item.sliceId,
        //     form_data: applyDefaultFormData(form_data),
        // };
        // const chartRequest = getChartDataRequest({
        //     formData: newChart.form_data,
        // });
        
        
        // chartRequest.then((resp) => {
        //     const ob = resp.json.result[0].data.find((it) => it[item.name])
        //     props.command({ id: 0, label: `${item.name}:${ob[item.name]}` });
        // })
    }
  }

  const upHandler = () => {
    setSelectedIndex((selectedIndex + items.length - 1) % items.length)
  }

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % items.length)
  }

  const enterHandler = () => {
    selectItem(selectedIndex)
  }

  useEffect(() => setSelectedIndex(0), [items])

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        upHandler()
        return true
      }

      if (event.key === 'ArrowDown') {
        downHandler()
        return true
      }

      if (event.key === 'Enter') {
        enterHandler()
        return true
      }

      return false
    },
  }))

  return (
    <div className="dropdown-menu">
      {items.length
        ? items.map((item, index) => (
          <button
            className={index === selectedIndex ? 'is-selected' : ''}
            key={index}
            onClick={() => selectItem(index)}
          >
            {item.name} {item.sliceId}
          </button>
        ))
        : <div className="item">No result</div>
      }
    </div>
  )
})
