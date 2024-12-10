import React from 'react'

const Seats = ({ order, setOrder, selectedSlot, formatSeats, priceList, setCurrentStep, validateOrder }) => {
  const calculateTotalPrice = (seats, isMember) => {
    if (seats === 10) {
      return isMember ? priceList.memberPriceEntireSauna : priceList.regularPriceEntireSauna;
    } else {
      const pricePerSeat = isMember ? priceList.memberPricePerSeat : priceList.regularPricePerSeat;
      return seats * pricePerSeat;
    }
  };

  const handleSeatChange = (e) => {
    const selectedSeats = Number(e.target.value);
    const totalPrice = calculateTotalPrice(selectedSeats, order.isMember);
    const paymentMethod = selectedSeats > 1 ? '' : order.paymentMethod
    setOrder({ ...order, selectedSeats, totalPrice, paymentMethod });
  };

  const handleMembershipChange = (e) => {
    const isMember = e.target.checked;
    const totalPrice = calculateTotalPrice(order.selectedSeats, isMember);
    setOrder({ ...order, isMember, totalPrice });
  };

  const handleContinue = () => {
    if (validateOrder()) {
      setCurrentStep('contact');
    }
  };

  return (
    <div className="space-y-4">
      <label htmlFor="seats" className="block text-sm font-medium text-gray-700">
        Antal platser
      </label>
      <select
        id="seats"
        name="seats"
        value={order.selectedSeats}
        onChange={handleSeatChange}
        className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
      >
        {[...Array(selectedSlot.available_seats)].map((_, i) => (
          <option key={i + 1} value={i + 1}>
            {formatSeats(i + 1)}
          </option>
        ))}
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
        <h3 className="text-lg font-medium text-gray-900">Bokningsöversikt</h3>
        <div className="mt-2 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Bastubokning</span>
            <span className="text-sm font-medium text-gray-900">{formatSeats(order.selectedSeats)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Medlemsrabatt</span>
            <span className="text-sm font-medium text-gray-900">{order.isMember ? 'Ja' : 'Nej'}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <span className="text-base font-medium text-gray-900">Totalt</span>
            <span className="text-base font-medium text-gray-900">{order.totalPrice} kr</span>
          </div>
        </div>
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

export default Seats