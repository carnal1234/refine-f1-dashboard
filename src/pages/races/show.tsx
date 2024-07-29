import { useCustom, useApiUrl } from "@refinedev/core";
import { useParams, useSearchParams } from "react-router-dom";
import { Flex, Spin } from "antd";

import { ListItemProps } from "antd/lib/list";



import { Show, MarkdownField } from "@refinedev/antd";

import { Card, Typography } from "antd";

// import type { ISession } from "../../interfaces";


import { Line, LineConfig, Bar, BarConfig, ColumnConfig } from '@ant-design/plots'





import { IDriver, ILap, ISession, IStint } from "../../interfaces";
import { useEffect, useState } from "react";
import { DollarOutlined, FieldTimeOutlined } from "@ant-design/icons";
import { Text as CustomText } from "../../components/common";
import { Datum } from "@ant-design/charts";
import { StintGraph } from "../../components/graph/stint";


const { Title, Text } = Typography;

interface CustomMap {
    [key: string]: string | undefined
}

interface CustomStintMap {
    [key: string]: object | undefined
}



export const SessionShow = () => {
    const apiUrl = useApiUrl();


    const { session_key } = useParams();

    const [driverData, setDriverData] = useState<Array<IDriver>>([]);
    const [sessionData, setSessionData] = useState<Array<ISession>>([]);
    const [lapData, setLapData] = useState<Array<ILap>>([]);
    const [stintData, setStintData] = useState<Array<IStint>>([]);

    const [isLoading, setIsLoading] = useState(true);



    const driverAcronym = driverData.reduce((driversSoFar: CustomMap, { driver_number, name_acronym }) => {
        let key = driver_number.toString()
        if (!driversSoFar[key]) driversSoFar[key] = name_acronym;
        //driversSoFar[key].push(name_acronym);
        return driversSoFar;
    }, {});




    const maxLap = Math.max(...stintData.map(d => d.lap_end), 0);



    async function fetchAllData() {
        const [driverResponse, sessionResponse, lapResponse, stintResponse] = await Promise.all([
            fetch(`${apiUrl}/drivers?session_key=${session_key}`),
            fetch(`${apiUrl}/sessions?session_key=${session_key}`),
            fetch(`${apiUrl}/laps?session_key=${session_key}`),
            fetch(`${apiUrl}/stints?session_key=${session_key}`)
        ]);

        const driverData = await driverResponse.json();
        const sessionData = await sessionResponse.json();
        const lapData = await lapResponse.json();
        const stintData = await stintResponse.json();

        return [driverData, sessionData, lapData, stintData];
    }




    useEffect(() => {
        fetchAllData().then(([driverData, sessionData, lapData, stintData]) => {
            setDriverData(driverData);
            setSessionData(sessionData);

            for (let item of lapData) {
                item['driver_number'] = item['driver_number'].toString()
            }
            setLapData(lapData)

            for (let item of stintData) {
                item['driver_number'] = item['driver_number'].toString()
                item['lap_interval'] = [item['lap_start'], item['lap_end']]
            }
            setStintData(stintData)

            setIsLoading(false)

        }).catch(error => {

        });
    }, []);

    const lapDataProps: LineConfig = {
        data: lapData,
        xField: "lap_number",
        yField: "lap_duration",
        isStack: false,
        seriesField: 'driver_number',


        yAxis: {
            label: { formatter: (v) => `${v}`.replace('_', ' ').replace(/\d{1,3}(?=(\d{3})+$)/g, (s) => `${s},`) },
            title: {
                description: "Lap Time",

            },
            min: null
        },
        xAxis: {
            title: {
                description: "Lap",
            },
        },
        meta: {
            lap_duration: {
                alias: '圈速'
            },
            lap_number: {
                alias: '圈'
            }
        },
        padding: [20, 100, 30, 80],
        legend: {
            position: 'right-top',
            itemName: {
                formatter: function (text: string) {
                    return driverAcronym[text] ? (text + " " + driverAcronym[text]) : text
                }  // 格式化文本函数
            }

        },
        tooltip: {
            formatter: (data) => {
                let driverNumber = data.driver_number
                let name = driverAcronym[driverNumber] ? (driverNumber + " " + driverAcronym[driverNumber]) : driverNumber

                return {
                    name: name,
                    value: `${data.lap_duration}s`
                }
            }
        },

    };

    const BarConfig: BarConfig = {
        data: stintData,
        xField: 'lap_interval',
        yField: 'driver_number',
        seriesField: 'compound',

        isStack: false,
        // isGroup: true,
        // groupField: "compound",


        yAxis: {
            min: 0,
            max: maxLap,
            label: {
            }

        },

        minBarWidth: 20,


        color: function (datum: Datum) {
            switch (datum.compound) {
                case 'SOFT': return '#FF0000';
                case 'MEDIUM': return '#FFFF00';
                case 'HARD': return '#f2f2f2';
            }
            return '#000000'
        },


    };

    return (
        <div>


            <CustomText size="lg" style={{ margin: '1rem', padding: '8px 16px' }}>
                {sessionData[0]?.country_name} {sessionData[0]?.session_type} Data
            </CustomText>
            <Card
                style={{ height: '100%', marginTop: '10px' }}
                headStyle={{ padding: '8px 16px' }}
                bodyStyle={{ padding: '24px 24px 0 24px' }}
                title={
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <FieldTimeOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                        <CustomText size="sm" style={{ marginLeft: '0.5rem' }}>
                            Race Pace
                        </CustomText>
                    </div>
                }
            >
                {isLoading ? (
                    <Flex align="center" gap="middle" justify="center">
                        <Spin size="large" />
                    </Flex>


                ) : (
                    <Line {...lapDataProps} height={500} />
                )}

            </Card>

            <Card
                style={{ height: '100%', marginTop: '10px' }}
                headStyle={{ padding: '8px 16px' }}
                bodyStyle={{ padding: '24px 24px 0 24px' }}
                title={
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <FieldTimeOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                        <CustomText size="sm" style={{ marginLeft: '0.5rem' }}>
                            Stint Data
                        </CustomText>
                    </div>
                }
            >
                <StintGraph data={stintData} driverAcronym={driverAcronym} />
            </Card>
        </div>


    )

};
