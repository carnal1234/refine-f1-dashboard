import { RaceControlParams } from '@/interfaces/openf1';
import { Annotation } from '@antv/g2plot/lib/types/annotation';

/**
 * Calculates the minimum and maximum values from an array of numbers
 * @param someArray Array of numbers to analyze
 * @returns Object containing minValue and maxValue
 */
export function calcMinMax(someArray: number[]): { minValue: number; maxValue: number } {
    if (someArray.length < 4) {
        return {
            minValue: Math.min(...someArray),
            maxValue: Math.max(...someArray)
        };
    }

    const values = someArray.slice().sort((a, b) => a - b);
    return {
        minValue: values[0],
        maxValue: values[values.length - 1]
    };
}

/**
 * Generates annotations for safety car periods
 * @param data Array of race control messages
 * @returns Array of annotations for the chart
 */
export function getSafetyCarAnnotations(data: RaceControlParams[]): Annotation[] {
    const filterData = data.filter(i => i.category === "SafetyCar");
    const annotations: Annotation[] = [];
    
    let safetyCarOutLap: number | undefined;
    
    filterData.forEach(d => {
        if (d.message === "SAFETY CAR DEPLOYED") {
            safetyCarOutLap = d.lap_number;
            if (safetyCarOutLap) {
                annotations.push({
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
                });
            }
        } else if (d.message === "SAFETY CAR IN THIS LAP" && safetyCarOutLap) {
            const safetyCarInLap = d.lap_number;
            annotations.push({
                id: `safetyCar[${safetyCarOutLap} - ${safetyCarInLap}]`,
                type: "region",
                start: [safetyCarOutLap ?? 0, 'min'],
                end: [safetyCarInLap ?? 0, 'max'],
            });
        }
    });
    return annotations;
}

/**
 * Generates tooltip HTML template
 */
export const tooltipTemplate = `
<li class="g2-tooltip-list-item" data-index={index} style="list-style-type: none; padding: 0px; margin: 12px 0px;">
    <span class="g2-tooltip-marker" style="background: {color}; width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 8px;"></span>
    <span class="g2-tooltip-name">{name}</span>:
    <span style="max-width: 12px; display: inline-block; margin-left: 10px; float:right; ">{stintCompoundSVG}</span>
    <span class="g2-tooltip-value" style="display: flex; margin-left: 30px;">{value} </span> 
    <span style="display: inline-block; margin-left: 10px; float:right;"><strong style="font-style:italic; color:red;">{isPit}</strong></span>
</li>`;

/**
 * Calculates responsive chart height based on viewport width
 */
export function getResponsiveChartHeight(): number {
    if (typeof window === 'undefined') return 500;
    
    const width = window.innerWidth;
    if (width < 768) return 300;
    if (width < 1024) return 400;
    return 500;
}

/**
 * Validates lap data format
 * @param data Array of lap data to validate
 * @throws Error if data is invalid
 */
export function validateLapData(data: any[]): void {
    if (!Array.isArray(data)) {
        throw new Error('Invalid lap data format: expected array');
    }
    
    if (data.some(lap => !lap.lap_number)) {
        throw new Error('Invalid lap data: missing lap numbers');
    }
    
    if (data.some(lap => lap.lap_duration !== null && typeof lap.lap_duration !== 'number')) {
        throw new Error('Invalid lap data: lap duration must be number or null');
    }
} 