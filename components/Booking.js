'use client'
import { useState, useEffect } from 'react';
import Checkout from './Checkout';
import DatePicker from '@/components/DatePicker'
import { format, parse, isValid, startOfDay, isSameDay } from 'date-fns'
import { sv } from 'date-fns/locale';

export default function Booking({ slots }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [filteredSlots, setFilteredSlots] = useState([]);

  useEffect(() => {
    if (selectedDate) {
      const selectedDateObj = startOfDay(new Date(selectedDate));
      const slotsForSelectedDate = slots.filter(slot => {
        const slotDate = new Date(slot.start_time);
        return isSameDay(selectedDateObj, slotDate);
      });
      setFilteredSlots(slotsForSelectedDate);
    }
  }, [selectedDate, slots]);

  const formatTime = (dateTimeString) => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return isValid(date) ? format(date, 'HH:mm') : 'Invalid Time';
  };

  return (
    <div className="md:grid md:grid-cols-2 md:divide-x md:divide-gray-200">
      <Checkout open={checkoutOpen} setOpen={setCheckoutOpen} />
      <div className="md:pr-14">
        <DatePicker selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
      </div>
      <section className="mt-12 md:mt-0 md:pl-14">
        <h2 className="text-base font-semibold leading-6 text-gray-900">
          {selectedDate ? (
            <>
              Tider för <time dateTime={selectedDate}>{format(new Date(selectedDate), 'dd MMM yyyy', { locale: sv })}</time>
            </>
          ) : (
            'Välj ett datum för att se tillgängliga tider'
          )}
        </h2>
        {selectedDate && (
          <>
            {filteredSlots.length > 0 ? (
              <ol className="mt-4 space-y-1 text-sm leading-6 text-gray-500">
                {filteredSlots.map((slot) => (
                  <li key={slot.id} className="rounded-xl focus-within:bg-gray-100 hover:bg-gray-100">
                    <button
                      onClick={() => setCheckoutOpen(true)}
                      className="group flex items-center justify-between w-full text-left rounded-xl px-4 py-2 focus:bg-gray-100 hover:bg-gray-100"
                    >
                      <div className="flex-auto">
                        <p className="text-gray-900">{slot.description}</p>
                        <p className="mt-0.5">
                          <time dateTime={slot.start_time}>{formatTime(slot.start_time)}</time> -{' '}
                          <time dateTime={slot.end_time}>{formatTime(slot.end_time)}</time>
                        </p>
                      </div>
                      <div className="text-sm font-medium text-gray-900">6 platser kvar</div>
                    </button>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 text-sm text-gray-500">Inga tider tillgängliga för detta datum.</p>
            )}
          </>
        )}
      </section>
    </div>
  )
}