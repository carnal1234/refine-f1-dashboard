import { useCustom, useApiUrl } from "@refinedev/core";
import { useParams, useSearchParams } from "react-router-dom";
import { Flex, Row, Col, Spin } from "antd";

import { ListItemProps } from "antd/lib/list";



import { Show, MarkdownField } from "@refinedev/antd";

import { Card, Typography } from "antd";









import { DriverParams, LapParams, PositionParams, RaceControlParams, SessionParams, StintParams, PitParams } from "../../interfaces/openf1";
import { useEffect, useRef, useState } from "react";
import { DollarOutlined, FieldTimeOutlined } from "@ant-design/icons";
import { Text as CustomText } from "../../components/common";
import { Datum } from "@ant-design/charts";
import { StintGraph } from "../../components/graph/stint";
import { RacePaceGraph } from "../../components/graph/race-pace";
import RaceWinnerCard from "../../components/races/winner-card";
import { RacePositionTable } from "../../components/races/position-table";
import DriverAvatar from "../../components/driver-avatar";
import DriverAvatarGroup from "@/components/driver-avatar-group";

import { TelemetryProvider, useTelemetry } from "@/context/TelemetryContext";
import EventCard, { EventCardRef } from "@/components/event-card";
import { PositionGraph } from "@/components/graph/position";





const { Title, Text } = Typography;

interface CustomMap {
    [key: string]: string
}

interface CustomStintMap {
    [key: string]: object
}



const SessionContent = () => {


    const apiUrl = useApiUrl();


    const { session_key } = useParams();

    const [driverData, setDriverData] = useState<Array<DriverParams>>([]);
    const [sessionData, setSessionData] = useState<Array<SessionParams>>([]);
    const [lapData, setLapData] = useState<Array<LapParams>>([]);
    const [stintData, setStintData] = useState<Array<StintParams>>([]);
    const [positionData, setPositionData] = useState<Array<PositionParams>>([]);
    const [raceControlData, setRaceControlData] = useState<Array<RaceControlParams>>([]);
    const [pitData, setPitData] = useState<Array<PitParams>>([]);
    const [isLoading, setIsLoading] = useState(true);

    const {
        isShowDriverSelect, setIsShowDriverSelect,
        //drivers, setDrivers,
        selectedDrivers, setSelectedDrivers,
    } = useTelemetry();

    const raceControlRef = useRef<EventCardRef>(null);




    const toggleDriverSelect = async (driver: DriverParams) => {

        if (!driver) return;

        let driver_no = driver.driver_number?.toString()!
        if (driver_no && selectedDrivers.hasOwnProperty(driver_no)) {
            let value = !selectedDrivers[driver_no]
            setSelectedDrivers({ ...selectedDrivers, [driver_no]: value })
        }
    }

    const onRacePaceToolTipChange = (lap_number: number) => {
        if (lap_number) {
            if (raceControlRef && raceControlRef.current) raceControlRef.current.updateLap(lap_number)
        }
    }







    const driverAcronym = driverData.reduce((driversSoFar: CustomMap, { driver_number, name_acronym }) => {
        let key = driver_number?.toString()!
        if (!driversSoFar[key]) driversSoFar[key] = name_acronym!;
        return driversSoFar;
    }, {});




    const maxLap = Math.max(...stintData.map(d => d.lap_end!), 0);




    useEffect(() => {
        const mode = import.meta.env.MODE










        async function fetchAllData() {
            const [driverResponse, sessionResponse, lapResponse, stintResponse, positionResponse, raceControlResponse, pitResponse] = await Promise.all([
                fetch(`${apiUrl}/drivers?session_key=${session_key}`),
                fetch(`${apiUrl}/sessions?session_key=${session_key}`),
                fetch(`${apiUrl}/laps?session_key=${session_key}`),
                fetch(`${apiUrl}/stints?session_key=${session_key}`),
                fetch(`${apiUrl}/position?session_key=${session_key}`),
                fetch(`${apiUrl}/race_control?session_key=${session_key}`),
                fetch(`${apiUrl}/pit?session_key=${session_key}`),
            ]);

            const driverData = await driverResponse.json();
            const sessionData = await sessionResponse.json();
            const lapData = await lapResponse.json();
            const stintData = await stintResponse.json();
            const positionData = await positionResponse.json();
            const raceControlData = await raceControlResponse.json()
            const pitData = await pitResponse.json()
            return [driverData, sessionData, lapData, stintData, positionData, raceControlData, pitData];
        }



        async function fetchMockData() {
            const [driverData, sessionData, lapData, stintData, positionData, raceControlData, pitData] = await Promise.all([
                await import('@/data/driver.json'),
                await import('@/data/sessions.json'),
                await import('@/data/lap.json'),
                await import('@/data/stint.json'),
                await import('@/data/position.json'),
                await import('@/data/race-control.json'),
                await import('@/data/pit.json'),

            ]);
            return [driverData?.default, sessionData?.default, lapData?.default,
            stintData?.default, positionData?.default, raceControlData?.default, pitData?.default];
        }

        const setAllData = ([driverData, sessionData, lapData, stintData, positionData, raceControlData, pitData]: any) => {
            for (let item of driverData) {
                item['driver_number'] = item['driver_number']?.toString()
            }
            for (let item of lapData) {
                item['driver_number'] = item['driver_number']?.toString()
            }
            for (let item of sessionData) {
                item['driver_number'] = item['driver_number']?.toString()
            }
            for (let item of positionData) {
                item['driver_number'] = item['driver_number']?.toString()
            }
            for (let item of stintData) {
                item['driver_number'] = item['driver_number']?.toString()
                item['lap_interval'] = [item['lap_start'], item['lap_end']]
            }
            for (let item of raceControlData) {
                item['driver_number'] = item['driver_number']?.toString()
            }
            for (let item of pitData) {
                item['driver_number'] = item['driver_number']?.toString()
            }



            setDriverData(driverData);
            setSessionData(sessionData);
            setLapData(lapData)
            setStintData(stintData)
            setPositionData(positionData)
            setRaceControlData(raceControlData)
            setPitData(pitData)

            // sessionStorage.setItem('session', JSON.stringify(meetingData));
            sessionStorage.setItem('session', JSON.stringify(sessionData));
            sessionStorage.setItem('driver', JSON.stringify(driverData));
            sessionStorage.setItem('raceControl', JSON.stringify(raceControlData));
            // sessionStorage.setItem('teamRadio', JSON.stringify(teamRadioData));
            // sessionStorage.setItem('weather', JSON.stringify(weatherData));
            sessionStorage.setItem('stints', JSON.stringify(stintData));
            sessionStorage.setItem('laps', JSON.stringify(lapData));
            // sessionStorage.setItem('intervals', JSON.stringify(intervalData));
            sessionStorage.setItem('positions', JSON.stringify(positionData));







            setIsLoading(false)

            let obj: Record<string, boolean> = {}

            driverData.map((d: DriverParams) => {
                if (d.driver_number) obj[d.driver_number?.toString()] = true
            })

            setSelectedDrivers(obj)
        }



        const cachedSession = sessionStorage.getItem('session');
        const cachedDrivers = sessionStorage.getItem('drivers');
        const cachedRaceControl = sessionStorage.getItem('raceControl');
        //const cachedTeamRadio = sessionStorage.getItem('teamRadio');
        const cachedWeather = sessionStorage.getItem('weather');
        const cachedStints = sessionStorage.getItem('stints');
        const cachedLaps = sessionStorage.getItem('laps');
        const cachedIntervals = sessionStorage.getItem('intervals');
        const cachedPositions = sessionStorage.getItem('positions');


        // if (cachedMeeting) setMeeting(JSON.parse(cachedMeeting));
        if (cachedSession) setSessionData(JSON.parse(cachedSession));
        if (cachedDrivers) setDriverData(JSON.parse(cachedDrivers));
        if (cachedRaceControl) setRaceControlData(JSON.parse(cachedRaceControl));
        // if (cachedTeamRadio) setTeamRadio(JSON.parse(cachedTeamRadio));
        // if (cachedWeather) setWeatherData(JSON.parse(cachedWeather));
        if (cachedStints) setStintData(JSON.parse(cachedStints));
        if (cachedLaps) setLapData(JSON.parse(cachedLaps));
        // if (cachedIntervals) setIntervalData(JSON.parse(cachedIntervals));
        if (cachedPositions) setPositionData(JSON.parse(cachedPositions));


        if (mode === "development") {
            fetchMockData().then(([driverData, sessionData, lapData, stintData, positionData, raceControlData, pitData]) => {

                setAllData([driverData, sessionData, lapData, stintData, positionData, raceControlData, pitData])

            }).catch(error => {
                console.error(error)

            })


        } else {
            fetchAllData().then(([driverData, sessionData, lapData, stintData, positionData, raceControlData, pitData]) => {
                setAllData([driverData, sessionData, lapData, stintData, positionData, raceControlData, pitData])

            }).catch(error => {
                console.error(error)

            })


        }

    }, [session_key]);

    return (
        <>
            <CustomText size="lg" style={{ margin: '1rem', padding: '8px 16px' }}>
                {sessionData[0]?.country_name} {sessionData[0]?.session_type} Data
            </CustomText>
            <div style={{ margin: '1rem', padding: '8px 16px' }}>
                <DriverAvatarGroup drivers={driverData} selectedDrivers={selectedDrivers} toggleDriverSelect={toggleDriverSelect} />
            </div>
            <Row
                gutter={[32, 32]}
                style={{
                    marginTop: '32px',
                    width: '100%'
                }}>
                <Col span={18}>
                    <RacePaceGraph
                        pitData={pitData}
                        stintData={stintData}
                        raceControlData={raceControlData}
                        data={lapData}
                        driverData={driverData}
                        driverAcronym={driverAcronym}
                        isLoading={isLoading}
                        selectedDrivers={selectedDrivers}
                        onToolTipChange={onRacePaceToolTipChange}
                    />

                </Col>
                <Col span={6}  >
                    <EventCard dataList={raceControlData} ref={raceControlRef} driverAcronym={driverAcronym} />

                </Col>
            </Row>

            <Row
                gutter={[32, 32]}
                style={{
                    marginTop: '32px',
                    width: '100%'
                }}>
                <Col span={24}>
                    <StintGraph stintData={stintData} driverAcronym={driverAcronym} isLoading={isLoading} />


                </Col>
            </Row>

            <Row
                gutter={[32, 32]}
                style={{
                    marginTop: '32px',
                    width: '100%'
                }}>
                <Col span={24}>
                    <PositionGraph
                        positionData={positionData}
                        lapData={lapData}
                        driverAcronym={driverAcronym}
                        isLoading={isLoading} />
                </Col>
            </Row>



        </>
    )
}

export const SessionPage: React.FC = () => {
    return (
        <TelemetryProvider>
            <SessionContent />
        </TelemetryProvider>
    );
};





