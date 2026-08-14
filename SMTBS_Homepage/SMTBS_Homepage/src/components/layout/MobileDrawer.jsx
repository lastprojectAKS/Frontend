import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { X, User } from "lucide-react";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/movies", label: "Movies" },
  { to: "/cinemas", label: "Cinemas" },
  { to: "/offers", label: "Offers" },
];

export default function MobileDrawer({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />

          <motion.nav
            aria-label="Mobile navigation"
            className="fixed inset-y-0 right-0 z-[95] flex w-full max-w-xs flex-col bg-bg-secondary p-6 shadow-elevated md:hidden"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div className="mb-8 flex items-center justify-between">
              <span className="text-lg font-bold text-text-primary">Menu</span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-text-secondary hover:text-text-primary"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <ul className="flex flex-col gap-1">
              {LINKS.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `block rounded-lg px-3 py-3 text-base font-semibold transition-colors ${
                        isActive ? "bg-accent/15 text-accent-text" : "text-text-secondary hover:bg-surface hover:text-text-primary"
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>

            <NavLink
              to="/profile"
              onClick={onClose}
              className="mt-auto flex items-center gap-2 rounded-lg bg-surface px-3 py-3 text-sm font-semibold text-text-primary"
            >
              <User className="h-4 w-4" aria-hidden="true" />
              My Profile
            </NavLink>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
