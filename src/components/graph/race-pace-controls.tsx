import React from 'react';
import { Button, Slider } from 'antd';

interface RacePaceControlsProps {
    showOutlier: boolean;
    outlierThreshold: number;
    onOutlierToggle: () => void;
    onThresholdChange: (value: number) => void;
}

export const RacePaceControls: React.FC<RacePaceControlsProps> = ({
    showOutlier,
    outlierThreshold,
    onOutlierToggle,
    onThresholdChange
}) => {
    return (
        <div className="race-pace-controls">
            <Button
                type="primary"
                onClick={onOutlierToggle}
                aria-label="Toggle outlier display"
                role="switch"
                aria-checked={showOutlier}
            >
                {showOutlier ? `Hide Outlier (>= ${outlierThreshold}%)` : `Show Outlier (>= ${outlierThreshold}%)`}
            </Button>
            <Slider
                value={outlierThreshold}
                onChange={onThresholdChange}
                min={110}
                max={200}
                aria-label="Outlier threshold adjustment"
            />
            <style jsx>{`
                .race-pace-controls {
                    margin-bottom: 1rem;
                }
            `}</style>
        </div>
    );
}; 