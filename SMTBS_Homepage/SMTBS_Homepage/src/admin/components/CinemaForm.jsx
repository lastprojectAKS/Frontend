import { useState } from "react";
import { Loader2 } from "lucide-react";
import Button from "../../components/ui/Button";

const inputClass =
  "h-11 w-full rounded-lg border border-border-strong bg-bg-secondary px-3.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent";
const labelClass = "flex flex-col gap-1.5 text-sm";
const captionClass = "font-medium text-text-secondary";

export default function CinemaForm({ cinema, onSubmit, onCancel, submitting = false, submitLabel = "Save cinema" }) {
  const [form, setForm] = useState({
    name: cinema?.name ?? "",
    location: cinema?.location ?? "",
    address: cinema?.address ?? "",
    phone: cinema?.phone ?? "",
    email: cinema?.email ?? "",
    status: cinema?.status ?? "Active",
  });
  const [errors, setErrors] = useState({});

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: null }));
  }

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = "Cinema name is required.";
    if (!form.location.trim()) next.location = "Location is required.";
    if (!form.address.trim()) next.address = "Address is required.";
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
      name: form.name.trim(),
      location: form.location.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      status: form.status,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className={labelClass}>
        <span className={captionClass}>Cinema name</span>
        <input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="SMTBS Downtown" className={inputClass} />
        {errors.name && <span className="text-xs text-error">{errors.name}</span>}
      </label>

      <label className={labelClass}>
        <span className={captionClass}>Location (short label)</span>
        <input value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="City Centre" className={inputClass} />
        {errors.location && <span className="text-xs text-error">{errors.location}</span>}
      </label>

      <label className={labelClass}>
        <span className={captionClass}>Address</span>
        <input value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="142 Market Street" className={inputClass} />
        {errors.address && <span className="text-xs text-error">{errors.address}</span>}
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          <span className={captionClass}>Phone</span>
          <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={captionClass}>Email</span>
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={inputClass} />
        </label>
      </div>

      <label className={labelClass}>
        <span className={captionClass}>Status</span>
        <select value={form.status} onChange={(e) => update("status", e.target.value)} className={inputClass}>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
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
