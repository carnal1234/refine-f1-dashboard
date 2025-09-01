import { useCustom, useApiUrl, useGo } from "@refinedev/core";

import {
    List,
    useTable,
    EditButton,
    ShowButton

} from "@refinedev/antd";

import { Table, Space, Select, Alert, Card, Row, Col, Typography } from "antd";
import Leaderboard from "@/components/Leaderboard";

import { MeetingParams, SessionResultParams, type DriverParams, type SessionParams } from "../../interfaces/openf1";
import { HttpError } from "../../../node_modules/@refinedev/core/dist/index";
import dayjs from 'dayjs'
import { SetStateAction, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCountryCode } from "@/utilities/helper";
import { fetchMeeting, fetchSession } from "@/services/openF1Api";

const { Title } = Typography;

const defaultSessionType = "Race"

type dataParams = SessionParams & MeetingParams

export const SessionList = () => {

    const apiUrl = useApiUrl();
    const go = useGo();
    const navigate = useNavigate();

    const [sessionData, setSessionData] = useState<dataParams[]>([]);
    const [meetingData, setMeetingData] = useState<MeetingParams[]>([]);
    const [sessionResultData, setSessionResultData] = useState<SessionResultParams[]>([]);
    const [selectedYear, setSelectedYear] = useState("2024")
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
    const [selectedSessionType, setSelectedSessionType] = useState<string | null>(null)
    const [pageLoading, setPageLoading] = useState(false)
    const yearList = [
        { value: '2023' },
        { value: '2024' },
    ]
    const [countryList, setCountryList] = useState<any[]>([])
    const [sessionTypeList, setSessionTypeList] = useState<any[]>([])

    const fetchData = async () => {
        try {
            setPageLoading(true)
            const params = {
                year: selectedYear ? Number(selectedYear) : undefined,
            }
            const batchPromises = [
                fetchSession(params),
                fetchMeeting(params),
            ]
            const [data, meetingData] = await Promise.all(batchPromises)

            const mergedData = data?.map((session: SessionParams) => {
                const meeting = meetingData.find((m: MeetingParams) => m.meeting_key === session.meeting_key);
                return {
                    ...session,
                    meeting_name: meeting ? meeting.meeting_name : null,
                }
            });

            setSessionData(mergedData);
            setMeetingData(meetingData);
            const countryNames = data?.map((d: SessionParams) => d.country_name) || [];
            const uniqueCountryNames = Array.from(new Set(countryNames));
            const countryList = uniqueCountryNames.map(name => ({ value: name }));
            setCountryList([...countryList])
            // setSelectedCountry("All")

        } catch (error) {
            console.error("Error fetching session data:", error);
        } finally {
            setPageLoading(false)
        }
    }


    useEffect(() => {
        if (selectedYear) {
            fetchData()
        }
    }, [selectedYear])

    useEffect(() => {
        if (!selectedYear || !selectedCountry || selectedCountry === "All") {
            setSessionTypeList([])
            setSelectedSessionType(null)
        } else {
            const sessionList = sessionData?.filter((s: SessionParams) => s.country_name === selectedCountry)?.map((d: SessionParams) => d.session_name) || [];
            const uniqueSessionList = Array.from(new Set(sessionList));
            const filterSessionList = uniqueSessionList.map(s => ({ value: s }));
            setSessionTypeList(filterSessionList || [])

            // Only set session type if it's not already set or if it's not available in the new country
            if (!selectedSessionType || !filterSessionList.find(s => s.value === selectedSessionType)) {
                setSelectedSessionType(defaultSessionType)
            }
        }
    }, [selectedYear, selectedCountry, sessionData])


    const filterData = useMemo(() => {
        return sessionData?.filter((session: dataParams) => {
            const matchesCountry = !selectedCountry || selectedCountry === "All" || session.country_name === selectedCountry;
            const matchesSessionType = !selectedSessionType || selectedSessionType === "All" || session.session_name === selectedSessionType;
            return matchesCountry && matchesSessionType;
        }) || [];
    }, [sessionData, selectedCountry, selectedSessionType]);

    // Dynamic table columns based on session type
    const getTableColumns = () => {
        const baseColumns = [
            {
                title: "Grand Prix",
                dataIndex: "meeting_name",
                key: "meeting_name",
            },
            {
                title: "Session",
                dataIndex: "session_name",
                key: "session_name",
            },
            {
                title: "Date",
                dataIndex: "date_start",
                key: "date_start",
                render: (value: string) => dayjs(value).format('YYYY-MM-DD'),
            },
            {
                title: "Actions",
                key: "actions",
                render: (value: any, record: SessionParams) => (
                    <Space>
                        <ShowButton
                            onClick={() => {
                                navigate(`/sessions/show/race?session_key=${record.session_key}&meeting_key=${record.meeting_key}`);
                            }}
                            hideText
                            size="small"
                            recordItemId={record.session_key}
                        />
                    </Space>
                ),
            },
        ];

        // Add session-specific columns
        if (selectedSessionType === "Race") {
            baseColumns.splice(3, 0, {
                title: "Circuit",
                dataIndex: "circuit_short_name",
                key: "circuit_short_name",
            });
        } else if (selectedSessionType === "Qualifying") {
            baseColumns.splice(3, 0, {
                title: "Circuit",
                dataIndex: "circuit_short_name",
                key: "circuit_short_name",
            });
        } else if (selectedSessionType?.includes("Practice")) {
            baseColumns.splice(3, 0, {
                title: "Circuit",
                dataIndex: "circuit_short_name",
                key: "circuit_short_name",
            });
        }

        return baseColumns;
    };

    return (
        <List>
            {/* Centered Alert */}
            <Row justify="center" style={{ marginBottom: 24 }}>
                <Col>
                    <Alert
                        message="OpenF1 API is under development and race data is currently available for 2023-2024 seasons."
                        type="warning"
                        style={{ textAlign: 'center' }}
                    />
                </Col>
            </Row>

            {/* Grouped Search Components */}
            <Card style={{ marginBottom: 24 }}>
                <Row gutter={[16, 16]} align="middle">
                    <Col>
                        <Title level={5} style={{ margin: 0 }}>Year:</Title>
                    </Col>
                    <Col>
                        <Select
                            placeholder="Select Year"
                            defaultValue="2024"
                            style={{ width: 120 }}
                            onChange={(value: string) => {
                                setSelectedYear(value)
                                setSelectedCountry(null)
                                setSelectedSessionType(null)
                            }}
                            options={yearList}
                            allowClear={true}
                            onClear={() => {
                                setSelectedCountry(null)
                                setSelectedSessionType(null)
                            }}
                        />
                    </Col>

                    <Col>
                        <Title level={5} style={{ margin: 0 }}>Country:</Title>
                    </Col>
                    <Col>
                        <Select
                            placeholder="Select Country"
                            style={{ width: 200 }}
                            onChange={(value: string) => {
                                setSelectedCountry(value)
                                // Only reset session type if the current one won't be valid for the new country
                                if (selectedSessionType && value) {
                                    const newSessionList = sessionData?.filter((s: SessionParams) => s.country_name === value)?.map((d: SessionParams) => d.session_name) || [];
                                    if (!newSessionList.includes(selectedSessionType)) {
                                        setSelectedSessionType(null)
                                    }
                                }
                            }}
                            options={countryList}
                            allowClear={true}
                            disabled={!selectedYear}
                            onClear={() => {
                                setSelectedSessionType(null)
                            }}
                        />
                    </Col>
                    {selectedCountry && selectedCountry !== "All" && (
                        <>
                            <Col>
                                <Title level={5} style={{ margin: 0 }}>Session:</Title>
                            </Col>
                            <Col>
                                <Select
                                    placeholder="Select Session"
                                    style={{ width: 200 }}
                                    onChange={(value: string) => setSelectedSessionType(value)}
                                    options={sessionTypeList}
                                    allowClear={true}
                                    disabled={!selectedCountry}
                                    value={selectedSessionType}
                                />
                            </Col>
                        </>
                    )}
                </Row>
            </Card>

            {/* Dynamic Table */}
            <Leaderboard
                data={filterData}
                columns={getTableColumns()}
                title="Sessions"
                loading={pageLoading}
                pagination={false}
                size="middle"
                scroll={{ x: 800 }}
                onRow={(record) => ({
                    onClick: () => {
                        navigate(`/sessions/show/race?session_key=${record.session_key}&meeting_key=${record.meeting_key}`);
                    },
                })}
                showCard={true}
                stripedRows={true}
            />
        </List>
    );
};
