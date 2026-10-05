import InfoPage, { Section } from "../components/info/InfoPage";
import { SITE_INFO } from "../lib/siteInfo";

export default function Terms() {
  return (
    <InfoPage
      title="Terms of Service"
      intro={`These terms govern your use of ${SITE_INFO.name}, including browsing, creating an account, and booking and paying for cinema tickets.`}
      updated={SITE_INFO.effectiveDate}
    >
      <Section title="1. Accounts">
        <p>
          You need an account to book tickets. You must give accurate details and keep your sign-in credentials
          confidential. You are responsible for activity on your account. Tell us promptly if you believe your
          account has been accessed without your permission.
        </p>
      </Section>

      <Section title="2. Bookings">
        <p>
          A booking reserves the seats you select once payment is complete. Each booking can include up to 8 seats.
          Showtimes, seat availability and film details are provided by the cinema and may change. If a showtime is
          cancelled by the cinema, we will cancel your booking and refund you in full.
        </p>
      </Section>

      <Section title="3. Prices and fees">
        <p>
          Prices are shown in Australian dollars before you pay. Each booking includes the booking fee shown at
          checkout. The total you see at checkout is the amount you will be charged, after any discounts or loyalty
          points you choose to apply.
        </p>
      </Section>

      <Section title="4. Payments">
        <p>
          Payments are processed by Stripe. By paying, you authorise the charge shown at checkout. We do not store
          your full card details.
        </p>
      </Section>

      <Section title="5. Cancellations and refunds">
        <p>
          You can cancel a booking online up to 2 hours before the showing. Once that cutoff has passed, online
          cancellation is not available and you should contact us. When you cancel in time, we refund the full amount
          paid to the original payment method. Refunds are processed through Stripe, and the time they take to appear
          depends on your bank or card provider.
        </p>
        <p>
          Cancelling a booking also reverses any loyalty points you earned from it and restores any points you spent on
          it, provided the earned points have not already been used on another booking.
        </p>
      </Section>

      <Section title="6. Loyalty points and promo codes">
        <p>
          Loyalty points are earned on amounts paid and can be applied at checkout. Points have no cash value and cannot
          be transferred or sold. We may change how points are earned and redeemed, or end the program, with reasonable
          notice where possible.
        </p>
        <p>
          Promo codes are subject to the conditions shown with each offer, including any valid days and dates. We may
          withdraw or change an offer at any time. Codes obtained or used in breach of these terms may be cancelled.
        </p>
      </Section>

      <Section title="7. Age ratings and cinema rules">
        <p>
          Films carry age ratings set by the classification board. Some films may require you to show proof of age at the
          cinema. Follow the cinema's instructions and house rules while on site. The cinema may refuse entry where these
          are not met, and no refund is payable in that case.
        </p>
      </Section>

      <Section title="8. Acceptable use">
        <p>
          Do not use the site to disrupt bookings, attempt to access other people's accounts or data, scrape content, or
          book tickets for resale. We may suspend accounts that breach these rules.
        </p>
      </Section>

      <Section title="9. Limitation of liability">
        <p>
          Nothing in these terms excludes any right you have under the Australian Consumer Law that cannot lawfully be
          excluded. Where permitted, our liability for a failure of the service is limited to re-supplying the service or
          refunding the amount you paid for the affected booking.
        </p>
      </Section>

      <Section title="10. Changes to these terms">
        <p>
          We may update these terms from time to time. The date at the top of this page shows when they were last
          changed. Continuing to use the site after a change means you accept the updated terms.
        </p>
      </Section>

      <Section title="11. Governing law and contact">
        <p>
          These terms are governed by the laws of New South Wales, Australia. Questions about these terms can be sent to{" "}
          <a href={`mailto:${SITE_INFO.supportEmail}`} className="font-semibold text-accent-text hover:underline">
            {SITE_INFO.supportEmail}
          </a>
          .
        </p>
      </Section>
    </InfoPage>
  );
}
