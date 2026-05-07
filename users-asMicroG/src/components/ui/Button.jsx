import { motion } from "framer-motion";

export default function Button({
  children,
  variant = "neu",
  size = "md",
  loading = false,
  icon,
  fullWidth = false,
  className = "",
  disabled,
  ...props
}) {
  const sizes = {
    sm: { padding: "8px 16px", fontSize: "0.85rem", minHeight: "36px" },
    md: { padding: "12px 24px", fontSize: "0.95rem", minHeight: "44px" },
    lg: { padding: "14px 32px", fontSize: "1.05rem", minHeight: "52px" },
    icon: { padding: "10px", minHeight: "44px", minWidth: "44px" },
  };

  const variants = {
    neu: "btn-neu",
    primary: "btn-neu btn-primary",
    ghost: "",
    danger: "btn-neu",
  };

  const style = {
    ...sizes[size],
    width: fullWidth ? "100%" : undefined,
    opacity: disabled || loading ? 0.6 : 1,
    cursor: disabled || loading ? "not-allowed" : "pointer",
    ...(variant === "danger" ? { color: "var(--error)" } : {}),
  };

  return (
    <motion.button
      whileTap={!disabled && !loading ? { scale: 0.96 } : {}}
      className={`${variants[variant]} ${className}`}
      style={style}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span
          style={{
            width: 18, height: 18, border: "2px solid currentColor",
            borderTopColor: "transparent", borderRadius: "50%",
            display: "inline-block", animation: "spin 0.7s linear infinite",
          }}
        />
      ) : (
        <>
          {icon && <span style={{ display: "flex", alignItems: "center" }}>{icon}</span>}
          {children}
        </>
      )}
    </motion.button>
  );
}
