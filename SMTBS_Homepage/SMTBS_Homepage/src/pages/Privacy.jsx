import InfoPage, { Section } from "../components/info/InfoPage";
import { SITE_INFO } from "../lib/siteInfo";

export default function Privacy() {
  return (
    <InfoPage
      title="Privacy Policy"
      intro={`This policy explains what personal information ${SITE_INFO.name} collects, why we collect it, and the choices you have. We handle personal information in line with the Australian Privacy Principles.`}
      updated={SITE_INFO.effectiveDate}
    >
      <Section title="1. What we collect">
        <ul className="list-disc space-y-2 pl-5">
          <li>Account details: your name, email address and, if you add it, phone number.</li>
          <li>Booking details: the movies, cinemas, showtimes, seats and amounts for your bookings.</li>
          <li>Loyalty and preferences: your points balance, favourite movies, and any release alerts you set.</li>
          <li>
            Payment status: whether a booking has been paid or refunded. We do not receive or store your full card
            details — these are handled by Stripe.
          </li>
          <li>Technical information: standard server logs, such as device type and the pages visited, used to keep the site working.</li>
        </ul>
      </Section>

      <Section title="2. How we use it">
        <p>
          We use your information to create and secure your account, process bookings and payments, issue refunds, apply
          loyalty points and promo codes, send account-related emails such as password resets, and respond to your
          questions. We also use it to keep the service reliable and to detect misuse.
        </p>
      </Section>

      <Section title="3. Who we share it with">
        <p>We share information only with the services needed to run SMTBS:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Supabase, which hosts our database and manages sign-in.</li>
          <li>Stripe, which processes payments and refunds.</li>
          <li>Google, if you choose to sign in with Google, and to load our fonts.</li>
          <li>Our website hosting provider.</li>
        </ul>
        <p>We do not sell your personal information.</p>
      </Section>

      <Section title="4. Cookies and local storage">
        <p>
          We use browser storage to keep you signed in, to remember your theme choice (light or dark), and to carry a
          promo code you chose on the Offers page through to checkout for the current session. These are essential to
          the features you use. You can clear them at any time in your browser settings, though you may need to sign in
          again.
        </p>
      </Section>

      <Section title="5. How long we keep it">
        <p>
          We keep your account information while your account is active. Booking and payment records are kept for as
          long as needed for accounting, tax and dispute purposes, even after an account is closed.
        </p>
      </Section>

      <Section title="6. Your choices">
        <p>
          You can view and update your name and phone number, and change your password, from your profile. To access a
          copy of the personal information we hold about you, correct it, or ask us to delete your account, email{" "}
          <a href={`mailto:${SITE_INFO.supportEmail}`} className="font-semibold text-accent-text hover:underline">
            {SITE_INFO.supportEmail}
          </a>
          . Some records may need to be kept where the law requires it.
        </p>
      </Section>

      <Section title="7. Security">
        <p>
          We protect your information with access controls and encrypted connections. Passwords are never stored in
          readable form. No online service is completely secure, so please use a strong, unique password and tell us
          promptly if you suspect your account has been compromised.
        </p>
      </Section>

      <Section title="8. Changes and contact">
        <p>
          We may update this policy. The date at the top of this page shows when it last changed. For privacy questions
          or complaints, contact{" "}
          <a href={`mailto:${SITE_INFO.supportEmail}`} className="font-semibold text-accent-text hover:underline">
            {SITE_INFO.supportEmail}
          </a>
          . If you're not satisfied with our response, you can contact the Office of the Australian Information
          Commissioner.
        </p>
      </Section>
    </InfoPage>
  );
}
