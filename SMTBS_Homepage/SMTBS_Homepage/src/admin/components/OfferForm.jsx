import { useState } from "react";
import { Loader2 } from "lucide-react";
import Button from "../../components/ui/Button";

const inputClass =
  "h-11 w-full rounded-lg border border-border-strong bg-bg-secondary px-3.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent";
const labelClass = "flex flex-col gap-1.5 text-sm";
const captionClass = "font-medium text-text-secondary";

function toFormState(offer) {
  return {
    title: offer?.title ?? "",
    description: offer?.description ?? "",
    discount: offer?.discount ?? "",
    validity: offer?.validity ?? "",
    code: offer?.code ?? "",
  };
}

export default function OfferForm({ offer, onSubmit, onCancel, submitting = false, submitLabel = "Save offer" }) {
  const [form, setForm] = useState(() => toFormState(offer));
  const [errors, setErrors] = useState({});

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: null }));
  }

  function validate() {
    const next = {};
    if (!form.title.trim()) next.title = "Title is required.";
    if (!form.discount.trim()) next.discount = "Discount is required, e.g. \"20% OFF\" or \"Save $15\".";
    if (!form.validity.trim()) next.validity = "Validity is required, e.g. \"Mon–Thu, all cinemas\".";
    if (!form.code.trim()) next.code = "Promo code is required.";
    return next;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const validation = validate();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      discount: form.discount.trim(),
      validity: form.validity.trim(),
      code: form.code.trim().toUpperCase(),
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
        {errors.title && <span className="text-xs text-error">{errors.title}</span>}
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          <span className={captionClass}>Discount</span>
          <input
            value={form.discount}
            onChange={(e) => update("discount", e.target.value)}
            placeholder="20% OFF"
            className={inputClass}
          />
          {errors.discount && <span className="text-xs text-error">{errors.discount}</span>}
        </label>
        <label className={labelClass}>
          <span className={captionClass}>Validity</span>
          <input
            value={form.validity}
            onChange={(e) => update("validity", e.target.value)}
            placeholder="Mon–Thu, all cinemas"
            className={inputClass}
          />
          {errors.validity && <span className="text-xs text-error">{errors.validity}</span>}
        </label>
      </div>

      <label className={labelClass}>
        <span className={captionClass}>Promo code</span>
        <input
          value={form.code}
          onChange={(e) => update("code", e.target.value)}
          placeholder="STUDENT20"
          className={`${inputClass} font-mono uppercase`}
        />
        {errors.code && <span className="text-xs text-error">{errors.code}</span>}
        <span className="text-xs text-text-muted">
          Display-only for now — codes aren't yet validated or applied at checkout.
        </span>
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
