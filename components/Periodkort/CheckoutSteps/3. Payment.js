import React, { useState, useEffect } from "react";
import {
  checkMembership,
  getPayment,
  createCoupon,
  createTransaction,
} from "@/lib/actions";

const Loader = () => (
  <div className="space-y-6 min-h-[400px] flex items-center">
    <div className="animate-pulse flex flex-col w-full justify-start">
      <div className="rounded-full bg-gray-300 h-16 w-16 mb-4 items-center justify-center"></div>

      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
    </div>
  </div>
);

const Payment = ({
  order,
  setOrder,
  errors,
  setErrors,
  formatSeats,
  setCurrentStep,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [manualQrVisible, setManualQrVisible] = useState(false);

  useEffect(() => {
    const verifyMembership = async () => {
      if (order.isMember) {
        setIsLoading(true);
        try {
          const isMember = await checkMembership(order.email);
          if (!isMember) {
            setErrors((prevErrors) => ({
              ...prevErrors,
              email: "E-postadressen finns inte registrerad som medlem",
            }));
            setCurrentStep("contact");
          }
        } catch (error) {
          console.error("Error checking membership:", error);
          setErrors((prevErrors) => ({
            ...prevErrors,
            email: "Ett fel uppstod vid kontroll av medlemskap",
          }));
        } finally {
          setIsLoading(false);
        }
      }
    };
    verifyMembership();
  }, [order.isMember, order.email, setErrors, setCurrentStep]);

  const handleBookingUsingSwish = async () => {
    setIsLoading(true);
    try {
      const newPaymentRequest = await createTransaction(
        order,
        order.selectedProduct,
      );
      setPaymentRequest(newPaymentRequest);

      // Opening Swish on mobile
      if (window.innerWidth < 700) {
        window.location = `swish://paymentrequest?token=${newPaymentRequest.token}&callbackurl=${window.location.origin}/bokning?paymentId=${newPaymentRequest.id}`;
      }

      let attempts = 0;
      const maxAttempts = 15; // 30 seconds / 2 seconds interval

      const pollPaymentStatus = async () => {
        const pollInterval = setInterval(async () => {
          attempts++;
          try {
            const payment = await getPayment(newPaymentRequest.id);

            if (["DECLINED", "ERROR", "CANCELLED"].includes(payment.status)) {
              clearInterval(pollInterval);
              setErrors({
                payment: `Betalningsförfrågan missslyckades. Status: ${payment.status.toLowerCase()}`,
              });
              setCurrentStep("error");
            } else if (payment.status === "PAID") {
              clearInterval(pollInterval);
              const confirmation = await createCoupon(
                payment.order,
                payment.id,
              );
              if (confirmation.success) {
                setErrors({});
                setCurrentStep("confirmation");
              }
              if (!confirmation.success) {
                setErrors({ payment: confirmation.message });
                setCurrentStep("error");
              }
            } else if (attempts >= maxAttempts) {
              clearInterval(pollInterval);
              setErrors({ payment: "Payment timed out" });
            }
          } catch (error) {
            clearInterval(pollInterval);
            console.error("Payment error:", error.message);
            setErrors({ payment: error.message });
            setCurrentStep("error");
          }
        }, 2000);
      };

      pollPaymentStatus();
    } catch (error) {
      console.error("Error creating payment request:", error);
      setErrors({ payment: "Misslyckades med att skapa betalningsförfrågan" });
      setCurrentStep("error");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  const renderSwishPayment = () => (
    <div className="mt-6 p-4 bg-gray-100 rounded-md relative">
      <h4 className="font-medium mb-2">Betala med swish </h4>
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
                  className="text-indigo-700 hover:underline hover:text-indigo-800"
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
              href={`swish://paymentrequest?token=${paymentRequest.token}&callbackurl=${window.location.origin}/bokning?paymentId=${paymentRequest.id}`}
            >
              Öppna Swish på denna enhet
            </a>
          </button>
        </>
      ) : (
        <div>
          <div className="font-bold text-lg py-2">
            Totalt pris: {order.totalPrice} kr
          </div>
          <button
            onClick={handleBookingUsingSwish}
            className="flex items-center justify-center px-4 py-3 border bg-white w-full rounded-md shadow-sm text-sm font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <img src="/swish-logo.svg" alt="Swish" className="h-7" />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="py-8">
        <h3 className="text-lg font-medium text-gray-900">Beställning</h3>
        <div className="mt-2 space-y-2">
          <>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Produkt</span>
              <span className="text-sm font-medium text-gray-900">
                {order.selectedProduct || "Ej vald"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Giltighetstid</span>
              <span className="text-sm font-medium text-gray-900">
                {order.startDate} till {order.expiryDate}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Medlemskap</span>
              <span className="text-sm font-medium text-gray-900">
                {order.isMember ? "Ja" : "Nej"}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-base font-medium text-gray-900">
                Totalt
              </span>
              <span className="text-base font-medium text-gray-900">
                {order.totalPrice} kr
              </span>
            </div>

            <div className="mt-6">
              <p className="text-xs text-gray-600 italic">
                priset inkluderar 25% moms
              </p>
              <a
                href="/villkor"
                className="text-sm text-indigo-600 hover:underline"
              >
                Läs våra köpvillkor
              </a>
            </div>
          </>
        </div>
      </div>

      {renderSwishPayment()}
    </div>
  );
};

export default Payment;
