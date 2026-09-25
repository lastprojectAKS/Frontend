import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { listFavouriteMovieIds, addFavourite, removeFavourite } from "../services/favouriteService";

const FavouritesContext = createContext(null);

// One shared set of favourited movie ids for the whole app, rather than each
// MovieCard fetching its own — keeps every card showing the same movie in
// sync (Home's grid and the Movies page can both render it in one session)
// and makes toggling instant everywhere without a re-fetch.
export function FavouritesProvider({ children }) {
  const { isLoggedIn, user } = useAuth();
  const [favouriteIds, setFavouriteIds] = useState(new Set());

  useEffect(() => {
    if (!isLoggedIn) {
      setFavouriteIds(new Set());
      return;
    }
    let cancelled = false;
    listFavouriteMovieIds().then((ids) => {
      if (!cancelled) setFavouriteIds(new Set(ids));
    });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, user?.id]);

  const isFavourite = useCallback((movieId) => favouriteIds.has(movieId), [favouriteIds]);

  const toggleFavourite = useCallback(
    async (movieId) => {
      if (!isLoggedIn) return { success: false, requiresLogin: true };

      const wasFavourite = favouriteIds.has(movieId);
      setFavouriteIds((prev) => {
        const next = new Set(prev);
        if (wasFavourite) next.delete(movieId);
        else next.add(movieId);
        return next;
      });

      try {
        if (wasFavourite) await removeFavourite(movieId);
        else await addFavourite(movieId);
        return { success: true };
      } catch (err) {
        // Roll back the optimistic update on failure.
        setFavouriteIds((prev) => {
          const next = new Set(prev);
          if (wasFavourite) next.add(movieId);
          else next.delete(movieId);
          return next;
        });
        return { success: false, error: err.message };
      }
    },
    [isLoggedIn, favouriteIds]
  );

  return <FavouritesContext.Provider value={{ isFavourite, toggleFavourite }}>{children}</FavouritesContext.Provider>;
}

export function useFavourites() {
  const ctx = useContext(FavouritesContext);
  if (!ctx) throw new Error("useFavourites must be used within a FavouritesProvider");
  return ctx;
}
