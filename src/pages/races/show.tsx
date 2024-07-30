import { useCustom, useApiUrl } from "@refinedev/core";
import { useParams, useSearchParams } from "react-router-dom";
import { Flex, Row, Col, Spin } from "antd";

import { ListItemProps } from "antd/lib/list";



import { Show, MarkdownField } from "@refinedev/antd";

import { Card, Typography } from "antd";

// import type { ISession } from "../../interfaces";







import { IDriver, ILap, IPosition, ISession, IStint } from "../../interfaces";
import { useEffect, useState } from "react";
import { DollarOutlined, FieldTimeOutlined } from "@ant-design/icons";
import { Text as CustomText } from "../../components/common";
import { Datum } from "@ant-design/charts";
import { StintGraph } from "../../components/graph/stint";
import { RacePaceGraph } from "../../components/graph/race-pace";
import RaceWinnerCard from "../../components/races/winner-card";
import { RacePositionTable } from "../../components/races/position-table";


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
    const [positionData, setPositionData] = useState<Array<IPosition>>([]);

    const [isLoading, setIsLoading] = useState(true);



    const driverAcronym = driverData.reduce((driversSoFar: CustomMap, { driver_number, name_acronym }) => {
        let key = driver_number.toString()
        if (!driversSoFar[key]) driversSoFar[key] = name_acronym;
        //driversSoFar[key].push(name_acronym);
        return driversSoFar;
    }, {});




    const maxLap = Math.max(...stintData.map(d => d.lap_end), 0);



    async function fetchAllData() {
        const [driverResponse, sessionResponse, lapResponse, stintResponse, positionResponse] = await Promise.all([
            fetch(`${apiUrl}/drivers?session_key=${session_key}`),
            fetch(`${apiUrl}/sessions?session_key=${session_key}`),
            fetch(`${apiUrl}/laps?session_key=${session_key}`),
            fetch(`${apiUrl}/stints?session_key=${session_key}`),
            fetch(`${apiUrl}/position?session_key=${session_key}`)
        ]);

        const driverData = await driverResponse.json();
        const sessionData = await sessionResponse.json();
        const lapData = await lapResponse.json();
        const stintData = await stintResponse.json();
        const positionData = await positionResponse.json();
        return [driverData, sessionData, lapData, stintData, positionData];
    }




    useEffect(() => {
        fetchAllData().then(([driverData, sessionData, lapData, stintData, positionData]) => {
            setDriverData(driverData);
            setSessionData(sessionData);

            for (let item of lapData) {
                item['driver_number'] = item['driver_number'].toString()
            }
            setLapData(lapData)

            for (let item of stintData) {
                item['driver_number'] = item['driver_number']?.toString()
                item['lap_interval'] = [item['lap_start'], item['lap_end']]
            }
            setStintData(stintData)

            setPositionData(positionData)

            setIsLoading(false)

        }).catch(error => {
            console.error(error)

        });
    }, []);




    return (
        <div>

            {/* <Row
                gutter={[32, 32]}
                style={{
                    marginTop: '32px'
                }}
            >
                <Col
                    xs={24}
                    sm={24}
                    xl={8}
                    style={{
                        height: '460px'
                    }}
                >
                    Finish Position Table

                    <RacePositionTable positionData={positionData} driverAcronym={driverAcronym} isLoading={isLoading} />


                </Col>

            </Row>

            <Row
                gutter={[32, 32]}
                style={{
                    marginTop: '32px'
                }}
            >
                <Col xs={24}>
                    Lastest
                </Col>
            </Row> */}



            <CustomText size="lg" style={{ margin: '1rem', padding: '8px 16px' }}>
                {sessionData[0]?.country_name} {sessionData[0]?.session_type} Data
            </CustomText>



            <RacePaceGraph data={lapData} driverAcronym={driverAcronym} isLoading={isLoading} />


            <StintGraph data={stintData} driverAcronym={driverAcronym} isLoading={isLoading} />

        </div>


    )

};
