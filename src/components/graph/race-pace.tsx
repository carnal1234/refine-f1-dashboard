import { useRef, useState, SetStateAction, useCallback, useEffect, useMemo } from 'react'
import { Line, LineConfig, Violin, ViolinConfig, Column, ColumnConfig, Box, BoxConfig } from '@ant-design/plots'

import { Button, Card, Slider } from "antd";
import { FieldTimeOutlined } from '@ant-design/icons';
import { Text as CustomText } from '../common';
import { Flex, Spin } from "antd";
import { Datum } from "@ant-design/charts";

import { LegendItem } from '@antv/g2plot/node_modules/@antv/g2/lib/interface'
import { ListItem } from '@antv/g2plot/node_modules/@antv/component/lib/types'

import { DriverParams, LapParams, RaceControlParams, StintParams, PitParams, SessionResultParams } from '@/interfaces/openf1';

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
    sessionResultData: Array<SessionResultParams>,
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
    const violinRef = useRef<ChartRef>(null);

    // Memoize callback functions
    const onSliderChange = useCallback((v: SetStateAction<number>) => {
        setState(prev => ({ ...prev, outlierThreshold: v as number }));
    }, []);

    const toggleOutlier = useCallback(() => {
        setState(prev => ({ ...prev, showOutlier: !prev.showOutlier }));
    }, []);

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

    // Create driver finishing position map for sorting
    const driverFinishingPositions = useMemo(() => {
        const positionMap = new Map<string, number>();

        props.sessionResultData.forEach(result => {
            const driverKey = result.driver_number?.toString();
            if (driverKey) {
                // Handle DNF/DNS/DSQ cases
                if (result.position === null || result.position === undefined) {
                    // For drivers who didn't finish, assign a high position number
                    // You can also check for DNF, DNS, DSQ flags if available
                    if (result.dnf || result.dns || result.dsq) {
                        positionMap.set(driverKey, 999); // Place them at the end
                    } else {
                        positionMap.set(driverKey, 999); // Default for null positions
                    }
                } else {
                    positionMap.set(driverKey, result.position);
                }
            }
        });

        return positionMap;
    }, [props.sessionResultData]);

    const processedData = useMemo(() => {
        const driverDataGroupById = props.driverData ? groupBy(props.driverData, i => i.driver_number!) : []
        const stintDataGroupById = props.stintData ? groupBy(props.stintData, i => i.driver_number!) : []
        const pitDataGroupById = props.pitData ? groupBy(props.pitData, i => i.driver_number!) : []
        const raceControlDataGroupById: Record<number | "OTHER", any> = groupBy(props.raceControlData, i => i.driver_number! || "OTHER")

        for (const driver_number in raceControlDataGroupById) {
            raceControlDataGroupById[driver_number] = groupBy(raceControlDataGroupById[driver_number], (i: any) => i.lap_number!)
        }
        const lapData = props.data.filter((i: LapParams) => i.lap_duration !== null)

        const validLapDurations = lapData
            .map(x => x.lap_duration)
            .filter((duration): duration is number => duration !== null && duration !== undefined && duration > 0);

        const minMax = CalcMinMax(validLapDurations);

        const lapDataWithStint: any = lapData.map(data => {
            let lap = data.lap_number!
            let driver_number = data.driver_number!
            let stint = stintDataGroupById[driver_number]?.find(i =>
                i.lap_start && i.lap_end && lap >= i.lap_start && lap <= i.lap_end)
            return Object.assign(data, { stint: stint });
        })

        const validLapData = lapDataWithStint.filter((x: { lap_duration: number | null }) => x.lap_duration !== null && x.lap_duration > 0);

        return {
            validLapData: validLapData,
            minMax: minMax,
            pitDataGroupById: pitDataGroupById,
            driverDataGroupById: driverDataGroupById,
            stintDataGroupById: stintDataGroupById,
            raceControlDataGroupById: raceControlDataGroupById
        }
    }, [props.data, props.driverData, props.stintData, props.pitData, props.raceControlData])

    const graphHeight = 500

    //Memoize filtered data
    const filteredData = useMemo(() => {
        if (state.showOutlier) {
            return processedData.validLapData;
        }

        return processedData.validLapData.filter((x: { lap_duration: number }) => {
            const threshold = processedData.minMax.minValue * (state.outlierThreshold / 100);
            return x.lap_duration >= processedData.minMax.minValue && x.lap_duration <= threshold;
        });
    }, [processedData.validLapData, processedData.minMax, state.showOutlier, state.outlierThreshold]);

    // Memoize safety car annotations - only recalculate when race control data changes
    const safetyCarAnnotations = useMemo(() => {
        return getSafetyCarAnnotation(props.raceControlData);
    }, [props.raceControlData]);

    const validLapMinMax = useMemo(() => {
        return CalcMinMax(filteredData.map((x: any) => x.lap_duration));
    }, [filteredData]);

    // Create violin data with explicit finishing position ordering
    const violinData = useMemo(() => {
        // Get unique driver numbers and sort them by finishing position
        const uniqueDrivers: string[] = [...new Set(filteredData.map((d: any) => d.driver_number?.toString()).filter(Boolean) as string[])];

        const sortedDrivers: string[] = uniqueDrivers.sort((a: string, b: string) => {
            const aPosition = driverFinishingPositions.get(a) || 999;
            const bPosition = driverFinishingPositions.get(b) || 999;
            return aPosition - bPosition;
        });

        console.log('Drivers sorted by finishing position:', sortedDrivers.map((driver: string, index: number) => ({
            position: index + 1,
            driver,
            finishPosition: driverFinishingPositions.get(driver),
            acronym: props.driverAcronym[driver],
            isDNF: driverFinishingPositions.get(driver) === 999
        })));

        // Create a mapping of driver to their finishing position
        const driverToPosition = new Map<string, number>();
        sortedDrivers.forEach((driver: string, index: number) => {
            driverToPosition.set(driver, index + 1);
        });

        // Transform the data to include the finishing position
        return filteredData.map((item: any) => {
            const driverKey = item.driver_number?.toString();
            const position = driverToPosition.get(driverKey) || 999;

            return {
                ...item,
                finish_order: position, // Use finishing order (1, 2, 3, etc.)
                driver_display: driverKey,
                finish_position: driverFinishingPositions.get(driverKey) || 999
            };
        });
    }, [filteredData, driverFinishingPositions, props.driverAcronym]);

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

    const itemTemplate = `<li class="g2-tooltip-list-item" data-index={index} style="list-style-type: none; padding: 0px; margin: 12px 0px;">
    <span class="g2-tooltip-marker" style="background: {color}; width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 8px;"></span>
    <span class="g2-tooltip-name">{name}</span>:
    <span style="max-width: 12px; display: inline-block; margin-left: 10px; float:right; ">{stintCompoundSVG}</span>
    <span class="g2-tooltip-value" style="display: flex; margin-left: 30px;">{value} </span> 
    <span style="display: inline-block; margin-left: 10px; float:right;"><strong style="font-style:italic; color:red;">{isPit}</strong></span>

    </li>`

    const lineConfig: LineConfig = {
        data: filteredData,
        theme: 'dark',
        xField: "lap_number",
        yField: "lap_duration",
        isStack: false,
        seriesField: 'driver_number',
        height: graphHeight,
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
                const pitData = processedData.pitDataGroupById[driverNumber]
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

    const violinConfig: ViolinConfig = {
        data: violinData,
        xField: "finish_order", // Use finishing order
        yField: "lap_duration",
        seriesField: "finish_order",
        yAxis: {
            type: 'linear',
            label: { formatter: (v) => formatSecondsToTime(v) },
            minLimit: state.showOutlier ? Math.round(processedData.minMax.minValue * 0.95) : Math.round(validLapMinMax.minValue * 0.95) ?? null,
            maxLimit: state.showOutlier ? Math.round(processedData.minMax.maxValue * 1.05) : Math.round(validLapMinMax.maxValue * 1.05) ?? null,
        },
        xAxis: {
            type: 'linear',
            label: {
                formatter: (text: string) => {
                    const value = parseInt(text);
                    // Find the driver for this finishing order
                    const sortedDrivers: string[] = [...new Set(filteredData.map((d: any) => d.driver_number?.toString()).filter(Boolean) as string[])]
                        .sort((a: string, b: string) => {
                            const aPos = driverFinishingPositions.get(a) || 999;
                            const bPos = driverFinishingPositions.get(b) || 999;
                            return aPos - bPos;
                        });

                    const driverNumber = sortedDrivers[value - 1] || value.toString();
                    const acronym = props.driverAcronym[driverNumber] || driverNumber;

                    return acronym;
                }
            }
        },
        meta: {
            finish_order: {
                type: 'linear',
                range: [0, 1],
            },
            high: {
                formatter: (v) => formatSecondsToTime(v),
            },
            low: {
                formatter: (v) => formatSecondsToTime(v),
            },
            q1: {
                formatter: (v) => formatSecondsToTime(v),
            },
            q3: {
                formatter: (v) => formatSecondsToTime(v),
            },
            median: {
                formatter: (v) => formatSecondsToTime(v),
            }
        },
        tooltip: {
            title: (title: string, datum: Datum) => {
                // Get sorted drivers (same logic as xAxis formatter)
                const sortedDrivers: string[] = [...new Set(filteredData.map((d: any) => d.driver_number?.toString()).filter(Boolean) as string[])]
                    .sort((a: string, b: string) => {
                        const aPos = driverFinishingPositions.get(a) || 999;
                        const bPos = driverFinishingPositions.get(b) || 999;
                        return aPos - bPos;
                    });

                // Get the finish_order from datum
                const finishOrder = datum.finish_order;
                if (finishOrder && sortedDrivers[finishOrder - 1]) {
                    const driverNumber = sortedDrivers[finishOrder - 1];
                    const acronym = props.driverAcronym[driverNumber] || '';
                    const finishPosition = driverFinishingPositions.get(driverNumber) || 999;

                    // Check if driver didn't finish (DNF, DNS, DSQ or position 999)
                    const isDNF = finishPosition === 999;
                    const dnfIndicator = isDNF ? ' (DNF)' : '';

                    return `${driverNumber} ${acronym}${dnfIndicator}`.trim();
                }

                return 'Driver Stats';
            },
            fields: ['high', 'low', 'q1', 'q3', 'median'],
        },
        theme: 'dark',
        autoFit: true,
        legend: false
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
                <>
                    <Line {...lineConfig} height={graphHeight} ref={chartRef} />
                    <Violin {...violinConfig} height={600} ref={violinRef} />
                </>
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
    sessionResultData: PropTypes.array.isRequired,
    driverAcronym: PropTypes.object.isRequired,
    isLoading: PropTypes.bool.isRequired,
    selectedDrivers: PropTypes.object.isRequired,
    onToolTipChange: PropTypes.func.isRequired
};