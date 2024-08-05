export interface DriverStanding {
    MRData: MRData;
  }
  export interface MRData {
    xmlns: string;
    series: string;
    url: string;
    limit: string;
    offset: string;
    total: string;
    StandingsTable: StandingsTable;
  }
  export interface StandingsTable {
    season: string;
    StandingsLists?: (StandingsListsEntity)[] | null;
  }
  export interface StandingsListsEntity {
    season: string;
    round: string;
    DriverStandings?: (DriverStandingsEntity)[] | null;
  }
  export interface DriverStandingsEntity {
    position: string;
    positionText: string;
    points: string;
    wins: string;
    Driver: Driver;
    Constructors?: (ConstructorsEntity)[] | null;
  }
  export interface Driver {
    driverId: string;
    permanentNumber: string;
    code: string;
    url: string;
    givenName: string;
    familyName: string;
    dateOfBirth: string;
    nationality: string;
  }
  export interface ConstructorsEntity {
    constructorId: string;
    url: string;
    name: string;
    nationality: string;
  }
  