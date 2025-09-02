/**
 * @param brake	Whether the brake pedal is pressed (100) or not (0).
 * @param date	The UTC date and time, in ISO 8601 format.
 * @param driver_number	The unique number assigned to an F1 driver (cf. Wikipedia).
 * @param drs	The Drag Reduction System (DRS) status (see mapping table below).
 * @param meeting_key	The unique identifier for the meeting. Use latest to identify the latest or current meeting.
 * @param n_gear	Current gear selection, ranging from 1 to 8. 0 indicates neutral or no gear engaged.
 * @param rpm	Revolutions per minute of the engine.
 * @param session_key	The unique identifier for the session. Use latest to identify the latest or current session.
 * @param speed	Velocity of the car in km/h.
 * @param throttle	Percentage of maximum engine power being used.
 */
export interface TelemetryParams {
    brake?: number;
    driver_number?: number;
    drs?: number;
    distance?: number;
    gear?: number;
    meeting_key?: number;
    n_gear?: number;
    rpm?: number;
    session_key?: number;
    speed?: number;
    throttle?: number;
    timestamp?: string;
}