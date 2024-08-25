import React from 'react'
import { Line, LineConfig, Bar, BarConfig, ColumnConfig } from '@ant-design/plots'

import { Card, Typography } from "antd";
import { FieldTimeOutlined } from '@ant-design/icons';
import { Text as CustomText } from '../common';
import { Flex, Spin } from "antd";
import { Datum } from "@ant-design/charts";
import { LapParams, PositionParams } from '@/interfaces/openf1';
import { groupBy } from '@/utilities/helper';
import dayjs from 'dayjs'


interface StaringGridMap {
    [key: string]: number
}

export const PositionGraph = (props: {
    positionData: Array<PositionParams>,
    lapData: Array<LapParams>,
    driverAcronym: any,
    isLoading: boolean
}) => {




    const positionDataSortByDate = props.positionData.sort((a, b) => (dayjs(a.date).isAfter(dayjs(b.date)) ? 1 : -1))
    const positionDataGroupByDate = positionDataSortByDate ? groupBy(positionDataSortByDate, i => i.date!) : []
    const lapDataGroupByDriver = groupBy(props.lapData.sort((a, b) => a.lap_number! - b.lap_number!), i => i.driver_number?.toString()!)


    const GetLapFromDateAndDriverNumber = function (driver_number: string, date: string): number {
        if (lapDataGroupByDriver?.length) {
            let arr = lapDataGroupByDriver[driver_number]
            let data = arr?.find((e: LapParams) => e.date_start && e.date_start >= date)

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



    const config: LineConfig = {
        data: updatedPositionDataArr,
        xField: "date",
        yField: "position",
        isStack: false,
        seriesField: "driver_number",
        autoFit: true,

        yAxis: {
            label: {
                formatter: (v) => v
            },
            title: {
                text: "位置",
                description: "Position",
                position: "center",
                autoRotate: true,
            },
            min: 1,
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


        },
        tooltip: {
            title: (title: string, datum: Datum) => {
                return `第 ${datum.lap_number} 圈`
            },
            fields: ['driver_number', 'lap_number', 'date', 'position'],

            formatter: (datum: Datum) => {
                let driverNumber = datum.driver_number
                let name = props.driverAcronym[driverNumber] ? (driverNumber + " " + props.driverAcronym[driverNumber]) : driverNumber
                return {
                    name: name,
                    value: `${datum.position}`
                }
            }
        },

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

