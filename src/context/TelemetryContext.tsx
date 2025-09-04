// @/context/TelemetryContext.tsx
import React, { ReactNode, createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { MeetingParams, SessionParams, WeatherParams, RaceControlParams, DriverParams, StintParams, LapParams, PitParams, SessionResultParams, PositionParams } from "@/interfaces/openf1";
import { fetchDrivers, fetchSession, fetchLaps, fetchStint, fetchPosition, fetchRaceControl, fetchPit, fetchWeather, fetchMeeting, fetchSessionResult } from "@/services/openF1Api";
import { storageHelpers } from "@/utilities/dataStorage";
import { Spin } from "antd";

interface TelemetryContextProps {
    // UI State
    isShowDriverSelect: boolean;
    setIsShowDriverSelect: React.Dispatch<React.SetStateAction<boolean>>;
    selectedDrivers: Record<string, boolean>;
    setSelectedDrivers: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;

    // Data State
    driverData: DriverParams[];
    sessionData: SessionParams[];
    lapData: LapParams[];
    stintData: StintParams[];
    positionData: PositionParams[];
    raceControlData: RaceControlParams[];
    weatherData: WeatherParams[];
    pitData: PitParams[];
    meetingData: MeetingParams[];
    sessionResultData: SessionResultParams[];

    // Loading State
    isLoading: boolean;

    // Actions
    loadSessionData: (sessionKey: number, meetingKey: number) => Promise<void>;
    refreshData: () => Promise<void>;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;

    //Driver Related Mapping
    driverAcronym: Record<string, string>;
    driverTeamColorMap: Record<string, string>;
}

const TelemetryContext = createContext<TelemetryContextProps | undefined>(undefined);

export const useTelemetry = () => {
    const context = useContext(TelemetryContext);
    if (!context) {
        throw new Error("useTelemetry must be used within a TelemetryProvider");
    }
    return context;
};

export const TelemetryProvider = ({ children }: { children: ReactNode }) => {
    // UI State
    const [isShowDriverSelect, setIsShowDriverSelect] = useState<boolean>(false);
    const [selectedDrivers, setSelectedDrivers] = useState<Record<string, boolean>>({});

    // Data State
    const [driverData, setDriverData] = useState<Array<DriverParams>>([]);
    const [sessionData, setSessionData] = useState<Array<SessionParams>>([]);
    const [lapData, setLapData] = useState<Array<LapParams>>([]);
    const [stintData, setStintData] = useState<Array<StintParams>>([]);
    const [positionData, setPositionData] = useState<Array<PositionParams>>([]);
    const [raceControlData, setRaceControlData] = useState<Array<RaceControlParams>>([]);
    const [weatherData, setWeatherData] = useState<Array<WeatherParams>>([]);
    const [pitData, setPitData] = useState<Array<PitParams>>([]);
    const [meetingData, setMeetingData] = useState<Array<MeetingParams>>([]);
    const [sessionResultData, setSessionResultData] = useState<Array<SessionResultParams>>([]);

    // Loading State
    const [isLoading, setIsLoading] = useState(false);

    // Current session/meeting keys
    const [currentSessionKey, setCurrentSessionKey] = useState<number | null>(null);
    const [currentMeetingKey, setCurrentMeetingKey] = useState<number | null>(null);

    // Data processing function
    const processData = useCallback(([driverData, sessionData, lapData, stintData, positionData, raceControlData, pitData, weatherData, meetingData, sessionResultData]: any) => {
        // Convert driver_number to string for consistency
        for (let item of driverData) {
            item['driver_number'] = item['driver_number']?.toString();
        }
        for (let item of lapData) {
            item['driver_number'] = item['driver_number']?.toString();
        }
        for (let item of sessionData) {
            item['driver_number'] = item['driver_number']?.toString();
        }
        for (let item of positionData) {
            item['driver_number'] = item['driver_number']?.toString();
        }
        for (let item of stintData) {
            item['driver_number'] = item['driver_number']?.toString();
            item['lap_interval'] = [item['lap_start'], item['lap_end']];
        }
        for (let item of raceControlData) {
            item['driver_number'] = item['driver_number']?.toString();
        }
        for (let item of pitData) {
            item['driver_number'] = item['driver_number']?.toString();
        }
        for (let item of sessionResultData) {
            item['driver_number'] = item['driver_number']?.toString();
        }

        return [driverData, sessionData, lapData, stintData, positionData, raceControlData, pitData, weatherData, meetingData, sessionResultData];
    }, []);

    // Main data loading function
    const loadSessionData = useCallback(async (sessionKey: number, meetingKey: number) => {
        if (sessionKey === currentSessionKey && meetingKey === currentMeetingKey) {
            return; // Already loaded this data
        }

        setIsLoading(true);
        setCurrentSessionKey(sessionKey);
        setCurrentMeetingKey(meetingKey);

        try {
            const mode = import.meta.env.MODE as string;

            // Check what data we need to fetch
            const needsFetch = {
                drivers: !storageHelpers.hasSessionData('drivers', sessionKey),
                session: !storageHelpers.hasSessionData('session', sessionKey),
                laps: !storageHelpers.hasSessionData('laps', sessionKey),
                stint: !storageHelpers.hasSessionData('stint', sessionKey),
                position: !storageHelpers.hasSessionData('position', sessionKey),
                raceControl: !storageHelpers.hasSessionData('raceControl', sessionKey),
                pit: !storageHelpers.hasSessionData('pit', sessionKey),
                weather: !storageHelpers.hasSessionData('weather', sessionKey),
                meeting: !storageHelpers.hasMeetingData(meetingKey),
                sessionResult: !storageHelpers.hasSessionData('sessionResult', sessionKey)
            };

            // If we have all data cached, load from cache
            if (!Object.values(needsFetch).some(Boolean)) {
                const cachedData = [
                    storageHelpers.getSessionData('drivers', sessionKey),
                    storageHelpers.getSessionData('session', sessionKey),
                    storageHelpers.getSessionData('laps', sessionKey),
                    storageHelpers.getSessionData('stint', sessionKey),
                    storageHelpers.getSessionData('position', sessionKey),
                    storageHelpers.getSessionData('raceControl', sessionKey),
                    storageHelpers.getSessionData('pit', sessionKey),
                    storageHelpers.getSessionData('weather', sessionKey),
                    storageHelpers.getMeetingData(meetingKey),
                    storageHelpers.getSessionData('sessionResult', sessionKey)
                ];

                const processedData = processData(cachedData);
                setAllData(processedData, sessionKey, meetingKey);
                setIsLoading(false);
                return;
            }

            let result;
            if (mode && mode.toLowerCase() === "development") {
                result = await fetchMockData();
            } else {
                result = await fetchAllData(sessionKey, meetingKey, needsFetch);
            }

            const processedData = processData(result);
            setAllData(processedData, sessionKey, meetingKey);
        } catch (error) {
            console.error('Error loading session data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [currentSessionKey, currentMeetingKey, processData]);

    // Fetch all data with rate limiting
    const fetchAllData = async (sessionKey: number, meetingKey: number, needsFetch: Record<string, boolean>) => {
        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

        // Initialize with cached data
        let driverData = needsFetch.drivers ? null : storageHelpers.getSessionData('drivers', sessionKey);
        let sessionData = needsFetch.session ? null : storageHelpers.getSessionData('session', sessionKey);
        let lapData = needsFetch.laps ? null : storageHelpers.getSessionData('laps', sessionKey);
        let stintData = needsFetch.stint ? null : storageHelpers.getSessionData('stint', sessionKey);
        let positionData = needsFetch.position ? null : storageHelpers.getSessionData('position', sessionKey);
        let raceControlData = needsFetch.raceControl ? null : storageHelpers.getSessionData('raceControl', sessionKey);
        let pitData = needsFetch.pit ? null : storageHelpers.getSessionData('pit', sessionKey);
        let weatherData = needsFetch.weather ? null : storageHelpers.getSessionData('weather', sessionKey);
        let meetingData = needsFetch.meeting ? null : storageHelpers.getMeetingData(meetingKey);
        let sessionResultData = needsFetch.sessionResult ? null : storageHelpers.getSessionData('sessionResult', sessionKey);

        // Batch 1 (up to 3 requests)
        const batch1Promises = [];
        if (needsFetch.drivers) batch1Promises.push(fetchDrivers({ session_key: sessionKey }));
        if (needsFetch.session) batch1Promises.push(fetchSession({ session_key: sessionKey }));
        if (needsFetch.laps) batch1Promises.push(fetchLaps({ session_key: sessionKey }));

        if (batch1Promises.length > 0) {
            const batch1Results = await Promise.all(batch1Promises);
            let resultIndex = 0;
            if (needsFetch.drivers) { driverData = batch1Results[resultIndex++]; }
            if (needsFetch.session) { sessionData = batch1Results[resultIndex++]; }
            if (needsFetch.laps) { lapData = batch1Results[resultIndex++]; }
            await sleep(350);
        }

        // Batch 2 (up to 3 requests)
        const batch2Promises = [];
        if (needsFetch.stint) batch2Promises.push(fetchStint({ session_key: sessionKey }));
        if (needsFetch.position) batch2Promises.push(fetchPosition({ session_key: sessionKey }));
        if (needsFetch.raceControl) batch2Promises.push(fetchRaceControl({ session_key: sessionKey }));

        if (batch2Promises.length > 0) {
            const batch2Results = await Promise.all(batch2Promises);
            let resultIndex = 0;
            if (needsFetch.stint) { stintData = batch2Results[resultIndex++]; }
            if (needsFetch.position) { positionData = batch2Results[resultIndex++]; }
            if (needsFetch.raceControl) { raceControlData = batch2Results[resultIndex++]; }
            await sleep(350);
        }

        // Batch 3 (up to 3 requests)
        const batch3Promises = [];
        if (needsFetch.pit) batch3Promises.push(fetchPit({ session_key: sessionKey }));
        if (needsFetch.weather) batch3Promises.push(fetchWeather({ session_key: sessionKey }));
        if (needsFetch.meeting) batch3Promises.push(fetchMeeting({ meeting_key: meetingKey }));
        if (needsFetch.sessionResult) batch3Promises.push(fetchSessionResult({ session_key: sessionKey }));

        if (batch3Promises.length > 0) {
            const batch3Results = await Promise.all(batch3Promises);
            let resultIndex = 0;
            if (needsFetch.pit) { pitData = batch3Results[resultIndex++]; }
            if (needsFetch.weather) { weatherData = batch3Results[resultIndex++]; }
            if (needsFetch.meeting) { meetingData = batch3Results[resultIndex++]; }
            if (needsFetch.sessionResult) { sessionResultData = batch3Results[resultIndex++]; }
        }

        return [driverData, sessionData, lapData, stintData, positionData, raceControlData, pitData, weatherData, meetingData, sessionResultData];
    };

    // Mock data for development
    const fetchMockData = async () => {
        const [driverData, sessionData, lapData, stintData, positionData, raceControlData, pitData, weatherData, meetingData, sessionResultData] = await Promise.all([
            await import('@/data/driver.json'),
            await import('@/data/sessions.json'),
            await import('@/data/lap.json'),
            await import('@/data/stint.json'),
            await import('@/data/position.json'),
            await import('@/data/race-control.json'),
            await import('@/data/pit.json'),
            await import('@/data/weather.json'),
            await import('@/data/meeting.json'),
            await import('@/data/sessionResult.json')
        ]);
        return [driverData?.default, sessionData?.default, lapData?.default,
        stintData?.default, positionData?.default, raceControlData?.default, pitData?.default, weatherData?.default, meetingData?.default, sessionResultData?.default];
    };

    // Set all data and initialize selected drivers
    const setAllData = useCallback(([driverData, sessionData, lapData, stintData, positionData, raceControlData, pitData, weatherData, meetingData, sessionResultData]: any, sessionKey: number, meetingKey: number) => {
        setDriverData(driverData);
        setSessionData(sessionData);
        setLapData(lapData);
        setStintData(stintData);
        setPositionData(positionData);
        setRaceControlData(raceControlData);
        setPitData(pitData);
        setWeatherData(weatherData);
        setMeetingData(meetingData);
        setSessionResultData(sessionResultData);

        // Store data using improved storage system
        storageHelpers.storeSessionData('drivers', driverData, sessionKey);
        storageHelpers.storeSessionData('session', sessionData, sessionKey);
        storageHelpers.storeSessionData('laps', lapData, sessionKey);
        storageHelpers.storeSessionData('stint', stintData, sessionKey);
        storageHelpers.storeSessionData('position', positionData, sessionKey);
        storageHelpers.storeSessionData('raceControl', raceControlData, sessionKey);
        storageHelpers.storeSessionData('pit', pitData, sessionKey);
        storageHelpers.storeSessionData('weather', weatherData, sessionKey);
        storageHelpers.storeMeetingData(meetingData, meetingKey);
        storageHelpers.storeSessionData('sessionResult', sessionResultData, sessionKey);

        // Initialize selected drivers
        let selectedDrivers: Record<string, boolean> = {};
        driverData.forEach((d: DriverParams) => {
            if (d.driver_number) selectedDrivers[d.driver_number?.toString()] = true;
        });
        setSelectedDrivers(selectedDrivers);
    }, []);

    // Refresh current data
    const refreshData = useCallback(async () => {
        if (currentSessionKey && currentMeetingKey) {
            // Clear cache and reload
            await loadSessionData(currentSessionKey, currentMeetingKey);
        }
    }, [currentSessionKey, currentMeetingKey, loadSessionData]);

    const driverAcronym = useMemo(() => {
        return driverData.reduce((driversSoFar: Record<string, string>, driver) => {
            const key = driver.driver_number?.toString();
            if (key && driver.name_acronym) {
                driversSoFar[key] = driver.name_acronym;
            }
            return driversSoFar;
        }, {} as Record<string, string>);
    }, [driverData]);

    const driverTeamColorMap = useMemo(() => {
        return driverData.reduce((driversSoFar: Record<string, string>, driver) => {
            const key = driver.driver_number?.toString();
            if (key && driver.team_colour) {
                driversSoFar[key] = driver.team_colour;
            }
            return driversSoFar;
        }, {} as Record<string, string>);
    }, [driverData]);

    return (
        <TelemetryContext.Provider value={{
            // UI State
            isShowDriverSelect, setIsShowDriverSelect,
            selectedDrivers, setSelectedDrivers,

            // Data State
            driverData, sessionData, lapData, stintData, positionData,
            raceControlData, weatherData, pitData, meetingData, sessionResultData,

            // Loading State
            isLoading, setIsLoading,

            // Actions
            loadSessionData, refreshData,

            //Driver Related Mapping
            driverAcronym, driverTeamColorMap,
        }}>
            <Spin spinning={isLoading} tip={isLoading ? "Refreshing..." : "Loading..."}>
                {children}
            </Spin>
        </TelemetryContext.Provider>
    );
};
