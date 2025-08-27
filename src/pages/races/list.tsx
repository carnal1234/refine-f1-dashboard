import { useCustom, useApiUrl, useGo } from "@refinedev/core";

import {
    List,
    useTable,
    EditButton,
    ShowButton

} from "@refinedev/antd";

import { Table, Space, Select } from "antd";

import { MeetingParams, type DriverParams, type SessionParams } from "../../interfaces/openf1";
import { HttpError } from "../../../node_modules/@refinedev/core/dist/index";
import dayjs from 'dayjs'
import { SetStateAction, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCountryCode } from "@/utilities/helper";
import { fetchMeeting, fetchSession } from "@/services/openF1Api";



type dataParams = SessionParams & MeetingParams

export const SessionList = () => {

    const apiUrl = useApiUrl();
    const go = useGo();
    const navigate = useNavigate();

    const [sessionData, setSessionData] = useState<dataParams[]>([]);
    const [meetingData, setMeetingData] = useState<MeetingParams[]>([]);
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
            setCountryList(countryList)

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
        if (!selectedYear || !selectedCountry) {
            setSessionTypeList([])
            setSelectedSessionType(null)
        } else {
            const sessionList = sessionData?.filter((s: SessionParams) => s.country_name === selectedCountry)?.map((d: SessionParams) => d.session_name) || [];
            const uniqueSessionList = Array.from(new Set(sessionList));
            const filterSessionList = uniqueSessionList.map(s => ({ value: s }));
            setSessionTypeList(filterSessionList || [])
            setSelectedSessionType(null)
        }
    }, [selectedYear, selectedCountry])


    const filterData = useMemo(() => {
        return sessionData?.filter((session: dataParams) => {
            const matchesCountry = !selectedCountry || session.country_name === selectedCountry;
            const matchesSessionType = !selectedSessionType || session.session_name === selectedSessionType;
            return matchesCountry && matchesSessionType;
        }) || [];
    }, [sessionData, selectedCountry, selectedSessionType]);

    return (
        <List>

            Select year :

            <Select
                placeholder="Select Year"
                defaultValue="2024"
                style={{ width: 120, margin: 20 }}
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


            Select country :

            <Select
                placeholder="Select Country"
                style={{ width: 200, margin: 20 }}
                onChange={(value: string) => {
                    setSelectedCountry(value)
                    setSelectedSessionType(null)
                }}
                options={countryList}
                allowClear={true}
                disabled={!selectedYear}
                onClear={() => {
                    setSelectedSessionType(null)
                }}
            />

            Select Session :

            <Select
                placeholder="Select Session"
                style={{ width: 200, margin: 20 }}
                onChange={(value: string) => setSelectedSessionType(value)}
                options={sessionTypeList}
                allowClear={true}
                disabled={!selectedCountry}
            />

            <br />



            <Table dataSource={filterData} rowKey="session_key"
                onRow={(record) => ({
                    onClick: () => {
                        // Your logic here
                        navigate(`/sessions/show/race?session_key=${record.session_key}&meeting_key=${record.meeting_key}`);
                    },
                })}
                loading={pageLoading}
            >
                <Table.Column dataIndex="country_name" title="Country" />
                <Table.Column dataIndex="meeting_name" title="Meeting Name" />
                <Table.Column dataIndex="session_name" title="Session Name" />
                {/* <Table.Column dataIndex="session_name" title="Session Name" /> */}
                <Table.Column
                    dataIndex="date_start"
                    title="Date"
                    render={(value) => {
                        return dayjs(value).format('YYYY-MM-DD')
                    }}
                />



                <Table.Column<SessionParams>
                    title="Actions"
                    dataIndex="actions"
                    render={(value, record) => (
                        <Space>
                            <ShowButton
                                onClick={() => {
                                    navigate(`/sessions/show/race?session_key=${record.session_key}&meeting_key=${record.meeting_key}`);
                                }}
                                // onClick={() => {
                                //     go({
                                //         to: `/sessions/show/session_key=${record.session_key}`,
                                //         type: "push",
                                //     });
                                // }}
                                hideText size="small" recordItemId={record.session_key} />
                        </Space>
                    )}
                />
            </Table>
        </List>
    );
};
