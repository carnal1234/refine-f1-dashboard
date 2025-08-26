import { Row, CollapseProps, Col, Button, Badge } from 'antd';
import { MeetingParams, SessionParams, WeatherParams } from '@/interfaces/openf1';
import WeatherBar from './WeatherBar';
import { useState, useEffect } from 'react';
import { getCountryCode } from '@/utilities/helper';

interface DashboardProps {
    trackTemperature: number,
    airTemperature: number,
    humidity: number,
    rainfall: number,
    windSpeed: number,
    meeting: MeetingParams,
    session: SessionParams
}




const DashboardHeader = ({
    trackTemperature,
    airTemperature,
    humidity,
    rainfall,
    windSpeed,
    meeting,
    session,
}: DashboardProps) => {
    const [countryCode, setCountryCode] = useState()

    useEffect(() => {
        if (meeting && meeting.country_name) {
            const code = getCountryCode(meeting.country_name);
            setCountryCode(code as any);
        } else {
            setCountryCode(undefined);
        }
    }, [meeting]);

    return (
        <Row align="middle" justify="space-between" gutter={[16, 16]}>
            {/* Left: Event Info */}
            <Col xs={24} sm={8} style={{ display: 'flex', alignItems: 'center' }}>
                {countryCode && (<span className={`fi fis fi-${countryCode}`} style={{ width: '64px', height: '32px' }}></span>)}
                <div style={{ marginLeft: 12 }}>
                    <h1 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>{meeting?.meeting_name}: {session?.session_type}</h1>
                    {/* <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>01:25:43</p> */}
                </div>
            </Col>

            {/* Center: Weather & Track Info */}
            <Col xs={24} sm={12} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
                {/* Temperature TRC */}
                <WeatherBar
                    trackTemperature={trackTemperature}
                    airTemperature={airTemperature}
                    humidity={humidity}
                    rainfall={rainfall}
                    windSpeed={windSpeed}
                />
            </Col>
        </Row>
    );
};

export default DashboardHeader;