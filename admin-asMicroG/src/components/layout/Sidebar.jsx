import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { label: "Dashboard", icon: "📊", to: "/dashboard" },
  { label: "Categories", icon: "🗂", to: "/categories" },
  { label: "Products", icon: "📦", to: "/products" },
  { label: "Orders", icon: "🧾", to: "/orders" },
  { label: "Customers", icon: "👥", to: "/customers" },
  { label: "Coupons", icon: "🎟", to: "/coupons" },
  { label: "Banners", icon: "🖼", to: "/banners" },
  { label: "Support", icon: "💬", to: "/support" },
  { label: "Analytics", icon: "📈", to: "/analytics" },
];

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("admin_tokens");
    localStorage.removeItem("admin_user");
    navigate("/login");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: -240 }}
          animate={{ x: 0 }}
          exit={{ x: -240 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{
            position: "fixed", left: 0, top: 0, bottom: 0,
            width: "var(--sidebar-width)",
            background: "var(--sidebar-bg)",
            borderRight: "1px solid var(--border)",
            zIndex: 200,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
          }}
        >
          {/* Logo */}
          <div style={{ padding: "20px 16px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "linear-gradient(135deg, var(--primary-dark), var(--primary))",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: 16, color: "white",
              }}>A</div>
              <div>
                <p style={{ fontWeight: 800, fontSize: "1rem", lineHeight: 1 }}>ASMICROG</p>
                <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Admin Panel</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: "12px 8px" }}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                style={({ isActive }) => ({
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: "var(--r-md)",
                  marginBottom: 2, textDecoration: "none",
                  color: isActive ? "var(--primary)" : "var(--text-secondary)",
                  background: isActive ? "rgba(76,175,80,0.1)" : "transparent",
                  fontWeight: isActive ? 600 : 400, fontSize: "0.9rem",
                  transition: "all var(--t-base)",
                  borderLeft: isActive ? "3px solid var(--primary)" : "3px solid transparent",
                })}
                onMouseEnter={(e) => { if (!e.currentTarget.classList.contains("active")) e.currentTarget.style.background = "rgba(76,175,80,0.05)"; }}
                onMouseLeave={(e) => { if (!e.currentTarget.classList.contains("active")) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontSize: 18, lineHeight: 1 }}>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div style={{ padding: "12px 8px", borderTop: "1px solid var(--border)" }}>
            <button
              onClick={handleLogout}
              className="btn-admin"
              style={{ width: "100%", justifyContent: "flex-start", color: "var(--error)", gap: 10, background: "rgba(239,83,80,0.05)" }}
            >
              <span>🚪</span> Sign Out
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
