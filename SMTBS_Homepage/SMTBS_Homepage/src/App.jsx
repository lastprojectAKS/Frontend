import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Movies from "./pages/Movies";
import MovieDetails from "./pages/MovieDetails";
import Cinemas from "./pages/Cinemas";
import CinemaDetails from "./pages/CinemaDetails";
import Offers from "./pages/Offers";
import Booking from "./pages/Booking";
import SeatSelection from "./pages/SeatSelection";
import Checkout from "./pages/Checkout";
import BookingSuccess from "./pages/BookingSuccess";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

import { AdminAuthProvider } from "./admin/context/AdminAuthContext";
import ProtectedAdminRoute from "./admin/components/ProtectedAdminRoute";
import AdminLogin from "./admin/pages/AdminLogin";
import AdminDashboard from "./admin/pages/Dashboard";
import AdminMovies from "./admin/pages/Movies";
import AdminMovieDetails from "./admin/pages/MovieDetails";
import AdminCinemas from "./admin/pages/Cinemas";
import AdminShowtimes from "./admin/pages/Showtimes";
import AdminBookings from "./admin/pages/Bookings";
import AdminBookingDetails from "./admin/pages/BookingDetails";
import AdminCustomers from "./admin/pages/Customers";
import AdminCustomerDetails from "./admin/pages/CustomerDetails";
import AdminReports from "./admin/pages/Reports";
import AdminSettings from "./admin/pages/Settings";

// Single AdminAuthProvider instance shared by /admin/login and every
// protected /admin/* route (they're all children of this one route). That
// matters: if login and the protected area each had their own provider,
// the state would only sync between them via the localStorage round-trip,
// and navigating right after login could race ahead of that write and
// bounce back to the login screen.
function AdminAuthGate() {
  return (
    <AdminAuthProvider>
      <Outlet />
    </AdminAuthProvider>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Customer-facing app — unchanged */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/movies/:id" element={<MovieDetails />} />
        <Route path="/cinemas" element={<Cinemas />} />
        <Route path="/cinemas/:id" element={<CinemaDetails />} />
        <Route path="/offers" element={<Offers />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/booking/seats" element={<SeatSelection />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/booking/success" element={<BookingSuccess />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Admin portal — isolated route tree, own layout/auth, no shared
          state with the customer app beyond the design-token theme. */}
      <Route element={<AdminAuthGate />}>
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route element={<ProtectedAdminRoute />}>
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/movies" element={<AdminMovies />} />
          <Route path="/admin/movies/:id" element={<AdminMovieDetails />} />
          <Route path="/admin/cinemas" element={<AdminCinemas />} />
          <Route path="/admin/showtimes" element={<AdminShowtimes />} />
          <Route path="/admin/bookings" element={<AdminBookings />} />
          <Route path="/admin/bookings/:id" element={<AdminBookingDetails />} />
          <Route path="/admin/customers" element={<AdminCustomers />} />
          <Route path="/admin/customers/:id" element={<AdminCustomerDetails />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
      </Route>
    </Routes>
  );
}
