import { useCustom, useApiUrl } from "@refinedev/core";
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import { Flex, Row, Col, Spin, TabsProps, Tabs } from "antd";

import { ListItemProps } from "antd/lib/list";
import { Show, MarkdownField } from "@refinedev/antd";
import { Card, Typography } from "antd";
import { DriverParams, LapParams, PositionParams, RaceControlParams, SessionParams, StintParams, PitParams, WeatherParams, MeetingParams } from "../../interfaces/openf1";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { fetchDrivers, fetchSession, fetchLaps, fetchStint, fetchPosition, fetchRaceControl, fetchPit, fetchWeather, fetchMeeting } from "@/services/openF1Api";
import TabPane from "antd/es/tabs/TabPane";
import DashboardHeader from "@/components/common/DashboardHeader";
import { storageHelpers } from "@/utilities/dataStorage";


const { Title, Text } = Typography;

interface CustomMap {
    [key: string]: string
}

interface CustomStintMap {
    [key: string]: object
}



const SessionContent = () => {


    const apiUrl = useApiUrl();


    // const { session_key } = useParams();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const sessionKeyParam = params.get('session_key');
    const meetingKeyParam = params.get('meeting_key')

    const session_key = sessionKeyParam ? Number(sessionKeyParam) : undefined;
    const meeting_key = meetingKeyParam ? Number(meetingKeyParam) : undefined;
    const [driverData, setDriverData] = useState<Array<DriverParams>>([]);
    const [sessionData, setSessionData] = useState<Array<SessionParams>>([]);
    const [lapData, setLapData] = useState<Array<LapParams>>([]);
    const [stintData, setStintData] = useState<Array<StintParams>>([]);
    const [positionData, setPositionData] = useState<Array<PositionParams>>([]);
    const [raceControlData, setRaceControlData] = useState<Array<RaceControlParams>>([]);
    const [weatherData, setWeatherData] = useState<Array<WeatherParams>>([])
    const [pitData, setPitData] = useState<Array<PitParams>>([]);
    const [meetingData, setMeetingData] = useState<Array<MeetingParams>>([])
    const [isLoading, setIsLoading] = useState(true);

    const {
        isShowDriverSelect, setIsShowDriverSelect,
        //drivers, setDrivers,
        selectedDrivers, setSelectedDrivers,
    } = useTelemetry();

    const raceControlRef = useRef<EventCardRef>(null);

    const toggleDriverSelect = async (driver: DriverParams) => {
        if (!driver) return;
        const driver_no = driver.driver_number?.toString()!
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

    const driverTeamColorMap = driverData.reduce((driversSoFar: CustomMap, { driver_number, team_colour }) => {
        let key = driver_number?.toString()!
        if (!driversSoFar[key]) driversSoFar[key] = team_colour!;
        return driversSoFar;
    }, {});

    useEffect(() => {
        // const mode = import.meta.env.MODE as string;
        const mode = "TEST"
        // Skip fetching if either key is missing
        if (session_key === undefined || meeting_key === undefined) {
            setIsLoading(false);
            return;
        }
        async function fetchAllData(needsFetch: Record<string, boolean>) {
            // Respect 3 requests/second rate limit by batching
            const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

            // Initialize with cached data
            let driverData = needsFetch.drivers ? null : storageHelpers.getSessionData('drivers', session_key!);
            let sessionData = needsFetch.session ? null : storageHelpers.getSessionData('session', session_key!);
            let lapData = needsFetch.laps ? null : storageHelpers.getSessionData('laps', session_key!);
            let stintData = needsFetch.stint ? null : storageHelpers.getSessionData('stint', session_key!);
            let positionData = needsFetch.position ? null : storageHelpers.getSessionData('position', session_key!);
            let raceControlData = needsFetch.raceControl ? null : storageHelpers.getSessionData('raceControl', session_key!);
            let pitData = needsFetch.pit ? null : storageHelpers.getSessionData('pit', session_key!);
            let weatherData = needsFetch.weather ? null : storageHelpers.getSessionData('weather', session_key!);
            let meetingData = needsFetch.meeting ? null : storageHelpers.getMeetingData(meeting_key!);

            // Batch 1 (up to 3 requests)
            const batch1Promises = [];
            if (needsFetch.drivers) batch1Promises.push(fetchDrivers({ session_key }));
            if (needsFetch.session) batch1Promises.push(fetchSession({ session_key }));
            if (needsFetch.laps) batch1Promises.push(fetchLaps({ session_key }));

            if (batch1Promises.length > 0) {
                const batch1Results = await Promise.all(batch1Promises);
                let resultIndex = 0;
                if (needsFetch.drivers) { driverData = batch1Results[resultIndex++]; }
                if (needsFetch.session) { sessionData = batch1Results[resultIndex++]; }
                if (needsFetch.laps) { lapData = batch1Results[resultIndex++]; }

                // Wait if we made requests
                if (batch1Promises.length > 0) await sleep(350);
            }

            // Batch 2 (up to 3 requests)
            const batch2Promises = [];
            if (needsFetch.stint) batch2Promises.push(fetchStint({ session_key }));
            if (needsFetch.position) batch2Promises.push(fetchPosition({ session_key }));
            if (needsFetch.raceControl) batch2Promises.push(fetchRaceControl({ session_key }));

            if (batch2Promises.length > 0) {
                const batch2Results = await Promise.all(batch2Promises);
                let resultIndex = 0;
                if (needsFetch.stint) { stintData = batch2Results[resultIndex++]; }
                if (needsFetch.position) { positionData = batch2Results[resultIndex++]; }
                if (needsFetch.raceControl) { raceControlData = batch2Results[resultIndex++]; }

                // Wait if we made requests
                if (batch2Promises.length > 0) await sleep(350);
            }

            // Batch 3 (up to 3 requests)
            const batch3Promises = [];
            if (needsFetch.pit) batch3Promises.push(fetchPit({ session_key }));
            if (needsFetch.weather) batch3Promises.push(fetchWeather({ session_key }));
            if (needsFetch.meeting) batch3Promises.push(fetchMeeting({ meeting_key }));

            if (batch3Promises.length > 0) {
                const batch3Results = await Promise.all(batch3Promises);
                let resultIndex = 0;
                if (needsFetch.pit) { pitData = batch3Results[resultIndex++]; }
                if (needsFetch.weather) { weatherData = batch3Results[resultIndex++]; }
                if (needsFetch.meeting) { meetingData = batch3Results[resultIndex++]; }
            }

            return [driverData, sessionData, lapData, stintData, positionData, raceControlData, pitData, weatherData, meetingData];
        }
        //Use For Development
        async function fetchMockData() {
            const [driverData, sessionData, lapData, stintData, positionData, raceControlData, pitData, weatherData, meetingData] = await Promise.all([
                await import('@/data/driver.json'),
                await import('@/data/sessions.json'),
                await import('@/data/lap.json'),
                await import('@/data/stint.json'),
                await import('@/data/position.json'),
                await import('@/data/race-control.json'),
                await import('@/data/pit.json'),
                await import('@/data/weather.json'),
                await import('@/data/meeting.json')
            ]);
            return [driverData?.default, sessionData?.default, lapData?.default,
            stintData?.default, positionData?.default, raceControlData?.default, pitData?.default, weatherData?.default, meetingData?.default];
        }

        const setAllData = ([driverData, sessionData, lapData, stintData, positionData, raceControlData, pitData, weatherData, meetingData]: any) => {
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
            setWeatherData(weatherData)
            setMeetingData(meetingData)

            // Store data using improved storage system
            storageHelpers.storeSessionData('drivers', driverData, session_key!);
            storageHelpers.storeSessionData('session', sessionData, session_key!);
            storageHelpers.storeSessionData('laps', lapData, session_key!);
            storageHelpers.storeSessionData('stint', stintData, session_key!);
            storageHelpers.storeSessionData('position', positionData, session_key!);
            storageHelpers.storeSessionData('raceControl', raceControlData, session_key!);
            storageHelpers.storeSessionData('pit', pitData, session_key!);
            storageHelpers.storeSessionData('weather', weatherData, session_key!);
            storageHelpers.storeMeetingData(meetingData, meeting_key!);

            setIsLoading(false)

            let selectedDrivers: Record<string, boolean> = {}

            driverData.map((d: DriverParams) => {
                if (d.driver_number) selectedDrivers[d.driver_number?.toString()] = true
            })

            setSelectedDrivers(selectedDrivers)
        }



        // Load cached data if available
        const cachedDrivers = storageHelpers.getSessionData('drivers', session_key!);
        const cachedSession = storageHelpers.getSessionData('session', session_key!);
        const cachedLaps = storageHelpers.getSessionData('laps', session_key!);
        const cachedStint = storageHelpers.getSessionData('stint', session_key!);
        const cachedPosition = storageHelpers.getSessionData('position', session_key!);
        const cachedRaceControl = storageHelpers.getSessionData('raceControl', session_key!);
        const cachedPit = storageHelpers.getSessionData('pit', session_key!);
        const cachedWeather = storageHelpers.getSessionData('weather', session_key!);
        const cachedMeeting = storageHelpers.getMeetingData(meeting_key!);

        // Set cached data if available
        if (cachedDrivers) setDriverData(cachedDrivers as DriverParams[]);
        if (cachedSession) setSessionData(cachedSession as SessionParams[]);
        if (cachedLaps) setLapData(cachedLaps as LapParams[]);
        if (cachedStint) setStintData(cachedStint as StintParams[]);
        if (cachedPosition) setPositionData(cachedPosition as PositionParams[]);
        if (cachedRaceControl) setRaceControlData(cachedRaceControl as RaceControlParams[]);
        if (cachedPit) setPitData(cachedPit as PitParams[]);
        if (cachedWeather) setWeatherData(cachedWeather as WeatherParams[]);
        if (cachedMeeting) setMeetingData(cachedMeeting as MeetingParams[]);


        // Check what data we need to fetch
        const needsFetch = {
            drivers: !storageHelpers.hasSessionData('drivers', session_key!),
            session: !storageHelpers.hasSessionData('session', session_key!),
            laps: !storageHelpers.hasSessionData('laps', session_key!),
            stint: !storageHelpers.hasSessionData('stint', session_key!),
            position: !storageHelpers.hasSessionData('position', session_key!),
            raceControl: !storageHelpers.hasSessionData('raceControl', session_key!),
            pit: !storageHelpers.hasSessionData('pit', session_key!),
            weather: !storageHelpers.hasSessionData('weather', session_key!),
            meeting: !storageHelpers.hasMeetingData(meeting_key!)
        };

        // If we have all data cached, just set loading to false
        if (!Object.values(needsFetch).some(Boolean)) {
            setIsLoading(false);
            return;
        }

        if (mode && mode.toLowerCase() === "development") {
            fetchMockData().then(([driverData, sessionData, lapData, stintData, positionData, raceControlData, pitData, weatherData, meetingData]) => {
                setAllData([driverData, sessionData, lapData, stintData, positionData, raceControlData, pitData, weatherData, meetingData])
            }).catch(error => {
                console.error(error)
            })
        } else {
            fetchAllData(needsFetch).then(([driverData, sessionData, lapData, stintData, positionData, raceControlData, pitData, weatherData, meetingData]) => {
                setAllData([driverData, sessionData, lapData, stintData, positionData, raceControlData, pitData, weatherData, meetingData])
            }).catch(error => {
                console.error(error)
            })
        }

    }, [session_key, meeting_key]);

    const title = useCallback(() => {
        const country = sessionData[0]?.country_name
        const sessionType = sessionData[0]?.session_type
        return country && sessionType ? `${country} ${sessionType} Data` : null
    }, [sessionData])

    const rainFall = useMemo(() => {
        const totalRainFall = weatherData?.reduce((total, item) => total + (item.rainfall || 0), 0);
        return totalRainFall
    }, [weatherData])

    return (
        <>
            <Spin spinning={isLoading} tip={isLoading ? "Refreshing..." : "Loading..."}>
                <DashboardHeader
                    trackTemperature={weatherData?.[0]?.track_temperature ?? 0}
                    airTemperature={weatherData?.[0]?.air_temperature ?? 0}
                    humidity={weatherData?.[0]?.humidity ?? 0}
                    rainfall={rainFall ?? 0}
                    windSpeed={weatherData?.[0]?.wind_speed ?? 0}
                    meeting={meetingData?.[0] ?? null}
                    session={sessionData?.[0] ?? null}
                />
                {/* <CustomText size="lg" style={{ margin: '1rem', padding: '8px 16px' }}>
                {title()}
            </CustomText> */}
                <div style={{ margin: '1rem', padding: '8px 16px' }}>
                    <DriverAvatarGroup
                        drivers={driverData}
                        selectedDrivers={selectedDrivers}
                        toggleDriverSelect={toggleDriverSelect}
                        onToggleAllDrivers={() => {
                            setSelectedDrivers(prev => {
                                const newState: Record<string, boolean> = {};
                                for (const driverId in prev) {
                                    newState[driverId] = !prev[driverId]; // invert each value
                                }
                                return newState;
                            });
                        }}
                        showAllSelected={isShowDriverSelect}
                    />
                </div>

                <Tabs>
                    <TabPane tab="Race Pace" key="1">
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
                    </TabPane>
                    <TabPane tab="Stint" key="2">
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
                    </TabPane>
                    <TabPane tab="Position" key="3">
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
                                    driverTeamColorMap={driverTeamColorMap}
                                    driverAcronym={driverAcronym}
                                    selectedDrivers={selectedDrivers}
                                    isLoading={isLoading} />
                            </Col>
                        </Row>
                    </TabPane>
                </Tabs>
            </Spin>
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