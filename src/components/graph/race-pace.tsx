import { useRef, useState, SetStateAction, useCallback, useEffect } from 'react'
import { Line, LineConfig } from '@ant-design/plots'

import { Button, Card, Slider } from "antd";
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

import PropTypes from 'prop-types';

interface ChartRef {
    getChart: () => any;
    // Add other methods as needed
}

interface RacePaceState {
    showOutlier: boolean;
    outlierThreshold: number;
    error: Error | null;
}

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
    const [state, setState] = useState<RacePaceState>({
        showOutlier: false,
        outlierThreshold: 110,
        error: null
    });

    const chartRef = useRef<ChartRef>(null);

    // Memoize callback functions
    const onSliderChange = useCallback((v: SetStateAction<number>) => {
        setState(prev => ({ ...prev, outlierThreshold: v as number }));
    }, []);

    const toggleOutlier = useCallback(() => {
        setState(prev => ({ ...prev, showOutlier: !prev.showOutlier }));
    }, []);

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
    // Calculate min/max only from valid lap durations
    const validLapDurations = lapData
        .map(x => x.lap_duration)
        .filter((duration): duration is number => duration !== null && duration !== undefined && duration > 0);

    const minMax = CalcMinMax(validLapDurations);
    console.log('Valid lap durations count:', validLapDurations.length);
    console.log('Min/Max:', minMax);


    const lapDataWithStint: any = lapData.map(data => {
        let lap = data.lap_number!
        let driver_number = data.driver_number!
        let stint = stintDataGroupById[driver_number]?.find(i =>
            i.lap_start && i.lap_end && lap >= i.lap_start && lap <= i.lap_end)
        return Object.assign(data, { stint: stint });

    })

    // Filter out null lap_duration values first
    const validLapData = lapDataWithStint.filter((x: { lap_duration: number | null }) => x.lap_duration !== null && x.lap_duration > 0);

    const data = state.showOutlier ? validLapData : validLapData.filter((x: { lap_duration: number }) => {
        const threshold = minMax.minValue * (state.outlierThreshold / 100);
        return x.lap_duration >= minMax.minValue && x.lap_duration <= threshold;
    });

    useEffect(() => {
        console.log('Filtered data count:', data.length);
        console.log('Min/Max values:', minMax);
        console.log('Outlier threshold:', state.outlierThreshold);
        console.log('Threshold calculation:', minMax.minValue * (state.outlierThreshold / 100));

        // Debug lap number mapping
        const lapNumbers = data.map((d: any) => d.lap_number).sort((a: number, b: number) => a - b);
        console.log('Lap numbers in data:', lapNumbers);
        console.log('Unique lap numbers:', [...new Set(lapNumbers)]);

        // Check for gaps in lap numbers
        const gaps = [];
        for (let i = 0; i < lapNumbers.length - 1; i++) {
            if (lapNumbers[i + 1] - lapNumbers[i] > 1) {
                gaps.push(`Gap between ${lapNumbers[i]} and ${lapNumbers[i + 1]}`);
            }
        }
        console.log('Gaps in lap numbers:', gaps);

        console.log('Sample data:', data.slice(0, 5));
    }, [data, minMax, state.outlierThreshold])




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
                                content: `SC`,
                                style: {
                                    fill: 'yellow',
                                    stroke: 'black'
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
                            style: {
                                fill: 'rgba(255, 255, 0, 0.2)', // Slight yellow transparent background
                                stroke: 'rgba(255, 255, 0, 0.5)', // Yellow border
                                lineWidth: 1
                            }
                        },
                        {
                            id: `safetyCarText[${safetyCarOutLap} - ${safetyCarInLap}]`,
                            type: "text",
                            position: [(safetyCarOutLap + safetyCarInLap) / 2, 'middle'],
                            content: 'SC',
                            style: {
                                fill: '#FFD700', // Golden yellow text
                                fontSize: 14,
                                fontWeight: 'bold',
                                textAlign: 'center',
                                textBaseline: 'middle'
                            }
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

    const lineConfig: LineConfig = {
        data: data,
        theme: 'dark',
        xField: "lap_number",
        yField: "lap_duration",
        isStack: false,
        seriesField: 'driver_number',
        xAxis: {
            type: 'linear',
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
            offsetX: 30,
            offsetY: 0,
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
                const driverNumber = datum.driver_number
                const name = props.driverAcronym[driverNumber] ? (driverNumber + " " + props.driverAcronym[driverNumber]) : driverNumber
                const compound = datum.stint?.compound
                const stintCompoundSVG = compound ? renderToString(getCompoundComponent(compound)) : ""
                const pitData = pitDataGroupById[driverNumber]
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

    if (state.error) {
        return <div role="alert" className="error-container">An error occurred: {state.error.message}</div>;
    }

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
            <Button
                type="primary"
                onClick={toggleOutlier}
                aria-label="Toggle outlier display"
                role="switch"
                aria-checked={state.showOutlier}
            >
                {state.showOutlier ? `Hide Outlier (>= ${state.outlierThreshold}%)` : `Show Outlier (>= ${state.outlierThreshold}%)`}
            </Button>
            <Slider
                value={state.outlierThreshold}
                onChange={onSliderChange}
                min={110}
                max={200}
                aria-label="Outlier threshold adjustment"
            />

            {props.isLoading ? (
                <Flex align="center" gap="middle" justify="center">
                    <Spin size="large" />
                </Flex>
            ) : (
                <Line {...lineConfig} height={graphHeight} ref={chartRef} />
            )}
        </Card>
    );
};

// Add prop types validation
RacePaceGraph.propTypes = {
    data: PropTypes.arrayOf(PropTypes.shape({
        lap_duration: PropTypes.number,
        lap_number: PropTypes.number.isRequired,
        driver_number: PropTypes.number.isRequired
    })).isRequired,
    driverData: PropTypes.array.isRequired,
    stintData: PropTypes.array.isRequired,
    raceControlData: PropTypes.array.isRequired,
    pitData: PropTypes.array.isRequired,
    driverAcronym: PropTypes.object.isRequired,
    isLoading: PropTypes.bool.isRequired,
    selectedDrivers: PropTypes.object.isRequired,
    onToolTipChange: PropTypes.func.isRequired
};



