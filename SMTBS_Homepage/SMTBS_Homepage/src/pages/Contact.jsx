import { useEffect, useState } from "react";
import { MapPin, Mail, Phone } from "lucide-react";
import InfoPage, { Section } from "../components/info/InfoPage";
import { listCinemas } from "../services/cinemaService";
import { SITE_INFO } from "../lib/siteInfo";

export default function Contact() {
  const [cinemas, setCinemas] = useState([]);

  useEffect(() => {
    let cancelled = false;
    listCinemas().then((data) => {
      if (!cancelled) setCinemas(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <InfoPage
      title="Contact Us"
      intro="Questions about a booking, a payment or your account? Email our support team and include your booking code where you can."
    >
      <Section title="Customer support">
        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={`mailto:${SITE_INFO.supportEmail}`}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 font-semibold text-text-primary transition-colors hover:border-border-strong"
          >
            <Mail className="h-4 w-4 text-accent-text" aria-hidden="true" />
            {SITE_INFO.supportEmail}
          </a>
          <a
            href={`tel:${SITE_INFO.supportPhoneHref}`}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 font-semibold text-text-primary transition-colors hover:border-border-strong"
          >
            <Phone className="h-4 w-4 text-accent-text" aria-hidden="true" />
            {SITE_INFO.supportPhone}
          </a>
        </div>
      </Section>

      {cinemas.length > 0 && (
        <Section title="Our cinemas">
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {cinemas.map((cinema) => (
              <li key={cinema.id} className="rounded-xl border border-border bg-surface p-4">
                <p className="font-semibold text-text-primary">{cinema.name}</p>
                <p className="mt-1 flex items-start gap-1.5 text-text-muted">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {cinema.location}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </InfoPage>
  );
}
