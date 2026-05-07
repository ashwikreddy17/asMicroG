import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { getFeaturedProducts, getCategories, getBanners } from "../services/productService";
import ProductCard from "../components/products/ProductCard";
import Spinner from "../components/ui/Spinner";


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
    timerRef.current = setInterval(next, 3500);
    return () => clearInterval(timerRef.current);
  }, [multi, paused, next]);

  if (!banners.length) {
    return (
      <div style={{
        background: "linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 50%, var(--primary-light) 100%)",
        borderRadius: "var(--r-2xl)", padding: "64px 40px",
        textAlign: "center", color: "white", marginBottom: 48,
        boxShadow: "var(--neu-raised-lg)", position: "relative", overflow: "hidden",
      }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800, marginBottom: 16, color: "white" }}>
            Shop Sustainably.<br />Live Beautifully.
          </h1>
          <p style={{ fontSize: "1.1rem", color: "#c8e6c9", marginBottom: 32, maxWidth: 480, margin: "0 auto 32px" }}>
            Eco-friendly products for a greener future. Free shipping on orders over ₹500.
          </p>
          <Link to="/products" className="btn-neu" style={{
            background: "white", color: "var(--primary-dark)", fontWeight: 700,
            padding: "14px 36px", borderRadius: "var(--r-full)", fontSize: "1rem",
            display: "inline-flex",
          }}>
            Shop Now →
          </Link>
        </motion.div>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{
            position: "absolute", width: 120 + i * 60, height: 120 + i * 60,
            borderRadius: "50%", border: "2px solid rgba(255,255,255,0.08)",
            top: "50%", left: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none",
          }} />
        ))}
      </div>
    );
  }

  const banner = banners[idx];
  const aspectRatio = banner.aspect_ratio || "21/8";
  const objectFit = banner.object_fit || "cover";

  return (
    <div
      style={{ marginBottom: 48, borderRadius: "var(--r-2xl)", overflow: "hidden", boxShadow: "var(--neu-raised-lg)", position: "relative" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div style={{ position: "relative", aspectRatio, width: "100%", overflow: "hidden" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={banner.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.45 }}
            style={{ position: "absolute", inset: 0 }}
          >
            {banner.image
              ? <img src={banner.image} alt={banner.title} style={{ width: "100%", height: "100%", objectFit, display: "block" }} />
              : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, var(--primary-dark), var(--primary))" }} />
            }
            {/* Overlay text */}
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(90deg, rgba(0,30,0,0.6) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)",
              display: "flex", flexDirection: "column", justifyContent: "center", padding: "clamp(16px,5%,48px) clamp(20px,6%,56px)",
            }}>
              <h2 style={{ color: "white", fontSize: "clamp(1.2rem,4vw,2.5rem)", fontWeight: 800, marginBottom: 8, lineHeight: 1.2, textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
                {banner.title}
              </h2>
              {banner.subtitle && (
                <p style={{ color: "#c8e6c9", marginBottom: 20, fontSize: "clamp(0.85rem,2vw,1.05rem)", maxWidth: 420, textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
                  {banner.subtitle}
                </p>
              )}
              {banner.link && (
                <button
                  onClick={() => navigate(banner.link)}
                  style={{
                    background: "white", color: "var(--primary-dark)", alignSelf: "flex-start",
                    borderRadius: "var(--r-full)", fontWeight: 700, padding: "10px 24px",
                    border: "none", cursor: "pointer", fontSize: "0.95rem",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                  }}
                >
                  {banner.button_text || "Shop Now"} →
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Prev / Next arrows */}
        {multi && (
          <>
            <button onClick={prev} style={arrowStyle("left")}>&#8249;</button>
            <button onClick={next} style={arrowStyle("right")}>&#8250;</button>
          </>
        )}

        {/* Dot indicators */}
        {multi && (
          <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6, zIndex: 10 }}>
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                style={{
                  width: i === idx ? 24 : 8, height: 8,
                  borderRadius: 4, border: "none", cursor: "pointer",
                  background: i === idx ? "white" : "rgba(255,255,255,0.5)",
                  transition: "width 0.3s, background 0.3s",
                  padding: 0,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function arrowStyle(side) {
  return {
    position: "absolute", top: "50%", transform: "translateY(-50%)",
    [side]: 12, zIndex: 10,
    background: "rgba(0,0,0,0.35)", color: "white", border: "none",
    borderRadius: "50%", width: 40, height: 40, cursor: "pointer",
    fontSize: "1.4rem", display: "flex", alignItems: "center", justifyContent: "center",
    lineHeight: 1,
  };
}

function CategoryGrid({ categories }) {
  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title gradient-text">Shop by Category</h2>
        <p className="section-subtitle">Find what you're looking for</p>
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
          {categories.map((cat) => (
            <motion.div key={cat.id} whileHover={{ y: -4 }}>
              <Link to={`/products?category=${cat.slug}`} style={{ textDecoration: "none" }}>
                <div className="neu-raised" style={{ textAlign: "center", padding: "20px 12px", cursor: "pointer" }}>
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", marginBottom: 10 }} />
                  ) : (
                    <div style={{
                      width: 56, height: 56, borderRadius: "50%", margin: "0 auto 10px",
                      background: "linear-gradient(135deg, var(--primary), var(--primary-light))",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 24, color: "white",
                    }}>🌿</div>
                  )}
                  <p style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-primary)" }}>{cat.name}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureStrip() {
  const features = [
    { icon: "🚚", title: "Free Delivery", desc: "On orders above ₹500" },
    { icon: "♻️", title: "Eco-Friendly", desc: "100% sustainable products" },
    { icon: "🔒", title: "Secure Payment", desc: "SSL encrypted checkout" },
    { icon: "↩️", title: "Easy Returns", desc: "7-day return policy" },
  ];
  return (
    <div style={{
      display: "grid", gap: 16,
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      margin: "48px 0",
    }}>
      {features.map((f) => (
        <div key={f.title} className="neu-raised" style={{ padding: "20px", display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 32 }}>{f.icon}</span>
          <div>
            <p style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{f.title}</p>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{f.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

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
      const toArr = (d) => Array.isArray(d) ? d : (d?.results ?? []);
      setBanners(toArr(b.data));
      setCategories(toArr(c.data).slice(0, 8));
      setFeatured(toArr(f.data));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner center />;

  return (
    <main className="main-content">
      <div className="container" style={{ padding: "24px 16px" }}>
        <HeroBanner banners={banners} />
        <FeatureStrip />
      </div>

      <CategoryGrid categories={categories} />

      <section className="section">
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h2 className="section-title gradient-text">Featured Products</h2>
            <Link to="/products?is_featured=true" style={{ color: "var(--primary)", fontWeight: 600 }}>View all →</Link>
          </div>
          <p className="section-subtitle">Hand-picked for you</p>
          <div className="grid-products">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* CTA Banner — only for guests */}
      {!user && (
        <section style={{ padding: "0 0 48px" }}>
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              style={{
                background: "linear-gradient(135deg, var(--primary-dark), var(--primary))",
                borderRadius: "var(--r-2xl)", padding: "48px 32px", textAlign: "center",
                boxShadow: "var(--neu-raised-lg)", color: "white",
              }}
            >
              <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "white", marginBottom: 12 }}>
                Join 50,000+ Happy Shoppers
              </h2>
              <p style={{ color: "#c8e6c9", marginBottom: 28 }}>
                Sign up and get 10% off your first order
              </p>
              <Link to="/auth?tab=register" className="btn-neu" style={{
                background: "white", color: "var(--primary-dark)", borderRadius: "var(--r-full)",
                padding: "14px 36px", fontWeight: 700, display: "inline-flex",
              }}>
                Create Account
              </Link>
            </motion.div>
          </div>
        </section>
      )}
    </main>
  );
}
