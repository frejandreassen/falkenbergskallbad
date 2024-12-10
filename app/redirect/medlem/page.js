"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createNewMember, getPayment, checkMembership } from "@/lib/actions";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const Loader = () => (
  <div className="my-24 max-w-2xl mx-auto p-6">
    <Card>
      <CardHeader>
        <CardTitle>Verifierar medlemsregistrering...</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-6">Ett ögonblick medan vi bekräftar din betalning.</p>
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

const ErrorDisplay = ({ error, showBackLink = true }) => (
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
          {showBackLink && (
            <div className="pt-4">
              <Link
                href="/#medlem"
                className="text-indigo-600 hover:text-indigo-800 underline"
              >
                Tillbaka till medlemsregistrering
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  </div>
);

const SuccessDisplay = () => (
  <div className="my-24 max-w-2xl mx-auto p-6">
    <Card>
      <CardHeader>
        <CardTitle>Välkommen som medlem!</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p>
            Din betalning har bekräftats och ditt medlemskap är nu aktivt. Du kommer snart få ett
            bekräftelsemail med mer information.
          </p>
          <h3 className="font-medium text-xl mb-2">Vad händer nu?</h3>
          <div className="bg-green-50 p-4 rounded-md">
            
            <ul className="text-green-700 space-y-2">
              <li>Du kan nu boka bastutider med ditt medlemskort</li>
              <li>Ta del av medlemsförmåner och rabatter</li>
              <li>Få inbjudningar till medlemsevenemang</li>
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


// Inner component that uses useSearchParams
const VerificationContent = () => {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
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
            if (isProcessing) {
              return;
            }

            setIsProcessing(true);
            const payment = await getPayment(paymentId);

            if (payment.status === "PAID") {
              clearInterval(pollInterval);
              
              try {
                const isMember = await checkMembership(payment.order.email);
                
                if (isMember) {
                  if (isActive) {
                    setStatus("success");
                  }
                } else {
                  await createNewMember(payment.order, payment);
                  if (isActive) {
                    setStatus("success");
                  }
                }
              } catch (err) {
                if (isActive) {
                  setError("Ett fel uppstod vid medlemsregistreringen.");
                  setStatus("error");
                }
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
          } finally {
            setIsProcessing(false);
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
    return <SuccessDisplay />;
  }

  if (status === "error") {
    return <ErrorDisplay error={error} />;
  }

  return <Loader />;
};

// Main component with proper Suspense boundary
const MembershipCallback = () => {
  return (
    <Suspense fallback={<Loader />}>
      <VerificationContent />
    </Suspense>
  );
};

export default MembershipCallback;