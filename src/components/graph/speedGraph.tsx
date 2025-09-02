import React from 'react';
import { Line, LineConfig } from '@ant-design/plots';
import { Card } from 'antd';

interface SpeedGraphProps {
    telemetryData: Array<any>;
    driverTeamColorMap: any;
    driverAcronymMap: Record<string, number>;
    driverData: Array<any>;
    selectedDrivers: Record<string, boolean>;
    isLoading: boolean;
}

const SpeedGraph: React.FC<SpeedGraphProps> = ({
    telemetryData,
    driverTeamColorMap,
    driverAcronymMap,
    driverData,
    selectedDrivers,
    isLoading
}) => {
    // Transform data to ensure proper line separation
    const processedData = telemetryData?.map(point => ({
        ...point,
        // Ensure driver_code is always a string
        driver_code: String(point.driver_code || 'UNKNOWN'),
        // Ensure distance is numeric
        distance: Number(point.distance) || 0,
        // Ensure speed is numeric
        speed: Number(point.speed) || 0
    })) || [];

    const lineConfig: LineConfig = {
        data: processedData,
        theme: 'dark',
        xField: "timestamp",
        yField: "speed",
        seriesField: 'driver_code',
        isStack: false,
        autoFit: true,
        padding: [80, 100, 80, 80],
        smooth: true,
        color(datum, defaultColor) {
            const driver_code = datum.driver_code
            const driverNum = driverAcronymMap[driver_code as string]
            const driverColor = driverTeamColorMap[driverNum];
            return driverColor ? `#${driverColor}` : (defaultColor || '#666');
        },
        xAxis: false,
        // xAxis: {
        //     title: {
        //         text: "Distance (m)",
        //         style: {
        //             fontSize: 12,
        //             textAlign: 'center',
        //             fill: '#999',
        //         }
        //     },
        //     label: {
        //         formatter: (v: any) => `${Math.round(Number(v))}m`
        //     }
        // },
        yAxis: {
            label: { formatter: (v: any) => `${v} km/h` },
            title: {
                text: "Speed (km/h)",
                description: "Speed",
                position: "bottom",
                style: {
                    fontSize: 12,
                    textAlign: 'center',
                    fill: '#999',
                }
            },
        },
        interactions: [{
            type: "legend-filter",
            enable: false,
        }],
        legend: {
            position: 'top-right',
            itemName: {
                formatter: (text: string) => text
            },
            selected: selectedDrivers,
            marker: {
                symbol: 'circle',
                style: {
                    r: 4,
                },
            },
        },
        tooltip: {
            showTitle: false,
            fields: ['speed', 'driver_code'],
            formatter: (datum: any) => {
                return {
                    name: `${datum.driver_code}`,
                    value: `${datum.speed} km/h`
                };
            }
        },
        appendPadding: [10, 10, 10, 10],
    };

    // Debug: Log the data structure to see what's happening
    console.log('SpeedGraph telemetryData:', telemetryData);
    console.log('Processed data:', processedData);
    console.log('Unique driver codes:', [...new Set(processedData.map(d => d.driver_code))]);
    console.log('Data sample:', processedData.slice(0, 5));

    return (
        <Card
            title=""
            style={{
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
            bodyStyle={{ padding: 0 }}
        >
            <Line {...lineConfig} height={600} loading={isLoading} />
        </Card>
    );
};

export default SpeedGraph;
