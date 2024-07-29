import { Bar, Datum, BarConfig } from '@ant-design/plots-new';
import React from 'react';
import ReactDOM from 'react-dom';
import { useEffect, useState } from "react";
import { IStint } from '../../interfaces';


export const StintGraph = (props: { data: any, driverAcronym: any }) => {



    enum COMPOUND {
        "SOFT" = "SOFT",
        "MEDIUM" = "MEDIUM",
        "HARD" = "HARD",
        "INTER" = "INTER",
        "WET" = "WET"
    }

    const compoundOrder = Object.values(COMPOUND);


    const sortedData = props.data
        .sort((a: any, b: any) => compoundOrder.indexOf(a.compound) - compoundOrder.indexOf(b.compound))

    const typeColorMapping = {
        "SOFT": '#f54842',
        'MEDIUM': '#f5d742',
        'HARD': '#cdcfc6',
        'INTER': '#36ad3e',
        'WET': '#163cc7'
    }

    type dataMap = {
        [key: string]: string | undefined
    }

    const usedStintMap = props?.data.reduce((dataSoFar: dataMap, { compound, ...props }: IStint) => {

        if (!dataSoFar[compound]) dataSoFar[compound] = typeColorMapping[compound as keyof typeof typeColorMapping];
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
    return <Bar {...config
    } />;
};

