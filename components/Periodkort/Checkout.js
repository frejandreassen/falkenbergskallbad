"use client";
import React, { useState } from "react";
import { z } from "zod";
import { format, addYears } from "date-fns";
import Confirmation from "./CheckoutSteps/4.Confirmation";
import Payment from "./CheckoutSteps/3. Payment";
import Contact from "./CheckoutSteps/2. Contact";
import ErrorComponent from "./CheckoutSteps/ErrorComponent";
import ProductSelection from "./CheckoutSteps/1. Product";

const steps = [
  { id: "selectProduct", name: "Välj produkt" },
  { id: "contact", name: "Kontaktinformation" },
  { id: "payment", name: "Betalning" },
  // { id: 'confirmation', name: 'Bekräftelse' }
];

// Define the order schema
const orderSchema = z.object({
  phone: z
    .string()
    .regex(
      /^(07[0-9]{8}|\+467[0-9]{8})$/,
      "Ange ditt mobilnummer enligt format 07XXXXXXXXX eller +467XXXXXXXX",
    ),
  email: z.string().email("Ange en giltig e-postadress"),
  selectedProduct: z.string().min(1, "Välj en produkt"),
  totalPrice: z.number().min(0, "Totalt pris måste vara positivt"),
});

const Checkout = () => {
  const today = format(new Date(), "yyyy-MM-dd");
  const expiryDate = format(addYears(new Date(), 1), "yyyy-MM-dd");

  const [currentStep, setCurrentStep] = useState("selectProduct");
  const [errors, setErrors] = useState({});
  const [order, setOrder] = useState({
    startDate: today,
    expiryDate: expiryDate,
    phone: "",
    email: "",
    selectedProduct: "",
    totalUses: 1000,
    totalPrice: 0,
  });

  const validateOrder = () => {
    let schemaToValidate;
    switch (currentStep) {
      case "selectProduct":
        break;
      case "contact":
        schemaToValidate = orderSchema.pick({
          selectedSeats: true,
          phone: true,
          email: true,
        });
        break;
      case "payment":
        schemaToValidate = orderSchema.pick({
          selectedSeats: true,
          phone: true,
          email: true,
          paymentMethod: true,
          couponId: true,
          couponCode: true,
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
    const currentIndex = steps.findIndex((step) => step.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "selectProduct":
        return (
          <ProductSelection
            order={order}
            setOrder={setOrder}
            setCurrentStep={setCurrentStep}
          />
        );
      case "contact":
        return (
          <Contact
            order={order}
            setOrder={setOrder}
            errors={errors}
            setCurrentStep={setCurrentStep}
            validateOrder={validateOrder}
          />
        );
      case "payment":
        return (
          <Payment
            order={order}
            setOrder={setOrder}
            errors={errors}
            setErrors={setErrors}
            setCurrentStep={setCurrentStep}
            validateOrder={validateOrder}
          />
        );
      case "confirmation":
        return <Confirmation order={order} />;
      case "error":
        return (
          <ErrorComponent errors={errors} setCurrentStep={setCurrentStep} />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div></div>

      <div>
        <div className="mt-4">{renderStepContent()}</div>
      </div>

      {(currentStep === "contact" || currentStep === "payment") && (
        <button
          type="button"
          onClick={handlePreviousStep}
          className="mt-2 text-sm text-indigo-600 hover:text-indigo-500"
        >
          ← Tillbaka
        </button>
      )}
      {(currentStep === "selectProduct" ||
        currentStep === "contact" ||
        currentStep === "payment") && (
        <div className="flex justify-between items-center pt-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex-1 flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step.id === currentStep
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {index + 1}
              </div>
              <span
                className={`text-xs mt-1 text-center ${
                  step.id === currentStep ? "text-indigo-600" : "text-gray-400"
                }`}
              >
                {step.name}
              </span>
            </div>
          ))}
        </div>
      )}
      {/* <pre>{JSON.stringify(order, 0, 2)}</pre>
      <pre>{JSON.stringify(errors, 0, 2)}</pre> */}
    </div>
  );
};

export default Checkout;
