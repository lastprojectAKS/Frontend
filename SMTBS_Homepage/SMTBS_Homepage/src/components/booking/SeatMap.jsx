import Seat from "./Seat";

const LEGEND = [
  { label: "Available", className: "border-border-strong bg-surface" },
  { label: "Selected", className: "border-accent bg-accent" },
  { label: "VIP", className: "border-warning/50 bg-warning/10" },
  { label: "Occupied", className: "border-border bg-bg-secondary" },
];

export default function SeatMap({ rows, selectedSeats, onToggleSeat }) {
  return (
    <div>
      <div className="mx-auto mb-8 w-full max-w-lg">
        <div className="h-2 w-full rounded-full bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
        <p className="mt-2 text-center text-xs font-semibold uppercase tracking-widest text-text-muted">Screen</p>
      </div>

      <div className="relative">
        <div className="no-scrollbar overflow-x-auto">
          <div className="mx-auto flex w-fit flex-col gap-2">
            {rows.map(({ row, seats }) => (
              <div key={row} className="flex items-center gap-2">
                <span className="w-4 shrink-0 text-center text-xs font-semibold text-text-muted">{row}</span>
                <div className="flex gap-1.5">
                  {seats.slice(0, 5).map((seat) => (
                    <Seat
                      key={seat.id}
                      seat={seat}
                      selected={selectedSeats.includes(seat.id)}
                      onToggle={() => onToggleSeat(seat.id)}
                    />
                  ))}
                </div>
                <div className="w-4 shrink-0" aria-hidden="true" />
                <div className="flex gap-1.5">
                  {seats.slice(5).map((seat) => (
                    <Seat
                      key={seat.id}
                      seat={seat}
                      selected={selectedSeats.includes(seat.id)}
                      onToggle={() => onToggleSeat(seat.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Edge fades hint that the seat map scrolls horizontally on narrow screens */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-surface to-transparent" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-surface to-transparent" aria-hidden="true" />
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2">
        {LEGEND.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs text-text-secondary">
            <span className={`h-3.5 w-3.5 rounded border ${item.className}`} aria-hidden="true" />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
