import { useState } from "react";
import { motion } from "framer-motion";
import { Ticket, Play } from "lucide-react";
import Rating from "../ui/Rating";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import TrailerModal from "../movies/TrailerModal";
import { formatDuration } from "../../lib/format";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 0.1 + i * 0.08, ease: "easeOut" },
  }),
};

export default function Hero({ movie }) {
  const [trailerOpen, setTrailerOpen] = useState(false);

  return (
    <section className="relative flex min-h-[92vh] items-end overflow-hidden bg-bg-primary">
      <div className="absolute inset-0">
        <img
          src={movie.poster}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-top opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/70 to-bg-primary/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg-primary via-bg-primary/40 to-transparent" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-40 sm:px-6 lg:px-8">
        <div className="max-w-xl">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
            <Badge tone="accent">Now Showing</Badge>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="mt-4 text-4xl font-extrabold leading-tight text-text-primary sm:text-5xl lg:text-6xl"
          >
            {movie.title}
          </motion.h1>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-secondary"
          >
            <Rating value={movie.rating} />
            <span aria-hidden="true">·</span>
            <span>{movie.genres.join(", ")}</span>
            <span aria-hidden="true">·</span>
            <span>{formatDuration(movie.duration)}</span>
          </motion.div>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
            className="mt-5 max-w-md text-text-secondary"
          >
            {movie.description}
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={4}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Button to={`/booking?movie=${movie.id}`} size="lg" icon={Ticket}>
              Book Tickets
            </Button>
            <Button variant="outline" size="lg" icon={Play} onClick={() => setTrailerOpen(true)}>
              Watch Trailer
            </Button>
          </motion.div>
        </div>
      </div>

      <TrailerModal movie={movie} open={trailerOpen} onClose={() => setTrailerOpen(false)} />
    </section>
  );
}
