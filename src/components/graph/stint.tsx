import { Bar, BarConfig } from '@ant-design/plots';
import React from 'react';
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




export const StintGraph = (props: { stintData: any, driverAcronym: any, isLoading: boolean }) => {



    enum COMPOUND {
        "SOFT" = "SOFT",
        "MEDIUM" = "MEDIUM",
        "HARD" = "HARD",
        "INTERMEDIATE" = "INTERMEDIATE",
        "WET" = "WET"
    }

    const compoundOrder = Object.values(COMPOUND);


    const sortedData = props.stintData
        .filter((d: any) => d.driver_number !== null && d.driver_number !== undefined)
        .sort((a: any, b: any) => a.driver_number - b.driver_number)
    // .sort((a: any, b: any) => compoundOrder.indexOf(a.compound) - compoundOrder.indexOf(b.compound))

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

    const usedStintMap = props?.stintData.reduce((dataSoFar: dataMap, { compound, ...props }: StintParams) => {

        if (!dataSoFar[compound!]) dataSoFar[compound!] = typeColorMapping[compound as keyof typeof typeColorMapping];
        //driversSoFar[key].push(name_acronym);
        return dataSoFar;
    }, {});





    const config: BarConfig = {
        data: sortedData,
        yField: 'driver_number',
        xField: 'lap_interval',
        seriesField: 'compound',
        // autoFit: true,
        isStack: false,

        tooltip: {
            title: "Strategy",
            fields: ['driver_number', 'lap_interval', 'compound', 'lap_start'],
            customItems: (originalItems: TooltipItem[]) => {
                if (originalItems.length > 0) {
                    let driver_number = originalItems[0].data.driver_number
                    let data = sortedData.filter((e: any) => e.driver_number === driver_number)
                    let items = data.map((d: any) => {
                        let color = typeColorMapping[d.compound as keyof typeof typeColorMapping]
                        let interval = `Lap ${d.lap_start} - Lap ${d.lap_end}`

                        return {
                            color: color,
                            data: d,
                            marker: true,
                            title: "Strategy",
                            name: d.compound,
                            value: interval,

                        }
                    })


                    return items
                } else {
                    return originalItems
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

