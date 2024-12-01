"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getPayment, createCoupon, findCouponByPaymentRequest } from "@/lib/actions";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

const Loader = () => (
  <div className="my-24 max-w-2xl mx-auto p-6">
    <Card>
      <CardHeader>
        <CardTitle>Verifierar betalning...</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-6">Ett ögonblick medan vi behandlar din betalning.</p>
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-pulse flex flex-col items-center">
            <div className="rounded-full bg-gray-300 h-16 w-16 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-32"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const ErrorDisplay = ({ error }) => (
  <div className="my-24 max-w-2xl mx-auto p-6">
    <Card>
      <CardHeader>
        <CardTitle>Ett fel uppstod</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-red-600">{error}</p>
          <p>
            Om du behöver hjälp eller har frågor, vänligen kontakta oss på{" "}
            <a href="mailto:falkenbergskallbad@gmail.com" className="text-indigo-600 hover:text-indigo-800">
              falkenbergskallbad@gmail.com
            </a>
          </p>
          <div className="pt-4">
            <Link
              href="/periodkort"
              className="text-indigo-600 hover:text-indigo-800 underline"
            >
              Tillbaka till periodkort
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const SuccessDisplay = ({ coupon }) => (
  <div className="my-24 max-w-2xl mx-auto p-6">
    <Card>
      <CardHeader>
        <CardTitle>Betalningen är genomförd!</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p>
            Din betalning har bekräftats och ditt {coupon.type} är nu aktivt. Du kommer snart få ett
            bekräftelsemail med mer information.
          </p>
          <div className="bg-green-50 p-4 rounded-md">
            <h3 className="font-medium text-green-800 mb-2">Ditt {coupon.type}</h3>
            <ul className="text-green-700 space-y-2">
              <li>Kortnummer: {coupon?.code}</li>
              <li>Giltigt till: {coupon?.expiry_date ? format(new Date(coupon.expiry_date), 'dd MMM yyyy', { locale: sv }) : '-'}</li>
              {(coupon.type == "Klippkort") && <li>Antal användningar kvar: {coupon?.remaining_uses}</li>}
            </ul>
          </div>
          <div className="pt-4">
            <Link
              href="/boka"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium text-white h-10 px-4 py-2 bg-indigo-600 hover:bg-indigo-700"
            >
              Boka bastutid
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const PeriodCardVerification = () => {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [couponData, setCouponData] = useState(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    let isActive = true;
    const paymentId = searchParams.get("paymentId");

    const verifyPayment = async () => {
      if (!paymentId) {
        if (isActive) {
          setError("Ogiltig betalningsförfrågan.");
          setStatus("error");
        }
        return;
      }

      try {
        let attempts = 0;
        const maxAttempts = 20;
        
        const pollInterval = setInterval(async () => {
          if (!isActive) {
            clearInterval(pollInterval);
            return;
          }

          try {
            const payment = await getPayment(paymentId);
            
            if (payment.status === "PAID") {
              clearInterval(pollInterval);
              
              try {
                // Check if card already exists
                const existingCard = await findCouponByPaymentRequest(payment.id);
                if (existingCard) {
                  setCouponData(existingCard) 
                  setStatus("success")
                  return
                }
                const confirmation = await createCoupon(payment.order, payment.id);
                if (confirmation.success) {
                  const newCard = await findCouponByPaymentRequest(payment.id)
                  setCouponData(newCard);
                  setStatus("success");
                } else {
                  setError(confirmation.message || "Failed to create period card");
                  setStatus("error");
                }
              } catch (cardError) {
                setError(cardError.message);
                setStatus("error");
              }
            } else if (["DECLINED", "ERROR", "CANCELLED"].includes(payment.status)) {
              clearInterval(pollInterval);
              if (isActive) {
                setError(`Betalningen misslyckades. Status: ${payment.status.toLowerCase()}`);
                setStatus("error");
              }
            } else if (attempts >= maxAttempts) {
              clearInterval(pollInterval);
              if (isActive) {
                setError("Tidsgränsen för betalningsverifiering har överskridits.");
                setStatus("error");
              }
            }
            attempts++;
          } catch (err) {
            clearInterval(pollInterval);
            if (isActive) {
              setError("Ett fel uppstod vid verifiering av betalningen.");
              setStatus("error");
            }
          }
        }, 3000);

        return () => {
          clearInterval(pollInterval);
          isActive = false;
        };
      } catch (err) {
        if (isActive) {
          setError("Ett tekniskt fel uppstod.");
          setStatus("error");
        }
      }
    };

    verifyPayment();

    return () => {
      isActive = false;
    };
  }, [searchParams]);

  if (status === "success") {
    return <SuccessDisplay coupon={couponData} />;
  }

  if (status === "error") {
    return <ErrorDisplay error={error} />;
  }

  return <Loader />;
};

const PeriodCardCallback = () => {
  return (
    <Suspense fallback={<Loader />}>
      <PeriodCardVerification />
    </Suspense>
  );
};

export default PeriodCardCallback;