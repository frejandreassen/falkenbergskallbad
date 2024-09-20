"use client";
import React, { useState, useEffect } from "react";
import { findBookingByUUID, cancelBooking } from "@/lib/actions";
import { format, isValid, addHours, isBefore } from "date-fns";
import { sv } from "date-fns/locale";
import Link from "next/link";

export const dynamic = "force-dynamic";

const formatTime = (dateTimeString) => {
  if (!dateTimeString) return "";
  const date = new Date(dateTimeString);
  return isValid(date) ? format(date, "HH:mm") : "Ogiltig tid";
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return isValid(date)
    ? format(date, "d MMMM yyyy", { locale: sv })
    : "Ogiltigt datum";
};

export default function BookingDetailsPage({ params }) {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const { uuid } = params;

  const fetchBookingDetails = async () => {
    try {
      const details = await findBookingByUUID(uuid);
      setBookingDetails(details);
    } catch (error) {
      console.error("Error fetching booking details:", error);
      setError(
        "Det gick inte att hämta bokningsdetaljerna. Vänligen kontrollera länken.",
      );
    }
  };

  useEffect(() => {
    fetchBookingDetails();
  }, [uuid]);

  const handleCancellation = async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await cancelBooking(bookingDetails.id);
      if (result.success) {
        await fetchBookingDetails(); // Refetch booking details after successful cancellation
      } else {
        setError(result.message || "Failed to cancel booking");
      }
    } catch (error) {
      setError("An error occurred while cancelling the booking.");
    } finally {
      setIsLoading(false);
    }
  };

  const isCancellationAllowed = () => {
    if (!bookingDetails || !bookingDetails.slot.start_time) return false;
    const startTime = new Date(bookingDetails.slot.start_time);
    const now = new Date();
    return isBefore(addHours(now, 24), startTime);
  };

  if (error) {
    return (
      <div className="bg-white py-24 px-4 max-w-5xl mx-auto">
        <h1 className="font-bodoni-moda text-3xl mb-10">Fel</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!bookingDetails) {
    return (
      <div className="bg-white py-24 px-4 max-w-5xl mx-auto">
        <h1 className="font-bodoni-moda text-3xl mb-10">Laddar...</h1>
      </div>
    );
  }

  if (bookingDetails.status === "cancelled") {
    return (
      <div className="bg-white py-24 px-4 max-w-2xl mx-auto">
        <h1 className="font-bodoni-moda text-3xl mb-12">Avbokning lyckades!</h1>
        <p className="mb-6">Denna bokning är avbokad och gäller inte längre.</p>
        {bookingDetails.transaction && (
          <div className="mb-6">
            <p className="mb-2">
              Vi har skickat en återbetalning på{" "}
              {bookingDetails.transaction.amount} kr till dig via Swish.
            </p>
          </div>
        )}
        <Link
          href="/boka"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Boka en ny tid
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white py-24 px-4 max-w-2xl mx-auto">
      <h1 className="font-bodoni-moda text-3xl mb-12">Bokningsdetaljer</h1>
      <div className="space-y-6">
        <div className="space-y-2">
          <p>
            <strong>Boknings-ID:</strong> {bookingDetails.id}
          </p>
          <p>
            <strong>Status:</strong> Aktiv
          </p>
          <p>
            <strong>Datum:</strong> {formatDate(bookingDetails.slot.date)}
          </p>
          <p>
            <strong>Tid:</strong> {formatTime(bookingDetails.slot.start_time)} -{" "}
            {formatTime(bookingDetails.slot.end_time)}
          </p>
          <p>
            <strong>Antal platser:</strong> {bookingDetails.booked_seats}
          </p>
          <p>
            <strong>Dörrkod:</strong> {bookingDetails.door_code}
          </p>
        </div>

        <div className="space-y-2 pt-8">
          <h2 className="font-bodoni-moda text-2xl mb-4">
            Användarinformation
          </h2>
          <p>
            <strong>Namn:</strong> {bookingDetails.user.first_name}{" "}
            {bookingDetails.user.last_name}
          </p>
          <p>
            <strong>E-post:</strong> {bookingDetails.user.email}
          </p>
        </div>

        {bookingDetails.transaction && (
          <div className="space-y-2 pt-8">
            <h2 className="font-bodoni-moda text-2xl mb-4">Kvitto</h2>
            <p>
              <strong>Belopp:</strong> {bookingDetails.transaction.amount} kr
            </p>
            <p>
              <strong>Varav moms:</strong> 0 kr
            </p>
            <p>
              <strong>Betalningsmetod:</strong> Swish
            </p>
            <p>
              <strong>Meddelande:</strong> {bookingDetails.transaction.message}
            </p>
            <p>
              <strong>Betaldatum:</strong>{" "}
              {formatDate(bookingDetails.transaction.datePaid)}{" "}
              {formatTime(bookingDetails.transaction.datePaid)}
            </p>
          </div>
        )}

        {bookingDetails.coupon && (
          <div className="space-y-2 pt-8">
            <h2 className="font-bodoni-moda text-2xl mb-4">
              Kuponginformation
            </h2>
            <p>
              <strong>Typ:</strong> {bookingDetails.coupon.type}
            </p>
            <p>
              <strong>Utgångsdatum:</strong>{" "}
              {formatDate(bookingDetails.coupon.expiry_date)}
            </p>
            {bookingDetails.coupon.remaining_uses < 30 && (
              <p>
                <strong>Återstående användningar:</strong>{" "}
                {bookingDetails.coupon.remaining_uses}
              </p>
            )}
          </div>
        )}

        {error && <p className="text-red-500">{error}</p>}
        {isCancellationAllowed() ? (
          <button
            onClick={handleCancellation}
            disabled={isLoading}
            className="mt-6 text-gray-500 hover:text-gray-700 underline focus:outline-none disabled:text-gray-300 disabled:no-underline"
          >
            {isLoading ? "Avbokar..." : "Avboka besök"}
          </button>
        ) : (
          <p className="mt-6 text-gray-500">
            Avbokning är inte möjlig mindre än 24 timmar före bokad tid.
          </p>
        )}
      </div>
    </div>
  );
}
