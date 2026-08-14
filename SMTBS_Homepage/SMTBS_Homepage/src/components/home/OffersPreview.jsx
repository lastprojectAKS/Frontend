import SectionHeader from "../ui/SectionHeader";
import OfferCard from "../offers/OfferCard";
import { offers } from "../../data/offers";

export default function OffersPreview() {
  return (
    <section className="border-t border-border bg-bg-secondary">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Save More"
          title="Special Offers"
          description="Deals worth planning your movie night around."
          actionLabel="View All"
          actionTo="/offers"
        />
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {offers.slice(0, 2).map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      </div>
    </section>
  );
}
