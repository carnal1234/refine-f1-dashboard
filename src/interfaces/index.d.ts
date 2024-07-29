export interface ISession{
  location: string,
  country_key: number,
  country_code: string,
  country_name: string,
  circuit_key: number,
  circuit_short_name: string,
  session_type: string,
  session_name: string,
  date_start: string,
  date_end: string,
  gmt_offset: string,
  session_key: number,
  meeting_key: number,
  year: number
}

export interface IDriver{
    broadcast_name: string,
    country_code: string,
    driver_number: number,
    first_name: string,
    full_name: string,
    headshot_url: string, 
    last_name: string,
    meeting_key: number,
    name_acronym: string,
    session_key: number,
    team_colour: string,
    team_name: string 
}

export interface ILap {
    date_start: string,
    driver_number: number,
    duration_sector_1: number,
    duration_sector_2: number,
    duration_sector_3: number,
    i1_speed: number,
    i2_speed: number,
    is_pit_out_lap: boolean,
    lap_duration: number,
    lap_number: number,
    meeting_key: number,
    segments_sector_1: Array<number>,
    segments_sector_2: Array<number>,
    segments_sector_3: Array<number>,
    session_key: number,
    st_speed: number,
    lap_duration?: number | undefined
  }

  export interface IStint{
    compound: string,
    driver_number: number,
    lap_end: number,
    lap_start: number,
    meeting_key: number,
    session_key: number,
    stint_number: number,
    tyre_age_at_start: number
  }

  export interface IRaceControl{
        session_key: number,
        meeting_key: number,
        date: string,
        category: string,
        flag: string,
        lap_number: number,
        message: string,
        driver_number: number,
        scope: string,
        sector: number
}
