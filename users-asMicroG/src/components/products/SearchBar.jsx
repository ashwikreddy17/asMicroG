import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "../../hooks/useDebounce";
import { searchSuggest } from "../../services/productService";

export default function SearchBar({ placeholder = "Search products, brands…", compact = false }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounce(query, 350);
  const navigate = useNavigate();
  const ref = useRef(null);

  useEffect(() => {
    if (debounced.length < 2) { setSuggestions([]); return; }
    setLoading(true);
    searchSuggest(debounced)
      .then(({ data }) => setSuggestions(data.results || data))
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false));
  }, [debounced]);

  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) { navigate(`/search?q=${encodeURIComponent(query)}`); setOpen(false); }
  };

  const handleSelect = (slug) => {
    navigate(`/products/${slug}`);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative", width: compact ? 260 : "100%" }}>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <span style={{
            position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
            color: "var(--text-muted)", fontSize: 18,
          }}>🔍</span>
          <input
            className="input-neu"
            type="search"
            placeholder={placeholder}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => query.length >= 2 && setOpen(true)}
            style={{ paddingLeft: 42 }}
            aria-label="Search"
            aria-autocomplete="list"
            aria-expanded={open}
          />
        </div>
        <button type="submit" className="btn-neu btn-primary" style={{ borderRadius: "var(--r-md)", padding: "0 20px" }}>
          Search
        </button>
      </form>

      <AnimatePresence>
        {open && (suggestions.length > 0 || loading) && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            role="listbox"
            style={{
              position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
              background: "var(--bg-card)", borderRadius: "var(--r-lg)",
              boxShadow: "var(--neu-raised-lg)", zIndex: "var(--z-dropdown)",
              listStyle: "none", overflow: "hidden", maxHeight: 320, overflowY: "auto",
            }}
          >
            {loading && (
              <li style={{ padding: "12px 16px", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                Searching…
              </li>
            )}
            {suggestions.map((p) => (
              <li key={p.id} role="option">
                <button
                  onClick={() => handleSelect(p.slug)}
                  style={{
                    width: "100%", textAlign: "left", padding: "10px 16px",
                    background: "none", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 12,
                    transition: "background var(--t-fast)",
                    color: "var(--text-primary)", fontSize: "0.9rem",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  {p.primary_image && (
                    <img src={p.primary_image.image} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }} />
                  )}
                  <div>
                    <div style={{ fontWeight: 500 }}>{p.name}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>₹{p.effective_price}</div>
                  </div>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
