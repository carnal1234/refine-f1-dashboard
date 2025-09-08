import React from 'react';
import SpeedGraph from './speedGraph';
import ThrottleGraph from './throttleGraph';
import BrakeGraph from './brakeGraph';
import DRSGraph from './drsGraph';
import GearGraph from './gearGraph';
import RPMGraph from './rpmGraph';

interface GraphConfig {
    type: string;
    title: string;
    icon?: string;
    component: React.ComponentType<any>;
    order: number;
}

interface GraphFactoryProps {
    telemetryData: Array<any>;
    driverTeamColorMap: any;
    driverAcronymMap: any;
    driverData: Array<any>;
    selectedDrivers: Record<string, boolean>;
    isLoading: boolean;
    enabledGraphs?: string[]; // Optional: allow filtering which graphs to show
}

const graphConfigs: GraphConfig[] = [
    { type: 'speed', title: 'Speed', component: SpeedGraph, order: 1 },
    { type: 'throttle', title: 'Throttle', component: ThrottleGraph, order: 2 },
    { type: 'brake', title: 'Brake', component: BrakeGraph, order: 3 },
    { type: 'rpm', title: 'RPM', component: RPMGraph, order: 4 },
    { type: 'drs', title: 'DRS', component: DRSGraph, order: 5 },
    { type: 'gear', title: 'Gear', component: GearGraph, order: 6 },
];

const GraphFactory: React.FC<GraphFactoryProps> = ({
    telemetryData,
    driverTeamColorMap,
    driverAcronymMap,
    driverData,
    selectedDrivers,
    isLoading,
    enabledGraphs
}) => {
    const commonProps = {
        telemetryData,
        driverTeamColorMap,
        driverAcronymMap,
        driverData,
        selectedDrivers,
        isLoading
    };

    // Filter graphs if enabledGraphs is provided
    const graphsToRender = enabledGraphs
        ? graphConfigs.filter(config => enabledGraphs.includes(config.type))
        : graphConfigs;

    // Sort by order
    const sortedGraphs = graphsToRender.sort((a, b) => a.order - b.order);

    return (
        <>
            {sortedGraphs.map(({ type, component: GraphComponent }) => (
                <GraphComponent
                    key={type}
                    {...commonProps}
                />
            ))}
        </>
    );
};

export default GraphFactory;
