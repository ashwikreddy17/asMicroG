import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { getFeaturedProducts, getCategories, getBanners } from "../services/productService";
import ProductCard from "../components/products/ProductCard";
import Spinner from "../components/ui/Spinner";

// ── Hero Banner ───────────────────────────────────────────────────

function HeroBanner({ banners }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);
  const navigate = useNavigate();
  const multi = banners.length > 1;

  const next = useCallback(() => setIdx((i) => (i + 1) % banners.length), [banners.length]);
  const prev = useCallback(() => setIdx((i) => (i - 1 + banners.length) % banners.length), [banners.length]);

  useEffect(() => {
    if (!multi || paused) return;
    timerRef.current = setInterval(next, 4000);
    return () => clearInterval(timerRef.current);
  }, [multi, paused, next]);

  if (!banners.length) {
    return (
      <div style={{
        background: "linear-gradient(135deg, var(--primary-dark) 0%, #1b5e20 40%, var(--primary) 70%, #43a047 100%)",
        borderRadius: "var(--r-2xl)", padding: "80px 48px",
        textAlign: "center", color: "white", marginBottom: 56,
        boxShadow: "var(--shadow-xl)", position: "relative", overflow: "hidden",
      }}>
        {/* Floating 3D rings */}
        {[160, 240, 320, 400].map((size, i) => (
          <div key={i} style={{
            position: "absolute", width: size, height: size, borderRadius: "50%",
            border: `${i % 2 === 0 ? 2 : 1}px solid rgba(255,255,255,${0.06 - i * 0.01})`,
            top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none",
          }} />
        ))}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 18px", background: "rgba(255,255,255,0.15)", borderRadius: "var(--r-full)", marginBottom: 20, backdropFilter: "blur(8px)" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>🌿 Eco-Friendly Shopping</span>
          </div>
          <h1 style={{ fontSize: "clamp(2rem,5.5vw,3.8rem)", fontWeight: 900, color: "white", marginBottom: 16, lineHeight: 1.1 }}>
            Shop Sustainably.<br />
            <span style={{ color: "#a5d6a7" }}>Live Beautifully.</span>
          </h1>
          <p style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.8)", marginBottom: 36, maxWidth: 480, margin: "0 auto 36px" }}>
            Eco-friendly products for a greener future. Free shipping on orders over ₹500.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/products" style={{
              background: "white", color: "var(--primary-dark)", fontWeight: 800,
              padding: "14px 36px", borderRadius: "var(--r-full)", fontSize: "1rem",
              display: "inline-flex", alignItems: "center", gap: 8,
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            }}>
              Shop Now <span>→</span>
            </Link>
            <Link to="/products?on_sale=true" style={{
              background: "rgba(255,255,255,0.18)", color: "white", fontWeight: 700,
              padding: "14px 28px", borderRadius: "var(--r-full)", fontSize: "1rem",
              display: "inline-flex", border: "1.5px solid rgba(255,255,255,0.35)",
              backdropFilter: "blur(8px)",
            }}>
              View Deals
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const banner = banners[idx];
  const aspectRatio = banner.aspect_ratio || "21/8";
  const objectFit = banner.object_fit || "cover";

  return (
    <div
      style={{ marginBottom: 56, borderRadius: "var(--r-2xl)", overflow: "hidden", boxShadow: "var(--shadow-xl)", position: "relative" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div style={{ position: "relative", aspectRatio, width: "100%", overflow: "hidden" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={banner.id}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5 }}
            style={{ position: "absolute", inset: 0 }}
          >
            {banner.image
              ? <img src={banner.image} alt={banner.title} style={{ width: "100%", height: "100%", objectFit, display: "block" }} />
              : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, var(--primary-dark), var(--primary))" }} />
            }
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(100deg, rgba(0,30,0,0.65) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)",
              display: "flex", flexDirection: "column", justifyContent: "center",
              padding: "clamp(20px,6%,64px) clamp(24px,7%,64px)",
            }}>
              <motion.h2
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                style={{ color: "white", fontSize: "clamp(1.3rem,4vw,2.6rem)", fontWeight: 900, marginBottom: 10, lineHeight: 1.15, textShadow: "0 2px 12px rgba(0,0,0,0.3)" }}
              >
                {banner.title}
              </motion.h2>
              {banner.subtitle && (
                <motion.p
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                  style={{ color: "rgba(255,255,255,0.85)", marginBottom: 24, fontSize: "clamp(0.88rem,2vw,1.05rem)", maxWidth: 420 }}
                >
                  {banner.subtitle}
                </motion.p>
              )}
              {banner.link && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  onClick={() => navigate(banner.link)}
                  style={{
                    background: "white", color: "var(--primary-dark)", alignSelf: "flex-start",
                    borderRadius: "var(--r-full)", fontWeight: 800, padding: "12px 28px",
                    border: "none", cursor: "pointer", fontSize: "0.95rem",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                  }}
                >
                  {banner.button_text || "Shop Now"} →
                </motion.button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {multi && (
          <>
            <button onClick={prev} style={arrowBtn("left")}>‹</button>
            <button onClick={next} style={arrowBtn("right")}>›</button>
            <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6, zIndex: 10 }}>
              {banners.map((_, i) => (
                <button key={i} onClick={() => setIdx(i)} style={{
                  width: i === idx ? 28 : 8, height: 8, borderRadius: 4, border: "none",
                  background: i === idx ? "white" : "rgba(255,255,255,0.45)",
                  cursor: "pointer", padding: 0, transition: "all 0.3s",
                }} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function arrowBtn(side) {
  return {
    position: "absolute", top: "50%", transform: "translateY(-50%)",
    [side]: 14, zIndex: 10,
    background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)",
    color: "white", border: "1.5px solid rgba(255,255,255,0.3)",
    borderRadius: "50%", width: 44, height: 44, cursor: "pointer",
    fontSize: "1.6rem", display: "flex", alignItems: "center", justifyContent: "center",
    lineHeight: 1, transition: "background 0.2s",
  };
}

// ── Feature Strip ─────────────────────────────────────────────────

function FeatureStrip() {
  const features = [
    { icon: "🚚", title: "Free Delivery",   desc: "On orders above ₹500",       color: "#e8f5e9" },
    { icon: "♻️", title: "Eco-Friendly",    desc: "100% sustainable products",   color: "#e8f5e9" },
    { icon: "🔒", title: "Secure Payment",  desc: "SSL encrypted checkout",      color: "#e8f5e9" },
    { icon: "↩️", title: "Easy Returns",    desc: "7-day return policy",         color: "#e8f5e9" },
  ];
  return (
    <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: 56 }}>
      {features.map((f, i) => (
        <motion.div
          key={f.title}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.07 }}
          className="card-3d"
          style={{
            padding: "20px 18px", display: "flex", alignItems: "center", gap: 14,
            background: "white", borderRadius: "var(--r-lg)",
            boxShadow: "var(--shadow-sm)", border: "1px solid var(--border-light)",
          }}
        >
          <div style={{ width: 48, height: 48, borderRadius: "var(--r-md)", background: f.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
            {f.icon}
          </div>
          <div>
            <p style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 2, fontSize: "0.92rem" }}>{f.title}</p>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>{f.desc}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Category Grid ─────────────────────────────────────────────────

function CategoryGrid({ categories }) {
  const colors = ["#e8f5e9", "#e3f2fd", "#fff3e0", "#fce4ec", "#f3e5f5", "#e0f7fa", "#f1f8e9", "#fff8e1"];
  return (
    <section style={{ padding: "0 0 56px" }}>
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
          <h2 className="section-title gradient-text">Shop by Category</h2>
          <Link to="/products" style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>View all →</Link>
        </div>
        <p className="section-subtitle">Find exactly what you're looking for</p>
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))" }}>
          {categories.map((cat, i) => (
            <motion.div key={cat.id} whileHover={{ y: -6, scale: 1.03 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
              <Link to={`/products?category=${cat.slug}`} style={{ textDecoration: "none", display: "block" }}>
                <div style={{
                  background: "white", borderRadius: "var(--r-xl)", padding: "24px 12px",
                  textAlign: "center", boxShadow: "var(--shadow-sm)",
                  border: "1px solid var(--border-light)",
                  transition: "box-shadow 0.2s",
                }}>
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} style={{ width: 58, height: 58, borderRadius: "50%", objectFit: "cover", marginBottom: 10 }} />
                  ) : (
                    <div style={{
                      width: 58, height: 58, borderRadius: "50%", margin: "0 auto 10px",
                      background: colors[i % colors.length],
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
                    }}>🌿</div>
                  )}
                  <p style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--text-primary)", margin: 0 }}>{cat.name}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Promo Banner ──────────────────────────────────────────────────

function PromoBanner() {
  return (
    <section style={{ padding: "0 0 56px" }}>
      <div className="container">
        <div style={{
          background: "linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #388e3c 100%)",
          borderRadius: "var(--r-2xl)", padding: "48px 40px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 24,
          boxShadow: "0 8px 32px rgba(27,94,32,0.3)",
          position: "relative", overflow: "hidden",
        }}>
          {/* decorative circles */}
          {[200, 300].map((s, i) => (
            <div key={i} style={{
              position: "absolute", right: i === 0 ? -60 : -20, top: i === 0 ? -60 : "auto", bottom: i === 1 ? -60 : "auto",
              width: s, height: s, borderRadius: "50%",
              background: "rgba(255,255,255,0.05)", pointerEvents: "none",
            }} />
          ))}
          <div>
            <p style={{ color: "#a5d6a7", fontWeight: 600, marginBottom: 6, fontSize: "0.88rem" }}>Limited Time Offer</p>
            <h2 style={{ color: "white", fontSize: "clamp(1.4rem,3vw,2rem)", fontWeight: 900, margin: 0 }}>
              Get 10% off your first order
            </h2>
            <p style={{ color: "rgba(255,255,255,0.75)", marginTop: 8 }}>Use code <strong style={{ color: "#a5d6a7" }}>WELCOME10</strong> at checkout</p>
          </div>
          <Link to="/products" style={{
            background: "white", color: "var(--primary-dark)", fontWeight: 800,
            padding: "14px 32px", borderRadius: "var(--r-full)", fontSize: "1rem",
            whiteSpace: "nowrap", flexShrink: 0, boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          }}>
            Shop Now →
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────

export default function HomePage() {
  const user = useSelector((s) => s.auth.user);
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getBanners("hero").catch(() => ({ data: [] })),
      getCategories().catch(() => ({ data: [] })),
      getFeaturedProducts().catch(() => ({ data: [] })),
    ]).then(([b, c, f]) => {
      const toArr = (d) => (Array.isArray(d) ? d : d?.results ?? []);
      setBanners(toArr(b.data));
      setCategories(toArr(c.data).slice(0, 8));
      setFeatured(toArr(f.data));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner center />;

  return (
    <main className="main-content">
      {/* Hero */}
      <div className="container" style={{ padding: "28px 16px 0" }}>
        <HeroBanner banners={banners} />
        <FeatureStrip />
      </div>

      {/* Categories */}
      <CategoryGrid categories={categories} />

      {/* Featured Products */}
      <section style={{ padding: "0 0 56px" }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
            <h2 className="section-title gradient-text">Featured Products</h2>
            <Link to="/products?is_featured=true" style={{ color: "var(--primary)", fontWeight: 600, fontSize: "0.9rem" }}>View all →</Link>
          </div>
          <p className="section-subtitle">Hand-picked just for you</p>
          <div className="grid-products">
            {featured.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="card-3d"
              >
                <ProductCard product={p} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Promo / CTA */}
      {!user ? (
        <section style={{ padding: "0 0 56px" }}>
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{
                background: "linear-gradient(135deg, var(--primary-dark), var(--primary))",
                borderRadius: "var(--r-2xl)", padding: "56px 40px", textAlign: "center",
                boxShadow: "0 8px 32px rgba(27,94,32,0.3)", color: "white",
                position: "relative", overflow: "hidden",
              }}
            >
              {[200, 320].map((s, i) => (
                <div key={i} style={{ position: "absolute", width: s, height: s, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.07)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />
              ))}
              <h2 style={{ fontSize: "2rem", fontWeight: 900, color: "white", marginBottom: 12 }}>
                Join 50,000+ Happy Shoppers
              </h2>
              <p style={{ color: "rgba(255,255,255,0.8)", marginBottom: 32 }}>
                Sign up today and get 10% off your first order
              </p>
              <Link to="/auth?tab=register" style={{
                background: "white", color: "var(--primary-dark)", borderRadius: "var(--r-full)",
                padding: "14px 40px", fontWeight: 800, display: "inline-flex",
                boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
              }}>
                Create Free Account →
              </Link>
            </motion.div>
          </div>
        </section>
      ) : (
        <PromoBanner />
      )}
    </main>
  );
}
