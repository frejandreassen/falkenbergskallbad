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
import { createNewMember, createTransaction, getPayment, checkMembership } from '@/lib/actions';
import Image from 'next/image';

const formSchema = z.object({
  firstName: z.string().min(1, "Vänligen ange ditt förnamn."),
  lastName: z.string().min(1, "Vänligen ange ditt efternamn."),
  email: z.string().email("Ogiltig e-postadress."),
  telefon: z
    .string()
    .regex(
      /^(07[0-9]{8}|\+467[0-9]{8})$/,
      "Ange ditt mobilnummer enligt format 07XXXXXXXXX eller +467XXXXXXXX",
    ),
});

const MEMBERSHIP_PRICE = 300; // Set your membership price here

export default function Membership({startPage, assetUrl, email}) {
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [manualQrVisible, setManualQrVisible] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      telefon: ""
    },
  });

  const handlePaymentWithSwish = async (values) => {
    setIsLoading(true);
    setError('');

    try {
      // Check if email is already registered
      const isMember = await checkMembership(values.email);
      if (isMember) {
        setError('Det finns redan ett medlemskap kopplat till denna e-postadress.');
        setIsLoading(false);
        return;
      }

      const newPaymentRequest = await createTransaction(
        { totalPrice: MEMBERSHIP_PRICE, ...values },
        `Medlemskap ${new Date().getFullYear()}`
      );
      setPaymentRequest(newPaymentRequest);

      // Opening Swish on mobile
      if (window.innerWidth < 700) {
        window.location = `swish://paymentrequest?token=${newPaymentRequest.token}&callbackurl=${window.location.origin}/redirect/medlem?paymentId=${newPaymentRequest.id}`;
      }

      let attempts = 0;
      const maxAttempts = 45;

      const pollPaymentStatus = async () => {
        const pollInterval = setInterval(async () => {
          attempts++;
          try {
            const payment = await getPayment(newPaymentRequest.id);

            if (["DECLINED", "ERROR", "CANCELLED"].includes(payment.status)) {
              clearInterval(pollInterval);
              setPaymentStatus('error');
              setError('Betalningen misslyckades. Vänligen försök igen.');
            } else if (payment.status === "PAID") {
              clearInterval(pollInterval);
              await createNewMember(values, payment);
              setPaymentStatus('success');
            } else if (attempts >= maxAttempts) {
              clearInterval(pollInterval);
              setPaymentStatus('timeout');
              setError('Betalningen tog för lång tid. Vänligen försök igen.');
            }
          } catch (error) {
            clearInterval(pollInterval);
            console.error("Payment error:", error.message);
            setPaymentStatus('error');
            setError('Ett fel uppstod vid betalningen. Vänligen försök igen.');
          }
        }, 2000);
      };

      pollPaymentStatus();
    } catch (error) {
      console.error("Error creating payment request:", error);
      setPaymentStatus('error');
      setError('Ett tekniskt fel uppstod. Vänligen försök igen senare.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPaymentStatus = () => {
    switch(paymentStatus) {
      case 'success':
        return (
          <div className="mt-6 p-4 bg-green-50 rounded-md">
            <h4 className="text-green-800 font-medium">Betalning genomförd!</h4>
            <p className="text-green-600 mt-2">
              Tack för ditt medlemskap. Du kommer snart få ett bekräftelsemail.
            </p>
          </div>
        );
      case 'error':
        return (
          <div className="mt-6 p-4 bg-red-50 rounded-md">
            <h4 className="text-red-800 font-medium">Betalning misslyckades</h4>
            <p className="text-red-600 mt-2">
              {error || 'Ett fel uppstod vid betalningen. Vänligen försök igen.'}
            </p>
          </div>
        );
      default:
        return error ? (
          <div className="mt-6 p-4 bg-red-50 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        ) : null;
    }
  };

  const renderSwishPayment = () => (
    <div className="mt-6 p-4 bg-gray-100 rounded-md relative">
      <h4 className="font-medium mb-2">Betala med swish</h4>
      {paymentRequest ? (
        <>
          <div className="hidden sm:block">
            {paymentRequest.qrCode && (
              <img
                className="m-auto"
                src={`data:image/png;base64,${paymentRequest.qrCode}`}
                alt="Swish QR Code"
              />
            )}
            <p className="text-sm text-gray-500 mt-5">
              Scanna QR koden med Swishappen för att genomföra betalning
            </p>
          </div>
          <div className="sm:hidden">
            {!manualQrVisible ? (
              <div>
                <p className="mb-5">Bekräfta betalning i swishappen</p>
                <svg
                  role="status"
                  className="m-auto mb-5 w-32 h-32 text-gray-200 animate-spin dark:text-gray-600"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="gray"
                  />
                </svg>
                <a
                  className="text-indigo-700 hover:underline hover:text-indigo-800 cursor-pointer"
                  onClick={() => setManualQrVisible(true)}
                >
                  Swish installerad på annan enhet?
                </a>
              </div>
            ) : (
              <div>
                {paymentRequest.qrCode && (
                  <img
                    className="m-auto"
                    src={`data:image/png;base64,${paymentRequest.qrCode}`}
                    alt="Swish QR Code"
                  />
                )}
                <p className="text-sm text-gray-500 mt-5">
                  Scanna QR koden med Swishappen för att genomföra betalning.
                  Stäng inte ned detta fönster.
                </p>
              </div>
            )}
          </div>
          <button
            type="button"
            className="w-full rounded-md border border-transparent bg-indigo-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <a
              href={`swish://paymentrequest?token=${paymentRequest.token}&callbackurl=${window.location.origin}/medlem?paymentId=${paymentRequest.id}`}
            >
              Öppna Swish på denna enhet
            </a>
          </button>
        </>
      ) : (
        <div>
          <div className="font-bold text-lg py-2">
            Medlemsavgift : {MEMBERSHIP_PRICE} kr
          </div>
          <div>Avser kalenderår {new Date().getFullYear()}</div>
          <button
            onClick={() => handlePaymentWithSwish(form.getValues())}
            disabled={!form.formState.isValid || isLoading}
            className="flex items-center justify-center px-4 py-3 border bg-white w-full rounded-md shadow-sm text-sm font-medium border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img src="/swish-logo.svg" alt="Swish" className="h-7" />
          </button>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    if (paymentStatus === 'success') {
      return (
        <div className="mt-6 p-4 bg-green-50 rounded-md">
          <h4 className="text-green-800 font-medium">Betalning genomförd!</h4>
          <p className="text-green-600 mt-2">
            Tack för ditt medlemskap. Du kommer snart få ett bekräftelsemail.
          </p>
        </div>
      );
    }
  
    return (
      <>
        {renderSwishPayment()}
        {renderPaymentStatus()}
      </>
    );
  };
  return (
    <div id="medlem" className="relative isolate bg-white px-6 py-24 sm:py-32 lg:px-8">
      {/* Background SVG pattern remains the same */}
      <div className="mx-auto max-w-xl lg:max-w-4xl">
        <h2 className="text-3xl font-bodoni-moda font-bold tracking-tight text-gray-900">
          {startPage.membership_header}
        </h2>
        <p className="mt-2 text-lg leading-8 text-gray-600">
          {startPage.membership_content}
        </p>
        <div className="mt-16 flex flex-col gap-16 sm:gap-y-20 lg:flex-row">
          <Form {...form}>
            <form className="lg:flex-auto">
              <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Förnamn</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Efternamn</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="my-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="my-6">
                <FormField
                  control={form.control}
                  name="telefon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobiltelefon</FormLabel>
                      <FormControl>
                        <Input type="tel" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {renderContent()}
              <p className="mt-4 text-xs">Om du istället vill betala med bankgiro: betala 300 kronor till bankgiro 145-4636, märk betalningen med ditt namn. Maila även telefon och namn till falkenbergskallbad@gmail.com</p>
            </form>
          </Form>

          <div className="lg:mt-6 lg:w-80 lg:flex-none">
            <figure className="">
              <blockquote className="text-lg font-semibold leading-8 text-gray-900">
                <p>{startPage.membership_testimonial_text}</p>
              </blockquote>
              <figcaption className="mt-10 flex gap-x-6">
                <Image
                  src={assetUrl + '/' + startPage.membership_testimonial_image}
                  width={40}
                  height={40}
                  alt="Medlem berättar"
                  className="h-12 w-12 flex-none rounded-full bg-gray-50"
                />
                <div>
                  <div className="text-base font-semibold text-gray-900">
                    {startPage.membership_testimonial_name}
                  </div>
                  <div className="text-sm leading-6 text-gray-600">
                    {startPage.membership_testimonial_title}
                  </div>
                </div>
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </div>
  );
}