import { createContext, useContext, useMemo, useState, useCallback } from "react";
import { TICKET_PRICE, VIP_TICKET_PRICE, BOOKING_FEE } from "../data/showtimes";
import { isVipSeat } from "../data/seatmap";

const BookingContext = createContext(null);

export { isVipSeat };

const initialSelection = {
  movieId: null,
  cinemaId: null,
  date: null,
  time: null,
  seats: [],
};

export function BookingProvider({ children }) {
  const [selection, setSelection] = useState(initialSelection);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  const setMovie = useCallback((movieId) => {
    setSelection((prev) => ({ ...initialSelection, movieId }));
  }, []);

  const setCinema = useCallback((cinemaId) => {
    setSelection((prev) => ({ ...prev, cinemaId, date: null, time: null, seats: [] }));
  }, []);

  const setDate = useCallback((date) => {
    setSelection((prev) => ({ ...prev, date, time: null, seats: [] }));
  }, []);

  const setTime = useCallback((time) => {
    setSelection((prev) => ({ ...prev, time, seats: [] }));
  }, []);

  const toggleSeat = useCallback((seatId) => {
    setSelection((prev) => {
      const isSelected = prev.seats.includes(seatId);
      if (isSelected) {
        return { ...prev, seats: prev.seats.filter((s) => s !== seatId) };
      }
      if (prev.seats.length >= 8) return prev;
      return { ...prev, seats: [...prev.seats, seatId] };
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelection(initialSelection);
  }, []);

  const confirmBooking = useCallback((extra = {}) => {
    setConfirmedBooking((prev) => {
      const ref = `SMTBS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      return { ...extra, ref };
    });
  }, []);

  const pricing = useMemo(() => {
    const vipCount = selection.seats.filter(isVipSeat).length;
    const standardCount = selection.seats.length - vipCount;
    const vipSubtotal = vipCount * VIP_TICKET_PRICE;
    const standardSubtotal = standardCount * TICKET_PRICE;
    const subtotal = vipSubtotal + standardSubtotal;
    const fee = selection.seats.length > 0 ? BOOKING_FEE : 0;
    return {
      vipCount,
      standardCount,
      vipSubtotal,
      standardSubtotal,
      subtotal,
      fee,
      total: subtotal + fee,
    };
  }, [selection.seats]);

  const value = useMemo(
    () => ({
      selection,
      setMovie,
      setCinema,
      setDate,
      setTime,
      toggleSeat,
      clearSelection,
      pricing,
      confirmedBooking,
      confirmBooking,
    }),
    [selection, setMovie, setCinema, setDate, setTime, toggleSeat, clearSelection, pricing, confirmedBooking, confirmBooking]
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used within a BookingProvider");
  return ctx;
}
