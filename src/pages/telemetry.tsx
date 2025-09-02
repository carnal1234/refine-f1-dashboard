import React, { useEffect, useMemo, useState } from 'react';
import { Card, Select, Col, Row, Typography, Button, message } from 'antd';
import { DriverParams, LapParams, SessionParams, MeetingParams } from '@/interfaces/openf1';
import { fetchTelemetry } from '@/services/fastApi';
import SpeedGraph from '@/components/graph/speedGraph';
import { formatSecondsToTime } from '@/utilities/helper';
import ThrottleGraph from '@/components/graph/throttleGraph';
import BrakeGraph from '@/components/graph/brakeGraph';
import DRSGraph from '@/components/graph/drsGraph';
import GearGraph from '@/components/graph/gearGraph';
import RPMGraph from '@/components/graph/rpmGraph';

const { Title } = Typography;

interface TelemetryProps {
    meetingData: Array<MeetingParams>,
    sessionData: Array<SessionParams>,
    lapData: Array<LapParams>,
    driverData: Array<DriverParams>,
    selectedDrivers: Record<string, boolean>,
    driverTeamColorMap: any,
    driverAcronym: any,
}

const Telemetry: React.FC<TelemetryProps> = ({
    meetingData,
    sessionData,
    lapData,
    driverData,
    selectedDrivers,
    driverTeamColorMap,
    driverAcronym,
}) => {

    const [isLoading, setIsLoading] = useState(false)
    const [selectedLap, setSelectedLap] = useState<number>(1)
    const [telemetryData, setTelemetryData] = useState<Array<any>>([])
    const [selectedDriverCodes, setSelectedDriverCodes] = useState<Array<string>>([])
    const [telemetryCache, setTelemetryCache] = useState<Record<string, any>>({})
    const [driverLoadingStatus, setDriverLoadingStatus] = useState<Record<string, boolean>>({})

    const driverAcronymMap = useMemo(() => {
        const mapping: Record<string, number> = {}
        for (const [num, name] of Object.entries(driverAcronym)) {
            mapping[name as string] = parseInt(num as string);
        }
        return mapping
    }, [driverAcronym])

    // Generate cache key for telemetry data
    const generateCacheKey = (sessionKey: number, driverCode: string, lapNumber: number): string => {
        return `${sessionKey}_${driverCode}_${lapNumber}`;
    };

    // Check if data exists in cache
    const getCachedTelemetry = (sessionKey: number, driverCode: string, lapNumber: number): any[] | null => {
        const cacheKey = generateCacheKey(sessionKey, driverCode, lapNumber);
        return telemetryCache[cacheKey] || null;
    };

    // Store data in cache
    const cacheTelemetry = (sessionKey: number, driverCode: string, lapNumber: number, data: any[]): void => {
        const cacheKey = generateCacheKey(sessionKey, driverCode, lapNumber);
        setTelemetryCache(prev => ({
            ...prev,
            [cacheKey]: data
        }));
    };

    const handleCompare = async () => {
        if (selectedDriverCodes.length === 0) {
            message.warning('Please select at least one driver to compare');
            return;
        }

        if (!sessionData[0]?.session_key) {
            message.error('Session key not available');
            return;
        }

        try {
            setIsLoading(true);
            // Initialize loading status for all selected drivers
            const initialLoadingStatus: Record<string, boolean> = {};
            selectedDriverCodes.forEach(driverCode => {
                initialLoadingStatus[driverCode] = true;
            });
            setDriverLoadingStatus(initialLoadingStatus);

            const allTelemetryData: Array<any> = [];
            const sessionKey = sessionData[0].session_key;
            const year = sessionData[0].year;
            const grand_prix = meetingData[0].meeting_name;
            const session_type = sessionData[0].session_type;
            const lap_number = selectedLap;

            for (const driverCode of selectedDriverCodes) {
                // Check cache first
                const cachedData = getCachedTelemetry(Number(sessionKey), driverCode, lap_number);

                if (cachedData) {
                    console.log(`Using cached data for ${driverCode} lap ${lap_number}`);
                    allTelemetryData.push(...cachedData);
                    // Update loading status for this driver
                    setDriverLoadingStatus(prev => ({ ...prev, [driverCode]: false }));
                } else {
                    console.log(`Fetching fresh data for ${driverCode} lap ${lap_number}`);
                    let mode = import.meta.env.MODE as string;
                    const response = mode === "development" ? await import('@/data/test.json') : await fetchTelemetry(year, grand_prix, session_type, driverCode, lap_number);

                    if (mode === 'development') {
                        allTelemetryData.push(...response.default);
                    } else if (response?.success && response?.telemetry?.data_points) {
                        const telemetryPoints = response.telemetry.data_points;
                        // Cache the fetched data
                        cacheTelemetry(Number(sessionKey), driverCode, lap_number, telemetryPoints);
                        allTelemetryData.push(...telemetryPoints);
                    }
                    // Update loading status for this driver
                    setDriverLoadingStatus(prev => ({ ...prev, [driverCode]: false }));
                }
            }

            setTelemetryData(allTelemetryData);
            message.success(`Loaded telemetry data for ${selectedDriverCodes.length} driver(s)`);
        } catch (error) {
            console.error('Error comparing drivers:', error);
            message.error('Failed to load telemetry data for comparison');
            // Reset loading status on error
            const resetLoadingStatus: Record<string, boolean> = {};
            selectedDriverCodes.forEach(driverCode => {
                resetLoadingStatus[driverCode] = false;
            });
            setDriverLoadingStatus(resetLoadingStatus);
        } finally {
            setIsLoading(false);
        }
    };

    const lapList = useMemo(() => {

        const maxLap = lapData?.reduce((maxLap, lap) => {
            return lap.lap_number && maxLap.lap_number && lap.lap_number > maxLap.lap_number ? lap : maxLap
        })
        const lapsArray = Array.from({ length: maxLap.lap_number! }, (_, index) => ({
            value: index + 1,
            label: index + 1,
        }));

        return lapsArray

    }, [lapData])

    const driverList = useMemo(() => {
        const selectedLapData = lapData?.filter(lap => lap.lap_number === selectedLap);
        return Object.keys(driverAcronymMap)
            ?.filter(driverCode => selectedLapData?.some(lap => lap.driver_number?.toString() === driverAcronymMap[driverCode]?.toString()))
            ?.map(driverCode => ({
                value: driverCode,
                label: driverCode
            }))
    }, [driverAcronymMap, selectedLap])

    // Preload telemetry data for current lap when it changes
    // useEffect(() => {
    //     if (sessionData[0]?.session_key && selectedLap > 0) {
    //         const preloadCommonDrivers = async () => {
    //             const commonDrivers = ['NOR', 'LEC', 'VER']; // Common drivers to preload
    //             const sessionKey = Number(sessionData[0].session_key);

    //             for (const driverCode of commonDrivers) {
    //                 // Only preload if not already cached
    //                 if (!getCachedTelemetry(sessionKey, driverCode, selectedLap)) {
    //                     try {
    //                         const year = sessionData[0].year;
    //                         const grand_prix = meetingData[0].meeting_name;
    //                         const session_type = sessionData[0].session_type;

    //                         const response = await fetchTelemetry(year, grand_prix, session_type, driverCode, selectedLap);
    //                         if (response?.success && response?.telemetry?.data_points) {
    //                             cacheTelemetry(sessionKey, driverCode, selectedLap, response.telemetry.data_points);
    //                             console.log(`Preloaded data for ${driverCode} lap ${selectedLap}`);
    //                         }
    //                     } catch (error) {
    //                         console.log(`Failed to preload data for ${driverCode} lap ${selectedLap}:`, error);
    //                     }
    //                 }
    //             }
    //         };

    //         preloadCommonDrivers();
    //     }
    // }, [selectedLap, sessionData, meetingData]);

    // Auto-remove retired drivers when lap changes
    useEffect(() => {
        if (selectedLap > 0 && selectedDriverCodes.length > 0) {
            const selectedLapData = lapData?.filter(lap => lap.lap_number === selectedLap);
            const availableDriversInLap = selectedLapData?.map(lap => lap.driver_number?.toString()) || [];

            // Filter out drivers who are not available in the selected lap
            const activeDrivers = selectedDriverCodes.filter(driverCode => {
                const driverNumber = driverAcronymMap[driverCode]?.toString();
                return driverNumber && availableDriversInLap.includes(driverNumber);
            });

            // If some drivers were removed, update the selection and show a message
            if (activeDrivers.length !== selectedDriverCodes.length) {
                const removedDrivers = selectedDriverCodes.filter(driverCode => !activeDrivers.includes(driverCode));
                setSelectedDriverCodes(activeDrivers);

                if (removedDrivers.length > 0) {
                    message.info(`Driver(s) ${removedDrivers.join(', ')} retired or not available in Lap ${selectedLap}. Removed from selection.`);
                }
            }
        }
    }, [selectedLap, lapData, driverAcronymMap, selectedDriverCodes]);


    return (
        <>
            <Card
                style={{
                    marginBottom: 16,
                    borderRadius: 8,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
                bodyStyle={{ padding: '16px 24px' }}
            >
                <Row gutter={[16, 16]} align="middle">
                    <Col>
                        <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                            📊 Telemetry Analysis
                        </Title>
                    </Col>
                    <Col flex="auto" />
                    {/* Lap Time Tags */}
                    {telemetryData && telemetryData.length > 0 && (
                        <Col>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                {(() => {
                                    // Create array of driver performance data and sort by lap time
                                    const driverPerformance = selectedDriverCodes.map(driverCode => {
                                        const driverNumber = driverAcronymMap[driverCode]?.toString();
                                        const lap = lapData.find(lap => lap.driver_number?.toString() === driverNumber && lap.lap_number === selectedLap);
                                        const driverData = telemetryData.find(point => point.driver_code === driverCode);
                                        return {
                                            driverCode,
                                            lapTime: formatSecondsToTime(lap?.lap_duration || 0),
                                            lapTimeSeconds: driverData?.lap_time_seconds || 0
                                        };
                                    }).sort((a, b) => a.lapTimeSeconds - b.lapTimeSeconds);

                                    return driverPerformance.map((driver, index) => (
                                        <div
                                            key={driver.driverCode}
                                            style={{
                                                padding: '6px 12px',
                                                backgroundColor: index === 0 ? '#f6ffed' :
                                                    index === 1 ? '#fff7e6' :
                                                        index === 2 ? '#fff2e8' : '#f5f5f5',
                                                border: `1px solid ${index === 0 ? '#b7eb8f' :
                                                    index === 1 ? '#ffd591' :
                                                        index === 2 ? '#ffbb96' : '#d9d9d9'}`,
                                                borderRadius: 16,
                                                fontSize: 12,
                                                fontWeight: 600,
                                                color: index === 0 ? '#52c41a' :
                                                    index === 1 ? '#faad14' :
                                                        index === 2 ? '#ff7a45' : '#666',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 4
                                            }}
                                        >

                                            <span>{driver.lapTime}-{driver.driverCode}</span>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </Col>
                    )}
                </Row>

                <Row gutter={[24, 16]} align="middle" style={{ marginTop: 16 }}>
                    <Col>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                                fontSize: 16,
                                fontWeight: 500,
                                color: '#666',
                                minWidth: '60px'
                            }}>
                                Lap:
                            </span>
                            <Select
                                placeholder="Select Lap"
                                value={selectedLap}
                                style={{
                                    width: 120,
                                    borderRadius: 6
                                }}
                                onChange={(value: number) => {
                                    setSelectedLap(value)
                                }}
                                options={lapList}
                                loading={isLoading}
                                showSearch
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                                }
                            />
                        </div>
                    </Col>

                    <Col>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                                fontSize: 14,
                                color: '#999',
                                fontStyle: 'italic'
                            }}>
                                Total Laps: {lapList?.length || 0}
                            </span>
                        </div>
                    </Col>

                    <Col>
                        {isLoading && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                color: '#1890ff',
                                fontSize: 14
                            }}>
                                <div style={{
                                    width: 16,
                                    height: 16,
                                    backgroundColor: '#1890ff',
                                    borderRadius: '50%',
                                    opacity: 0.6
                                }} />
                                Loading telemetry...
                            </div>
                        )}
                    </Col>
                </Row>

                <Row gutter={[24, 16]} align="middle" style={{ marginTop: 16 }}>
                    <Col>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                                fontSize: 16,
                                fontWeight: 500,
                                color: '#666',
                                minWidth: '80px'
                            }}>
                                Drivers:
                            </span>
                            <Select
                                mode="multiple"
                                placeholder="Select drivers to compare"
                                value={selectedDriverCodes}
                                onChange={setSelectedDriverCodes}
                                style={{
                                    width: 300,
                                    borderRadius: 6
                                }}
                                options={driverList}
                                showSearch
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                                }
                                maxTagCount={5}
                                maxTagTextLength={10}
                            />
                        </div>
                    </Col>

                    <Col>
                        <Button
                            type="primary"
                            onClick={handleCompare}
                            loading={isLoading}
                            disabled={selectedDriverCodes.length === 0}
                            style={{
                                borderRadius: 6,
                                height: 32
                            }}
                        >
                            🚀 Compare Telemetry
                        </Button>
                    </Col>
                </Row>

                {telemetryData && telemetryData.length > 0 && (
                    <Row style={{ marginTop: 16 }}>
                        <Col>
                            <div style={{
                                padding: '8px 16px',
                                backgroundColor: '#f6ffed',
                                border: '1px solid #b7eb8f',
                                borderRadius: 6,
                                color: '#52c41a',
                                fontSize: 14
                            }}>
                                ✅ Showing telemetry data for Lap {selectedLap} - {selectedDriverCodes.join(', ')} ({telemetryData.length} data points)
                            </div>
                        </Col>
                    </Row>
                )}

                {/* Fetching Status */}
                <Row style={{ marginTop: 12 }}>
                    <Col>
                        <div style={{
                            padding: '6px 12px',
                            backgroundColor: '#f0f9ff',
                            border: '1px solid #bae6fd',
                            borderRadius: 6,
                            color: '#0369a1',
                            fontSize: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            flexWrap: 'wrap'
                        }}>
                            <span>📡 Fetching Status:</span>
                            {Object.keys(driverLoadingStatus).length > 0 ? (
                                <>
                                    {Object.entries(driverLoadingStatus).map(([driverCode, isLoading]) => (
                                        <span
                                            key={driverCode}
                                            style={{
                                                padding: '2px 8px',
                                                backgroundColor: isLoading ? '#fef3c7' : '#dcfce7',
                                                border: `1px solid ${isLoading ? '#fbbf24' : '#22c55e'}`,
                                                borderRadius: 12,
                                                color: isLoading ? '#92400e' : '#166534',
                                                fontSize: 11,
                                                fontWeight: 500
                                            }}
                                        >
                                            {isLoading ? `⏳ Loading ${driverCode}...` : `✅ ${driverCode} Ready`}
                                        </span>
                                    ))}
                                </>
                            ) : (
                                <span style={{ color: '#6b7280', fontStyle: 'italic' }}>
                                    No drivers selected
                                </span>
                            )}
                        </div>
                    </Col>
                </Row>
            </Card>


            <SpeedGraph
                telemetryData={telemetryData}
                driverTeamColorMap={driverTeamColorMap}
                driverAcronymMap={driverAcronymMap}
                driverData={driverData}
                selectedDrivers={selectedDrivers}
                isLoading={isLoading}
            />

            <ThrottleGraph
                telemetryData={telemetryData}
                driverTeamColorMap={driverTeamColorMap}
                driverAcronymMap={driverAcronymMap}
                driverData={driverData}
                selectedDrivers={selectedDrivers}
                isLoading={isLoading}
            />

            <BrakeGraph
                telemetryData={telemetryData}
                driverTeamColorMap={driverTeamColorMap}
                driverAcronymMap={driverAcronymMap}
                driverData={driverData}
                selectedDrivers={selectedDrivers}
                isLoading={isLoading}
            />

            <RPMGraph
                telemetryData={telemetryData}
                driverTeamColorMap={driverTeamColorMap}
                driverAcronymMap={driverAcronymMap}
                driverData={driverData}
                selectedDrivers={selectedDrivers}
                isLoading={isLoading}
            />

            <DRSGraph
                telemetryData={telemetryData}
                driverTeamColorMap={driverTeamColorMap}
                driverAcronymMap={driverAcronymMap}
                driverData={driverData}
                selectedDrivers={selectedDrivers}
                isLoading={isLoading}
            />

            <GearGraph
                telemetryData={telemetryData}
                driverTeamColorMap={driverTeamColorMap}
                driverAcronymMap={driverAcronymMap}
                driverData={driverData}
                selectedDrivers={selectedDrivers}
                isLoading={isLoading}
            />


        </>
    );
};

export default Telemetry;