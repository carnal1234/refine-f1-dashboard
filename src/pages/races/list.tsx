import { useCustom, useApiUrl, useGo } from "@refinedev/core";

import {
    List,
    useTable,
    EditButton,
    ShowButton

} from "@refinedev/antd";

import { Table, Space, Select } from "antd";

import type { DriverParams, SessionParams } from "../../interfaces/openf1";
import { HttpError } from "../../../node_modules/@refinedev/core/dist/index";
import dayjs from 'dayjs'
import { SetStateAction, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";





export const SessionList = () => {

    const apiUrl = useApiUrl();
    const go = useGo();
    const navigate = useNavigate();



    const [sessionData, setSessionData] = useState([]);
    const [selectedYear, setSelectedYear] = useState("2024")


    useEffect(() => {

        fetch(`${apiUrl}/sessions?session_name=Race&year=${selectedYear}`)
            .then(res => res.json())
            .then(json => setSessionData(json))
            .catch(err => console.error(err))

    }, [selectedYear])



    // const { tableProps } = useTable<SessionParams, HttpError>({
    //     resource: "sessions?session_name=Race&year=2024",
    //     hasPagination: false,

    // });

    const handleChange = (value: string) => setSelectedYear(value)

    return (
        <List>

            Select year :

            <Select
                placeholder="Select year"
                defaultValue="2024"
                style={{ width: 120, margin: 20 }}
                onChange={handleChange}
                options={[

                    { value: '2023' },
                    { value: '2024' },
                ]}
            />

            <br />

            <Table dataSource={sessionData} rowKey="session_key">
                <Table.Column dataIndex="country_name" title="Country" />
                <Table.Column dataIndex="session_type" title="Session Type" />
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
