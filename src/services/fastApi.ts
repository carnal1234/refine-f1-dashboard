// services/api.ts

const fetchApiData = async (endpoint: string) => {
    try {
        const mode = import.meta.env.MODE;
        const baseUrl = mode === "development" ? 'http://localhost:5000/api' : import.meta.env.VITE_APP_API_URL
        const url = `${baseUrl}/${endpoint}`;
        const response = await fetch(url);
        const data = await response.json();
        console.log(url);
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

// TELEMETRY const response = await fetch('http://localhost:5000/api/session/2025/Monaco/Q/telemetry/NOR?lap=5');


export const fetchTelemetry = async (year: any, grand_prix: any, session_type: any, driver_code: any, lap_number: any) => {
    const endpoint = `session/${year}/${grand_prix}/${session_type}/telemetry/${driver_code}?lap=${lap_number}`;
    const data = await fetchApiData(endpoint);
    return data;
}
