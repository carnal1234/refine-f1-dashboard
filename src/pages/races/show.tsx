import { useCustom, useApiUrl } from "@refinedev/core";
import { useParams, useSearchParams } from "react-router-dom";
import { Flex, Spin } from "antd";

import { ListItem } from "@antv/component/lib/types"



import { Show, MarkdownField } from "@refinedev/antd";

import { Card, Typography } from "antd";

// import type { ISession } from "../../interfaces";


import { Line, LineConfig, Bar, BarConfig } from '@ant-design/plots'





import { IDriver, ILap, ISession, IStint } from "../../interfaces";
import { useEffect, useState } from "react";
import { DollarOutlined, FieldTimeOutlined } from "@ant-design/icons";
import { Text as CustomText } from "../../components/common";


const { Title, Text } = Typography;

interface CustomMap {
    [key: string]: string | undefined
}


export const SessionShow = () => {
    const apiUrl = useApiUrl();


    const { session_key } = useParams();

    const [driverData, setDriverData] = useState<Array<IDriver>>([]);
    const [sessionData, setSessionData] = useState<Array<ISession>>([]);
    const [lapData, setLapData] = useState<Array<ILap>>([]);
    const [stintData, setStintData] = useState<Array<IStint>>([]);

    const [isLoading, setIsLoading] = useState(true);



    const driverGroupByNumber = driverData.reduce((driversSoFar: CustomMap, { driver_number, name_acronym }) => {
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
                formatter: function (text: string, item: ListItem, index: number) {
                    return driverGroupByNumber[text] ? (text + " " + driverGroupByNumber[text]) : text
                }  // 格式化文本函数
            }

        },
        tooltip: {
            formatter: (data) => {
                let driverNumber = data.driver_number
                let name = driverGroupByNumber[driverNumber] ? (driverNumber + " " + driverGroupByNumber[driverNumber]) : driverNumber

                return {
                    name: name,
                    value: `${data.lap_duration}s`
                }
            }
        },

    };

    const BarConfig: BarConfig = {
        data: stintData,
        xField: 'lap_start',
        yField: 'driver_number',
        seriesField: 'compound',


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

            {/* <Card
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
                <Bar {...BarConfig} height={500} />
            </Card> */}
        </div>


    )

};
