import { Bar, BarConfig } from '@ant-design/plots';
import React, { useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useEffect, useState } from "react";
import { StintParams } from '@/interfaces/openf1';

import { Card, Typography } from "antd";
import { FieldTimeOutlined } from '@ant-design/icons';
import { Text as CustomText } from '../common';
import { Flex, Spin } from "antd";
import { Chart } from '@ant-design/plots-new/es/core/base/chart';

import { Datum } from '@antv/g2plot/lib/types/common'
import { TooltipItem } from '@antv/g2plot/node_modules/@antv/g2/lib/interface'




export const StintGraph = (props: {
    stintData: Array<StintParams>,
    driverAcronym: any,
    isLoading: boolean
}) => {



    enum COMPOUND {
        "SOFT" = "SOFT",
        "MEDIUM" = "MEDIUM",
        "HARD" = "HARD",
        "INTERMEDIATE" = "INTERMEDIATE",
        "WET" = "WET"
    }
    const filterData = useMemo(() => {

        return props.stintData
            .filter((d: any) => d.driver_number !== null
                && d.driver_number !== undefined
            )
            .sort((a: any, b: any) => a.driver_number - b.driver_number)
            ?.map((d: any) => {
                return {
                    ...d,
                    lapNumber: d.lap_end - d.lap_start + 1,
                    lapIntervalForDisplay: [d.lap_start - 0.5 < 0 ? 0 : d.lap_start - 0.5, d.lap_end + 0.5]
                }
            })
    }, [props.stintData])

    useEffect(() => {
        console.log(filterData, filterData?.filter((d: any) => d.driver_number === "1"))
    }, [filterData])


    const typeColorMapping = {
        "SOFT": '#f54842',
        'MEDIUM': '#f5d742',
        'HARD': '#cdcfc6',
        'INTERMEDIATE': '#36ad3e',
        'WET': '#163cc7'
    }

    type dataMap = {
        [key: string]: string | undefined
    }




    const config: BarConfig = {
        data: filterData,
        yField: 'driver_number',
        xField: 'lapIntervalForDisplay',
        seriesField: 'compound',
        // autoFit: true,
        isStack: false,

        // Add white border styling
        barStyle: {
            stroke: '#000',
            strokeWidth: 1
        },
        tooltip: {
            title: "Strategy",
            fields: ['driver_number', 'lap_interval', 'compound', 'lap_start'],
            customItems: (originalItems: TooltipItem[]) => {
                if (originalItems.length > 0) {
                    let driver_number = originalItems[0].data.driver_number;
                    let data = filterData.filter((e: any) => e.driver_number === driver_number);
                    let items = data.map((d: any) => {
                        let color = typeColorMapping[d.compound as keyof typeof typeColorMapping];
                        let interval = `Lap ${d.lap_start} - Lap ${d.lap_end}`;

                        return {
                            color: color,
                            data: d,
                            marker: 'circle', // Change from boolean to string
                            title: "Strategy",
                            name: d.compound,
                            value: interval,
                            mappingData: d
                        };
                    });
                    return items as TooltipItem[]; // Cast to TooltipItem[]
                } else {
                    return originalItems;
                }
            },
        },
        yAxis: {
            label: {

                formatter: (v) => { return `${v} ${props.driverAcronym[v]}` },
            },
        },
        xAxis: {
            title: {
                text: "圈",
                description: "Lap",
                position: "center",

            },
            label: {
                formatter: (v) => { return v }
            }
        },
        interactions: [{
            type: "legend-filter",
            enable: false,
        }],
        color: (datum: Datum, defaultColor?: string) => {
            let color = typeColorMapping[datum.compound as keyof typeof typeColorMapping]
            return datum.compound && color ? color : (defaultColor ? defaultColor : '#fff')
        },

    };
    return (
        <Card
            style={{ height: '100%', marginTop: '10px' }}
            headStyle={{ padding: '8px 16px' }
            }
            bodyStyle={{ padding: '24px 24px 0 24px' }}
            title={
                < div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <FieldTimeOutlined />
                    <CustomText size="sm" style={{ marginLeft: '0.5rem' }}>
                        Stint Data
                    </CustomText>
                </div >
            }
        >

            <Bar {...config} height={500} />
        </Card >


    );
};

