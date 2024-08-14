import { useCustom, useApiUrl } from "@refinedev/core";
import { useParams, useSearchParams } from "react-router-dom";
import { Flex, Row, Col, Spin } from "antd";

import { ListItemProps } from "antd/lib/list";



import { Show, MarkdownField } from "@refinedev/antd";

import { Card, Typography } from "antd";









import { DriverParams, LapParams, PositionParams, SessionParams, StintParams } from "../../interfaces/openf1";
import { useEffect, useRef, useState } from "react";
import { DollarOutlined, FieldTimeOutlined } from "@ant-design/icons";
import { Text as CustomText } from "../../components/common";
import { Datum } from "@ant-design/charts";
import { StintGraph } from "../../components/graph/stint";
import { RacePaceGraph } from "../../components/graph/race-pace";
import RaceWinnerCard from "../../components/races/winner-card";
import { RacePositionTable } from "../../components/races/position-table";
import DriverAvatar from "../../components/driver-avatar";
import DriverAvatarGroup from "@/components/driver-avatar-group";

import { TelemetryProvider, useTelemetry } from "@/context/TelemetryContext";





const { Title, Text } = Typography;

interface CustomMap {
    [key: string]: string
}

interface CustomStintMap {
    [key: string]: object
}



const SessionContent = () => {


    const apiUrl = useApiUrl();


    const { session_key } = useParams();

    const [driverData, setDriverData] = useState<Array<DriverParams>>([]);
    const [sessionData, setSessionData] = useState<Array<SessionParams>>([]);
    const [lapData, setLapData] = useState<Array<LapParams>>([]);
    const [stintData, setStintData] = useState<Array<StintParams>>([]);
    const [positionData, setPositionData] = useState<Array<PositionParams>>([]);
    const [isLoading, setIsLoading] = useState(true);


    //USER PREFERENCE

    // const selectedDriver: Record<string, boolean> = {}
    //const [selectedDriver, setSelectedDriver] = useState<Record<string, boolean>>({})

    const {
        isShowDriverSelect, setIsShowDriverSelect,
        //drivers, setDrivers,
        selectedDrivers, setSelectedDrivers,

    } = useTelemetry();



    const toggleDriverSelect = async (driver: DriverParams) => {

        if (!driver) return;

        let driver_no = driver.driver_number?.toString()!
        if (driver_no && selectedDrivers.hasOwnProperty(driver_no)) {
            //selectedDriver[driver_no] = !selectedDriver[driver_no]
            let value = !selectedDrivers[driver_no]
            setSelectedDrivers({ ...selectedDrivers, [driver_no]: value })
        }
        // racePaceGraphRef?.current?.updateChart()
        // console.log(selectedDrivers)
    }







    const driverAcronym = driverData.reduce((driversSoFar: CustomMap, { driver_number, name_acronym }) => {
        let key = driver_number?.toString()!
        if (!driversSoFar[key]) driversSoFar[key] = name_acronym!;
        //driversSoFar[key].push(name_acronym);
        return driversSoFar;
    }, {});




    const maxLap = Math.max(...stintData.map(d => d.lap_end!), 0);




    useEffect(() => {

        const mode = import.meta.env.MODE

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

        async function fetchMockData() {
            const [driverData, sessionData, lapData, stintData, positionData] = await Promise.all([
                await import('@/data/driver.json'),
                await import('@/data/sessions.json'),
                await import('@/data/lap.json'),
                await import('@/data/stint.json'),
                await import('@/data/position.json'),
            ]);
            return [driverData?.default, sessionData?.default, lapData?.default, stintData?.default, positionData?.default];
        }

        const setAllData = ([driverData, sessionData, lapData, stintData, positionData]: any) => {
            for (let item of driverData) {
                item['driver_number'] = item['driver_number']?.toString()
            }

            setDriverData(driverData);

            for (let item of sessionData) {
                //item['driver_number'] = item['driver_number']?.toString()
            }

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

            let obj: Record<string, boolean> = {}

            driverData.map((d: DriverParams) => {
                if (d.driver_number) obj[d.driver_number?.toString()] = true
            })

            setSelectedDrivers(obj)
        }

        if (mode === "development") {
            fetchMockData().then(([driverData, sessionData, lapData, stintData, positionData]) => {

                setAllData([driverData, sessionData, lapData, stintData, positionData])

            }).catch(error => {
                console.error(error)

            })


        } else {
            fetchAllData().then(([driverData, sessionData, lapData, stintData, positionData]) => {
                setAllData([driverData, sessionData, lapData, stintData, positionData])

            }).catch(error => {
                console.error(error)

            })


        }

    }, []);

    // useEffect(() => {
    //     localStorage.setItem("selectedDriver", JSON.stringify(selectedDriver));
    // }, [selectedDriver]);













    return (
        <TelemetryProvider>

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
            <div>
                <DriverAvatarGroup drivers={driverData} selectedDrivers={selectedDrivers} toggleDriverSelect={toggleDriverSelect} />
            </div>



            <CustomText size="lg" style={{ margin: '1rem', padding: '8px 16px' }}>
                {sessionData[0]?.country_name} {sessionData[0]?.session_type} Data
            </CustomText>



            <RacePaceGraph data={lapData} driverData={driverData} driverAcronym={driverAcronym} isLoading={isLoading} selectedDrivers={selectedDrivers} />


            <StintGraph data={stintData} driverAcronym={driverAcronym} isLoading={isLoading} />

        </TelemetryProvider>


    )
}

export const SessionPage: React.FC = () => {
    return (
        <TelemetryProvider>
            <SessionContent />
        </TelemetryProvider>
    );
};





