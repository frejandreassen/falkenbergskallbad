import React, { useState } from "react";

const ProductSelection = ({ order, setOrder, setCurrentStep }) => {
  function getPrice(selectedProduct) {
    switch (selectedProduct) {
      case "Årskort":
        return 1000;
      case "Klippkort - 10 gånger":
        return 400;
      default:
        return 0;
    }
  }

  const handleOrderChange = (e) => {
    const selectedProduct = e.target.value;
    const totalPrice = getPrice(selectedProduct);
    setOrder({ ...order, selectedProduct, totalPrice });
  };

  const handleMembershipChange = (e) => {
    setOrder({ ...order, isMember: e.target.checked });
  };

  const handleContinue = () => {
    if (validateOrder()) {
      setCurrentStep("contact");
    }
  };

  const validateOrder = () => {
    return order.isMember && order.selectedProduct !== "";
  };

  return (
    <div className="space-y-4">
      <label
        htmlFor="product"
        className="block text-sm font-medium text-gray-700"
      >
        Välj produkt
      </label>
      <select
        id="product"
        name="product"
        value={order.selectedProduct}
        onChange={handleOrderChange}
        className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
      >
        <option value="">Välj en produkt</option>
        <option value="Årskort">Årskort</option>
        <option value="Klippkort - 10 gånger">Klippkort - 10 gånger</option>
      </select>
      <div className="flex items-center">
        <input
          id="isMember"
          name="isMember"
          type="checkbox"
          checked={order.isMember}
          onChange={handleMembershipChange}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label htmlFor="isMember" className="ml-2 block text-sm text-gray-900">
          Jag är medlem
        </label>
      </div>
      <div className="py-8">
        <h3 className="text-lg font-medium text-gray-900">Beställning</h3>
        <div className="mt-2 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Produkt</span>
            <span className="text-sm font-medium text-gray-900">
              {order.selectedProduct || "Ej vald"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Medlemskap</span>
            <span className="text-sm font-medium text-gray-900">
              {order.isMember ? "Ja" : "Nej"}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <span className="text-base font-medium text-gray-900">Totalt</span>
            <span className="text-base font-medium text-gray-900">
              {order.totalPrice} kr
            </span>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={handleContinue}
        disabled={!validateOrder()}
        className="w-full rounded-md border border-transparent bg-indigo-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        Fortsätt
      </button>
      <div className="text-xs">
        För att köpa årskort eller klippkort måste du vara medlem i föreningen.
      </div>
    </div>
  );
};

export default ProductSelection;
