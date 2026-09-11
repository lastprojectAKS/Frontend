import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import OfferCard from "../components/offers/OfferCard";
import { listOffers } from "../services/offerService";

export default function Offers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listOffers().then((data) => {
      if (!cancelled) {
        setOffers(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-accent-text">Deals</p>
        <h1 className="text-3xl font-bold text-text-primary sm:text-4xl">Special Offers</h1>
        <p className="mt-2 text-text-secondary">Save on your next movie night with these promotions.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-text-muted" aria-hidden="true" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      )}
    </div>
  );
}
