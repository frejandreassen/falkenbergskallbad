import React, { useState } from 'react';
import { z } from 'zod';

const steps = [
  { id: 'seats', name: 'Välj platser' },
  { id: 'contact', name: 'Kontaktinformation' },
  { id: 'payment', name: 'Betalning' },
  { id: 'confirmation', name: 'Bekräftelse' },
];

const contactSchema = z.object({
  email: z.string().email('Ange en giltig e-postadress').min(1, 'E-post är obligatoriskt'),
  phone: z.string()
    .regex(/^(07[0-9]{8}|\+467[0-9]{8})$/, "Ange ditt mobilnummer enligt format 07XXXXXXXXX eller +467XXXXXXXX")
    .min(1, 'Ange telefonnummer'),
});

const Checkout = ({ availableSeats, pricePerSeat, entireSaunaPrice, selectedSlot }) => {
  const [currentStep, setCurrentStep] = useState('seats');
  const [selectedSeats, setSelectedSeats] = useState(1);
  const [contactInfo, setContactInfo] = useState({ phone: '', email: '' });
  const [errors, setErrors] = useState({});

  const totalPrice = selectedSeats === availableSeats ? entireSaunaPrice : selectedSeats * pricePerSeat;

  const handleSeatChange = (e) => {
    setSelectedSeats(Number(e.target.value));
  };

  const handleContactChange = (e) => {
    setContactInfo({ ...contactInfo, [e.target.name]: e.target.value });
  };

  const validateContactInfo = () => {
    try {
      contactSchema.parse(contactInfo);
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

  const handleNextStep = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentStep === 'contact' && !validateContactInfo()) {
      return;
    }
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
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
    if (number === availableSeats) {
      return `${number} platser - Hela bastun`;
    }
    return number === 1 ? '1 plats' : `${number} platser`;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'seats':
        return (
          <div className="space-y-4">
            <label htmlFor="seats" className="block text-sm font-medium text-gray-700">
              Antal platser
            </label>
            <select
              id="seats"
              name="seats"
              value={selectedSeats}
              onChange={handleSeatChange}
              className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            >
              {[...Array(availableSeats)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {formatSeats(i + 1)}
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-gray-500">Totalt pris: {totalPrice} kr</p>
          </div>
        );
        case 'contact':
            return (
              <div className="space-y-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Telefonnummer
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={contactInfo.phone}
                    onChange={handleContactChange}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      errors.phone ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    }`}
                  />
                  {errors.phone && <p className="mt-2 text-sm text-red-600">{errors.phone}</p>}
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    E-postadress
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={contactInfo.email}
                    onChange={handleContactChange}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    }`}
                  />
                  {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
                </div>
              </div>
            );
      case 'payment':
        return <p className="text-gray-500 h-48 bg-pink-200 rounded-lg p-10">Betalning (platshållare)</p>;
      case 'confirmation':
        return (
          <div className="space-y-4 my-10">
            <h3 className="text-2xl font-bold">Tack för din bokning!</h3>
            <p className="text-gray-600">Din bokning är bekräftad.</p>
            <p className="text-gray-600">Bokningsinformation har skickats till din e-post.</p>
            <p className="text-gray-600">Vi ser fram emot att välkomna dig!</p>
          </div>
        );
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
        <h3 className="text-lg font-medium text-gray-900">Bokningsinformation</h3>
        <div className="mt-4">{renderStepContent()}</div>
      </div>


        <>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Bokningsöversikt</h3>
            <div className="mt-2 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Bastubokning</span>
                <span className="text-sm font-medium text-gray-900">{formatSeats(selectedSeats)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-base font-medium text-gray-900">Totalt</span>
                <span className="text-base font-medium text-gray-900">{totalPrice} kr</span>
              </div>
            </div>
          </div>

          {(currentStep === 'contact' || currentStep === 'seats' || currentStep === 'payment' ) && (<button
            type="button"
            onClick={handleNextStep}
            className="w-full rounded-md border border-transparent bg-indigo-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Fortsätt
          </button>
        )}

          {(currentStep === 'contact' || currentStep === 'payment') && (
            <button
              type="button"
              onClick={handlePreviousStep}
              className="mt-2 text-sm text-indigo-600 hover:text-indigo-500"
            >
              ← Tillbaka
            </button>
          )}
        </>


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
    </div>
  );
};

export default Checkout;