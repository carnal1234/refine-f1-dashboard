import { useCustom, useApiUrl } from "@refinedev/core";

import {
  List,
  useTable,

} from "@refinedev/antd";

import { Table, Space } from "antd";

import type { DriverParams } from "../../interfaces/openf1";
import { HttpError } from "../../../node_modules/@refinedev/core/dist/index";

export const DriverList = () => {

  const apiUrl = useApiUrl();

  //"https://api.openf1.org/v1/sessions?session_type=Race&year=2023"

  const { data, isLoading } = useCustom<DriverParams>({
    url: `${apiUrl}/sessions`,
    method: "get",
    config: {
      query: {
        session_type: "Race",
        year: 2024
      },
    },
  });

  const { tableProps } = useTable<DriverParams, HttpError>({
    resource: "drivers?session_key=latest",
    hasPagination: false,
  });




  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="driver_number" title="Driver No" />
        <Table.Column dataIndex="full_name" title="Full Name" />
        <Table.Column dataIndex="team_name" title="Team Name" />


        {/* <Table.Column<DriverParams>
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
