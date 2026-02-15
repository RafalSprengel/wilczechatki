"use client";
import { useState, useEffect } from 'react';
import './ClendarPicker.css';

interface UnavailableDate {
    date: string | null;
}

type UnavailableDates = UnavailableDate[];

interface BookingDates {
    start: string | null;
    end: string | null;
    count: number;
}

interface DayProps {
    currentDay: number;
    currentDate: string;
    isPast: boolean;
    isToday: boolean;
    isSelectedAsStart: boolean;
    isSelectedAsEnd: boolean;
    isSelectedBetween: boolean;
    isHovered: boolean;
    isReserved: boolean;
    isSunday: boolean;
    isSaturday: boolean;
    isWeekend: boolean;
    handleClickOnDay: (date: string) => void;
    handleMouseHoverDay: (date: string) => void;
}

const Day = ({
    currentDay,
    currentDate,
    isPast,
    isToday,
    isSelectedAsStart,
    isSelectedAsEnd,
    isSelectedBetween,
    isHovered,
    isReserved,
    isSunday,
    isSaturday,
    isWeekend,
    handleClickOnDay,
    handleMouseHoverDay,
}: DayProps) => {
    const dayClasses = [
        'day',
        isPast ? 'day__past' : '',
        isToday ? 'day__today' : '',
        isReserved ? 'day__reserved' : '',
        isSaturday ? 'day__saturday' : '',
        isSunday ? 'day__sunday' : '',
        isSelectedAsStart ? 'day__selected-as-start' : '',
        isSelectedAsEnd ? 'day__selected-as-end' : '',
        isSelectedBetween ? 'day__selected-between' : '',
        isHovered ? 'day__hovered' : '',
        isWeekend ? 'day__weekend' : '',
    ].filter(Boolean).join(' ');

    return (
        <div
            className={dayClasses}
            onClick={() => handleClickOnDay(currentDate)}
            onMouseEnter={() => handleMouseHoverDay(currentDate)}
        >
            {currentDay}
        </div>
    );
};

interface MonthProps {
    currentDate: Date;
    unavailableDates: UnavailableDates | null;
    selectedStart: string | null;
    selectedEnd: string | null;
    setSelectedStart: (date: string | null) => void;
    setSelectedEnd: (date: string | null) => void;
}

const Month = ({ currentDate, unavailableDates, selectedStart, selectedEnd, setSelectedStart, setSelectedEnd }: MonthProps) => {
    const [hoveredDate, setHoveredDate] = useState<string | null>(null);
    const res = [];
    let currentDay = 0;

    let firstDayOfTheMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    if (firstDayOfTheMonth === 0) firstDayOfTheMonth = 7;

    const numberOfDaysCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

    for (let i = 1; i <= 42; i++) {
        if (i >= firstDayOfTheMonth && i < numberOfDaysCurrentMonth + firstDayOfTheMonth) {
            currentDay++;
            let isSelectedBetween = false;
            let isReserved = false;
            let dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDay);
            let currentDateFormatted = formatDate(dateObj);

            const todayFormatted = formatDate(new Date());

            const isToday = todayFormatted === currentDateFormatted;
            const isSunday = dateObj.getDay() === 0;
            const isSaturday = dateObj.getDay() === 6;
            const isPast = new Date(currentDateFormatted + 'T23:59:59') < new Date();
            const isWeekend = isSunday || isSaturday;

            let isSelectedAsStart = selectedStart === currentDateFormatted;
            let isSelectedAsEnd = selectedEnd === currentDateFormatted;

            if (unavailableDates) {
                isReserved = unavailableDates.some(el => el.date === currentDateFormatted);
            }

            let isHovered = Boolean(selectedStart && !selectedEnd && hoveredDate &&
                new Date(currentDateFormatted) > new Date(selectedStart) &&
                new Date(currentDateFormatted) < new Date(hoveredDate) &&
                !isReserved && !isWeekend);

            if (selectedStart && selectedEnd) {
                isSelectedBetween = new Date(currentDateFormatted) > new Date(selectedStart) &&
                    new Date(currentDateFormatted) < new Date(selectedEnd) &&
                    !isReserved && !isWeekend;
            }

            const handleClickOnDay = (date: string) => {
                if (isPast || isWeekend || isReserved) return;
                if (!selectedStart || (selectedStart && selectedEnd)) {
                    setSelectedStart(date);
                    setSelectedEnd(null);
                } else if (selectedStart && !selectedEnd) {
                    if (new Date(currentDateFormatted) < new Date(selectedStart)) {
                        setSelectedEnd(selectedStart);
                        setSelectedStart(date);
                    } else {
                        setSelectedEnd(date);
                    }
                }
            };

            const handleMouseHoverDay = (date: string ) => {
                if (selectedStart && !selectedEnd) setHoveredDate(date);
            };

            res.push(
                <Day
                    key={currentDateFormatted}
                    currentDay={currentDay}
                    currentDate={currentDateFormatted}
                    isPast={isPast}
                    isToday={isToday}
                    isSelectedAsStart={isSelectedAsStart}
                    isSelectedAsEnd={isSelectedAsEnd}
                    isSelectedBetween={isSelectedBetween}
                    isReserved={isReserved}
                    isSunday={isSunday}
                    isSaturday={isSaturday}
                    isWeekend={isWeekend}
                    handleClickOnDay={handleClickOnDay}
                    handleMouseHoverDay={handleMouseHoverDay}
                    isHovered={isHovered}
                />
            );
        } else {
            res.push(<div className="day__blank" key={`blank-${i}`}></div>);
        }
    }
    return <div className="month-container">{res}</div>;
};

function formatDate(dateObj: Date): string {
        let year = dateObj.getFullYear();
        let month = ((dateObj.getMonth() + 1)).toString().padStart(2, '0');
        let day = dateObj.getDate().toString().padStart(2, '0');
        return (year + "-" + month + '-' + day);
}

interface CalendarPickerProps {
    unavailableDates: UnavailableDates | null;
    onDateChange: (dates: BookingDates) => void;
}

export default function CalendarPicker({ unavailableDates, onDateChange }: CalendarPickerProps) { 
    const [currentDate, setDate] = useState<Date>(new Date());
    const [selectedStart, setSelectedStart] = useState<string | null>(null);
    const [selectedEnd, setSelectedEnd] = useState<string | null>(null);

    const weekDays: string[]= ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const monthsNames: string[] = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const getSelectedDaysCount = (): number => {
        if (!selectedStart) return 0;
        if (!selectedEnd) return 1;

        let count = 0;
        let start = new Date(selectedStart);
        let end = new Date(selectedEnd);

        if (start > end) [start, end] = [end, start];

        let tempDate = new Date(start);
        while (tempDate <= end) {
            const dayOfWeek = tempDate.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const formatted = formatDate(tempDate);
            const isReserved = unavailableDates?.some(el => el.date === formatted);

            if (!isWeekend && !isReserved) {
                count++;
            }
            tempDate.setDate(tempDate.getDate() + 1);
        }
        return count;
    };

    const totalSelected = getSelectedDaysCount();

    useEffect(() => {
        if (onDateChange) {
            onDateChange({ start: selectedStart, end: selectedEnd, count: totalSelected });
        }
    }, [selectedStart, selectedEnd, totalSelected, onDateChange]);

    const changeMonth = (offset: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setDate(newDate);
    };

    const changeYear = (offset: number) => {
        const newDate = new Date(currentDate);
        newDate.setFullYear(newDate.getFullYear() + offset);
        setDate(newDate);
    };

    return (
        <div className="calendar">
            <div className="navigation">
                <div className="navigation__arrow material-symbols-outlined" onClick={() => changeYear(-1)}>keyboard_double_arrow_left</div>
                <div className="navigation__arrow material-symbols-outlined" onClick={() => changeMonth(-1)}>keyboard_arrow_left</div>
                <div className="navigation__current-month" onClick={() => setDate(new Date())}>
                    {monthsNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </div>
                <div className="navigation__arrow material-symbols-outlined" onClick={() => changeMonth(1)}>keyboard_arrow_right</div>
                <div className="navigation__arrow material-symbols-outlined" onClick={() => changeYear(1)}>keyboard_double_arrow_right</div>
            </div>

            <div className="week-days">
                {weekDays.map((day) => <span className="week-days__names" key={day}>{day}</span>)}
            </div>

            <Month
                currentDate={currentDate}
                unavailableDates={unavailableDates}
                selectedStart={selectedStart}
                selectedEnd={selectedEnd}
                setSelectedStart={setSelectedStart}
                setSelectedEnd={setSelectedEnd}
            />

            <div className="buttons">
                <button className="buttons__clear" onClick={() => { setSelectedStart(null); setSelectedEnd(null); }}>Clear</button>
                <button className="buttons__add" disabled={totalSelected === 0}>
                    {totalSelected > 0 ? `Book ${totalSelected} day${totalSelected > 1 ? 's' : ''}` : 'Book now'}
                </button>
            </div>
        </div>
    );
}