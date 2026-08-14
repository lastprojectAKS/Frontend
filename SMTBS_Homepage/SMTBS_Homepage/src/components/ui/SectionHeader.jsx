import Button from "./Button";

export default function SectionHeader({ eyebrow, title, description, actionLabel, actionTo, align = "left" }) {
  const isCenter = align === "center";

  return (
    <div
      className={`flex flex-col gap-3 ${isCenter ? "items-center text-center mx-auto max-w-2xl" : "sm:flex-row sm:items-end sm:justify-between"}`}
    >
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-accent-text">{eyebrow}</p>
        )}
        <h2 className="text-2xl font-bold text-text-primary sm:text-3xl">{title}</h2>
        {description && <p className="mt-2 max-w-2xl text-text-secondary">{description}</p>}
      </div>

      {actionLabel && actionTo && !isCenter && (
        <Button to={actionTo} variant="secondary" size="sm" className="shrink-0">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
