'use client'
import { Fragment, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import { Menu, Transition } from '@headlessui/react'
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline'
import Checkout from '@/components/Checkout'

const days = [
  { date: '2021-12-27' },
  { date: '2021-12-28' },
  { date: '2021-12-29' },
  { date: '2021-12-30' },
  { date: '2021-12-31' },
  { date: '2022-01-01', isCurrentMonth: true },
  { date: '2022-01-02', isCurrentMonth: true },
  { date: '2022-01-03', isCurrentMonth: true },
  { date: '2022-01-04', isCurrentMonth: true },
  { date: '2022-01-05', isCurrentMonth: true },
  { date: '2022-01-06', isCurrentMonth: true },
  { date: '2022-01-07', isCurrentMonth: true },
  { date: '2022-01-08', isCurrentMonth: true },
  { date: '2022-01-09', isCurrentMonth: true },
  { date: '2022-01-10', isCurrentMonth: true },
  { date: '2022-01-11', isCurrentMonth: true },
  { date: '2022-01-12', isCurrentMonth: true, isToday: true },
  { date: '2022-01-13', isCurrentMonth: true },
  { date: '2022-01-14', isCurrentMonth: true },
  { date: '2022-01-15', isCurrentMonth: true },
  { date: '2022-01-16', isCurrentMonth: true },
  { date: '2022-01-17', isCurrentMonth: true },
  { date: '2022-01-18', isCurrentMonth: true },
  { date: '2022-01-19', isCurrentMonth: true },
  { date: '2022-01-20', isCurrentMonth: true },
  { date: '2022-01-21', isCurrentMonth: true, isSelected: true },
  { date: '2022-01-22', isCurrentMonth: true },
  { date: '2022-01-23', isCurrentMonth: true },
  { date: '2022-01-24', isCurrentMonth: true },
  { date: '2022-01-25', isCurrentMonth: true },
  { date: '2022-01-26', isCurrentMonth: true },
  { date: '2022-01-27', isCurrentMonth: true },
  { date: '2022-01-28', isCurrentMonth: true },
  { date: '2022-01-29', isCurrentMonth: true },
  { date: '2022-01-30', isCurrentMonth: true },
  { date: '2022-01-31', isCurrentMonth: true },
  { date: '2022-02-01' },
  { date: '2022-02-02' },
  { date: '2022-02-03' },
  { date: '2022-02-04' },
  { date: '2022-02-05' },
  { date: '2022-02-06' },
]
const meetings = [
  {
    id: 1,
    name: 'Bastu - mixat',
    start: '6:00',
    startDatetime: '2022-01-21T13:00',
    end: '8:00',
    endDatetime: '2022-01-21T14:30',
  },
  {
    id: 1,
    name: 'Bastu - damer',
    start: '8:00',
    startDatetime: '2022-01-21T13:00',
    end: '10:00',
    endDatetime: '2022-01-21T14:30',
  },{
    id: 1,
    name: 'Bastu - herrar',
    start: '12:00',
    startDatetime: '2022-01-21T13:00',
    end: '14:00',
    endDatetime: '2022-01-21T14:30',
  },
  {
    id: 1,
    name: 'Bastu - mixat',
    start: '14:00',
    startDatetime: '2022-01-21T13:00',
    end: '16:00',
    endDatetime: '2022-01-21T14:30',
  },
  {
    id: 1,
    name: 'Bastu - mixat',
    start: '16:00',
    startDatetime: '2022-01-21T13:00',
    end: '18:00',
    endDatetime: '2022-01-21T14:30',
  },
  {
    id: 1,
    name: 'Bastu - mixat',
    start: '18:00',
    startDatetime: '2022-01-21T13:00',
    end: '20:00',
    endDatetime: '2022-01-21T14:30',
  },
  // More meetings...
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Example() {
const [checkoutOpen, setCheckoutOpen] = useState(false)

  return (
    <div className="bg-white py-24 px-4 max-w-5xl mx-auto">
    <Checkout open={checkoutOpen} setOpen={setCheckoutOpen} />
    <h1 className="font-bodoni-moda text-3xl my-10">Boka bastu</h1>
    <div className="md:grid md:grid-cols-2 md:divide-x md:divide-gray-200">
      <div className="md:pr-14">
        <div className="flex items-center">
          <h2 className="flex-auto text-sm font-semibold text-gray-900">January 2022</h2>
          <button
            type="button"
            className="-my-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Previous month</span>
            <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="-my-1.5 -mr-1.5 ml-2 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Next month</span>
            <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-10 grid grid-cols-7 text-center text-xs leading-6 text-gray-500">
          <div>M</div>
          <div>T</div>
          <div>W</div>
          <div>T</div>
          <div>F</div>
          <div>S</div>
          <div>S</div>
        </div>
        <div className="mt-2 grid grid-cols-7 text-sm">
          {days.map((day, dayIdx) => (
            <div key={day.date} className={classNames(dayIdx > 6 && 'border-t border-gray-200', 'py-2')}>
              <button
                type="button"
                className={classNames(
                  day.isSelected && 'text-white',
                  !day.isSelected && day.isToday && 'text-indigo-600',
                  !day.isSelected && !day.isToday && day.isCurrentMonth && 'text-gray-900',
                  !day.isSelected && !day.isToday && !day.isCurrentMonth && 'text-gray-400',
                  day.isSelected && day.isToday && 'bg-indigo-600',
                  day.isSelected && !day.isToday && 'bg-gray-900',
                  !day.isSelected && 'hover:bg-gray-200',
                  (day.isSelected || day.isToday) && 'font-semibold',
                  'mx-auto flex h-8 w-8 items-center justify-center rounded-full'
                )}
              >
                <time dateTime={day.date}>{day.date.split('-').pop().replace(/^0/, '')}</time>
              </button>
            </div>
          ))}
        </div>
      </div>
      <section className="mt-12 md:mt-0 md:pl-14">
        <h2 className="text-base font-semibold leading-6 text-gray-900">
          Tider för <time dateTime="2022-01-21">21 januari 2025</time>
        </h2>
        <ol className="mt-4 space-y-1 text-sm leading-6 text-gray-500">
            {meetings.map((meeting) => (
                <li key={meeting.id} className="rounded-xl focus-within:bg-gray-100 hover:bg-gray-100">
                    <button
                        onClick={()=>setCheckoutOpen(true)}
                        className="group flex items-center space-x-4 w-full text-left rounded-xl px-4 py-2 focus:bg-gray-100 hover:bg-gray-100"
                    >
                        <div className="flex-auto">
                            <p className="text-gray-900">{meeting.name}</p>
                            <p className="mt-0.5">
                                <time dateTime={meeting.startDatetime}>{meeting.start}</time> -{' '}
                                <time dateTime={meeting.endDatetime}>{meeting.end}</time>
                            </p>
                        </div>
                        <div>6 platser kvar</div>
                    </button>
                </li>
            ))}

        </ol>
      </section>
      
    </div>
    
    </div>
  )
}
