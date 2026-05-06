export default function Spinner({ size = 40, center = false }) {
  const el = (
    <div
      className="spinner"
      style={{ width: size, height: size, borderWidth: size > 30 ? 3 : 2 }}
      role="status"
      aria-label="Loading"
    />
  );

  if (center) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "48px 0" }}>
        {el}
      </div>
    );
  }
  return el;
}
