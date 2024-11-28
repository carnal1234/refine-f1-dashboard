import { forwardRef, Ref, useImperativeHandle, useRef, useState, useEffect, SetStateAction } from 'react'
import { Line, LineConfig, Bar, BarConfig, ColumnConfig, Plot, G2 } from '@ant-design/plots'

import { Button, Card, Slider, Typography } from "antd";
import { FieldTimeOutlined } from '@ant-design/icons';
import { Text as CustomText } from '../common';
import { Flex, Spin } from "antd";
import { Datum } from "@ant-design/charts";

import { LegendItem } from '@antv/g2plot/node_modules/@antv/g2/lib/interface'

import { ListItem } from '@antv/g2plot/node_modules/@antv/component/lib/types'

import { DriverParams, LapParams, RaceControlParams, StintParams, PitParams } from '@/interfaces/openf1';

import { useTelemetry } from "@/context/TelemetryContext";

import { formatSecondsToTime, groupBy } from '@/utilities/helper';

import { Annotation } from '@antv/g2plot/lib/types/annotation'

import { getCompoundComponent } from '../common/tyre';

import { renderToString } from 'react-dom/server';

interface RacePaceGraphProp {
    data: Array<LapParams>,
    driverData: Array<DriverParams>,
    stintData: Array<StintParams>,
    raceControlData: Array<RaceControlParams>,
    pitData: Array<PitParams>,
    driverAcronym: any,
    isLoading: boolean,
    selectedDrivers: Record<string, boolean>,
    onToolTipChange: (lap: number) => void
}



export const RacePaceGraph = (props: RacePaceGraphProp) => {

    const [showOutlier, setShowOutlier] = useState(false)
    const [outlierThreshold, setOutlierThreshold] = useState(110);

    const onSliderChange = (v: SetStateAction<number>) => setOutlierThreshold(v)


    const chartRef = useRef<any>(null)

    const graphHeight = 500

    const driverDataGroupById = props.driverData ? groupBy(props.driverData, i => i.driver_number!) : []

    const stintDataGroupById = props.stintData ? groupBy(props.stintData, i => i.driver_number!) : []

    const pitDataGroupById = props.pitData ? groupBy(props.pitData, i => i.driver_number!) : []


    const raceControlDataGroupById: Record<number | "OTHER", any> = groupBy(props.raceControlData, i => i.driver_number! || "OTHER")

    for (const driver_number in raceControlDataGroupById) {
        raceControlDataGroupById[driver_number] = groupBy(raceControlDataGroupById[driver_number], (i: any) => i.lap_number!)
    }



    const lapData = props.data.filter((i: LapParams) => i.lap_duration !== null)


    //Calculate median 
    function CalcMinMax(someArray: any[]): any {

        if (someArray.length < 4)
            return someArray;

        let values, maxValue, minValue;

        values = someArray.slice().sort((a, b) => a - b);//copy array fast and sort

        minValue = values[0]
        maxValue = values[values.length - 1]

        return { minValue: minValue, maxValue: maxValue }
    }

    //const fastest_lap = lapData.map(x => )


    const minMax = CalcMinMax(lapData.map(x => x.lap_duration))


    const lapDataWithStint: any = lapData.map(data => {
        let lap = data.lap_number!
        let driver_number = data.driver_number!
        let stint = stintDataGroupById[driver_number]?.find(i =>
            i.lap_start && i.lap_end && lap >= i.lap_start && lap <= i.lap_end)
        return Object.assign(data, { stint: stint });

    })

    const data = showOutlier ? lapDataWithStint : lapDataWithStint.filter((x: { lap_duration: number; }) => x.lap_duration >= minMax.minValue && x.lap_duration <= minMax.minValue * outlierThreshold / 100)




    const getSafetyCarAnnotation = (data: Array<RaceControlParams>): Annotation[] => {

        const filter_data = data.filter(i => i.category === "SafetyCar")

        let isSafetyCarDeployed = false
        let safetyCarOutLap: number | undefined = 0
        let safetyCarInLap: number | undefined = 99

        let annotations: Annotation[] = []

        filter_data.map(d => {
            if (d.message === "SAFETY CAR DEPLOYED") {
                isSafetyCarDeployed = true
                safetyCarOutLap = d.lap_number
                if (safetyCarOutLap) {
                    annotations.push(
                        {
                            id: `dataMarker_SC_[${safetyCarOutLap}]`,
                            type: "dataMarker",
                            position: [safetyCarOutLap, 'max'],
                            text: {
                                content: `${d.message} AT LAP ${safetyCarOutLap}`,
                                style: {
                                    fill: 'black'
                                }
                            },

                            direction: 'upward'
                        }

                    )

                }




            }
            else if (d.message === "SAFETY CAR IN THIS LAP") {
                isSafetyCarDeployed = false
                safetyCarInLap = d.lap_number

                if (safetyCarOutLap && safetyCarInLap) {
                    annotations.push(
                        {
                            id: `safetyCar[${safetyCarOutLap} - ${safetyCarInLap}]`,
                            type: "region",
                            start: [safetyCarOutLap, 'min'],
                            end: [safetyCarInLap, 'max'],
                        }
                    )
                }


            }

        })
        return annotations
    }

    const itemTemplate = `<li class="g2-tooltip-list-item" data-index={index} style="list-style-type: none; padding: 0px; margin: 12px 0px;">
    <span class="g2-tooltip-marker" style="background: {color}; width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 8px;"></span>
    <span class="g2-tooltip-name">{name}</span>:
    <span style="max-width: 12px; display: inline-block; margin-left: 10px; float:right; ">{stintCompoundSVG}</span>
    <span class="g2-tooltip-value" style="display: flex; margin-left: 30px;">{value} </span> 
    <span style="display: inline-block; margin-left: 10px; float:right;"><strong style="font-style:italic; color:red;">{isPit}</strong></span>

    </li>`

    const toggleOutlier = function () {
        setShowOutlier(!showOutlier)

    }

    const lineConfig: LineConfig = {
        data: data,
        xField: "lap_number",
        yField: "lap_duration",
        isStack: false,
        seriesField: 'driver_number',
        xAxis: {
            label: { formatter: (v) => v },

            title: {
                text: "圈",
                description: "Lap",
                position: "center",

            },
        },
        yAxis: {
            label: { formatter: (v) => formatSecondsToTime(v) },
            title: {
                text: "圈速(s)",
                description: "圈速(s)",
                position: "bottom",
                style: {
                    fontSize: 12, // 文本大小
                    textAlign: 'center', // 文本对齐方式
                    fill: '#999', // 文本颜色
                    // ...
                }

            },
            min: null
        },
        autoFit: true,
        padding: [80, 100, 80, 80],
        smooth: true,
        legend: {
            position: 'right-top',
            itemName: {
                formatter: function (text: string) {
                    return props.driverAcronym[text] ? (text + " " + props.driverAcronym[text]) : text
                }
            },
            itemValue: {
                formatter: (text: string, item: ListItem, index: number) => { return text }
            },
            selected: props.selectedDrivers,


        },
        interactions: [{
            type: "legend-filter",
            enable: false,
        }],

        tooltip: {
            title: (title: string, datum: Datum) => {
                return `第 ${datum.lap_number} 圈`
            },
            fields: ['driver_number', 'lap_number', 'lap_duration', 'stint'],
            formatter: (datum: Datum) => {
                let driverNumber = datum.driver_number
                let name = props.driverAcronym[driverNumber] ? (driverNumber + " " + props.driverAcronym[driverNumber]) : driverNumber
                // let stint = stintDataGroupById[driverNumber].filter(s => s.)
                let stintCompoundSVG = renderToString(getCompoundComponent(datum.stint.compound))
                let pitData = pitDataGroupById[driverNumber]
                let isPit = pitData?.some(i => i.lap_number === datum.lap_number) ? "In Pit" : ""
                isPit = pitData?.some(i => i.lap_number === datum.lap_number - 1) ? "Out Lap" : isPit
                return {
                    name: name,
                    value: formatSecondsToTime(datum.lap_duration),
                    stintCompoundSVG: stintCompoundSVG,
                    isPit: isPit
                }
            },
            containerTpl: '<div class="g2-tooltip">'
                + '<div class="g2-tooltip-title" style="margin:10px 0;"></div>'
                + '<ul class="g2-tooltip-list"></ul></div>',
            itemTpl: itemTemplate,



        },
        // color: (datum: Datum, defaultColor?: string) => {

        //     let driver_no = datum.driver_number

        //     if (driverDataGroupById[driver_no] && driverDataGroupById[driver_no][0].team_colour) {
        //         return '#' + driverDataGroupById[driver_no][0].team_colour
        //     }

        //     return defaultColor
        // }

        annotations: getSafetyCarAnnotation(props.raceControlData),
        onReady(chart) {
            chart.on('tooltip:change', (ev: any) => {
                let data = ev.data.items && ev.data.items.length > 0 ? ev.data.items[0] : null
                let lap: number = data?.data.lap_number
                props.onToolTipChange(lap)
            })

            chart.on('legend-item:click', (ev: any) => {
                let target = ev.g2
            })



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
            <Button type="primary" onClick={toggleOutlier}> {showOutlier ? `Hide Outlier (>= ${outlierThreshold}%)` : `Show Outlier (>= ${outlierThreshold}%)`} </Button>
            <Slider defaultValue={outlierThreshold} disabled={false} min={110} max={200} onChange={onSliderChange} />

            {props.isLoading ? (
                <Flex align="center" gap="middle" justify="center">
                    <Spin size="large" />
                </Flex>
            ) : (
                <Line {...lineConfig} height={graphHeight} ref={chartRef} />
            )}
        </Card>

    )
}



