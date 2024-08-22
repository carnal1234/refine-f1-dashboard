import { Bar, Datum, BarConfig } from '@ant-design/plots-new';
import React from 'react';
import ReactDOM from 'react-dom';
import { useEffect, useState } from "react";
import { StintParams } from '@/interfaces/openf1';

import { Card, Typography } from "antd";
import { FieldTimeOutlined } from '@ant-design/icons';
import { Text as CustomText } from '../common';
import { Flex, Spin } from "antd";



export const StintGraph = (props: { data: any, driverAcronym: any, isLoading: boolean }) => {



    enum COMPOUND {
        "SOFT" = "SOFT",
        "MEDIUM" = "MEDIUM",
        "HARD" = "HARD",
        "INTERMEDIATE" = "INTERMEDIATE",
        "WET" = "WET"
    }

    const compoundOrder = Object.values(COMPOUND);


    const sortedData = props.data
        .filter((d: any) => d.driver_number !== null && d.driver_number !== undefined)
        .sort((a: any, b: any) => compoundOrder.indexOf(a.compound) - compoundOrder.indexOf(b.compound))

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

    const usedStintMap = props?.data.reduce((dataSoFar: dataMap, { compound, ...props }: StintParams) => {

        if (!dataSoFar[compound!]) dataSoFar[compound!] = typeColorMapping[compound as keyof typeof typeColorMapping];
        //driversSoFar[key].push(name_acronym);
        return dataSoFar;
    }, {});

    const colorRange = []

    for (const [compound, color] of Object.entries(typeColorMapping)) {
        if (usedStintMap[compound]) {
            colorRange.push(color)
        }
    }





    const config = {
        data: sortedData,
        yField: 'lap_interval',
        xField: 'driver_number',
        colorField: 'compound',
        stack: false,
        tooltip: {
            // render: (event, { lap_duration, compound }) => <div>Your custom render content here.</div>,
            title: "compound",
            items: [
                {
                    channel: 'lap_interval',
                    field: 'lap_interval',
                    valueFormatter: ((d: any) => {
                        return `Lap ${d[0]} - Lap ${d[1]}`
                    })
                }
            ]
        },
        sort: {
            reverse: false,
            by: 'x',
        },
        scale: {
            color: {
                range: colorRange,
            },
        },
        axis: {
            y: {


            },
            x: {
                labelFormatter: (v: string | number) => {

                    if (props?.driverAcronym[v]) return `${v} ${props.driverAcronym[v]}`
                    else return v
                },
                labelSpacing: 4,
                style: {

                },
            },
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
                        Stint Data
                    </CustomText>
                </div>
            }
        >

            <Bar {...config} />
        </Card>


    );
};

