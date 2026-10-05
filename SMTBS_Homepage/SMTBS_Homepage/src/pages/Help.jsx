import InfoPage, { Section } from "../components/info/InfoPage";

const FAQS = [
  {
    q: "How do I book tickets?",
    a: "Choose a movie, pick a cinema, date and showtime, select your seats, then continue to checkout. You'll receive a booking code on the confirmation page, and the booking is also saved to your profile.",
  },
  {
    q: "Can I cancel my booking?",
    a: "Yes. Cancel from your profile up to 2 hours before the showing. After that the booking can't be cancelled online — contact us if you have an urgent problem.",
  },
  {
    q: "How do refunds work?",
    a: "A cancelled paid booking is refunded to the card it was paid with. Most banks show the refund within 5–10 business days, though the exact timing depends on your bank.",
  },
  {
    q: "What happens if a cinema cancels my showtime?",
    a: "We cancel the booking and refund the full amount to your original payment method. Your loyalty points for that booking are reversed as well.",
  },
  {
    q: "How do I use a promo code?",
    a: "Enter the code in the Promo Code box at checkout and select Apply. Codes have their own validity days and dates, which are shown on the Offers page. One code can be used per booking, and it can be combined with loyalty points.",
  },
  {
    q: "How do loyalty points work?",
    a: "You earn 1 point for every dollar you pay. 100 points are worth $1 and can be applied at checkout. Points you earn from a booking are reversed if that booking is cancelled.",
  },
  {
    q: "How do I get into the cinema?",
    a: "Show your booking code or the QR code on the confirmation page, or print the ticket from there. Some films have age restrictions and you may need to show photo ID at the cinema.",
  },
  {
    q: "Is my payment secure?",
    a: "Payments are processed by Stripe. Your card details are entered into Stripe's secure payment form and are never stored on our servers.",
  },
  {
    q: "I can't sign in or reset my password.",
    a: "Use 'Forgot password' on the sign-in screen to receive a reset link by email. If you still can't get in, contact us and include the email address on your account.",
  },
];

export default function Help() {
  return (
    <InfoPage
      title="Help Center"
      intro="Answers to the questions we hear most often. If you can't find what you need, contact our support team."
    >
      <Section title="Frequently asked questions">
        <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-surface">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group px-5 py-4">
              <summary className="cursor-pointer list-none font-semibold text-text-primary marker:hidden">
                <span className="flex items-center justify-between gap-4">
                  {q}
                  <span aria-hidden="true" className="text-text-muted transition-transform group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-3">{a}</p>
            </details>
          ))}
        </div>
      </Section>

      <Section title="Still need help?">
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
          <p>
            Email{" "}
            <a href="mailto:zainnisar457@gmail.com" className="font-semibold text-accent-text hover:underline">
              zainnisar457@gmail.com
            </a>{" "}
            or call{" "}
            <a href="tel:+61424230419" className="font-semibold text-accent-text hover:underline">
              0424 230 419
            </a>
            .
          </p>
          <p>Include your booking code if your question is about a booking.</p>
        </div>
      </Section>
    </InfoPage>
  );
}
