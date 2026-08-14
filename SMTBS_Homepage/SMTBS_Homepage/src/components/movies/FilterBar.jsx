function Chip({ active, onClick, children, pill = true }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`${pill ? "rounded-full px-3.5 py-1.5 text-xs" : "rounded-lg px-4 py-2 text-sm"} font-semibold transition-colors ${
        active ? "bg-text-primary text-bg-primary" : "bg-surface text-text-secondary hover:text-text-primary"
      }`}
    >
      {children}
    </button>
  );
}

export default function FilterBar({
  genres,
  activeGenre,
  onGenreChange,
  statusOptions,
  activeStatus,
  onStatusChange,
}) {
  return (
    <div className="flex flex-col gap-3">
      {statusOptions && (
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((opt) => (
            <Chip key={opt.value} active={activeStatus === opt.value} onClick={() => onStatusChange(opt.value)} pill={false}>
              {opt.label}
            </Chip>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Chip active={activeGenre === "all"} onClick={() => onGenreChange("all")}>
          All Genres
        </Chip>
        {genres.map((genre) => (
          <Chip key={genre} active={activeGenre === genre} onClick={() => onGenreChange(genre)}>
            {genre}
          </Chip>
        ))}
      </div>
    </div>
  );
}
