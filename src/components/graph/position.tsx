import React, { useCallback, useMemo } from 'react'
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


    const processedData = useMemo(() => {

        const positionDataSortByDate = props.positionData.sort((a, b) => (dayjs(a.date).isAfter(dayjs(b.date)) ? 1 : -1))
        const positionDataGroupByDate = positionDataSortByDate ? groupBy(positionDataSortByDate, i => i.date!) : []
        const lapDataGroupByDriver = groupBy(props.lapData.sort((a, b) => a.lap_number! - b.lap_number!), i => i.driver_number?.toString()!)
        const startingGrid = positionDataSortByDate.reduce((obj: StaringGridMap, { driver_number, position }) => {
            let key = driver_number?.toString()!
            if (!obj[key]) obj[key] = position!;
            return obj;
        }, {});
        return {
            positionDataSortByDate: positionDataSortByDate,
            positionDataGroupByDate: positionDataGroupByDate,
            lapDataGroupByDriver: lapDataGroupByDriver,
            startingGrid: startingGrid

        }
    }, [props.positionData, props.lapData]);



    const filterData = useMemo(() => {
        // Create sorted copies to avoid mutating original arrays
        const positionDataSortByDate = [...props.positionData].sort((a, b) =>
            dayjs(a.date).isAfter(dayjs(b.date)) ? 1 : -1
        );

        const lapDataSortByLapNumber = [...props.lapData].sort((a, b) =>
            (a.lap_number || 0) - (b.lap_number || 0)
        );

        // Pre-compute lap data lookup for O(1) access
        const lapDataGroupByDriver = groupBy(lapDataSortByLapNumber, i => i.driver_number?.toString()!);

        // Create a more efficient lap lookup function
        const getLapFromDateAndDriverNumber = (driver_number: string, date: string): number => {
            const driverLaps = lapDataGroupByDriver[driver_number];
            if (!driverLaps) return -1;

            // Use binary search for better performance on large datasets
            let left = 0;
            let right = driverLaps.length - 1;
            let result = -1;

            while (left <= right) {
                const mid = Math.floor((left + right) / 2);
                const lap = driverLaps[mid];

                if (lap.date_start && dayjs(lap.date_start).isAfter(dayjs(date))) {
                    result = lap.lap_number || -1;
                    right = mid - 1; // Look for earlier lap
                } else {
                    left = mid + 1;
                }
            }

            return result;
        };

        // Pre-allocate arrays with estimated size for better performance
        const estimatedSize = positionDataSortByDate.length * 20; // Estimate 20 drivers max
        const updatedPositionDataArr: any[] = [];
        updatedPositionDataArr.length = estimatedSize;
        let dataIndex = 0;

        const dateLapMapping = new Map<string, number>();
        let positionMap = { ...processedData.startingGrid };

        // Process data more efficiently
        for (const [date, positionDataArr] of Object.entries(processedData.positionDataGroupByDate)) {
            const session_key = positionDataArr[0].session_key;
            const meeting_key = positionDataArr[0].meeting_key;

            // Update position map in batch
            for (const data of positionDataArr) {
                const key = data.driver_number?.toString();
                if (key) positionMap[key] = data.position!;
            }

            // Create position data for all drivers - avoid nested loops
            const driverEntries = Object.entries(positionMap);
            for (let i = 0; i < driverEntries.length; i++) {
                const [driver_number, position] = driverEntries[i];
                const lap = getLapFromDateAndDriverNumber(driver_number, date);

                if (position === 1) dateLapMapping.set(date, lap);

                // Direct assignment instead of push for better performance
                updatedPositionDataArr[dataIndex++] = {
                    session_key,
                    meeting_key,
                    driver_number,
                    date,
                    position,
                    lap_number: lap
                };
            }
        }

        // Trim array to actual size
        updatedPositionDataArr.length = dataIndex;

        // Optimize finish order calculation
        const lastDate = updatedPositionDataArr[updatedPositionDataArr.length - 1]?.date;
        const finishOrder = updatedPositionDataArr
            .filter(e => e.date === lastDate)
            .sort((a, b) => a.position - b.position);

        return {
            updatedPositionDataArr,
            lastDate,
            finishOrder
        };
    }, [processedData.positionDataGroupByDate, processedData.startingGrid, processedData.lapDataGroupByDriver]);





    const customLegendItem: LegendItem[] = useMemo(() => {
        return filterData.finishOrder.map(i => {
            let color = props.driverTeamColorMap[parseInt(i.driver_number)]

            return {
                name: i.driver_number,
                value: i.position,
                marker: { symbol: 'circle', style: { fill: `#${color}`, r: 5 } },
                unchecked: !props.selectedDrivers[parseInt(i.driver_number)]
            }
        })
    }, [filterData.finishOrder, props.driverTeamColorMap, props.selectedDrivers])


    const config: LineConfig = {
        data: filterData.updatedPositionDataArr,
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
        },
        xAxis: {
            position: "top",
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

