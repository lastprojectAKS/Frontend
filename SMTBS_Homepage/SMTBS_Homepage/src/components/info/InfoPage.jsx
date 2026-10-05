import useDocumentTitle from "../../lib/useDocumentTitle";

export default function InfoPage({ title, intro, updated, children }) {
  useDocumentTitle(title);
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold text-text-primary">{title}</h1>
      {intro && <p className="mt-3 text-text-secondary">{intro}</p>}
      {updated && <p className="mt-2 text-xs text-text-muted">Last updated {updated}</p>}
      <div className="mt-10 flex flex-col gap-10 text-sm leading-relaxed text-text-secondary">{children}</div>
    </div>
  );
}

export function Section({ title, children }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-text-primary">{title}</h2>
      {children}
    </section>
  );
}
