import { useCustom, useApiUrl } from "@refinedev/core";
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import { Flex, Row, Col, Spin, TabsProps, Tabs } from "antd";

import { ListItemProps } from "antd/lib/list";
import { Show, MarkdownField } from "@refinedev/antd";
import { Card, Typography } from "antd";
import { DriverParams, LapParams, PositionParams, RaceControlParams, SessionParams, StintParams, PitParams, WeatherParams, MeetingParams, SessionResultParams } from "../../interfaces/openf1";
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
import { formatSecondsToTime } from "@/utilities/helper";
import TabPane from "antd/es/tabs/TabPane";
import DashboardHeader from "@/components/common/DashboardHeader";
import Leaderboard from "@/components/Leaderboard";
import { ColumnsType } from "antd/es/table";


const { Title, Text } = Typography;

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

    const {
        isShowDriverSelect, setIsShowDriverSelect,
        selectedDrivers, setSelectedDrivers,
        driverData,
        sessionData,
        lapData,
        stintData,
        positionData,
        raceControlData,
        weatherData,
        pitData,
        meetingData,
        sessionResultData,
        isLoading, setIsLoading,
        loadSessionData,
        driverAcronym,
        driverTeamColorMap
    } = useTelemetry();

    const raceControlRef = useRef<EventCardRef>(null);

    // Load data when session_key or meeting_key changes
    useEffect(() => {
        if (session_key && meeting_key) {
            loadSessionData(session_key, meeting_key);
        }
    }, [session_key, meeting_key, loadSessionData]);

    const toggleDriverSelect = async (driver: DriverParams) => {
        console.log('toggleDriverSelect', driver, selectedDrivers)
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




    const isRace = sessionData[0]?.session_type === 'Race'
    const isQualifying = sessionData[0]?.session_type === 'Qualifying'
    const isPractice = sessionData[0]?.session_type === 'Practice'

    const title = useCallback(() => {
        const country = sessionData[0]?.country_name
        const sessionType = sessionData[0]?.session_type
        return country && sessionType ? `${country} ${sessionType} Data` : null
    }, [sessionData])

    const rainFall = useMemo(() => {
        const totalRainFall = weatherData?.reduce((total, item) => total + (item.rainfall || 0), 0);
        return totalRainFall
    }, [weatherData])

    // Create leaderboard columns for the generalized component
    const getLeaderboardColumns = (sessionType: string | undefined) => {
        if (!sessionType) return [];

        const generalColumn = [{
            title: 'POS',
            dataIndex: 'position',
            key: 'position',
            width: 80,
            align: 'center' as const,
            render: (pos: number) => (
                <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{pos && pos > 0 ? pos : "NC"}</span>
            ),
        },
        {
            title: 'NO',
            dataIndex: 'driver_number',
            key: 'num',
            width: 70,
            align: 'center' as const,
            render: (num: number) => (
                <span style={{ color: '#8c8c8c', fontWeight: 'bold', fontSize: '16px' }}>{num}</span>
            ),
        },
        {
            title: 'DRIVER',
            dataIndex: 'driver_name',
            key: 'name',
            width: 300,
            render: (name: string, record: SessionResultParams) => {
                const driver = driverData.find(d => d.driver_number === record.driver_number);
                const teamColor = driverTeamColorMap[record.driver_number!];
                if (!driver) return <span>Driver not found</span>;

                return (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                        <DriverAvatar driverData={driver} size={32} />
                        <div
                            style={{
                                width: 4,
                                height: 24,
                                backgroundColor: teamColor,
                                marginRight: 12,
                                borderRadius: 2
                            }}
                        />
                        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{driver.full_name}</span>
                    </div>
                )
            },
        },

        ]

        const qualifyingColumn = [
            {
                title: 'Q1',
                dataIndex: 'q1',
                key: 'q1',
                width: 80,
                align: 'center' as const,
                render: (q1: number, record: SessionResultParams) => {
                    const duration = typeof record.duration === 'number' ? formatSecondsToTime(record.duration) : record.duration?.[0] ? formatSecondsToTime(record.duration?.[0]) : null
                    return (
                        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{duration}</span>
                    )
                },
            },
            {
                title: 'Q2',
                dataIndex: 'q2',
                key: 'q2',
                width: 80,
                align: 'center' as const,
                render: (q2: number, record: SessionResultParams) => (
                    <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{typeof record.duration === 'number' ? formatSecondsToTime(record.duration) : formatSecondsToTime(record.duration?.[1])}</span>
                ),
            },
            {
                title: 'Q3',
                dataIndex: 'q3',
                key: 'q3',
                width: 80,
                align: 'center' as const,
                render: (q3: number, record: SessionResultParams) => (
                    <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{typeof record.duration === 'number' ? formatSecondsToTime(record.duration) : formatSecondsToTime(record.duration?.[2])}</span>
                ),
            },
            {
                title: 'LAPS',
                dataIndex: 'number_of_laps',
                key: 'laps',
                width: 100,
                align: 'left' as const,
                render: (laps: string) => (
                    <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '16px' }}>{laps}</span>
                )
            },
        ]

        const raceColumn = [
            {
                title: 'TIME / RETIRED',
                dataIndex: 'duration',
                key: 'lastLap',
                width: 150,
                align: 'left' as const,
                render: (duration: string, record: SessionResultParams) => {
                    if (record.position === 1) {
                        return <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '16px' }}>{formatSecondsToTime(duration)}</span>
                    }
                    const isRetired = record.dsq ? "DSQ" : record.dnf ? "DNF" : record.dns ? "DNS" : null
                    const result = isRetired ? isRetired : typeof record.gap_to_leader === "string" ? record.gap_to_leader :
                        `+${record.gap_to_leader}s`
                    return (
                        <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '16px' }}>{result}</span>
                    )
                },
            },
            {
                title: 'PTS.',
                dataIndex: 'points',
                key: 'gap',
                width: 80,
                align: 'left' as const,
                render: (points: string) => (
                    <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '16px' }}>{points}</span>
                ),
            },
        ]

        const practiceColumn = [
            {
                title: 'TIME / GAP',
                dataIndex: 'duration',
                key: 'lastLap',
                width: 150,
                align: 'left' as const,
                render: (duration: string, record: SessionResultParams) => {
                    return <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '16px' }}>{formatSecondsToTime(duration)}</span>
                },
            },
            {
                title: 'LAPS',
                dataIndex: 'number_of_laps',
                key: 'laps',
                width: 100,
                align: 'left' as const,
                render: (laps: string) => (
                    <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '16px' }}>{laps}</span>
                ),

            },
        ]

        if (sessionType === 'Race') {
            return [...generalColumn, ...raceColumn]
        } else if (sessionType === 'Qualifying') {
            return [...generalColumn, ...qualifyingColumn]
        } else if (sessionType === 'Practice') {
            return [...generalColumn, ...practiceColumn]
        } else {
            return []
        }
    };

    return (
        <>
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
                <TabPane tab="Leaderboard" key="1">
                    <Row
                        gutter={[32, 32]}
                        style={{
                            marginTop: '32px',
                            width: '100%'
                        }}>
                        <Col span={24}>
                            <Leaderboard
                                data={sessionResultData}
                                columns={getLeaderboardColumns(sessionData[0]?.session_type)}
                                title="Race Results"
                                loading={isLoading}
                                pagination={false}
                                size="middle"
                                scroll={{ x: 800, y: 600 }}
                                showCard={true}
                                stripedRows={true}
                            />
                        </Col>
                    </Row>
                </TabPane>
                <TabPane tab="Race Pace" key="2">
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
                <TabPane tab="Stint" key="3">
                    <Row
                        gutter={[32, 32]}
                        style={{
                            marginTop: '32px',
                            width: '100%'
                        }}>
                        <Col span={24}>
                            <StintGraph
                                stintData={stintData}
                                driverAcronym={driverAcronym}
                                isLoading={isLoading}
                            />


                        </Col>
                    </Row>
                </TabPane>
                {isRace && (<TabPane tab="Position" key="4">
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
                )}

            </Tabs>
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