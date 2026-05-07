export default function Input({
  label,
  error,
  icon,
  className = "",
  type = "text",
  ...props
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
      {label && (
        <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        {icon && (
          <span style={{
            position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
            color: "var(--text-muted)", display: "flex", pointerEvents: "none",
          }}>
            {icon}
          </span>
        )}
        <input
          type={type}
          className={`input-neu ${className}`}
          style={{ paddingLeft: icon ? 42 : 16 }}
          {...props}
        />
      </div>
      {error && (
        <span style={{ fontSize: "0.8rem", color: "var(--error)" }}>{error}</span>
      )}
    </div>
  );
}
