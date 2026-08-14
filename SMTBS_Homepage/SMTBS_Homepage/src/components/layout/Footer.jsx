import { Link } from "react-router-dom";
import { Clapperboard } from "lucide-react";

// lucide-react doesn't ship brand marks, so these are small local glyphs
// kept visually consistent (24x24, currentColor, 1.5 stroke) with the rest
// of the icon set used across the app.
function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 9h2V6h-2c-1.7 0-3 1.3-3 3v2H9v3h2v6h3v-6h2.2l.8-3H14V9z" />
    </svg>
  );
}

function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17" cy="7" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TwitterIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 4l7.5 9.5L4.5 20H7l5.2-5.8L16.5 20H20l-7.8-9.9L19.5 4H17l-4.8 5.4L8 4H4z" />
    </svg>
  );
}

function YoutubeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="6" width="18" height="12" rx="3" />
      <path d="M11 9.5l4 2.5-4 2.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

const NAV_COLUMNS = [
  {
    title: "Explore",
    links: [
      { label: "Movies", to: "/movies" },
      { label: "Cinemas", to: "/cinemas" },
      { label: "Offers", to: "/offers" },
      { label: "My Profile", to: "/profile" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", to: "/#" },
      { label: "Contact Us", to: "/#" },
      { label: "Terms of Service", to: "/#" },
      { label: "Privacy Policy", to: "/#" },
    ],
  },
];

const SOCIALS = [
  { label: "Facebook", icon: FacebookIcon },
  { label: "Instagram", icon: InstagramIcon },
  { label: "Twitter", icon: TwitterIcon },
  { label: "YouTube", icon: YoutubeIcon },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-bg-secondary">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Link to="/" className="flex items-center gap-2 text-lg font-extrabold text-text-primary">
              <Clapperboard className="h-6 w-6 text-accent" aria-hidden="true" />
              SMTBS
            </Link>
            <p className="mt-3 max-w-xs text-sm text-text-secondary">
              A faster, more cinematic way to find movies and book your seat.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {SOCIALS.map(({ label, icon: Icon }) => (
                <a
                  key={label}
                  href="/#"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-text-secondary transition-colors hover:text-text-primary"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {NAV_COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h3 className="mb-4 text-sm font-semibold text-text-primary">{column.title}</h3>
              <ul className="flex flex-col gap-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm text-text-secondary transition-colors hover:text-text-primary">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-xs text-text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} SMTBS. All rights reserved.</p>
          <p>Frontend demo — no real bookings or payments are processed.</p>
        </div>
      </div>
    </footer>
  );
}
