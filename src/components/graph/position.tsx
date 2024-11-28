import React from 'react'
import { Line, LineConfig, Bar, BarConfig, ColumnConfig } from '@ant-design/plots'

import { Card, Typography } from "antd";
import { FieldTimeOutlined } from '@ant-design/icons';
import { Text as CustomText } from '../common';
import { Flex, Spin } from "antd";
import { Datum } from "@ant-design/charts";
import { DriverParams, LapParams, PositionParams } from '@/interfaces/openf1';
import { groupBy } from '@/utilities/helper';
import dayjs from 'dayjs'

import { LegendItem, TooltipItem } from '@antv/g2plot/node_modules/@antv/g2/lib/interface'


interface StaringGridMap {
    [key: string]: number
}

export const PositionGraph = (props: {
    positionData: Array<PositionParams>,
    lapData: Array<LapParams>,
    driverTeamColorMap: any,
    driverAcronym: any,
    selectedDrivers: Record<string, boolean>,
    isLoading: boolean
}) => {



    const positionDataSortByDate = props.positionData.sort((a, b) => (dayjs(a.date).isAfter(dayjs(b.date)) ? 1 : -1))
    const positionDataGroupByDate = positionDataSortByDate ? groupBy(positionDataSortByDate, i => i.date!) : []
    const lapDataGroupByDriver = groupBy(props.lapData.sort((a, b) => a.lap_number! - b.lap_number!), i => i.driver_number?.toString()!)

    const lastLap = props.lapData[props.lapData.length - 1]?.lap_number

    const GetLapFromDateAndDriverNumber = function (driver_number: string, date: string): number {

        if (lapDataGroupByDriver) {
            let arr = lapDataGroupByDriver[driver_number]



            let data = arr?.find((e: LapParams) => e.date_start && dayjs(e.date_start).isAfter(dayjs(date)))
            return data && data.lap_number ? data.lap_number : -1
        } else {
            return -1
        }
    }







    const startingGrid = positionDataSortByDate.reduce((obj: StaringGridMap, { driver_number, position }) => {
        let key = driver_number?.toString()!
        if (!obj[key]) obj[key] = position!;
        return obj;
    }, {});


    //Convert Data for graph
    let positionMap = { ...startingGrid }
    let updatedPositionDataArr = []
    let dateLapMapping = new Map<string, number>()
    for (const [date, positionDataArr] of Object.entries(positionDataGroupByDate)) {

        //Update Position
        const session_key = positionDataArr[0].session_key
        const meeting_key = positionDataArr[0].meeting_key

        for (const data of positionDataArr) {
            let key = data.driver_number?.toString()!
            if (key) positionMap[key] = data.position!
        }

        //Create Position of All Driver at Specfic Date
        for (const [driver_number, position] of Object.entries(positionMap)) {

            let lap = GetLapFromDateAndDriverNumber(driver_number, date)

            if (position === 1) dateLapMapping.set(date, lap)


            updatedPositionDataArr.push(
                {
                    "session_key": session_key,
                    "meeting_key": meeting_key,
                    "driver_number": driver_number,
                    "date": date,
                    "position": position,
                    "lap_number": lap
                }
            )

        }

    }

    const lastDate = updatedPositionDataArr[updatedPositionDataArr.length - 1].date

    const finishOrder = updatedPositionDataArr.filter(e => e.date === lastDate).sort((a, b) => a.position - b.position)

    const customLegendItem: LegendItem[] = finishOrder.map(i => {
        let color = props.driverTeamColorMap[parseInt(i.driver_number)]

        return {
            name: i.driver_number,
            value: i.position,
            marker: { symbol: 'circle', style: { fill: `#${color}`, r: 5 } },
            unchecked: !props.selectedDrivers[parseInt(i.driver_number)]
        }
    })


    const config: LineConfig = {
        data: updatedPositionDataArr,
        xField: "date",
        yField: "position",
        isStack: false,
        seriesField: "driver_number",
        autoFit: true,
        color(datum, defaultColor) {
            let color = props.driverTeamColorMap[parseInt(datum.driver_number)]
            return color ? `#${color}` : defaultColor!
        },

        yAxis: {
            label: {
                formatter: (v) => v,


            },
            title: {
                text: "位置",
                description: "Position",
                position: "center",
                autoRotate: true,
            },

            min: 1,
            minLimit: 1,
            max: 20,
            tickCount: 2


            // max: props.driverAcronym.length,

            // range: [1, 20]
        },
        xAxis: {
            // title: {
            //     text: "圈",
            //     description: "Lap",
            //     position: "center",
            // },
            position: "top",
            // label: {
            //     formatter: (v) => dateLapMapping.get(v)
            // },
            label: null





        },
        reflect: 'y',

        padding: [20, 100, 30, 80],
        legend: {
            position: 'right-top',
            itemName: {
                formatter: function (text: string) {
                    return props.driverAcronym[text] ? (text + " " + props.driverAcronym[text]) : text
                }  // 格式化文本函数
            },


            custom: true,

            items: customLegendItem,
            selected: props.selectedDrivers,




        },
        tooltip: {
            title: (title: string, datum: Datum) => {
                //console.log(datum)
                return `第 ${datum.lap_number} 圈位置`
            },
            fields: ['driver_number', 'lap_number', 'date', 'position'],

            formatter: (datum: Datum) => {
                let driverNumber = datum.driver_number
                let name = props.driverAcronym[driverNumber] ? (driverNumber + " " + props.driverAcronym[driverNumber]) : driverNumber
                return {
                    name: name,
                    value: `${datum.position}`
                }
            },
            customItems: (originalItems: TooltipItem[]) => {
                return originalItems.sort((a, b) => parseInt(a.value.toString()) - parseInt(b.value.toString()))
            }
        },
        interactions: [{
            type: "legend-filter",
            enable: false,
        }],

    };

    return (
        <Card
            style={{ height: '100%', marginTop: '10px' }}
            headStyle={{ padding: '8px 16px' }}
            bodyStyle={{ padding: '24px 24px 0 24px' }}
            title={
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <FieldTimeOutlined />
                    <CustomText size="sm" style={{ marginLeft: '0.5rem' }}>
                        Position Graph
                    </CustomText>
                </div>
            }
        >
            {props.isLoading ? (
                <Flex align="center" gap="middle" justify="center">
                    <Spin size="large" />
                </Flex>


            ) : (
                <Line {...config} height={600} />
            )}

        </Card>

    )
}

