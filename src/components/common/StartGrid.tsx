import React, { useMemo } from 'react';
import styled from 'styled-components';
import { DriverParams, PositionParams } from '@/interfaces/openf1';
import { isValidColor } from '@/utilities/helper';
import { useTelemetry } from '@/context/TelemetryContext';
import dayjs from 'dayjs';

interface StartGridProps {
    drivers: DriverParams[];
    positionData: PositionParams[];
    title?: string;
}

interface GridEntryProps {
    position: number;
    driver: DriverParams;
    teamColor: string;
}
//#region StyledComponents

const GridContainer = styled.div`
  background: #2a2a2a;
  border-radius: 8px;
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
`;

const GridTitle = styled.h2`
  color: #fff;
  text-align: center;
  margin-bottom: 20px;
  font-size: 1.5rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.1rem;
`;

const GridLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  max-width: 500px;
  margin: 0 auto;
`;

const GridEntry = styled.div<{ teamColor: string }>`
  display: flex;
  align-items: center;
  background: #fff;
  border: 2px solid #fff;
  border-radius: 4px;
  padding: 8px 12px;
  min-height: 50px;
  position: relative;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
`;

const PositionBox = styled.div`
  width: 30px;
  height: 30px;
  background: #000;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  border-radius: 2px;
  margin-right: 8px;
  flex-shrink: 0;
`;

const TeamColorBar = styled.div<{ teamColor: string }>`
  width: 4px;
  height: 100%;
  background-color: ${props => props.teamColor};
  margin-right: 8px;
  border-radius: 2px;
  flex-shrink: 0;
`;

const DriverName = styled.span`
  color: #000;
  font-weight: bold;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.05rem;
  flex: 1;
`;

//#endregion StyledComponents

const GridEntryComponent: React.FC<GridEntryProps> = ({ position, driver, teamColor }) => {
    return (
        <GridEntry teamColor={teamColor}>
            <PositionBox>{position}</PositionBox>
            <TeamColorBar teamColor={teamColor} />
            <DriverName>{driver.last_name}</DriverName>
        </GridEntry>
    );
};

const StartGrid: React.FC<StartGridProps> = ({ drivers, positionData, title = "Starting Grid" }) => {
    const { driverTeamColorMap } = useTelemetry();

    const { sortedDrivers, driverStartingPositions } = useMemo(() => {
        // Get the earliest position data for each driver to determine starting grid
        const driverStartingPositions = new Map<string, { position: number; date: string }>();

        // Sort position data by date to get chronological order
        const sortedPositionData = [...positionData].sort((a, b) =>
            dayjs(a.date).isBefore(dayjs(b.date)) ? -1 : 1
        );

        // Find the earliest position for each driver
        sortedPositionData.forEach(position => {
            const driverKey = position.driver_number?.toString();
            if (driverKey && position.position && position.date) {
                if (!driverStartingPositions.has(driverKey)) {
                    driverStartingPositions.set(driverKey, {
                        position: position.position,
                        date: position.date
                    });
                }
            }
        });

        // Sort drivers by their starting position
        const sortedDrivers = [...drivers].sort((a, b) => {
            const aKey = a.driver_number?.toString();
            const bKey = b.driver_number?.toString();

            const aStartingPos = aKey ? driverStartingPositions.get(aKey)?.position : 999;
            const bStartingPos = bKey ? driverStartingPositions.get(bKey)?.position : 999;

            return (aStartingPos || 999) - (bStartingPos || 999);
        });

        return { sortedDrivers, driverStartingPositions };
    }, [drivers, positionData]);


    return (
        <GridContainer>
            <GridTitle>{title}</GridTitle>
            <GridLayout>
                {sortedDrivers.map((driver, index) => {
                    const driverKey = driver.driver_number?.toString();

                    // Get the actual starting position from the pre-calculated map
                    const actualPosition = driverKey ? driverStartingPositions.get(driverKey)?.position : index + 1;
                    const position = actualPosition || index + 1;

                    const teamColor = driverKey && driverTeamColorMap[driverKey]
                        ? `#${driverTeamColorMap[driverKey]}`
                        : isValidColor(`#${driver.team_colour}`)
                            ? `#${driver.team_colour}`
                            : "#666666";

                    return (
                        <GridEntryComponent
                            key={driver.driver_number || index}
                            position={position}
                            driver={driver}
                            teamColor={teamColor}
                        />
                    );
                })}
            </GridLayout>
        </GridContainer>
    );
};

export default StartGrid;
