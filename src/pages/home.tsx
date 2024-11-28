import { useEffect, useState } from 'react';

import '@/style/homepage.scss'
import dayjs from 'dayjs';
import { fetchCurrentSeason } from '@/services/ergastApi';
import { findNextRace } from '@/utilities/helper'

export const HomePage = () => {



    const [data, setData] = useState<any>();
    const [raceIndex, setNextRaceIndex] = useState(0)
    const [currentRace, setCurrentRace] = useState<any>({})

    const calculateTimeLeft = () => {

        let race = data?.MRData?.RaceTable?.Races ? data.MRData.RaceTable.Races[raceIndex] : undefined

        if (race) {

            let currentTime = new Date()
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

        const mode = import.meta.env.MODE


        async function fetchData() {
            try {
                const apiData = mode === "development" ? await import('@/data/current.json') : await fetchCurrentSeason();

                //const apiData = await fetchCurrentSeason();
                setData(apiData);
                const raceIndex = findNextRace(apiData.MRData.RaceTable.Races);
                setNextRaceIndex(raceIndex);
                setCurrentRace(apiData.MRData.RaceTable.Races[raceIndex])
            }
            catch (err) {
                console.error("Error fetching data", err);

            }

        }
        fetchData()

    }, [])


    type TimeLeft = {
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
        weeks: number;
    };







    useEffect(() => {
        setTimeout(() => setTimeLeft(calculateTimeLeft()), 1000);
    }, [timeLeft]);

    const Counter: React.FC = () => {
        return (
            <div className="counter">
                <div className="counter-item">
                    <span className="value">{String(timeLeft.weeks).padStart(2, '0')}</span>
                    <span className="label">Weeks</span>
                </div>
                <div className="counter-item">
                    <span className="value">{String(timeLeft.days).padStart(2, '0')}</span>
                    <span className="label">Days</span>
                </div>

                <div className="counter-item">
                    <span className="value">{String(timeLeft.hours).padStart(2, '0')}</span>
                    <span className="label">Hours</span>
                </div>

                <div className="counter-item">
                    <span className="value">
                        {String(timeLeft.minutes).padStart(2, '0')}
                    </span>
                    <span className="label">Minutes</span>
                </div>

                <div className="counter-item">
                    <span className="value">
                        {String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                    <span className="label">Seconds</span>
                </div>
            </div>
        )
    }

    return (
        <div className="homepage">
            <div className="container">
                {currentRace ? <h1>{currentRace.raceName} </h1> : <></>}

                <Counter />

                <p></p>

                {/* <button onClick={notify}>Inscreva-se</button> */}

                {/* <ToastContainer
            theme="dark"
            position="top-center"
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            pauseOnHover
        /> */}
            </div>
        </div>


    );
};