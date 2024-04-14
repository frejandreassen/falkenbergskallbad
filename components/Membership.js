'use client'
import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Input } from "@/components/ui/input"
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
import { sendMembershipEmail } from '@/lib/actions';
import Image from 'next/image';

const formSchema = z.object({
  firstName: z.string().min(1, "Please enter your first name."),
  lastName: z.string().min(1, "Please enter your last name."),
  email: z.string().email("Invalid email address."),
});

export default function Membership({startPage, assetUrl, email}) {
  const [messageSent, setMessageSent] = useState(false);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: ""
    },
  });

  async function onSubmit(values) {
    console.log(values);
    try {
      await sendMembershipEmail(email, values, startPage.membership_payment_info);
      setMessageSent(true); // Set the message sent state to true on success
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  }

    return (
      <div  id="medlem" className="relative isolate bg-white px-6 py-24 sm:py-32 lg:px-8">
        <svg
          className="absolute inset-0 -z-10 h-full w-full stroke-gray-200 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="83fd4e5a-9d52-42fc-97b6-718e5d7ee527"
              width={200}
              height={200}
              x="50%"
              y={-64}
              patternUnits="userSpaceOnUse"
            >
              <path d="M100 200V.5M.5 .5H200" fill="none" />
            </pattern>
          </defs>
          <svg x="50%" y={-64} className="overflow-visible fill-gray-50">
            <path
              d="M-100.5 0h201v201h-201Z M699.5 0h201v201h-201Z M499.5 400h201v201h-201Z M299.5 800h201v201h-201Z"
              strokeWidth={0}
            />
          </svg>
          <rect width="100%" height="100%" strokeWidth={0} fill="url(#83fd4e5a-9d52-42fc-97b6-718e5d7ee527)" />
        </svg>
        <div className="mx-auto max-w-xl lg:max-w-4xl">
          <h2 className="text-3xl font-bodoni-moda font-bold tracking-tight text-gray-900">{startPage.membership_header}</h2>
          <p className="mt-2 text-lg leading-8 text-gray-600">
          {startPage.membership_content}
          </p>
          <div className="mt-16 flex flex-col gap-16 sm:gap-y-20 lg:flex-row">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="lg:flex-auto">
              <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                <FormField control={form.control} name="firstName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Förnamn</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Efternamn</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )} />
                
              </div>
              <div className="my-6">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                  </FormItem>
                )} />
              </div>
                {!messageSent ? (
                  <div className="mt-10">
                    <Button type="submit" className="block w-full rounded-md bg-indigo-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                    {startPage.membership_button_text}
                    </Button>
                    <p className="text-xs text-center my-2">{startPage.membership_button_explanation}</p>
                  </div>
                ) : (
                  <div>
                    <article className="prose prose-img:rounded-lg prose-headings:font-bodoni-moda">
                      <div dangerouslySetInnerHTML={{ __html: startPage.membership_payment_info }} />
                    </article>
                  </div>
                )}

            </form>
          </Form>
          
            <div className="lg:mt-6 lg:w-80 lg:flex-none">
              <figure className="">
                <blockquote className="text-lg font-semibold leading-8 text-gray-900">
                  <p>
                    {startPage.membership_testimonial_text}
                  </p>
                </blockquote>
                <figcaption className="mt-10 flex gap-x-6">
                  <img
                    src={assetUrl+'/'+startPage.membership_testimonial_image}
                    alt=""
                    className="h-12 w-12 flex-none rounded-full bg-gray-50"
                  />
                  <div>
                    <div className="text-base font-semibold text-gray-900">{startPage.membership_testimonial_name}</div>
                    <div className="text-sm leading-6 text-gray-600">{startPage.membership_testimonial_title}</div>
                  </div>
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </div>
    )
  }
  