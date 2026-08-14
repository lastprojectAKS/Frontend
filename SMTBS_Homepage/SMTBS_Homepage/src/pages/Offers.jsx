import OfferCard from "../components/offers/OfferCard";
import { offers } from "../data/offers";

export default function Offers() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-accent-text">Deals</p>
        <h1 className="text-3xl font-bold text-text-primary sm:text-4xl">Special Offers</h1>
        <p className="mt-2 text-text-secondary">Save on your next movie night with these promotions.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {offers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
      </div>
    </div>
  );
}
