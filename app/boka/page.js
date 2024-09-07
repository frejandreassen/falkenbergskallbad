// 'use client'
// import { Fragment, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import { Menu, Transition } from '@headlessui/react'
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline'
// import Checkout from '@/components/Checkout'
import DatePicker from '@/components/DatePicker'
import { getSlots } from '@/lib/actions'
import Booking from '@/components/Booking'


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

export default async function Page() {
// const [checkoutOpen, setCheckoutOpen] = useState(false)
// const slots = await getSlots()

  return (
    <div className="bg-white py-24 px-4 max-w-5xl mx-auto">
    {/* <Checkout open={checkoutOpen} setOpen={setCheckoutOpen} /> */}
    <h1 className="font-bodoni-moda text-3xl my-10">Denna sida är under uppbyggnad</h1>
    {/* <Booking slots={slots}/> */}
    
    </div>
  )
}
