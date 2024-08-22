import React from 'react'
import { Line, LineConfig, Bar, BarConfig, ColumnConfig } from '@ant-design/plots'

import { Card, Typography } from "antd";
import { FieldTimeOutlined } from '@ant-design/icons';
import { Text as CustomText } from '../common';
import { Flex, Spin } from "antd";
import { Datum } from "@ant-design/charts";



export const PositionGraph = (props: { data: any, driverAcronym: any, isLoading: boolean }) => {

    const lapDataProps: LineConfig = {
        data: props.data,
        xField: "lap_number",
        yField: "lap_duration",
        isStack: false,
        seriesField: 'driver_number',


        yAxis: {
            label: { formatter: (v) => `${v}`.replace('_', ' ').replace(/\d{1,3}(?=(\d{3})+$)/g, (s) => `${s},`) },
            title: {
                description: "Lap Time",

            },
            min: null
        },
        xAxis: {
            title: {
                description: "Lap",
            },
        },
        meta: {
            lap_duration: {
                alias: '圈速'
            },
            lap_number: {
                alias: '圈'
            }
        },
        padding: [20, 100, 30, 80],
        legend: {
            position: 'right-top',
            itemName: {
                formatter: function (text: string) {
                    return props.driverAcronym[text] ? (text + " " + props.driverAcronym[text]) : text
                }  // 格式化文本函数
            }

        },
        tooltip: {
            formatter: (datum: Datum) => {
                let driverNumber = datum.driver_number
                let name = props.driverAcronym[driverNumber] ? (driverNumber + " " + props.driverAcronym[driverNumber]) : driverNumber
                return {
                    name: name,
                    value: `${datum.lap_duration}s`
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
                        Race Pace
                    </CustomText>
                </div>
            }
        >
            {props.isLoading ? (
                <Flex align="center" gap="middle" justify="center">
                    <Spin size="large" />
                </Flex>


            ) : (
                // <Line {...lapDataProps} height={500} />
                <></>
            )}

        </Card>

    )
}

