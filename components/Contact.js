'use client'
import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { sendEmail } from '@/lib/actions';
import { EnvelopeIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

const formSchema = z.object({
  name: z.string().optional(), // Optional; add validation if needed
  email: z.string().email(),
  message: z.string().min(10), // Optional; add validation if needed
});

export default function Contact({header, content, email}) {
  const [messageSent, setMessageSent] = useState(false);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  })
 
  // 2. Define a submit handler.
  async function onSubmit(values) {
    console.log(values);
    try {
      await sendEmail(email, values);
      setMessageSent(true); // Set the message sent state to true on success
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  }
  return (
    <div id="kontakt" className="relative isolate bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-2">
        <div className="relative px-6 pb-20 pt-24 sm:pt-32 lg:static lg:px-8 lg:py-48">
          <div className="mx-auto max-w-xl lg:mx-0 lg:max-w-lg">
            <div className="absolute inset-y-0 left-0 -z-10 w-full overflow-hidden bg-gray-100 ring-1 ring-gray-900/10 lg:w-1/2">
              <svg
                className="absolute inset-0 h-full w-full stroke-gray-200 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
                aria-hidden="true"
              >
                <defs>
                  <pattern
                    id="83fd4e5a-9d52-42fc-97b6-718e5d7ee527"
                    width={200}
                    height={200}
                    x="100%"
                    y={-1}
                    patternUnits="userSpaceOnUse"
                  >
                    <path d="M130 200V.5M.5 .5H200" fill="none" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" strokeWidth={0} fill="white" />
                <svg x="100%" y={-1} className="overflow-visible fill-gray-50">
                  <path d="M-470.5 0h201v201h-201Z" strokeWidth={0} />
                </svg>
                <rect width="100%" height="100%" strokeWidth={0} fill="url(#83fd4e5a-9d52-42fc-97b6-718e5d7ee527)" />
              </svg>
            </div>
            <h2 className="text-3xl font-bodoni-moda font-bold tracking-tight text-gray-900">{header}</h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              {content}
            </p>
            <dl className="mt-10 space-y-4 text-base leading-7 text-gray-600">
              <div className="flex gap-x-4">
                <dt className="flex-none">
                  <span className="sr-only">Email</span>
                  <EnvelopeIcon className="h-7 w-6 text-gray-400" aria-hidden="true" />
                </dt>
                <dd>
                  <a className="hover:text-gray-900" href={`mailto:${email}`}>
                    {email}
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 pb-24 pt-20 sm:pb-32 lg:px-8 lg:py-48">
            <div className="mx-auto max-w-xl lg:mr-0 lg:max-w-lg">
              <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Namn</FormLabel>
                      <FormControl>
                        <Input type="text" autoComplete="name" {...field} />
                      </FormControl>
                    </FormItem>
                  )} />
                </div>
                <div className="sm:col-span-2">
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" autoComplete="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="sm:col-span-2">
                  <FormField control={form.control} name="message" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meddelande</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                {messageSent ? (
                  <div className="rounded-md bg-green-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">Tack för ditt meddelande!</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button type="submit" disabled={messageSent} className="submit-button-styles rounded-md bg-indigo-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                    Skicka meddelande
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>

      </div>
    </div>
  )
}
