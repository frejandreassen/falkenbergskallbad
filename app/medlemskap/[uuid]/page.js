"use client";
import React, { useState, useEffect } from "react";
import { findMembershipByUUID, createTransaction, getPayment, updateMemberPayment } from "@/lib/actions";
import { format, isValid } from "date-fns";
import { sv } from "date-fns/locale";
import Link from "next/link";

export const dynamic = "force-dynamic";

const MEMBERSHIP_PRICE = 300; // Same as in the Membership component

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return isValid(date)
    ? format(date, "d MMMM yyyy", { locale: sv })
    : "Ogiltigt datum";
};

export default function MembershipDetailsPage({ params }) {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [membershipDetails, setMembershipDetails] = useState(null);
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [manualQrVisible, setManualQrVisible] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [isProcessing, setIsProcessing] = useState(false);
  const { uuid } = params;

  const fetchMembershipDetails = async () => {
    try {
      const details = await findMembershipByUUID(uuid);
      setMembershipDetails(details);
    } catch (error) {
      console.error("Error fetching membership details:", error);
      setError(
        "Det gick inte att hämta medlemskapsdetaljerna. Vänligen kontrollera länken."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembershipDetails();
  }, [uuid]);

  const isMembershipExpired = () => {
    if (!membershipDetails || !membershipDetails.betalt_till_och_med) return true;
    const expiryDate = new Date(membershipDetails.betalt_till_och_med);
    const today = new Date();
    return today > expiryDate;
  };

  const handlePaymentWithSwish = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setError('');

    try {
      // Create a payment order
      const orderData = {
        totalPrice: MEMBERSHIP_PRICE,
        firstName: membershipDetails.fornamn,
        lastName: membershipDetails.efternamn,
        email: membershipDetails.email,
        telefon: membershipDetails.telefon,
        memberId: membershipDetails.id,
        uuid: membershipDetails.uuid
      };

      const newPaymentRequest = await createTransaction(
        orderData,
        `Medlemskap ${new Date().getFullYear()}`
      );
      setPaymentRequest(newPaymentRequest);

      // Store payment ID in session storage to prevent duplicate submissions
      sessionStorage.setItem('pendingPaymentId', newPaymentRequest.id);

      // Opening Swish on mobile
      if (window && window.innerWidth < 700) {
        // Construct and encode callback URL properly
        const callbackUrl = encodeURIComponent(
          `${window.location.origin}/redirect/medlemskap?paymentId=${newPaymentRequest.id}&memberId=${membershipDetails.id}&uuid=${uuid}`
        );
        window.location = `swish://paymentrequest?token=${newPaymentRequest.token}&callbackurl=${callbackUrl}`;
      }

      let attempts = 0;
      const maxAttempts = 45;
      let pollInterval;

      const pollPaymentStatus = async () => {
        // Clear any existing intervals first
        if (window && window.paymentPollInterval) {
          clearInterval(window.paymentPollInterval);
        }
        
        pollInterval = setInterval(async () => {
          attempts++;
          try {
            const payment = await getPayment(newPaymentRequest.id);

            if (["DECLINED", "ERROR", "CANCELLED"].includes(payment.status)) {
              clearInterval(pollInterval);
              setPaymentStatus('error');
              setError('Betalningen misslyckades. Vänligen försök igen.');
              sessionStorage.removeItem('pendingPaymentId');
              setIsProcessing(false);
            } else if (payment.status === "PAID") {
              clearInterval(pollInterval);
              
              try {
                // Update the member's payment information
                await updateMemberPayment(membershipDetails.id, {
                  amount: MEMBERSHIP_PRICE,
                  message: `Medlemskap ${new Date().getFullYear()}`
                });
                
                setPaymentStatus('success');
                // Force reload the membership details after successful payment
                await fetchMembershipDetails();
                sessionStorage.removeItem('pendingPaymentId');
              } catch (updateError) {
                console.error("Error updating membership:", updateError);
                setError('Betalningen lyckades men ett fel uppstod vid uppdateringen av medlemskapet. Vänligen kontakta oss.');
              } finally {
                setIsProcessing(false);
              }
            } else if (attempts >= maxAttempts) {
              clearInterval(pollInterval);
              setPaymentStatus('timeout');
              setError('Betalningen tog för lång tid. Vänligen försök igen.');
              sessionStorage.removeItem('pendingPaymentId');
              setIsProcessing(false);
            }
          } catch (error) {
            clearInterval(pollInterval);
            console.error("Payment error:", error.message);
            setPaymentStatus('error');
            setError('Ett fel uppstod vid betalningen. Vänligen försök igen.');
            sessionStorage.removeItem('pendingPaymentId');
            setIsProcessing(false);
          }
        }, 2000);
        
        // Store interval reference globally so it can be cleared if needed
        if (window) {
          window.paymentPollInterval = pollInterval;
        }
      };

      pollPaymentStatus();
    } catch (error) {
      console.error("Error creating payment request:", error);
      setPaymentStatus('error');
      setError('Ett tekniskt fel uppstod. Vänligen försök igen senare.');
      sessionStorage.removeItem('pendingPaymentId');
      setIsProcessing(false);
    }
  };

  const renderPaymentStatus = () => {
    switch(paymentStatus) {
      case 'success':
        return (
          <div className="mt-6 p-4 bg-green-50 rounded-md">
            <h4 className="text-green-800 font-medium">Betalning genomförd!</h4>
            <p className="text-green-600 mt-2">
              Tack för din medlemsavgift. Din betalning har registrerats.
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
      {paymentRequest ? (
        <>
          <h4 className="font-medium mb-2">Betala med swish</h4>
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
            className="w-full mt-4 flex items-center justify-center px-4 py-3 border bg-white rounded-md shadow-sm text-sm font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <a
              href={`swish://paymentrequest?token=${paymentRequest.token}&callbackurl=${encodeURIComponent(`${window.location.origin}/redirect/medlemskap?paymentId=${paymentRequest.id}&memberId=${membershipDetails.id}&uuid=${uuid}`)}`}
            >
              Öppna Swish på denna enhet
            </a>
          </button>
        </>
      ) : null}
    </div>
  );

  if (error && !membershipDetails) {
    return (
      <div className="bg-white py-24 px-4 max-w-5xl mx-auto">
        <h1 className="font-bodoni-moda text-3xl mb-10">Fel</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white py-24 px-4 max-w-5xl mx-auto">
        <h1 className="font-bodoni-moda text-3xl mb-10">Laddar...</h1>
      </div>
    );
  }

  return (
    <div className="bg-white py-24 px-4 max-w-2xl mx-auto">
      <h1 className="font-bodoni-moda text-3xl mb-12">Medlemskapsdetaljer</h1>
      <div className="space-y-6">
        <div className="space-y-2">
          <p>
            <strong>Medlemskap start:</strong> {formatDate(membershipDetails.medlemskap_start)}
          </p>
          <div className="flex items-center">
            <p>
              <strong>Betalt till och med:</strong> {formatDate(membershipDetails.betalt_till_och_med)}
            </p>
            {!isMembershipExpired() && (
              <svg className="ml-3 h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            )}
          </div>
          {membershipDetails.datum_senaste_betalning && (
            <p>
              <strong>Senaste betalning:</strong> {formatDate(membershipDetails.datum_senaste_betalning)}
            </p>
          )}
        </div>

        {isMembershipExpired() && paymentStatus === 'pending' && !paymentRequest && (
          <div className="mt-6 p-4 bg-gray-100 rounded-md relative">
            <h3 className="text-xl font-semibold mb-2">Dags att betala årets medlemsavgift</h3>
            <p className="mb-4">Du är fortfarande medlem, men det är dags att betala medlemsavgiften för att fortsätta ta del av alla förmåner.</p>
            
            <div className="font-bold text-lg py-2">
              Medlemsavgift: {MEMBERSHIP_PRICE} kr
            </div>
            <div className="mb-4">Avser kalenderår {new Date().getFullYear()}</div>
            
            <button
              onClick={handlePaymentWithSwish}
              disabled={isProcessing}
              className="flex items-center justify-center px-4 py-3 border bg-white w-full rounded-md shadow-sm text-sm font-medium border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Bearbetar...
                </span>
              ) : (
                <img src="/swish-logo.svg" alt="Swish" className="h-7" />
              )}
            </button>
            
            <p className="mt-4 text-xs">Om du istället vill betala med bankgiro: betala 300 kronor till bankgiro 145-4636, märk betalningen med ditt namn och e-post.</p>
          </div>
        )}

        {paymentRequest && paymentStatus === 'pending' && renderSwishPayment()}
        {renderPaymentStatus()}

        <div className="space-y-2 pt-8">
          <h2 className="font-bodoni-moda text-2xl mb-4">
            Medlemsinformation
          </h2>
          <p>
            <strong>Namn:</strong> {membershipDetails.fornamn}{" "}
            {membershipDetails.efternamn}
          </p>
          <p>
            <strong>E-post:</strong> {membershipDetails.email}
          </p>
          <p>
            <strong>Telefon:</strong> {membershipDetails.telefon}
          </p>
        </div>

        <div className="pt-8 space-y-2 text-sm">
          <p>Falkenberg Kallbadsvänner</p>
          <p>Organisationsnummer: 802542-2380</p>
          <p>Riddarevägen 3</p>
          <p>311 37 Falkenberg</p>
          <Link 
            href="/" 
            className="text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            Tillbaka till hemsidan
          </Link>
        </div>
      </div>
    </div>
  );
}