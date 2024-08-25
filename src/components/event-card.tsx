import React, { forwardRef, useState, useImperativeHandle } from 'react'

import { Card, Typography, Timeline, Button, Empty } from 'antd'


import {
    ToTopOutlined,
    MenuUnfoldOutlined,
    RightOutlined,
    InfoCircleOutlined,
} from "@ant-design/icons";
import Paragraph from "antd/lib/typography/Paragraph";
import { RaceControlParams } from '@/interfaces/openf1';
import { Text as CustomText } from "@/components/common";




interface EventCardProps {
    dataList: RaceControlParams[],
    driverAcronym: Record<string, string>
}

export type EventCardRef = {
    updateLap: (lap: number) => void;
};

const EventCard = forwardRef<EventCardRef, EventCardProps>((props, ref) => {

    const { Title, Text } = Typography;

    const [selectedLap, setSelectedLap] = useState<number | undefined>()

    const filter_data = props.dataList.filter(i => i.lap_number === selectedLap)

    useImperativeHandle(ref, () => ({
        updateLap: (lap: number | undefined) => {
            setSelectedLap(lap)
        }
    }), []);



    const [reverse, setReverse] = useState(false);


    return (
        <Card
            // bordered={false} className="criclebox h-full" style={{ height: '100%' }}
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
                    <InfoCircleOutlined />
                    <CustomText size="sm" style={{ marginLeft: '0.5rem' }}>
                        Race Events
                    </CustomText>
                </div>
            }
        >



            <div className="timeline-box">


                {
                    selectedLap ?
                        <Paragraph className="lastweek" style={{ marginBottom: 24 }}>
                            <span className="bnb2">Lap {selectedLap}</span>
                        </Paragraph>
                        : <></>

                }
                {filter_data && filter_data.length > 0 ?

                    <Timeline
                        className="timelinelist"
                        reverse={reverse}
                    >
                        {
                            filter_data && filter_data.length > 0 ?
                                filter_data.map((t, index) => {
                                    // const title = props.driverAcronym[t.driver_number!]

                                    return (
                                        <Timeline.Item key={index}>
                                            {/* <Title level={5}>{title}</Title> */}
                                            <Text> {t.message}</Text>
                                        </Timeline.Item>
                                    )


                                })
                                : <></>

                        }
                    </Timeline>

                    :
                    <Empty />}

            </div>
        </Card>
    )
})

export default EventCard
