import { useCustom, useApiUrl, useGo } from "@refinedev/core";

import {
    List,
    useTable,
    EditButton,
    ShowButton

} from "@refinedev/antd";

import { Table, Space } from "antd";

import type { IDriver, ISession } from "../../interfaces";
import { HttpError } from "../../../node_modules/@refinedev/core/dist/index";
import dayjs from 'dayjs'





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

    const { tableProps } = useTable<ISession, HttpError>({
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



                <Table.Column<ISession>
                    title="Actions"
                    dataIndex="actions"
                    render={(value, record) => (
                        <Space>

                            <ShowButton onClick={() => {
                                go({
                                    to: `/sessions/show/${record.session_key}`,
                                    type: "push",
                                });
                            }}


                                hideText size="small" recordItemId={record.session_key} />
                        </Space>
                    )}
                />
            </Table>
        </List>
    );
};
