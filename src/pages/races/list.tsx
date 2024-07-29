import { useCustom, useApiUrl, useGo } from "@refinedev/core";

import {
    List,
    useTable,
    EditButton,
    ShowButton

} from "@refinedev/antd";

import { Table, Space } from "antd";

import type { IDriver } from "../../interfaces";
import { HttpError } from "../../../node_modules/@refinedev/core/dist/index";
import dayjs from 'dayjs'


type SessionType = {
    location: string,
    country_key: number,
    country_code: string,
    country_name: string,
    circuit_key: number,
    circuit_short_name: string,
    session_type: string,
    session_name: string,
    date_start: string,
    date_end: string,
    gmt_offset: string,
    session_key: number,
    meeting_key: number,
    year: number
}


export const SessionList = () => {

    const apiUrl = useApiUrl();
    const go = useGo();


    //"https://api.openf1.org/v1/sessions?session_type=Race&year=2023"

    // const { data, isLoading } = useCustom<IDriver>({
    //   url: `${apiUrl}/sessions`,
    //   method: "get",
    //   config: {
    //     query: {
    //       session_type: "Race",
    //       year: 2024
    //     },
    //   },
    // });

    const { tableProps } = useTable<SessionType, HttpError>({
        resource: "sessions?session_name=Race&year=2024",
        hasPagination: false,
    });
    // const { data, isLoading } = useMany<IDriver>({
    //   resource: "drivers",
    //   ids: categoryIds,
    //   queryOptions: {
    //     enabled: categoryIds.length > 0,
    //   },
    // });

    return (
        <List>
            <Table {...tableProps} rowKey="session_key">
                <Table.Column dataIndex="country_name" title="Country" />
                <Table.Column dataIndex="session_type" title="Session Type" />
                <Table.Column dataIndex="session_name" title="Session Name" />
                <Table.Column
                    dataIndex="date_start"
                    title="Date"
                    render={(value) => {
                        return dayjs(value).format('YYYY-MM-DD')
                    }}
                />



                <Table.Column
                    title="Actions"
                    dataIndex="actions"
                    render={(_, record) => (
                        <Space>

                            <ShowButton onClick={() => {
                                go({
                                    to: `/sessions/show/${record.session_key}`,
                                    type: "push",
                                });
                            }}


                                hideText size="small" recordItemId={record.id} />
                        </Space>
                    )}
                />
            </Table>
        </List>
    );
};
