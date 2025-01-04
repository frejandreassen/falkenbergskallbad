import React from 'react'

const Contact = ({ order, setOrder, errors, setCurrentStep, validateOrder }) => {
  const handleOrderChange = (e) => {
    const { name, value } = e.target;
    const finalValue = name === 'email' ? value.toLowerCase() : value;
    setOrder({ ...order, [name]: finalValue });
  };
  const handleContinue = () => {
    if (validateOrder()) {
      setCurrentStep('payment');
    }
  };


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
          value={order.phone}
          onChange={handleOrderChange}
          className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
            errors.phone
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
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
          value={order.email}
          onChange={handleOrderChange}
          className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
            errors.email
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
          }`}
        />
        {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
      </div>
      <button
        type="button"
        onClick={handleContinue}
        className="w-full rounded-md border border-transparent bg-indigo-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        Fortsätt
      </button>
    </div>
  )
}

export default Contact