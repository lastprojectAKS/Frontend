import { createContext, useContext, useMemo, useState, useCallback } from "react";
import { BOOKING_FEE } from "../data/showtimes";

const BookingContext = createContext(null);

const initialSelection = {
  movieId: null,
  cinemaId: null,
  date: null,
  time: null,
  showtimeId: null,
  screenId: null,
  seats: [],
};

export function BookingProvider({ children }) {
  const [selection, setSelection] = useState(initialSelection);
  // Real per-seat category/price, populated once the seat map loads —
  // pricing below is derived from this instead of a flat rate, since real
  // seats now vary in price by screen and category.
  const [seatDetails, setSeatDetails] = useState({});
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  const setMovie = useCallback((movieId) => {
    setSelection(() => ({ ...initialSelection, movieId }));
    setSeatDetails({});
  }, []);

  const setCinema = useCallback((cinemaId) => {
    setSelection((prev) => ({ ...prev, cinemaId, date: null, time: null, showtimeId: null, screenId: null, seats: [] }));
    setSeatDetails({});
  }, []);

  const setDate = useCallback((date) => {
    setSelection((prev) => ({ ...prev, date, time: null, showtimeId: null, screenId: null, seats: [] }));
    setSeatDetails({});
  }, []);

  // Time selection now also carries the real showtime/screen id — needed
  // to fetch the real seat map and to call book_seats() at checkout.
  const setTime = useCallback((time, showtimeId, screenId) => {
    setSelection((prev) => ({ ...prev, time, showtimeId, screenId, seats: [] }));
    setSeatDetails({});
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
    setSeatDetails({});
  }, []);

  const confirmBooking = useCallback((booking) => {
    setConfirmedBooking(booking);
  }, []);

  const pricing = useMemo(() => {
    const byCategory = {};
    let subtotal = 0;
    selection.seats.forEach((seatId) => {
      const detail = seatDetails[seatId];
      if (!detail) return;
      if (!byCategory[detail.category]) byCategory[detail.category] = { count: 0, subtotal: 0 };
      byCategory[detail.category].count += 1;
      byCategory[detail.category].subtotal += detail.price;
      subtotal += detail.price;
    });
    const fee = selection.seats.length > 0 ? BOOKING_FEE : 0;
    return { byCategory, subtotal, fee, total: subtotal + fee };
  }, [selection.seats, seatDetails]);

  const value = useMemo(
    () => ({
      selection,
      setMovie,
      setCinema,
      setDate,
      setTime,
      toggleSeat,
      clearSelection,
      seatDetails,
      setSeatDetails,
      pricing,
      confirmedBooking,
      confirmBooking,
    }),
    [selection, setMovie, setCinema, setDate, setTime, toggleSeat, clearSelection, seatDetails, pricing, confirmedBooking, confirmBooking]
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used within a BookingProvider");
  return ctx;
}
