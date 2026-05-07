import { NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toggleDrawer, selectCartCount } from "../../store/cartSlice";

const navItems = [
  { label: "Home", icon: "🏠", to: "/" },
  { label: "Shop", icon: "🛍", to: "/products" },
  { label: "Cart", icon: "🛒", to: null, action: true },
  { label: "Wishlist", icon: "♡", to: "/wishlist" },
  { label: "Account", icon: "👤", to: "/profile" },
];

export default function BottomNav() {
  const dispatch = useDispatch();
  const cartCount = useSelector(selectCartCount);

  return (
    <nav
      style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        height: 64,
        background: "rgba(232,245,233,0.95)", backdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(46,125,50,0.12)",
        display: "flex", zIndex: "var(--z-navbar)",
        boxShadow: "0 -4px 12px rgba(0,50,0,0.08)",
      }}
      aria-label="Bottom navigation"
    >
      {navItems.map((item) => {
        const isCart = item.action;
        const content = (
          <>
            <span style={{ fontSize: 22, position: "relative", lineHeight: 1 }}>
              {item.icon}
              {isCart && cartCount > 0 && (
                <span className="badge badge-primary" style={{
                  position: "absolute", top: -6, right: -8,
                  minWidth: 18, height: 18, padding: "0 4px",
                  fontSize: "0.65rem", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </span>
            <span style={{ fontSize: "0.7rem", fontWeight: 600, marginTop: 2 }}>{item.label}</span>
          </>
        );

        if (isCart) {
          return (
            <button
              key={item.label}
              onClick={() => dispatch(toggleDrawer())}
              style={{
                flex: 1, background: "none", border: "none", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: 2, color: "var(--text-secondary)",
                minHeight: 44, padding: "4px 0",
              }}
              aria-label={`Cart, ${cartCount} items`}
            >
              {content}
            </button>
          );
        }

        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            style={({ isActive }) => ({
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: 2, textDecoration: "none",
              color: isActive ? "var(--primary)" : "var(--text-secondary)",
              minHeight: 44, padding: "4px 0",
              fontSize: isActive ? "0.72rem" : "0.7rem",
              fontWeight: isActive ? 700 : 600,
              transition: "color var(--t-fast)",
            })}
          >
            {content}
          </NavLink>
        );
      })}
    </nav>
  );
}
