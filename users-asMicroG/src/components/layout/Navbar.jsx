import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { logout } from "../../store/authSlice";
import { selectCartCount, toggleDrawer } from "../../store/cartSlice";
import SearchBar from "../products/SearchBar";
import CartDrawer from "../cart/CartDrawer";

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const cartCount = useSelector(selectCartCount);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
    setUserMenuOpen(false);
  };

  return (
    <>
      <header style={{
        position: "sticky", top: 0, zIndex: "var(--z-navbar)",
        background: "rgba(232,245,233,0.9)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(46,125,50,0.1)",
        boxShadow: "0 2px 8px rgba(0,50,0,0.08)",
      }}>
        <div className="container" style={{ padding: "0 16px" }}>
          <nav style={{
            display: "flex", alignItems: "center", gap: 16,
            height: 64, position: "relative",
          }}>
            {/* Logo */}
            <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "linear-gradient(135deg, var(--primary), var(--primary-light))",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "var(--neu-raised-sm)", color: "white", fontWeight: 800, fontSize: 16,
              }}>A</div>
              <span style={{ fontWeight: 800, fontSize: "1.2rem" }} className="gradient-text hide-mobile">
                ASMICROG
              </span>
            </Link>

            {/* Search – desktop */}
            <div className="hide-mobile" style={{ flex: 1, maxWidth: 480 }}>
              <SearchBar compact />
            </div>

            {/* Nav links – desktop */}
            <div className="hide-mobile" style={{ display: "flex", gap: 4 }}>
              {[
                { label: "Products", to: "/products" },
                { label: "Deals", to: "/products?on_sale=true" },
              ].map((link) => (
                <Link key={link.to} to={link.to} className="btn-neu" style={{ padding: "8px 16px", fontSize: "0.9rem" }}>
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
              {/* Wishlist */}
              <Link to="/wishlist" className="btn-neu" style={{ padding: 10, borderRadius: "50%", fontSize: 20 }} aria-label="Wishlist">
                ♡
              </Link>

              {/* Cart */}
              <button
                className="btn-neu"
                onClick={() => dispatch(toggleDrawer())}
                aria-label={`Cart, ${cartCount} items`}
                style={{ padding: 10, borderRadius: "50%", position: "relative" }}
              >
                🛒
                {cartCount > 0 && (
                  <span className="badge badge-primary" style={{
                    position: "absolute", top: -4, right: -4,
                    minWidth: 20, height: 20, padding: "0 5px", borderRadius: "var(--r-full)",
                    fontSize: "0.7rem", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </button>

              {/* User menu */}
              <div style={{ position: "relative" }}>
                <button
                  className="btn-neu"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  style={{ padding: 10, borderRadius: "50%" }}
                  aria-label="User menu"
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }} />
                  ) : "👤"}
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      style={{
                        position: "absolute", top: "calc(100% + 8px)", right: 0,
                        background: "var(--bg-card)", borderRadius: "var(--r-lg)",
                        boxShadow: "var(--neu-raised-lg)", minWidth: 180, zIndex: "var(--z-dropdown)",
                        overflow: "hidden",
                      }}
                    >
                      {user ? (
                        <>
                          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(46,125,50,0.1)" }}>
                            <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{user.first_name || user.username}</div>
                            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{user.email}</div>
                          </div>
                          {[
                            { label: "My Orders", to: "/orders" },
                            { label: "Profile", to: "/profile" },
                            { label: "Wishlist", to: "/wishlist" },
                            { label: "Support", to: "/support" },
                          ].map((item) => (
                            <Link
                              key={item.to}
                              to={item.to}
                              onClick={() => setUserMenuOpen(false)}
                              style={{ display: "block", padding: "10px 16px", color: "var(--text-primary)", fontSize: "0.9rem", transition: "background var(--t-fast)" }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg)")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                            >
                              {item.label}
                            </Link>
                          ))}
                          <button
                            onClick={handleLogout}
                            style={{ width: "100%", textAlign: "left", padding: "10px 16px", background: "none", border: "none", cursor: "pointer", color: "var(--error)", fontSize: "0.9rem", borderTop: "1px solid rgba(46,125,50,0.1)" }}
                          >
                            Sign Out
                          </button>
                        </>
                      ) : (
                        <>
                          <Link to="/auth" onClick={() => setUserMenuOpen(false)} style={{ display: "block", padding: "12px 16px", fontWeight: 600, color: "var(--primary)" }}>
                            Sign In
                          </Link>
                          <Link to="/auth?tab=register" onClick={() => setUserMenuOpen(false)} style={{ display: "block", padding: "10px 16px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                            Create Account
                          </Link>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Hamburger – mobile */}
              <button
                className="btn-neu show-mobile"
                onClick={() => setMenuOpen(!menuOpen)}
                style={{ padding: 10, borderRadius: "var(--r-md)" }}
                aria-label="Menu"
              >
                {menuOpen ? "✕" : "☰"}
              </button>
            </div>
          </nav>

          {/* Mobile search */}
          <div className="show-mobile" style={{ paddingBottom: 12 }}>
            <SearchBar />
          </div>

          {/* Mobile nav */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: "hidden", borderTop: "1px solid rgba(46,125,50,0.1)" }}
              >
                <div style={{ padding: "12px 0", display: "flex", flexDirection: "column", gap: 4 }}>
                  {[
                    { label: "Products", to: "/products" },
                    { label: "Deals", to: "/products?on_sale=true" },
                    { label: "My Orders", to: "/orders" },
                    { label: "Profile", to: "/profile" },
                  ].map((link) => (
                    <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}
                      style={{ padding: "10px 4px", color: "var(--text-primary)", fontWeight: 500 }}>
                      {link.label}
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <CartDrawer />
    </>
  );
}
