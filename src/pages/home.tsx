import { useEffect, useState } from 'react';
import { Alert, Row, Col, Typography, Card, Statistic, Space, Spin } from 'antd';
import { ClockCircleOutlined, CalendarOutlined, TrophyOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { fetchCurrentSeason } from '@/services/ergastApi';
import { findNextRace } from '@/utilities/helper';

const { Title, Text } = Typography;

type TimeLeft = {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    weeks: number;
};

// Separate CountdownCounter component
const CountdownCounter: React.FC<{ timeLeft: TimeLeft }> = ({ timeLeft }) => {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            flexWrap: 'wrap',
            margin: '20px 0'
        }}>
            <div style={{
                textAlign: 'center',
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                minWidth: '100px'
            }}>
                <div style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    color: '#fff',
                    marginBottom: '5px'
                }}>
                    {String(timeLeft.weeks).padStart(2, '0')}
                </div>
                <div style={{
                    fontSize: '1rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                    textTransform: 'uppercase'
                }}>
                    Weeks
                </div>
            </div>
            <div style={{
                textAlign: 'center',
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                minWidth: '100px'
            }}>
                <div style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    color: '#fff',
                    marginBottom: '5px'
                }}>
                    {String(timeLeft.days).padStart(2, '0')}
                </div>
                <div style={{
                    fontSize: '1rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                    textTransform: 'uppercase'
                }}>
                    Days
                </div>
            </div>
            <div style={{
                textAlign: 'center',
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                minWidth: '100px'
            }}>
                <div style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    color: '#fff',
                    marginBottom: '5px'
                }}>
                    {String(timeLeft.hours).padStart(2, '0')}
                </div>
                <div style={{
                    fontSize: '1rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                    textTransform: 'uppercase'
                }}>
                    Hours
                </div>
            </div>
            <div style={{
                textAlign: 'center',
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                minWidth: '100px'
            }}>
                <div style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    color: '#fff',
                    marginBottom: '5px'
                }}>
                    {String(timeLeft.minutes).padStart(2, '0')}
                </div>
                <div style={{
                    fontSize: '1rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                    textTransform: 'uppercase'
                }}>
                    Minutes
                </div>
            </div>
            <div style={{
                textAlign: 'center',
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                minWidth: '100px'
            }}>
                <div style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    color: '#fff',
                    marginBottom: '5px'
                }}>
                    {String(timeLeft.seconds).padStart(2, '0')}
                </div>
                <div style={{
                    fontSize: '1rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                    textTransform: 'uppercase'
                }}>
                    Seconds
                </div>
            </div>
        </div>
    );
};

export const HomePage = () => {
    const [data, setData] = useState<any>();
    const [raceIndex, setNextRaceIndex] = useState(0);
    const [currentRace, setCurrentRace] = useState<any>({});
    const [isLoading, setIsLoading] = useState(false);

    const calculateTimeLeft = () => {
        let race = data?.MRData?.RaceTable?.Races ? data.MRData.RaceTable.Races[raceIndex] : undefined;

        if (race) {
            let currentTime = new Date();
            const raceDate = new Date(race.date + "T" + race.time);
            const timeDiff = raceDate.getTime() - currentTime.getTime();
            const weeks = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 7));
            const days = Math.floor((timeDiff % (1000 * 60 * 60 * 24 * 7)) / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

            let timeLeft: TimeLeft = {} as TimeLeft;

            if (timeDiff > 0) {
                timeLeft = {
                    weeks: weeks,
                    days: days,
                    hours: hours,
                    minutes: minutes,
                    seconds: seconds,
                };
            }

            return timeLeft;
        } else {
            return {
                weeks: 0,
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0,
            };
        }
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const mode = import.meta.env.MODE;

        async function fetchData() {
            try {
                setIsLoading(true)
                const apiData = mode === "development" ? await import('@/data/current.json') : await fetchCurrentSeason();
                setData(apiData);
                const raceIndex = findNextRace(apiData.MRData.RaceTable.Races);
                setNextRaceIndex(raceIndex);
                setCurrentRace(apiData.MRData.RaceTable.Races[raceIndex]);

            } catch (err) {
                console.error("Error fetching data", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setTimeLeft(calculateTimeLeft()), 1000);
        return () => clearTimeout(timer);
    }, [timeLeft]);

    const RaceInfo: React.FC = () => {
        if (!currentRace) return null;

        return (
            <>
                <Spin spinning={isLoading} tip={isLoading ? "Refreshing..." : "Loading..."}></Spin>
                <Card
                    style={{
                        marginBottom: 24,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white'
                    }}
                >
                    <Row align="middle" justify="space-between">
                        <Col>
                            <Space direction="vertical" size="small">
                                <Title level={2} style={{ color: 'white', margin: 0 }}>
                                    {currentRace.raceName}
                                </Title>
                                <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
                                    {currentRace.circuitName} • {dayjs(currentRace.date).format('MMMM D, YYYY')}
                                </Text>
                            </Space>
                        </Col>
                        <Col>
                            <TrophyOutlined style={{ fontSize: '48px', color: 'rgba(255,255,255,0.8)' }} />
                        </Col>
                    </Row>
                </Card>
            </>
        );
    };

    return (
        <div style={{
            padding: '24px',
            minHeight: '100vh',
            // background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
            color: 'white'
        }}>
            <Row justify="center">
                <Col xs={24} lg={20} xl={16}>
                    {/* Centered Alert */}
                    <Row justify="center" style={{ marginBottom: 24 }}>
                        <Col>
                            <Alert
                                message="OpenF1 API is under development and race data is currently available for 2023-2024 seasons."
                                type="warning"
                                style={{ textAlign: 'center' }}
                            />
                        </Col>
                    </Row>

                    {/* Race Information */}
                    <RaceInfo />

                    {/* Countdown Counter */}
                    <Card
                        title={
                            <Space>
                                <ClockCircleOutlined />
                                <span>Countdown to Next Race</span>
                            </Space>
                        }
                        style={{
                            marginBottom: 24,
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                    >
                        <CountdownCounter timeLeft={timeLeft} />
                    </Card>

                    {/* Additional Race Details */}
                    {currentRace && (
                        <Card
                            title="Race Details"
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)'
                            }}
                        >
                            <Row gutter={[16, 16]}>
                                <Col xs={24} md={12}>
                                    <Statistic
                                        title="Circuit"
                                        value={currentRace?.Circuit?.circuitName}
                                        valueStyle={{ fontSize: '16px', color: 'white' }}
                                    />
                                </Col>
                                <Col xs={24} md={12}>
                                    <Statistic
                                        title="Date"
                                        value={dayjs(currentRace.date).format('MMMM D, YYYY')}
                                        valueStyle={{ fontSize: '16px', color: 'white' }}
                                    />
                                </Col>
                                <Col xs={24} md={12}>
                                    <Statistic
                                        title="Time"
                                        value={currentRace.time ? dayjs(`2000-01-01T${currentRace.time}`).format('HH:mm') : 'TBD'}
                                        valueStyle={{ fontSize: '16px', color: 'white' }}
                                    />
                                </Col>
                                <Col xs={24} md={12}>
                                    <Statistic
                                        title="Round"
                                        value={currentRace.round}
                                        valueStyle={{ fontSize: '16px', color: 'white' }}
                                    />
                                </Col>
                            </Row>
                        </Card>
                    )}
                </Col>
            </Row>
        </div>
    );
};