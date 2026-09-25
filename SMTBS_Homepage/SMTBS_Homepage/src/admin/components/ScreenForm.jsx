import { useState, useEffect } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import Button from "../../components/ui/Button";
import { SCREEN_TYPES, canReduceScreenCapacity } from "../services/cinemaService";

const inputClass =
  "h-11 w-full rounded-lg border border-border-strong bg-bg-secondary px-3.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent";
const labelClass = "flex flex-col gap-1.5 text-sm";
const captionClass = "font-medium text-text-secondary";

function seatCount(seatCategories, name) {
  return seatCategories?.find((c) => c.name === name)?.count ?? 0;
}

export default function ScreenForm({ screen, onSubmit, onCancel, submitting = false, submitLabel = "Save screen" }) {
  const [form, setForm] = useState({
    name: screen?.name ?? "",
    type: screen?.type ?? SCREEN_TYPES[0],
    status: screen?.status ?? "Active",
    standard: seatCount(screen?.seatCategories, "Standard"),
    premium: seatCount(screen?.seatCategories, "Premium"),
    vip: seatCount(screen?.seatCategories, "VIP"),
  });
  const [errors, setErrors] = useState({});

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: null }));
  }

  const newCapacity = Number(form.standard || 0) + Number(form.premium || 0) + Number(form.vip || 0);

  // canReduceScreenCapacity now queries real showtimes, so it's async — this
  // effect keeps a live inline warning as the admin types, but the
  // authoritative check (avoiding any race with a stale value here) happens
  // again inside handleSubmit right before saving.
  const [capacityCheck, setCapacityCheck] = useState({ allowed: true, reason: null });
  useEffect(() => {
    if (!screen) {
      setCapacityCheck({ allowed: true, reason: null });
      return;
    }
    let cancelled = false;
    canReduceScreenCapacity(screen.id, newCapacity).then((result) => {
      if (!cancelled) setCapacityCheck(result);
    });
    return () => {
      cancelled = true;
    };
  }, [screen, newCapacity]);

  function validateStatic() {
    const next = {};
    if (!form.name.trim()) next.name = "Screen name is required.";
    if (newCapacity <= 0) next.capacity = "At least one seat is required.";
    return next;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validation = validateStatic();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    if (screen) {
      const check = await canReduceScreenCapacity(screen.id, newCapacity);
      if (!check.allowed) {
        setErrors({ capacity: check.reason });
        return;
      }
    }

    onSubmit({
      name: form.name.trim(),
      type: form.type,
      status: form.status,
      seatCategories: [
        { name: "Standard", count: Number(form.standard || 0), priceMultiplier: 1 },
        { name: "Premium", count: Number(form.premium || 0), priceMultiplier: 1.4 },
        { name: "VIP", count: Number(form.vip || 0), priceMultiplier: 1.9 },
      ].filter((c) => c.count > 0),
    });
  }

  const segments = [
    { key: "standard", label: "Standard", value: Number(form.standard || 0), color: "bg-accent" },
    { key: "premium", label: "Premium", value: Number(form.premium || 0), color: "bg-warning" },
    { key: "vip", label: "VIP", value: Number(form.vip || 0), color: "bg-success" },
  ];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className={labelClass}>
          <span className={captionClass}>Screen name</span>
          <input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Screen 1" className={inputClass} />
          {errors.name && <span className="text-xs text-error">{errors.name}</span>}
        </label>
        <label className={labelClass}>
          <span className={captionClass}>Type</span>
          <select value={form.type} onChange={(e) => update("type", e.target.value)} className={inputClass}>
            {SCREEN_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          <span className={captionClass}>Status</span>
          <select value={form.status} onChange={(e) => update("status", e.target.value)} className={inputClass}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </label>
      </div>

      <div>
        <p className={`mb-2 ${captionClass}`}>Seat categories</p>
        <div className="grid grid-cols-3 gap-4">
          <label className={labelClass}>
            <span className="text-xs text-text-muted">Standard</span>
            <input
              type="number"
              min={0}
              value={form.standard}
              onChange={(e) => update("standard", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            <span className="text-xs text-text-muted">Premium</span>
            <input
              type="number"
              min={0}
              value={form.premium}
              onChange={(e) => update("premium", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            <span className="text-xs text-text-muted">VIP</span>
            <input type="number" min={0} value={form.vip} onChange={(e) => update("vip", e.target.value)} className={inputClass} />
          </label>
        </div>

        <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-surface-hover">
          {segments
            .filter((s) => s.value > 0)
            .map((s) => (
              <div key={s.key} className={s.color} style={{ width: `${newCapacity > 0 ? (s.value / newCapacity) * 100 : 0}%` }} />
            ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
          {segments.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${s.color}`} />
              {s.label}: {s.value}
            </span>
          ))}
          <span className="ml-auto font-semibold text-text-primary">Total capacity: {newCapacity}</span>
        </div>

        {errors.capacity && (
          <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-error/10 px-3 py-2 text-xs text-error">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {errors.capacity}
          </p>
        )}
      </div>

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
