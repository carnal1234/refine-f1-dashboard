import React, { useEffect, useMemo } from 'react';
import { Table, Tag, Card } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { DriverParams, LapParams, SessionResultParams, SessionParams, MeetingParams } from '@/interfaces/openf1';
import { formatSecondsToTime, groupBy } from '@/utilities/helper';
import DriverAvatar from './driver-avatar';

interface LeaderboardProps {
    // Core data props
    data: any[];
    columns: ColumnsType<any>;

    // Optional props for different use cases
    title?: string;
    loading?: boolean;
    pagination?: false | TablePaginationConfig;
    size?: 'small' | 'middle' | 'large';
    scroll?: { x?: number | string; y?: number | string };

    // Optional styling
    cardStyle?: React.CSSProperties;
    tableStyle?: React.CSSProperties;

    // Optional callbacks
    onRow?: (record: any, index?: number) => React.HTMLAttributes<HTMLTableRowElement>;
    rowClassName?: (record: any, index?: number) => string;

    // Optional features
    showCard?: boolean;
    stripedRows?: boolean;
}

const Leaderboard: React.FC<LeaderboardProps> = ({
    data,
    columns,
    title,
    loading = false,
    pagination = false,
    size = 'middle',
    scroll = { x: 800, y: 600 },
    cardStyle = {},
    tableStyle = {},
    onRow,
    rowClassName,
    showCard = true,
    stripedRows = true
}) => {

    const defaultRowClassName = (record: any, index?: number) => {
        if (!stripedRows) return '';
        return index !== undefined && index % 2 === 0 ? 'ant-table-row-striped' : '';
    };

    const tableComponent = (
        <Table
            columns={columns}
            dataSource={data}
            pagination={pagination}
            size={size}
            scroll={scroll}
            style={{ ...tableStyle }}
            loading={loading}
            onRow={onRow}
            rowClassName={rowClassName || defaultRowClassName}
        />
    );

    if (!showCard) {
        return tableComponent;
    }

    return (
        <Card
            title={title}
            // style={{
            //     backgroundColor: '#f5f5f5',
            //     borderRadius: 8,
            //     ...cardStyle
            // }}
            bodyStyle={{ padding: 0 }}
        >
            {tableComponent}
        </Card>
    );
};

export default Leaderboard;