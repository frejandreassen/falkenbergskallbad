'use client'
'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getPayment, bookUsingSwish } from '@/lib/actions';

const PaymentStatusPage = () => {
  const searchParams = useSearchParams();
  const paymentRequestId = searchParams.get('paymentRequestId');
  const orderData = searchParams.get('orderData');
  
  const [status, setStatus] = useState('PENDING');
  const [error, setError] = useState(null);
  const [bookingConfirmation, setBookingConfirmation] = useState(null);

  useEffect(() => {
    if (!paymentRequestId || !orderData) return;

    const order = JSON.parse(decodeURIComponent(orderData));

    const pollPaymentStatus = async () => {
      try {
        const result = await getPayment(paymentRequestId);
        setStatus(result);

        if (['PAID', 'DECLINED', 'ERROR', 'CANCELLED'].includes(result)) {
          clearInterval(pollInterval);
          if (result === 'PAID') {
            try {
              const bookingResult = await bookUsingSwish(order, { id: paymentRequestId });
              if (bookingResult.success) {
                setBookingConfirmation(bookingResult);
              } else {
                setError('Booking failed: ' + bookingResult.message);
              }
            } catch (bookingError) {
              console.error('Error making booking:', bookingError);
              setError('Failed to complete booking');
            }
          }
        }
      } catch (err) {
        console.error('Error fetching payment status:', err);
        setError('Failed to fetch payment status');
        clearInterval(pollInterval);
      }
    };

    const pollInterval = setInterval(pollPaymentStatus, 2000);

    return () => clearInterval(pollInterval);
  }, [paymentRequestId, orderData]);

  const renderContent = () => {
    if (error) {
      return <p className="text-red-500 text-center">{error}</p>;
    }

    if (status === 'PENDING') {
      return (
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-10 w-10 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600 text-center">Processing your payment...</p>
        </div>
      );
    }

    if (status === 'PAID' && bookingConfirmation) {
      return (
        <div className="space-y-4">
          <p className="text-green-600 font-semibold text-center">Payment successful!</p>
          <h2 className="text-xl font-bold">Booking Confirmation</h2>
          <div className="space-y-2">
            <p><strong>Booking ID:</strong> {bookingConfirmation.bookingId}</p>
            <p><strong>Date:</strong> {new Date(bookingConfirmation.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> {bookingConfirmation.time}</p>
            <p><strong>Seats:</strong> {bookingConfirmation.seats.join(', ')}</p>
            <p><strong>Total Price:</strong> {bookingConfirmation.totalPrice} SEK</p>
          </div>
          <p className="text-sm text-gray-600">A confirmation email has been sent to your email address.</p>
        </div>
      );
    }

    return (
      <p className={`text-center font-semibold ${
        status === 'PAID' ? 'text-green-600' : 'text-red-600'
      }`}>
        Payment {status.toLowerCase()}
      </p>
    );
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Payment Status</h1>
        {renderContent()}
      </div>
    </div>
  );
};

export default PaymentStatusPage;