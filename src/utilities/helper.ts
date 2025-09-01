// @/utils/helper.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
/* TIME */

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function formatSecondsToTime(seconds: any) {
    const totalSeconds = Number(seconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;
    const milliseconds = Math.round((totalSeconds - Math.floor(totalSeconds)) * 1000);
    
    // If duration is greater than 1 hour, use HH:MM:SS.MS format
    if (hours > 0) {
        const mm = String(minutes).padStart(2, '0');
        const ss = remainingSeconds.toFixed(0).padStart(2, '0');
        const ms = String(milliseconds).padStart(3, '0');
        return `${hours}:${mm}:${ss}.${ms}`;
    }
    
    // Otherwise, use original MM:SS.MMM format
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

export function cn(...inputs: ClassValue[]) {
return twMerge(clsx(inputs))
}

export const getCountryCode = (countryName: string) => {
const countryList = [{"Name":"Afghanistan","Code":"AF"},{"Name":"Albania","Code":"AL"},{"Name":"Algeria","Code":"DZ"},{"Name":"American Samoa","Code":"AS"},{"Name":"Andorra","Code":"AD"},{"Name":"Angola","Code":"AO"},{"Name":"Anguilla","Code":"AI"},{"Name":"Antarctica","Code":"AQ"},{"Name":"Antigua and Barbuda","Code":"AG"},{"Name":"Argentina","Code":"AR"},{"Name":"Armenia","Code":"AM"},{"Name":"Aruba","Code":"AW"},{"Name":"Australia","Code":"AU"},{"Name":"Austria","Code":"AT"},{"Name":"Azerbaijan","Code":"AZ"},{"Name":"Bahamas","Code":"BS"},{"Name":"Bahrain","Code":"BH"},{"Name":"Bangladesh","Code":"BD"},{"Name":"Barbados","Code":"BB"},{"Name":"Belarus","Code":"BY"},{"Name":"Belgium","Code":"BE"},{"Name":"Belize","Code":"BZ"},{"Name":"Benin","Code":"BJ"},{"Name":"Bermuda","Code":"BM"},{"Name":"Bhutan","Code":"BT"},{"Name":"Bolivia, Plurinational State of","Code":"BO"},{"Name":"Bonaire, Sint Eustatius and Saba","Code":"BQ"},{"Name":"Bosnia and Herzegovina","Code":"BA"},{"Name":"Botswana","Code":"BW"},{"Name":"Bouvet Island","Code":"BV"},{"Name":"Brazil","Code":"BR"},{"Name":"British Indian Ocean Territory","Code":"IO"},{"Name":"Brunei Darussalam","Code":"BN"},{"Name":"Bulgaria","Code":"BG"},{"Name":"Burkina Faso","Code":"BF"},{"Name":"Burundi","Code":"BI"},{"Name":"Cambodia","Code":"KH"},{"Name":"Cameroon","Code":"CM"},{"Name":"Canada","Code":"CA"},{"Name":"Cape Verde","Code":"CV"},{"Name":"Cayman Islands","Code":"KY"},{"Name":"Central African Republic","Code":"CF"},{"Name":"Chad","Code":"TD"},{"Name":"Chile","Code":"CL"},{"Name":"China","Code":"CN"},{"Name":"Christmas Island","Code":"CX"},{"Name":"Cocos (Keeling) Islands","Code":"CC"},{"Name":"Colombia","Code":"CO"},{"Name":"Comoros","Code":"KM"},{"Name":"Congo","Code":"CG"},{"Name":"Congo, the Democratic Republic of the","Code":"CD"},{"Name":"Cook Islands","Code":"CK"},{"Name":"Costa Rica","Code":"CR"},{"Name":"Croatia","Code":"HR"},{"Name":"Cuba","Code":"CU"},{"Name":"Curaçao","Code":"CW"},{"Name":"Cyprus","Code":"CY"},{"Name":"Czech Republic","Code":"CZ"},{"Name":"Côte d'Ivoire","Code":"CI"},{"Name":"Denmark","Code":"DK"},{"Name":"Djibouti","Code":"DJ"},{"Name":"Dominica","Code":"DM"},{"Name":"Dominican Republic","Code":"DO"},{"Name":"Ecuador","Code":"EC"},{"Name":"Egypt","Code":"EG"},{"Name":"El Salvador","Code":"SV"},{"Name":"Equatorial Guinea","Code":"GQ"},{"Name":"Eritrea","Code":"ER"},{"Name":"Estonia","Code":"EE"},{"Name":"Eswatini","Code":"SZ"},{"Name":"Ethiopia","Code":"ET"},{"Name":"Falkland Islands (Malvinas)","Code":"FK"},{"Name":"Faroe Islands","Code":"FO"},{"Name":"Fiji","Code":"FJ"},{"Name":"Finland","Code":"FI"},{"Name":"France","Code":"FR"},{"Name":"French Guiana","Code":"GF"},{"Name":"French Polynesia","Code":"PF"},{"Name":"French Southern Territories","Code":"TF"},{"Name":"Gabon","Code":"GA"},{"Name":"Gambia","Code":"GM"},{"Name":"Georgia","Code":"GE"},{"Name":"Germany","Code":"DE"},{"Name":"Ghana","Code":"GH"},{"Name":"Gibraltar","Code":"GI"},{"Name":"Greece","Code":"GR"},{"Name":"Greenland","Code":"GL"},{"Name":"Grenada","Code":"GD"},{"Name":"Guadeloupe","Code":"GP"},{"Name":"Guam","Code":"GU"},{"Name":"Guatemala","Code":"GT"},{"Name":"Guernsey","Code":"GG"},{"Name":"Guinea","Code":"GN"},{"Name":"Guinea-Bissau","Code":"GW"},{"Name":"Guyana","Code":"GY"},{"Name":"Haiti","Code":"HT"},{"Name":"Heard Island and McDonald Islands","Code":"HM"},{"Name":"Holy See (Vatican City State)","Code":"VA"},{"Name":"Honduras","Code":"HN"},{"Name":"Hong Kong","Code":"HK"},{"Name":"Hungary","Code":"HU"},{"Name":"Iceland","Code":"IS"},{"Name":"India","Code":"IN"},{"Name":"Indonesia","Code":"ID"},{"Name":"Iran, Islamic Republic of","Code":"IR"},{"Name":"Iraq","Code":"IQ"},{"Name":"Ireland","Code":"IE"},{"Name":"Isle of Man","Code":"IM"},{"Name":"Israel","Code":"IL"},{"Name":"Italy","Code":"IT"},{"Name":"Jamaica","Code":"JM"},{"Name":"Japan","Code":"JP"},{"Name":"Jersey","Code":"JE"},{"Name":"Jordan","Code":"JO"},{"Name":"Kazakhstan","Code":"KZ"},{"Name":"Kenya","Code":"KE"},{"Name":"Kiribati","Code":"KI"},{"Name":"Korea, Democratic People's Republic of","Code":"KP"},{"Name":"Korea, Republic of","Code":"KR"},{"Name":"Kuwait","Code":"KW"},{"Name":"Kyrgyzstan","Code":"KG"},{"Name":"Lao People's Democratic Republic","Code":"LA"},{"Name":"Latvia","Code":"LV"},{"Name":"Lebanon","Code":"LB"},{"Name":"Lesotho","Code":"LS"},{"Name":"Liberia","Code":"LR"},{"Name":"Libya","Code":"LY"},{"Name":"Liechtenstein","Code":"LI"},{"Name":"Lithuania","Code":"LT"},{"Name":"Luxembourg","Code":"LU"},{"Name":"Macao","Code":"MO"},{"Name":"Macedonia, the Former Yugoslav Republic of","Code":"MK"},{"Name":"Madagascar","Code":"MG"},{"Name":"Malawi","Code":"MW"},{"Name":"Malaysia","Code":"MY"},{"Name":"Maldives","Code":"MV"},{"Name":"Mali","Code":"ML"},{"Name":"Malta","Code":"MT"},{"Name":"Marshall Islands","Code":"MH"},{"Name":"Martinique","Code":"MQ"},{"Name":"Mauritania","Code":"MR"},{"Name":"Mauritius","Code":"MU"},{"Name":"Mayotte","Code":"YT"},{"Name":"Mexico","Code":"MX"},{"Name":"Micronesia, Federated States of","Code":"FM"},{"Name":"Moldova, Republic of","Code":"MD"},{"Name":"Monaco","Code":"MC"},{"Name":"Mongolia","Code":"MN"},{"Name":"Montenegro","Code":"ME"},{"Name":"Montserrat","Code":"MS"},{"Name":"Morocco","Code":"MA"},{"Name":"Mozambique","Code":"MZ"},{"Name":"Myanmar","Code":"MM"},{"Name":"Namibia","Code":"NA"},{"Name":"Nauru","Code":"NR"},{"Name":"Nepal","Code":"NP"},{"Name":"Netherlands","Code":"NL"},{"Name":"New Caledonia","Code":"NC"},{"Name":"New Zealand","Code":"NZ"},{"Name":"Nicaragua","Code":"NI"},{"Name":"Niger","Code":"NE"},{"Name":"Nigeria","Code":"NG"},{"Name":"Niue","Code":"NU"},{"Name":"Norfolk Island","Code":"NF"},{"Name":"Northern Mariana Islands","Code":"MP"},{"Name":"Norway","Code":"NO"},{"Name":"Oman","Code":"OM"},{"Name":"Pakistan","Code":"PK"},{"Name":"Palau","Code":"PW"},{"Name":"Palestine, State of","Code":"PS"},{"Name":"Panama","Code":"PA"},{"Name":"Papua New Guinea","Code":"PG"},{"Name":"Paraguay","Code":"PY"},{"Name":"Peru","Code":"PE"},{"Name":"Philippines","Code":"PH"},{"Name":"Pitcairn","Code":"PN"},{"Name":"Poland","Code":"PL"},{"Name":"Portugal","Code":"PT"},{"Name":"Puerto Rico","Code":"PR"},{"Name":"Qatar","Code":"QA"},{"Name":"Romania","Code":"RO"},{"Name":"Russian Federation","Code":"RU"},{"Name":"Rwanda","Code":"RW"},{"Name":"Réunion","Code":"RE"},{"Name":"Saint Barthélemy","Code":"BL"},{"Name":"Saint Helena, Ascension and Tristan da Cunha","Code":"SH"},{"Name":"Saint Kitts and Nevis","Code":"KN"},{"Name":"Saint Lucia","Code":"LC"},{"Name":"Saint Martin (French part)","Code":"MF"},{"Name":"Saint Pierre and Miquelon","Code":"PM"},{"Name":"Saint Vincent and the Grenadines","Code":"VC"},{"Name":"Samoa","Code":"WS"},{"Name":"San Marino","Code":"SM"},{"Name":"Sao Tome and Principe","Code":"ST"},{"Name":"Saudi Arabia","Code":"SA"},{"Name":"Senegal","Code":"SN"},{"Name":"Serbia","Code":"RS"},{"Name":"Seychelles","Code":"SC"},{"Name":"Sierra Leone","Code":"SL"},{"Name":"Singapore","Code":"SG"},{"Name":"Sint Maarten (Dutch part)","Code":"SX"},{"Name":"Slovakia","Code":"SK"},{"Name":"Slovenia","Code":"SI"},{"Name":"Solomon Islands","Code":"SB"},{"Name":"Somalia","Code":"SO"},{"Name":"South Africa","Code":"ZA"},{"Name":"South Georgia and the South Sandwich Islands","Code":"GS"},{"Name":"South Sudan","Code":"SS"},{"Name":"Spain","Code":"ES"},{"Name":"Sri Lanka","Code":"LK"},{"Name":"Sudan","Code":"SD"},{"Name":"Suriname","Code":"SR"},{"Name":"Svalbard and Jan Mayen","Code":"SJ"},{"Name":"Sweden","Code":"SE"},{"Name":"Switzerland","Code":"CH"},{"Name":"Syrian Arab Republic","Code":"SY"},{"Name":"Taiwan, Province of China","Code":"TW"},{"Name":"Tajikistan","Code":"TJ"},{"Name":"Tanzania, United Republic of","Code":"TZ"},{"Name":"Thailand","Code":"TH"},{"Name":"Timor-Leste","Code":"TL"},{"Name":"Togo","Code":"TG"},{"Name":"Tokelau","Code":"TK"},{"Name":"Tonga","Code":"TO"},{"Name":"Trinidad and Tobago","Code":"TT"},{"Name":"Tunisia","Code":"TN"},{"Name":"Turkey","Code":"TR"},{"Name":"Turkmenistan","Code":"TM"},{"Name":"Turks and Caicos Islands","Code":"TC"},{"Name":"Tuvalu","Code":"TV"},{"Name":"Uganda","Code":"UG"},{"Name":"Ukraine","Code":"UA"},{"Name":"United Arab Emirates","Code":"AE"},{"Name":"United Kingdom","Code":"GB"},{"Name":"United States","Code":"US"},{"Name":"United States Minor Outlying Islands","Code":"UM"},{"Name":"Uruguay","Code":"UY"},{"Name":"Uzbekistan","Code":"UZ"},{"Name":"Vanuatu","Code":"VU"},{"Name":"Venezuela, Bolivarian Republic of","Code":"VE"},{"Name":"Viet Nam","Code":"VN"},{"Name":"Virgin Islands, British","Code":"VG"},{"Name":"Virgin Islands, U.S.","Code":"VI"},{"Name":"Wallis and Futuna","Code":"WF"},{"Name":"Western Sahara","Code":"EH"},{"Name":"Yemen","Code":"YE"},{"Name":"Zambia","Code":"ZM"},{"Name":"Zimbabwe","Code":"ZW"},{"Name":"Åland Islands","Code":"AX"}]
return countryList?.find(i => i.Name === countryName)?.Code?.toLocaleLowerCase()
}

