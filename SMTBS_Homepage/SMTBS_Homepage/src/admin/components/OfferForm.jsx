import { useState } from "react";
import { Loader2 } from "lucide-react";
import Button from "../../components/ui/Button";
import { buildOfferDisplay } from "../services/offerService";

const inputClass =
  "h-11 w-full rounded-lg border border-border-strong bg-bg-secondary px-3.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent";
const labelClass = "flex flex-col gap-1.5 text-sm";
const captionClass = "font-medium text-text-secondary";
const errorClass = "text-xs text-error";

// Monday-first, matching how weekday ranges read on the public Offers page.
const DAYS = [
  { dow: 1, label: "Mon" },
  { dow: 2, label: "Tue" },
  { dow: 3, label: "Wed" },
  { dow: 4, label: "Thu" },
  { dow: 5, label: "Fri" },
  { dow: 6, label: "Sat" },
  { dow: 0, label: "Sun" },
];

function toFormState(offer) {
  return {
    title: offer?.title ?? "",
    description: offer?.description ?? "",
    code: offer?.code ?? "",
    discount_type: offer?.discount_type ?? "percent",
    discount_value: offer?.discount_value ?? "",
    days: offer?.days_of_week ?? [],
    valid_from: offer?.valid_from ?? "",
    valid_until: offer?.valid_until ?? "",
    active: offer?.active ?? true,
  };
}

export default function OfferForm({ offer, onSubmit, onCancel, submitting = false, submitLabel = "Save offer" }) {
  const [form, setForm] = useState(() => toFormState(offer));
  const [errors, setErrors] = useState({});

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: null }));
  }

  function toggleDay(dow) {
    const next = form.days.includes(dow) ? form.days.filter((d) => d !== dow) : [...form.days, dow];
    update("days", next);
  }

  function validate() {
    const next = {};
    const value = Number(form.discount_value);
    if (!form.title.trim()) next.title = "Title is required.";
    if (!form.code.trim()) next.code = "Promo code is required.";
    if (!form.discount_value || !(value > 0)) next.discount_value = "Enter an amount greater than 0.";
    else if (form.discount_type === "percent" && value > 100) next.discount_value = "A percentage can't exceed 100.";
    if (form.valid_from && form.valid_until && form.valid_until < form.valid_from) {
      next.valid_until = "End date can't be before the start date.";
    }
    return next;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const validation = validate();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    const fields = {
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      days_of_week: form.days.length ? [...form.days].sort((a, b) => a - b) : null,
      valid_from: form.valid_from || null,
      valid_until: form.valid_until || null,
    };

    onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      code: form.code.trim().toUpperCase(),
      active: form.active,
      ...fields,
      ...buildOfferDisplay(fields),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className={labelClass}>
        <span className={captionClass}>Title</span>
        <input
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="Student Discount"
          className={inputClass}
        />
        {errors.title && <span className={errorClass}>{errors.title}</span>}
      </label>

      <label className={labelClass}>
        <span className={captionClass}>Description</span>
        <textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          rows={3}
          placeholder="Show a valid student ID at checkout and save on any weekday screening."
          className="w-full resize-none rounded-lg border border-border-strong bg-bg-secondary px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </label>

      <label className={labelClass}>
        <span className={captionClass}>Promo code</span>
        <input
          value={form.code}
          onChange={(e) => update("code", e.target.value)}
          placeholder="STUDENT20"
          className={`${inputClass} font-mono uppercase`}
        />
        {errors.code && <span className={errorClass}>{errors.code}</span>}
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          <span className={captionClass}>Discount type</span>
          <select
            value={form.discount_type}
            onChange={(e) => update("discount_type", e.target.value)}
            className={inputClass}
          >
            <option value="percent">Percent off</option>
            <option value="fixed">Fixed amount off ($)</option>
          </select>
        </label>
        <label className={labelClass}>
          <span className={captionClass}>{form.discount_type === "percent" ? "Percent" : "Amount ($)"}</span>
          <input
            type="number"
            min="0"
            step={form.discount_type === "percent" ? "1" : "0.01"}
            value={form.discount_value}
            onChange={(e) => update("discount_value", e.target.value)}
            placeholder={form.discount_type === "percent" ? "20" : "15"}
            className={inputClass}
          />
          {errors.discount_value && <span className={errorClass}>{errors.discount_value}</span>}
        </label>
      </div>

      <fieldset className="flex flex-col gap-2 text-sm">
        <legend className={captionClass}>Valid days</legend>
        <p className="text-xs text-text-muted">Leave all unticked to allow every day.</p>
        <div className="flex flex-wrap gap-2">
          {DAYS.map(({ dow, label }) => (
            <label
              key={dow}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border-strong px-3 py-1.5 text-text-primary has-[:checked]:border-accent has-[:checked]:bg-accent/10"
            >
              <input
                type="checkbox"
                checked={form.days.includes(dow)}
                onChange={() => toggleDay(dow)}
                className="h-4 w-4 accent-accent"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          <span className={captionClass}>Valid from</span>
          <input type="date" value={form.valid_from} onChange={(e) => update("valid_from", e.target.value)} className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={captionClass}>Valid until</span>
          <input
            type="date"
            value={form.valid_until}
            onChange={(e) => update("valid_until", e.target.value)}
            className={inputClass}
          />
          {errors.valid_until && <span className={errorClass}>{errors.valid_until}</span>}
        </label>
      </div>
      <p className="-mt-2 text-xs text-text-muted">Leave dates empty for no start or end date.</p>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-text-primary">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => update("active", e.target.checked)}
          className="h-4 w-4 accent-accent"
        />
        Active (customers can apply this code)
      </label>

      <div className="mt-2 flex gap-3">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : submitLabel}
        </Button>
      </div>
    </form>
  );
}
