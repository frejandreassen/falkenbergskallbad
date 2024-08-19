'use client'
import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subDays, addDays, addMonths, subMonths } from 'date-fns';
import { sv } from 'date-fns/locale';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/20/solid'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function Calendar({ selectedDate, setSelectedDate }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [days, setDays] = useState([]);

  useEffect(() => {
    const startOfThisMonth = startOfMonth(currentDate);
    const endOfThisMonth = endOfMonth(currentDate);

    let startDate = subDays(startOfThisMonth, getDay(startOfThisMonth) - 1);
    let endDate = addDays(endOfThisMonth, 7 - getDay(endOfThisMonth));
    let dateRange = eachDayOfInterval({ start: startDate, end: endDate });

    const formattedDays = dateRange.map(date => {
      const formattedDate = format(date, 'yyyy-MM-dd');
      return {
        date: formattedDate,
        isToday: formattedDate === format(new Date(), 'yyyy-MM-dd'),
        isCurrentMonth: format(date, 'MM-yyyy') === format(currentDate, 'MM-yyyy'),
        isSelected: formattedDate === selectedDate,
      }
    });
    
    setDays(formattedDays);
  }, [currentDate, selectedDate]);

  const handlePreviousMonth = () => {
    setCurrentDate(prevDate => subMonths(prevDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prevDate => addMonths(prevDate, 1));
  };
  
  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  return (
    <div>
      <div className="flex items-center text-gray-900 my-10">
        <button
          onClick={handlePreviousMonth}
          type="button"
          className="-m-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
        >
          <span className="sr-only">Previous month</span>
          <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="flex-auto text-sm text-center font-semibold">
          {capitalizeFirstLetter(format(currentDate, 'MMMM yyyy', {locale: sv}))}
        </div>
        <button
          onClick={handleNextMonth}
          type="button"
          className="-m-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
        >
          <span className="sr-only">Next month</span>
          <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-6 grid grid-cols-7 text-xs text-center leading-6 text-gray-500">
        <div>M</div>
        <div>T</div>
        <div>O</div>
        <div>T</div>
        <div>F</div>
        <div>L</div>
        <div>S</div>
      </div>
      <div className="isolate mt-2 grid grid-cols-7 gap-px rounded-lg bg-gray-200 text-sm shadow ring-1 ring-gray-200">
        {days.map((day, dayIdx) => (
          <button
            key={day.date}
            type="button"
            onClick={() => handleDateClick(day.date)}
            className={classNames(
              'py-1.5 hover:bg-gray-100 focus:z-10',
              day.isCurrentMonth ? 'bg-white' : 'bg-gray-50',
              (day.isSelected || day.isToday) && 'font-semibold',
              day.isSelected && 'text-white',
              day.isCurrentMonth && !day.isSelected && 'text-gray-900',
              !day.isCurrentMonth && !day.isSelected && 'text-gray-400',
              day.isToday && !day.isSelected && 'text-gray-600',
              dayIdx === 0 && 'rounded-tl-lg',
              dayIdx === 6 && 'rounded-tr-lg',
              dayIdx === days.length - 7 && 'rounded-bl-lg',
              dayIdx === days.length - 1 && 'rounded-br-lg'
            )}
          >
            <time
              dateTime={day.date}
              className={classNames(
                'mx-auto flex h-7 w-7 items-center justify-center rounded-full',
                day.isSelected && 'bg-gray-600',
              )}
            >
              {day.date.split('-').pop().replace(/^0/, '')}
            </time>
          </button>
        ))}
      </div>
      {selectedDate && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-6">
          <dt className="text-base font-medium">Valt datum</dt>
          <dd className="text-base font-medium text-gray-900">
            {format(new Date(selectedDate), 'dd MMM yyyy', {locale: sv})}
          </dd>
        </div>
      )}
    </div>
  );
}

export default Calendar;