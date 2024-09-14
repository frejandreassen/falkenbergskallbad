import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getUserCoupons, checkMembership, getPayment, bookUsingCard, bookUsingSwish } from '@/lib/actions';
import { createPaymentRequest } from '@/lib/swish';

const Loader = () => (
  <div className="space-y-6 min-h-[400px] flex items-center">
    <div className="animate-pulse flex flex-col w-full justify-start">
      <div className="rounded-full bg-gray-300 h-16 w-16 mb-4 items-center justify-center"></div>

      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
    </div>
  </div>
);

const Payment = ({ order, setOrder, errors, setErrors, formatSeats, setCurrentStep }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasAttemptedCardFetch, setHasAttemptedCardFetch] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [manualQrVisible, setManualQrVisible] = useState(false);

  useEffect(() => {
    const verifyMembership = async () => {
      if (order.isMember) {
        setIsLoading(true);
        try {
          const isMember = await checkMembership(order.email);
          if (!isMember) {
            setErrors(prevErrors => ({
              ...prevErrors,
              email: "E-postadressen finns inte registrerad som medlem"
            }));
            setCurrentStep('contact');
          }
        } catch (error) {
          console.error('Error checking membership:', error);
          setErrors(prevErrors => ({
            ...prevErrors,
            email: "Ett fel uppstod vid kontroll av medlemskap"
          }));
        } finally {
          setIsLoading(false);
        }
      }
    };

    verifyMembership();
  }, [order.isMember, order.email, setErrors, setCurrentStep]);

  const setPaymentMethod = (method) => {
    setOrder({
      ...order,
      paymentMethod: method,
      couponId: 0,
      couponCode: ''
    });
  };

  const handleCouponChange = (e) => {
    const { name, value } = e.target;
    setOrder({ ...order, [name === 'cardSelection' ? 'couponId' : name]: value });
  };

  const handleBookingUsingCard = async () => {
    const booking = await bookUsingCard(order)
    console.log(booking)
    if (!booking.success) {
      setErrors({ booking: booking.message });
      setCurrentStep('error')
    }
    if (booking.success) {
      setErrors({})
      setCurrentStep('confirmation')
    }

  }
  const handleBookingUsingSwish = async () => {
    setIsLoading(true);
    try {
      const newPaymentRequest = await createPaymentRequest(order.totalPrice, "Bastu Falkenbergs Kallbad");
      setPaymentRequest(newPaymentRequest);

      
      // Simulate opening Swish on mobile
      if (window.innerWidth < 700) {
        window.location = `swish://paymentrequest?token=${newPaymentRequest.token}&callbackurl=${window.location.protocol}//${window.location.hostname}/bekrafta/${newPaymentRequest.id}`;
      }

      let attempts = 0;
      const maxAttempts = 15; // 30 seconds / 2 seconds interval

      const pollPaymentStatus = async () => {
        const pollInterval = setInterval(async () => {
          attempts++;
          try {
            const status = await getPayment(newPaymentRequest.id);
            
            if (['DECLINED', 'ERROR', 'CANCELLED'].includes(status)) {
              clearInterval(pollInterval);
              setErrors({ payment: `Payment ${status.toLowerCase()}` });
            } else if (status === 'PAID') {
              clearInterval(pollInterval);
              const booking = await bookUsingSwish(order, newPaymentRequest);
              if (booking.success) {
                setErrors({});
                setCurrentStep('confirmation');
              }
            } else if (attempts >= maxAttempts) {
              clearInterval(pollInterval);
              setErrors({ payment: 'Payment timed out' });
            }
          } catch (error) {
            clearInterval(pollInterval);
            console.error('Payment error:', error.message);
            setErrors({ payment: error.message });
            setCurrentStep('error')
          }
        }, 2000);
      };

      pollPaymentStatus();
    } catch (error) {
      console.error('Error creating payment request:', error);
      setErrors({ payment: 'Failed to create payment request' });
    } finally {
      setIsLoading(false);
    }
  };


  const fetchUserCardInfo = async () => {
    setPaymentMethod('card');
    setIsLoading(true);
    try {
      const coupons = await getUserCoupons(order.email);
      setOrder(prevOrder => ({
        ...prevOrder,
        userCards: coupons,
        couponId: coupons.length > 0 ? coupons[0].id : ''
      }));
    } catch (err) {
      console.error('Error fetching user card info:', err);
    } finally {
      setIsLoading(false);
      setHasAttemptedCardFetch(true);
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  const renderSwishPayment = () => (
    <div className="mt-6 p-4 bg-gray-100 rounded-md relative">
      <button
        onClick={() => setPaymentMethod('')}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        aria-label="Stäng"
      >
        <X size={20} />
      </button>
      <h4 className="font-medium mb-2">Betala med swish </h4>
      {paymentRequest ? (
        <>
          <div className="hidden sm:block">
            {/* <img 
              className="m-auto" 
              src={`data:image/png;base64, ${btoa(String.fromCharCode.apply(null, new Uint8Array(paymentRequest.qrCode.data)))}`} 
              alt="Swish QR Code"
            /> */}
            <p className="text-sm text-gray-500 mt-5">Scanna QR koden med Swishappen för att genomföra betalning</p>
          </div>
          <div className="sm:hidden">
            {!manualQrVisible ? (
              <div>
                <p className="mb-5">Bekräfta betalning i swishappen</p>
                <svg role="status" className="m-auto mb-5 w-32 h-32 text-gray-200 animate-spin dark:text-gray-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                  <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="gray"/>
                </svg>
                <a className="text-indigo-700 hover:underline hover:text-indigo-800" onClick={() => setManualQrVisible(true)}>Swish installerad på annan enhet?</a>
              </div>
            ) : (
              <div>
                {/* <img 
                  className="m-auto" 
                  src={`data:image/png;base64, ${btoa(String.fromCharCode.apply(null, new Uint8Array(paymentRequest.qrCode.data)))}`} 
                  alt="Swish QR Code"
                /> */}
                <p className="text-sm text-gray-500 mt-5">Scanna QR koden med Swishappen för att genomföra betalning</p>
              </div>
            )}
          </div>
          <button
            type="button"
            className="mt-16 inline-flex space-x-5 items-center justify-center mt-5 mb-3 lg:mb-0 lg:mr-3 w-full lg:w-auto py-2 px-6 leading-loose bg-blue-500 hover:bg-blue-700 text-white font-semibold rounded-l-xl rounded-t-xl transition duration-200"className="w-full rounded-md border border-transparent bg-indigo-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <a href={`swish://paymentrequest?token=${paymentRequest.token}&callbackurl=${window.location.protocol}//${window.location.hostname}/bekrafta/${paymentRequest.id}`}>
              Öppna Swish
            </a>
          </button>
        </>
      ) : (
        <div>
          <div className="font-bold text-lg py-2">Totalt pris: {order.totalPrice} kr</div>
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
        <h3 className="text-lg font-medium text-gray-900">Bokningsöversikt</h3>
        <div className="mt-2 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Bastubokning</span>
            <span className="text-sm font-medium text-gray-900">{formatSeats(order.selectedSeats)}</span>
          </div>
          {order.paymentMethod !== 'card' && (
            <>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-base font-medium text-gray-900">Totalt</span>
                <span className="text-base font-medium text-gray-900">{order.totalPrice} kr</span>
              </div>

              <div className="mt-6">
                <p className='text-xs text-gray-600 italic'>priset inkluderar moms</p>
                <a href="/villkor" className="text-sm text-indigo-600 hover:underline">
                  Läs våra köpvillkor
                </a>
              </div></>
          )}

        </div>
      </div>


      
      {!order.paymentMethod && (
        <div className="flex flex-col space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Välj betalningsmetod</h3>
          <button
            onClick={() => setPaymentMethod('swish')}
            className="flex items-center justify-center px-4 py-3 border rounded-md shadow-sm text-sm font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <img src="/swish-logo.svg" alt="Swish" className="h-7" />
          </button>
          {order.selectedSeats <= 1 && (
            <button
              onClick={fetchUserCardInfo}
              className="px-4 py-3 border rounded-md shadow-sm text-sm font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Årskort / Klippkort
            </button>
          )}
        </div>
      )}
      {order.paymentMethod === 'swish' && renderSwishPayment()}
      {order.paymentMethod === 'card' && (
        <div className="mt-6 p-4 bg-gray-100 rounded-md relative">
          <button
            onClick={() => setPaymentMethod('')}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            aria-label="Stäng"
          >
            <X size={20} />
          </button>
          {hasAttemptedCardFetch && (!order.userCards || order.userCards.length === 0) ? (
            <div className="py-8 space-y-8">
              <p>Vi hittade inget aktivt kort som tillhör angiven epost-adress:</p>
              <p className="underline">{order.email}</p>
            </div>
          ) : (
            <>
              <h4 className="font-medium mb-4">Välj kort</h4>
              {order.userCards && order.userCards.map((card) => (
                <div key={card.id} className="mb-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="cardSelection"
                      value={card.id}
                      checked={order.couponId === card.id}
                      onChange={handleCouponChange}
                      className="form-radio h-5 w-5 text-indigo-600"
                    />
                    <span className="text-gray-700">
                      {card.type || 'Kort'} -
                      {card.expiry_date
                        ? ` Giltigt till: ${new Date(card.expiry_date).toLocaleDateString()}`
                        : ` Återstående användningar: ${card.remaining_uses}`}
                    </span>
                  </label>
                </div>
              ))}
              <div className="mt-4">
                <label htmlFor="couponCode" className="block text-sm font-medium text-gray-700">
                  Ange kod
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    name="couponCode"
                    id="couponCode"
                    value={order.couponCode}
                    onChange={handleCouponChange}
                    required
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="••••••"
                  />
                </div>
                {errors.couponCode && <p className="mt-2 text-sm text-red-600">{errors.couponCode}</p>}
              </div>
              <button
                type="button"
                onClick={handleBookingUsingCard}
                className="mt-5 w-full rounded-md border border-transparent bg-indigo-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Boka
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Payment;