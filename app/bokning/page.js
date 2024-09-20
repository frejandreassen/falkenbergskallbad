"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  findBookingByPaymentRequest,
  getPayment,
  bookUsingSwish,
} from "@/lib/actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

const Loader = () => (
  <div className="space-y-6 min-h-[400px] flex items-center">
    <div className="animate-pulse flex flex-col w-full justify-start">
      <div className="rounded-full bg-gray-300 h-16 w-16 mb-4 items-center justify-center"></div>
      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
    </div>
  </div>
);

function SwishCallbackContent() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasStartedRef = useRef(false);

  useEffect(() => {
    const paymentId = searchParams.get("paymentId");
    const order = searchParams.get("order");

    if (paymentId && order && !hasStartedRef.current) {
      hasStartedRef.current = true;
      const decodedOrder = JSON.parse(decodeURIComponent(order));
      handlePaymentCallback(paymentId, decodedOrder);
    } else if (!paymentId || !order) {
      setError("Ogiltiga parametrar för Swish-återkoppling.");
      setIsLoading(false);
    }

    return () => {
      hasStartedRef.current = false;
    };
  }, [searchParams]);

  const handlePaymentCallback = async (paymentId, orderDetails) => {
    try {
      const existingBooking = await findBookingByPaymentRequest(paymentId);

      if (existingBooking) {
        router.push(`/bokning/${existingBooking.uuid}`);
        return;
      }

      pollPaymentStatus(paymentId, orderDetails);
    } catch (error) {
      console.error("Error handling payment callback:", error);
      setError("Ett fel uppstod vid hantering av betalningen.");
      setIsLoading(false);
    }
  };

  const pollPaymentStatus = async (paymentId, orderDetails) => {
    const maxAttempts = 20;
    const pollingInterval = 3000;
    let attempts = 0;

    const poll = async () => {
      if (!hasStartedRef.current) return; // Stop polling if component is unmounted

      try {
        const paymentStatus = await getPayment(paymentId);

        if (paymentStatus === "PAID") {
          const booking = await bookUsingSwish(orderDetails, paymentId);
          if (booking.success) {
            router.push(`/bokning/${booking.uuid}`);
          } else {
            setError(
              booking.message || "Det gick inte att slutföra bokningen.",
            );
            setIsLoading(false);
          }
        } else if (["DECLINED", "ERROR", "CANCELLED"].includes(paymentStatus)) {
          setError(
            `Betalningen misslyckades. Status: ${paymentStatus.toLowerCase()}`,
          );
          setIsLoading(false);
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, pollingInterval);
        } else {
          setError(
            "Tidsgränsen för betalningsverifiering har överskridits. Vänligen kontrollera din Swish-app eller försök igen.",
          );
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error polling payment status:", error);
        setError("Ett fel uppstod vid kontroll av betalningsstatus.");
        setIsLoading(false);
      }
    };

    poll();
  };
  if (isLoading) {
    return (
      <div className="bg-white py-24 px-4 max-w-5xl mx-auto">
        <h1 className="font-bodoni-moda text-3xl mb-10">
          Verifierar betalning...
        </h1>
        <p>Detta kan ta upp till en minut. Vänligen stäng inte webbläsaren.</p>
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white py-24 px-4 max-w-5xl mx-auto">
        <h1 className="font-bodoni-moda text-3xl mb-10">Fel vid betalning</h1>
        <p className="mb-6">{error}</p>
        <Link
          href="/boka"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Gå tillbaka till bokning
        </Link>
      </div>
    );
  }

  return null;
}

export default function SwishCallback() {
  return (
    <Suspense fallback={<Loader />}>
      <SwishCallbackContent />
    </Suspense>
  );
}