import React, { useState } from 'react';
import { z } from 'zod';
import { differenceInMinutes } from 'date-fns';

import Confirmation from './CheckoutSteps/4.Confirmation';
import Payment from './CheckoutSteps/3. Payment';
import Contact from './CheckoutSteps/2. Contact';
import Seats from './CheckoutSteps/1. Seats';
import ErrorComponent from './CheckoutSteps/ErrorComponent';

const steps = [
  { id: 'seats', name: 'Välj platser' },
  { id: 'contact', name: 'Kontaktinformation' },
  { id: 'payment', name: 'Betalning' },
  // { id: 'confirmation', name: 'Bekräftelse' }
];

// Define the order schema
const orderSchema = z.object({
  selectedSeats: z.number().min(1, 'Minst en plats måste väljas'),
  phone: z.string().regex(/^(07[0-9]{8}|\+467[0-9]{8})$/, "Ange ditt mobilnummer enligt format 07XXXXXXXXX eller +467XXXXXXXX"),
  email: z.string().email('Ange en giltig e-postadress'),
  isMember: z.boolean(),
  paymentMethod: z.string().optional(),
  couponId: z.number().optional(),
  couponCode: z.string().optional(),
  totalPrice: z.number().min(0, 'Totalt pris måste vara positivt'),
  userCards: z.array(z.object({
    id: z.number(),
    type: z.string().optional(),
    expiry_date: z.string().optional(),
    remaining_uses: z.number().optional()
  })).optional()
});

const Checkout = ({ selectedSlot, priceList }) => {
  const [currentStep, setCurrentStep] = useState('seats');
  const [errors, setErrors] = useState({});

  const slotDuration = Math.round(differenceInMinutes(selectedSlot.end_time, selectedSlot.start_time) / 60);
  const prices = {
    regularPricePerSeat: 0,  // Regular price per seat
    memberPricePerSeat: 0,   // Member price per seat
    regularPriceEntireSauna: 0,  // Regular price for entire sauna
    memberPriceEntireSauna: 0,    // Member price for entire sauna
  };
  switch (slotDuration) {
    case 1: 
      prices.regularPricePerSeat = priceList.seat_1hour
      prices.memberPricePerSeat = priceList.seat_1hour_member
      prices.regularPriceEntireSauna = priceList.sauna_1hour
      prices.memberPriceEntireSauna = priceList.sauna_1hour_member;
      break;
    case 2: 
      prices.regularPricePerSeat = priceList.seat_2hour
      prices.memberPricePerSeat = priceList.seat_2hour_member
      prices.regularPriceEntireSauna = priceList.sauna_2hour
      prices.memberPriceEntireSauna = priceList.sauna_2hour_member;
      break;
    case 3: 
      prices.regularPricePerSeat = priceList.seat_3hour
      prices.memberPricePerSeat = priceList.seat_3hour_member
      prices.regularPriceEntireSauna = priceList.sauna_3hour
      prices.memberPriceEntireSauna = priceList.sauna_3hour_member;
      break;
  }
  const [order, setOrder] = useState({
    selectedSeats: 1,
    slotId: selectedSlot.id, 
    phone: '0706920705',
    email: 'frej.andreassen@gmail.com',
    isMember: false,
    paymentMethod: '',
    couponId: 0, 
    couponCode: '',
    totalPrice: prices.regularPricePerSeat,
    userCards: []
  });

  const validateOrder = (step) => {
    let schemaToValidate;
    switch (step) {
      case 'seats':
        schemaToValidate = orderSchema.pick({ selectedSeats: true, totalPrice: true });
        break;
      case 'contact':
        schemaToValidate = orderSchema.pick({ selectedSeats: true, phone: true, email: true });
        break;
      case 'payment':
        schemaToValidate = orderSchema.pick({ 
          selectedSeats: true, 
          phone: true, 
          email: true, 
          paymentMethod: true,
          couponId: true,
          couponCode: true
        });
        break;
      default:
        schemaToValidate = orderSchema;
    }

    try {
      schemaToValidate.parse(order);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors = {};
        error.errors.forEach((err) => {
          newErrors[err.path[0]] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };


  const handlePreviousStep = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  const formatDateTime = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('sv-SE', options);
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  };

  const formatSeats = (number) => {
    if (number === 10) {
      return `${number} platser - Hela bastun`;
    }
    return number === 1 ? '1 plats' : `${number} platser`;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'seats':
        return <Seats 
          order={order}
          setOrder={setOrder}
          selectedSlot={selectedSlot}
          priceList={prices}
          formatSeats={formatSeats}
          setCurrentStep={setCurrentStep}
          validateOrder={validateOrder}
        />;
      case 'contact':
        return <Contact 
          order={order}
          setOrder={setOrder}
          errors={errors}
          setCurrentStep={setCurrentStep}
          validateOrder={validateOrder}
        />;
      case 'payment':
        return <Payment 
          order={order}
          setOrder={setOrder}
          errors={errors}
          setErrors={setErrors}
          priceList={prices}
          formatSeats={formatSeats}
          setCurrentStep={setCurrentStep}
          validateOrder={validateOrder}
        />;
      case 'confirmation':
        return <Confirmation 
          order={order} 
        />;
      case 'error':
        return <ErrorComponent errors={errors} setCurrentStep={setCurrentStep}/>
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Vald tid</h3>
        <p className="text-xl font-semibold text-indigo-600">
          {formatDateTime(selectedSlot.start_time)}
        </p>
        <p className="text-md text-gray-600">
          {formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)}
        </p>
        <p className="text-sm text-gray-500">{selectedSlot.description}</p>
      </div>

      <div>
        <div className="mt-4">{renderStepContent()}</div>
      </div>

      {(currentStep === 'contact' || currentStep === 'payment') && (
        <button
          type="button"
          onClick={handlePreviousStep}
          className="mt-2 text-sm text-indigo-600 hover:text-indigo-500"
        >
          ← Tillbaka
        </button>
      )}
      {(currentStep === 'seats' || currentStep === 'contact' || currentStep === 'payment') && (
        <div className="flex justify-between items-center pt-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex-1 flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step.id === currentStep ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {index + 1}
              </div>
              <span className={`text-xs mt-1 text-center ${
                step.id === currentStep ? 'text-indigo-600' : 'text-gray-400'
              }`}>
                {step.name}
              </span>
            </div>
          ))}
        </div>
      )}
      <pre>{JSON.stringify(order,0,2)}</pre>
      <pre>{JSON.stringify(errors,0,2)}</pre>
    </div>
  );
};

export default Checkout;