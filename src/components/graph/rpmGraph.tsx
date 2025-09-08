import React from 'react';
import { Line, LineConfig } from '@ant-design/plots';
import { Card } from 'antd';

interface RPMGraphProps {
    telemetryData: Array<any>;
    driverTeamColorMap: any;
    driverAcronymMap: Record<string, number>;
    driverData: Array<any>;
    selectedDrivers: Record<string, boolean>;
    isLoading: boolean;
}

const RPMGraph: React.FC<RPMGraphProps> = ({
    telemetryData,
    driverTeamColorMap,
    driverAcronymMap,
    driverData,
    selectedDrivers,
    isLoading
}) => {
    // Transform and sort data to ensure proper overlapping
    const processedData = React.useMemo(() => {
        if (!telemetryData || telemetryData.length === 0) return [];

        // Sort all data by distance first, then by driver to ensure proper ordering
        const sortedData = telemetryData
            .map(point => ({
                ...point,
                driver_code: String(point.driver_code || 'UNKNOWN'),
                distance: Number(point.distance) || 0,
                speed: Number(point.speed) || 0
            }))
            .sort((a, b) => {
                // First sort by distance, then by driver code for consistent ordering
                if (a.distance !== b.distance) {
                    return a.distance - b.distance;
                }
                return a.driver_code.localeCompare(b.driver_code);
            });

        return sortedData;
    }, [telemetryData]);

    const lineConfig: LineConfig = {
        data: processedData,
        theme: 'dark',
        xField: "distance",
        yField: "rpm",
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
        xAxis: {
            type: 'linear',
            nice: true,
            label: null,
            title: null,
        },
        yAxis: {
            label: { formatter: (v: any) => `${v}` },
            title: {
                text: "RPM",
                description: "RPM",
                position: "left",
                style: {
                    fontSize: 12,
                    textAlign: 'center',
                    fill: '#999',
                }
            },
        },
        meta: {
            distance: {
                type: 'linear',
                nice: true,
            },
            rpm: {
                type: 'linear',
                nice: true,
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
            fields: ['rpm', 'driver_code'],
            formatter: (datum: any) => {
                return {
                    name: `${datum.driver_code}`,
                    value: `${datum.rpm} RPM`
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
            <Line {...lineConfig} height={600} loading={isLoading} />
        </Card>
    );
};

export default RPMGraph;
