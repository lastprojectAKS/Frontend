import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Movies from "./pages/Movies";
import MovieDetails from "./pages/MovieDetails";
import Cinemas from "./pages/Cinemas";
import CinemaDetails from "./pages/CinemaDetails";
import Offers from "./pages/Offers";
import Booking from "./pages/Booking";
import SeatSelection from "./pages/SeatSelection";
import BookingSuccess from "./pages/BookingSuccess";
import Profile from "./pages/Profile";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Help from "./pages/Help";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";

import { AdminAuthProvider } from "./admin/context/AdminAuthContext";
import ProtectedAdminRoute from "./admin/components/ProtectedAdminRoute";

// Checkout is the only customer page that pulls in the Stripe SDK — lazy
// enough that eagerly bundling it made Stripe.js load (and log its "test
// mode" warning) on every single page view, including ones with nothing to
// do with payments, like the 404 page. Splitting it out means that script
// only loads once someone actually reaches checkout.
const Checkout = lazy(() => import("./pages/Checkout"));

// The entire admin portal — including Recharts, which a customer browsing
// the main site never touches — is code-split into its own chunk. A
// customer's first load no longer pays for any of this; an admin visiting
// /admin/* pays a one-time chunk fetch instead.
const AdminLogin = lazy(() => import("./admin/pages/AdminLogin"));
const AdminResetPassword = lazy(() => import("./admin/pages/AdminResetPassword"));
const AdminDashboard = lazy(() => import("./admin/pages/Dashboard"));
const AdminMovies = lazy(() => import("./admin/pages/Movies"));
const AdminMovieDetails = lazy(() => import("./admin/pages/MovieDetails"));
const AdminCinemas = lazy(() => import("./admin/pages/Cinemas"));
const AdminOffers = lazy(() => import("./admin/pages/Offers"));
const AdminShowtimes = lazy(() => import("./admin/pages/Showtimes"));
const AdminBookings = lazy(() => import("./admin/pages/Bookings"));
const AdminBookingDetails = lazy(() => import("./admin/pages/BookingDetails"));
const AdminCustomers = lazy(() => import("./admin/pages/Customers"));
const AdminCustomerDetails = lazy(() => import("./admin/pages/CustomerDetails"));
const AdminReports = lazy(() => import("./admin/pages/Reports"));
const AdminSettings = lazy(() => import("./admin/pages/Settings"));

function AdminChunkFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary">
      <Loader2 className="h-6 w-6 animate-spin text-text-muted" aria-hidden="true" />
    </div>
  );
}

// Single AdminAuthProvider instance shared by /admin/login and every
// protected /admin/* route (they're all children of this one route). That
// matters: if login and the protected area each had their own provider,
// the state would only sync between them via the localStorage round-trip,
// and navigating right after login could race ahead of that write and
// bounce back to the login screen.
function AdminAuthGate() {
  return (
    <AdminAuthProvider>
      <Suspense fallback={<AdminChunkFallback />}>
        <Outlet />
      </Suspense>
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
        <Route
          path="/checkout"
          element={
            <Suspense
              fallback={
                <div className="flex min-h-[60vh] items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-text-muted" aria-hidden="true" />
                </div>
              }
            >
              <Checkout />
            </Suspense>
          }
        />
        <Route path="/booking/success" element={<BookingSuccess />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/help" element={<Help />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Admin portal — isolated route tree, own layout/auth, no shared
          state with the customer app beyond the design-token theme. */}
      <Route element={<AdminAuthGate />}>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/reset-password" element={<AdminResetPassword />} />

        <Route element={<ProtectedAdminRoute />}>
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/movies" element={<AdminMovies />} />
          <Route path="/admin/movies/:id" element={<AdminMovieDetails />} />
          <Route path="/admin/cinemas" element={<AdminCinemas />} />
          <Route path="/admin/offers" element={<AdminOffers />} />
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
