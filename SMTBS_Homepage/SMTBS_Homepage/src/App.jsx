import { Routes, Route } from "react-router-dom";
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

export default function App() {
  return (
    <Routes>
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
    </Routes>
  );
}
