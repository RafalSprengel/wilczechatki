"use client";
import { useState, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/pl';
import './ClendarPicker.css';

dayjs.locale('pl');

export interface DayData {
  price?: number;
  available: boolean;
  discount?: boolean;
}

export type DatesData = Record<string, DayData>;

interface BookingDates {
  start: string | null;
  end: string | null;
  count: number;
}

interface DayProps {
  dateStr: string;
  dayNumber: number;
  data?: DayData;
  isPast: boolean;
  isToday: boolean;
  isSelectedAsStart: boolean;
  isSelectedAsEnd: boolean;
  isSelectedBetween: boolean;
  isHovered: boolean;
  isWeekend: boolean;
  onClick: (date: string, isPast: boolean, available: boolean) => void;
  onMouseEnter: (date: string) => void;
}

const Day = ({
  dateStr,
  dayNumber,
  data,
  isPast,
  isToday,
  isSelectedAsStart,
  isSelectedAsEnd,
  isSelectedBetween,
  isHovered,
  isWeekend,
  onClick,
  onMouseEnter,
}: DayProps) => {
  const isAvailable = data ? data.available : true;
  const isReserved = !isAvailable;

  const dayClasses = [
    'day',
    isPast ? 'day__past' : '',
    isToday ? 'day__today' : '',
    isReserved ? 'day__reserved' : '',
    isSelectedAsStart ? 'day__selected-as-start' : '',
    isSelectedAsEnd ? 'day__selected-as-end' : '',
    isSelectedBetween ? 'day__selected-between' : '',
    isHovered ? 'day__hovered' : '',
    isWeekend ? 'day__weekend' : '',
    data?.discount ? 'day__discount' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={dayClasses}
      onClick={() => onClick(dateStr, isPast, isAvailable)}
      onMouseEnter={() => onMouseEnter(dateStr)}
    >
      <span className="day-number">{dayNumber}</span>
      {data?.price && (
        <span className="day-price">
          £{data.price}
        </span>
      )}
    </div>
  );
};

interface CalendarPickerProps {
  dates: DatesData;
  onDateChange: (dates: BookingDates) => void;
  minBookingDays?: number;
  maxBookingDays?: number;
  isRange?: boolean;
}

export default function CalendarPicker({
  dates,
  onDateChange,
  minBookingDays = 0,
  maxBookingDays = 999,
  isRange = true,
}: CalendarPickerProps) {
  const [viewDate, setViewDate] = useState(dayjs());
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<string | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const weekDays = ['P', 'W', 'Ś', 'C', 'P', 'S', 'N'];

  const days = useMemo(() => {
    const startOfMonth = viewDate.startOf('month');
    const daysInMonth = viewDate.daysInMonth();

    const startDayOfWeek = startOfMonth.day() === 0 ? 7 : startOfMonth.day();

    const result = [];
    const today = dayjs().startOf('day');

    for (let i = 1; i < startDayOfWeek; i++) {
      result.push({ isBlank: true, key: `blank-${i}` });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = viewDate.date(d);
      const fullDate = dateObj.format('YYYY-MM-DD');
      const isWeekend = dateObj.day() === 0 || dateObj.day() === 6;
      const isPast = dateObj.isBefore(today);

      result.push({
        isBlank: false,
        dateStr: fullDate,
        dayNumber: d,
        isPast,
        isToday: dateObj.isSame(today, 'day'),
        isWeekend,
        data: dates[fullDate]
      });
    }

    return result;
  }, [viewDate, dates]);

  const handleDayClick = (date: string, isPast: boolean, available: boolean) => {
    if (isPast || !available) return;

    if (!isRange) {
      setSelectedStart(date);
      setSelectedEnd(null);
      setError(null);
      return;
    }

    if (!selectedStart || (selectedStart && selectedEnd)) {
      setSelectedStart(date);
      setSelectedEnd(null);
      setError(null);
    } else {
      let start = dayjs(selectedStart);
      let end = dayjs(date);

      if (end.isBefore(start)) {
        [start, end] = [end, start];
      }
      let hasReserved = false;
      let curr = start;
      while (curr.isBefore(end) || curr.isSame(end, 'day')) {
        if (dates[curr.format('YYYY-MM-DD')]?.available === false) {
          hasReserved = true;
          break;
        }
        curr = curr.add(1, 'day');
      }

      if (hasReserved) {
        setSelectedStart(date);
        setSelectedEnd(null);
      } else {
        const diff = end.diff(start, 'day');
        
        if (diff < minBookingDays) {
          setError(`Minimalna ilość nocy to ${minBookingDays}.`);
        } else if (diff > maxBookingDays) {
          setError(`Maksymalny okres rezerwacji to ${maxBookingDays} dni.`);
        } else {
          setSelectedStart(start.format('YYYY-MM-DD'));
          setSelectedEnd(end.format('YYYY-MM-DD'));
          setError(null);
        }
      }
    }
  };

  useEffect(() => {
    if (!isRange && selectedEnd) {
      setSelectedEnd(null);
    }
  }, [isRange, selectedEnd]);

  useEffect(() => {
    const start = selectedStart;
    const end = selectedEnd;
    
    const count = start && end 
      ? dayjs(end).diff(dayjs(start), 'day') 
      : (start ? 0 : 0);

    onDateChange({ start, end, count });
  }, [selectedStart, selectedEnd, onDateChange]);

  return (
    <div className="calendar">
      <div className="navigation">
        <div className="navigation__arrow material-symbols-outlined" onClick={() => setViewDate(viewDate.subtract(1, 'year'))}>keyboard_double_arrow_left</div>
        <div className="navigation__arrow material-symbols-outlined" onClick={() => setViewDate(viewDate.subtract(1, 'month'))}>keyboard_arrow_left</div>
        <div className="navigation__current-month" onClick={() => setViewDate(dayjs())} style={{ textTransform: 'capitalize' }}>
          {viewDate.format('MMMM YYYY')}
        </div>
        <div className="navigation__arrow material-symbols-outlined" onClick={() => setViewDate(viewDate.add(1, 'month'))}>keyboard_arrow_right</div>
        <div className="navigation__arrow material-symbols-outlined" onClick={() => setViewDate(viewDate.add(1, 'year'))}>keyboard_double_arrow_right</div>
      </div>

      <div className="week-days">
        {weekDays.map((day, index) => <span className="week-days__names" key={index}>{day}</span>)}
      </div>

      <div className="month-container">
        {days.map((day: any) => {
          if (day.isBlank) return <div key={day.key} className="day__blank" />;

          const isSelectedAsStart = selectedStart === day.dateStr;
          const isSelectedAsEnd = isRange && selectedEnd === day.dateStr;
          const isSelectedBetween = isRange && selectedStart && selectedEnd && 
                                    dayjs(day.dateStr).isAfter(selectedStart) && 
                                    dayjs(day.dateStr).isBefore(selectedEnd);
          
          const isHovered = isRange && selectedStart && !selectedEnd && hoveredDate &&
                            dayjs(day.dateStr).isAfter(selectedStart) && 
                            dayjs(day.dateStr).isBefore(dayjs(hoveredDate).add(1, 'day'));

          return (
            <Day
              key={day.dateStr}
              {...day}
              isSelectedAsStart={isSelectedAsStart}
              isSelectedAsEnd={isSelectedAsEnd}
              isSelectedBetween={isSelectedBetween}
              isHovered={isHovered}
              onClick={handleDayClick}
              onMouseEnter={setHoveredDate}
            />
          );
        })}
      </div>

      {error && <div className="calendar-error">{error}</div>}
    </div>
  );
}