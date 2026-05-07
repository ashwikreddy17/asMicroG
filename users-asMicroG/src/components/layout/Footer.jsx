import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer style={{
      background: "var(--primary-dark)",
      color: "#c8e6c9",
      marginTop: 64,
    }}>
      <div className="container" style={{ padding: "48px 16px 24px" }}>
        <div style={{ display: "grid", gap: 32, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: 32 }}>
          {/* Brand */}
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.4rem", color: "#fff", marginBottom: 12 }}>ASMICROG</div>
            <p style={{ color: "#a5d6a7", fontSize: "0.9rem", lineHeight: 1.7 }}>
              Your eco-friendly shopping destination. Sustainable products, delivered with care.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 style={{ color: "#fff", marginBottom: 12 }}>Shop</h4>
            {["All Products", "New Arrivals", "Best Sellers", "Deals & Offers"].map((l) => (
              <Link key={l} to="/products" style={{ display: "block", color: "#a5d6a7", marginBottom: 8, fontSize: "0.9rem" }}>
                {l}
              </Link>
            ))}
          </div>

          {/* Account */}
          <div>
            <h4 style={{ color: "#fff", marginBottom: 12 }}>Account</h4>
            {[
              { label: "My Orders", to: "/orders" },
              { label: "Wishlist", to: "/wishlist" },
              { label: "Profile", to: "/profile" },
              { label: "Support", to: "/support" },
            ].map((l) => (
              <Link key={l.to} to={l.to} style={{ display: "block", color: "#a5d6a7", marginBottom: 8, fontSize: "0.9rem" }}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Info */}
          <div>
            <h4 style={{ color: "#fff", marginBottom: 12 }}>Info</h4>
            <p style={{ color: "#a5d6a7", fontSize: "0.9rem" }}>📞 +91 98765 43210</p>
            <p style={{ color: "#a5d6a7", fontSize: "0.9rem", marginTop: 8 }}>✉️ support@asmicrog.com</p>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              {["📘", "📷", "🐦", "▶️"].map((icon, i) => (
                <span key={i} style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", fontSize: 16,
                }}>{icon}</span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 24, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <p style={{ fontSize: "0.85rem", color: "#a5d6a7" }}>
            © {new Date().getFullYear()} ASMICROG. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: 16 }}>
            {["Privacy Policy", "Terms of Service", "Refund Policy"].map((l) => (
              <Link key={l} to="#" style={{ color: "#a5d6a7", fontSize: "0.85rem" }}>{l}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
