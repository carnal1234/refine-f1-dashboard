import React from 'react';
import { Line, LineConfig } from '@ant-design/plots';
import { Card } from 'antd';

interface GearGraphProps {
    telemetryData: Array<any>;
    driverTeamColorMap: any;
    driverAcronymMap: Record<string, number>;
    driverData: Array<any>;
    selectedDrivers: Record<string, boolean>;
    isLoading: boolean;
}

const GearGraph: React.FC<GearGraphProps> = ({
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
        xField: "distance",
        yField: "gear",
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
        yAxis: {
            label: { formatter: (v: any) => `${v}` },
            title: {
                text: "Gear",
                description: "Gear",
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
            fields: ['gear', 'driver_code'],
            formatter: (datum: any) => {
                return {
                    name: `${datum.driver_code}`,
                    value: `${datum.gear}`
                };
            }
        },
        appendPadding: [10, 10, 10, 10],
    };

    return (
        <Card
            title=""
            style={{
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
            bodyStyle={{ padding: 0 }}
        >
            <Line {...lineConfig} height={300} loading={isLoading} />
        </Card>
    );
};

export default GearGraph;
