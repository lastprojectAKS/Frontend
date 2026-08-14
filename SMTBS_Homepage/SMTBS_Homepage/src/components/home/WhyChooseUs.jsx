import { Ticket, ShieldCheck, Star, Smartphone } from "lucide-react";
import SectionHeader from "../ui/SectionHeader";

const BENEFITS = [
  {
    icon: Ticket,
    title: "Effortless Booking",
    description: "Choose your movie, cinema and seat in just a few taps.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Checkout",
    description: "A clean, trustworthy checkout flow every time you book.",
  },
  {
    icon: Star,
    title: "Loyalty Rewards",
    description: "Earn points on every booking and redeem them for perks.",
  },
  {
    icon: Smartphone,
    title: "Built For Mobile",
    description: "A fast, native-feeling experience on any device.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Why SMTBS"
        title="A better way to book"
        description="Everything about the experience is designed to get you from browsing to your seat, fast."
        align="center"
      />

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {BENEFITS.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-6 text-center transition-colors hover:border-border-strong"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/15 text-accent">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="font-semibold text-text-primary">{title}</h3>
            <p className="text-sm text-text-secondary">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
