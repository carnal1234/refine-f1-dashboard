import { useCustom, useApiUrl } from "@refinedev/core";

import {
  List,
  useTable,

} from "@refinedev/antd";

import { Table, Space } from "antd";

import type { IDriver } from "../../interfaces";
import { HttpError } from "../../../node_modules/@refinedev/core/dist/index";

export const DriverList = () => {

  const apiUrl = useApiUrl();

  //"https://api.openf1.org/v1/sessions?session_type=Race&year=2023"

  const { data, isLoading } = useCustom<IDriver>({
    url: `${apiUrl}/sessions`,
    method: "get",
    config: {
      query: {
        session_type: "Race",
        year: 2024
      },
    },
  });

  const { tableProps } = useTable<IDriver, HttpError>({
    resource: "drivers?session_key=latest",
    hasPagination: false,
  });


  console.log(tableProps)
  // const { data, isLoading } = useMany<IDriver>({
  //   resource: "drivers",
  //   ids: categoryIds,
  //   queryOptions: {
  //     enabled: categoryIds.length > 0,
  //   },
  // });

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="driver_number" title="Driver No" />
        <Table.Column dataIndex="full_name" title="Full Name" />
        <Table.Column dataIndex="team_name" title="Team Name" />


        {/* <Table.Column<IDriver>
          title="Actions"
          dataIndex="actions"
          render={(_, record) => (
            <Space>
              <EditButton hideText size="small" recordItemId={record.id} />
              <ShowButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        /> */}
      </Table>
    </List>
  );
};
