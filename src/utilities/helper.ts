// @/utils/helper.ts

/* TIME */

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function formatSecondsToTime(seconds: any) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const formattedSeconds = remainingSeconds.toFixed(3).padStart(6, '0');
    return `${minutes}:${formattedSeconds}`;
};

export function parseISOTime(time: string) {
    return parseInt(time.split("T")[1]).toFixed(2);
};

export function parseISODateAndTime(time: string, gmt_offset: string = "00:00:00") {
    const date = new Date(time);

    // Extract hours, minutes, and seconds from GMT offset string
    const [hours, minutes, seconds] = gmt_offset.split(":").map(Number);

    // Adjust the date based on the GMT offset
    date.setUTCHours(date.getUTCHours() + hours);
    date.setUTCMinutes(date.getUTCMinutes() + minutes);
    date.setUTCSeconds(date.getUTCSeconds() + seconds);

    // Format the adjusted date and time
    const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        timeZoneName: "short"
    };

    return date.toLocaleString("en-US", options);
};

export function parseISOTimeFull(time: string | undefined, gmt_offset: string = "00:00:00") {
    if (!time) return null;
    const date = new Date(time);

    // Extract hours, minutes, and seconds from GMT offset string
    const [hours, minutes, seconds] = gmt_offset.split(":").map(Number);

    // Adjust the date based on the GMT offset
    date.setUTCHours(date.getUTCHours() + hours);
    date.setUTCMinutes(date.getUTCMinutes() + minutes);
    date.setUTCSeconds(date.getUTCSeconds() + seconds);

    // Format the adjusted date and time
    const options: Intl.DateTimeFormatOptions = {
        hour: "numeric",
        minute: "numeric",
        second: "numeric"
    };

    return date.toLocaleString("en-US", options);
};


export function findNextRace(races: any[]) {
    const currentDate = new Date();
    for (let i = 0; i < races.length; i++) {
        const raceDate = new Date(races[i].date + " " + races[i].time);
        if (raceDate > currentDate) {
            return i;
        }
    }
    return 0;
};





/* VALIDATORS */
export const isValidColor = (str: string) => {
    if (str[0] != '#')
        return false;

    if (!(str.length == 4 || str.length == 7))
        return false;

    for (let i = 1; i < str.length; i++)
        if (!((str[i].charCodeAt(0) <= '0'.charCodeAt(0) && str[i].charCodeAt(0) <= 9)
            || (str[i].charCodeAt(0) >= 'a'.charCodeAt(0) && str[i].charCodeAt(0) <= 'f'.charCodeAt(0))
            || (str[i].charCodeAt(0) >= 'A'.charCodeAt(0) || str[i].charCodeAt(0) <= 'F'.charCodeAt(0))))
            return false;

    return true;
}

export const teamNameConvertor = (name: string) => {
    switch (name) {
        case "Red Bull":
            return "Red Bull Racing";
        case "Sauber":
            return "Kick Sauber";
        case "RB F1 Team":
            return "RB";
        case "Alpine F1 Team":
            return "Alpine";
        default:
            return name;
    }
}



/* IMAGE URLS*/

export const trackImage = (cityName: string | undefined, countryName: string | undefined) => {
    let name: string | undefined = countryName;
    if (name == "UK") name = "Great Britain";
    else if(cityName == "Imola") name = "Emilia Romagna";
    else if (name == "UAE") name = "Abu Dhabi";
    else if (name == "United States" || name == "USA") name = cityName;
    if (cityName == "Austin") name = "USA";
    return `https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/${name}.png.transform/2col/image.png`;
};

export const trackDetailedImage = (cityName: string | undefined, countryName: string | undefined) => {
    let name: string | undefined = countryName;
    if (name == "USA" || name == "United States" && cityName != "Austin" || name == "Azerbaijan") name = cityName;
    else if (name == "Monaco") name = "Monoco";
    else if (name == "UK") name = "Great Britain";
    else if (name == "UAE") name = "Abu Dhabi";
    else if(cityName == "Imola") name = "Emilia Romagna";
    return `https://media.formula1.com/image/upload/f_auto/q_auto/v1677244984/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/${name?.replace(" ", "_")}_Circuit.png.transform/6col/image.png`;
};

export const flagImage = (countryName: string | undefined) => {
    return `https://media.formula1.com/d_default_fallback_image.png/content/dam/fom-website/flags/${countryName}.jpg.transform/1col/image.jpg`;
}

export function driverImage(firstName: string, lastName: string): string;
export function driverImage(name: string): string;
export function driverImage(firstNameOrName: string, lastName?: string): string {
    const fallbackUrl = `https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/null/null01_null_null/null01.png.transform/1col/image.png`;

    if (lastName !== undefined) {
        const firstName = firstNameOrName
        const words = [firstName, lastName];
        const initials = words.map((word) => word.slice(0, 3).toUpperCase());
        const parsedName = initials.join("");
        return `https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/${parsedName[0]}/${parsedName}01_${firstName}_${lastName}/${parsedName}01.png.transform/1col/image.png`;
    }

    let words = firstNameOrName?.split(" ");
    if (words[0] === "ZHOU") words = [words[1], words[0]];
    const initials = words.map((word) => word.slice(0, 3).toUpperCase());
    const parsedName = initials.join("");
    if (words[0] === "Nyck") return 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/N/NYCDEV01_Nyck_De%20Vries/nycdev01.png.transform/1col/image.png';
    return `https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/${parsedName[0]}/${parsedName}01_${words[0]}_${words[1]}/${parsedName}01.png.transform/1col/image.png`;
};

export const numberImage = (firstName: string, lastName: string) => {
    const words = [firstName, lastName]
    const initials = words.map((word) => word.slice(0, 3).toUpperCase());
    const parsedName = initials.join("");
    return `https://media.formula1.com/d_default_fallback_image.png/content/dam/fom-website/2018-redesign-assets/drivers/number-logos/${parsedName}01.png.transform/1col/image.png`;
};

export const carImage = (year: string, teamName: string) => {
    return `https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/${year}/${teamName}.png.transform/3col/image.png`;
}

export const logoImage = (year: string, teamName: string) => {
    return `https://media.formula1.com/content/dam/fom-website/teams/${year}/${teamName}-logo.png.transform/2col/image.png`;
}


export const fetcher = async (url: string) => {
    const res = await fetch(url);
    return res.json();
};



export const groupBy = <T, K extends keyof any>(list: T[], getKey: (item: T) => K) =>
  list.reduce((previous, currentItem) => {
    const group = getKey(currentItem);
    if (!previous[group]) previous[group] = [];
    previous[group].push(currentItem);
    return previous;
}, {} as Record<K, T[]>);

export const chunk = (arr: any[], size: number) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_: any, i: number) =>
    arr.slice(i * size, i * size + size)
  );


