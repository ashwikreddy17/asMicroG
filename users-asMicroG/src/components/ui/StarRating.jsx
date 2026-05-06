export default function StarRating({ rating = 0, max = 5, size = 16, interactive = false, onChange }) {
  const stars = Array.from({ length: max }, (_, i) => i + 1);
  return (
    <span className="stars" style={{ fontSize: size }}>
      {stars.map((s) => (
        <span
          key={s}
          className={s <= rating ? "" : "star-empty"}
          style={{ cursor: interactive ? "pointer" : "default" }}
          onClick={() => interactive && onChange?.(s)}
          role={interactive ? "button" : undefined}
          aria-label={interactive ? `Rate ${s} stars` : undefined}
        >
          ★
        </span>
      ))}
    </span>
  );
}
