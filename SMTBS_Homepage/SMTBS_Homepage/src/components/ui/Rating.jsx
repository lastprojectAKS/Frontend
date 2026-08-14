import { Star } from "lucide-react";

export default function Rating({ value, size = "md", showValue = true }) {
  const dimension = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-5 w-5" : "h-4 w-4";
  const textSize = size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm";

  return (
    <span className="inline-flex items-center gap-1" aria-label={`Rated ${value} out of 10`}>
      <Star className={`${dimension} fill-warning text-warning`} aria-hidden="true" />
      {showValue && (
        <span className={`${textSize} font-semibold text-text-primary`}>{value.toFixed(1)}</span>
      )}
    </span>
  );
}
