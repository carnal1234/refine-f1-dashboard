// @/context/TelemetryContext.tsx
import React, { ReactNode, createContext, useContext, useState } from "react";
import { MeetingParams, SessionParams, WeatherParams, RaceControlParams, DriverParams, StintParams } from "@/interfaces/openf1";


interface TelemetryContextProps {
    isShowDriverSelect: boolean;
    setIsShowDriverSelect: React.Dispatch<React.SetStateAction<boolean>>;
    drivers: DriverParams[];
    setDrivers: React.Dispatch<React.SetStateAction<DriverParams[]>>;
    selectedDrivers: Record<string, boolean>;
    setSelectedDrivers: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;

}

const TelemetryContext = createContext<TelemetryContextProps | undefined>(undefined);

export const useTelemetry = () => {
    const context = useContext(TelemetryContext);
    if (!context) {
        throw new Error("useTelemetry must be used within a TelemetryProvider");
    }
    return context;
};

export const TelemetryProvider = ({ children }: { children: ReactNode }) => {


    const [isShowDriverSelect, setIsShowDriverSelect] = useState<boolean>(false);
    const [drivers, setDrivers] = useState<DriverParams[]>([]);
    const [selectedDrivers, setSelectedDrivers] = useState<Record<string, boolean>>({});


    return (
        <TelemetryContext.Provider value={{

            isShowDriverSelect, setIsShowDriverSelect,
            drivers, setDrivers,
            selectedDrivers, setSelectedDrivers,

        }}>
            {children}
        </TelemetryContext.Provider>
    );
};
