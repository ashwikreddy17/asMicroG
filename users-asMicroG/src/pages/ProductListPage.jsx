import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { getProducts, getCategories } from "../services/productService";
import ProductCard from "../components/products/ProductCard";
import Spinner from "../components/ui/Spinner";
import Button from "../components/ui/Button";

function FilterSidebar({ filters, setFilters, categories, onClose }) {
  const [localFilters, setLocalFilters] = useState(filters);

  const apply = () => { setFilters(localFilters); onClose?.(); };
  const reset = () => { const f = {}; setLocalFilters(f); setFilters(f); onClose?.(); };

  return (
    <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3>Filters</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "var(--text-muted)" }}>✕</button>
      </div>

      {/* Category */}
      <div>
        <p style={{ fontWeight: 600, marginBottom: 12, color: "var(--text-secondary)" }}>Category</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {categories.map((c) => (
            <button
              key={c.slug}
              onClick={() => setLocalFilters((f) => ({ ...f, category: f.category === c.slug ? undefined : c.slug }))}
              className="btn-neu"
              style={{
                padding: "6px 14px", fontSize: "0.82rem", borderRadius: "var(--r-full)",
                background: localFilters.category === c.slug ? "var(--primary)" : undefined,
                color: localFilters.category === c.slug ? "white" : undefined,
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <p style={{ fontWeight: 600, marginBottom: 12, color: "var(--text-secondary)" }}>Price Range</p>
        <div style={{ display: "flex", gap: 12 }}>
          {[["min_price", "Min ₹"], ["max_price", "Max ₹"]].map(([key, ph]) => (
            <input
              key={key}
              className="input-neu"
              type="number"
              placeholder={ph}
              value={localFilters[key] || ""}
              onChange={(e) => setLocalFilters((f) => ({ ...f, [key]: e.target.value || undefined }))}
              style={{ flex: 1 }}
            />
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[["in_stock", "In Stock Only"], ["on_sale", "On Sale"]].map(([key, label]) => (
          <label key={key} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <div className={localFilters[key] ? "neu-inset" : "neu-raised"} style={{
              width: 44, height: 24, borderRadius: 12, position: "relative",
              background: localFilters[key] ? "var(--primary)" : undefined,
              transition: "all var(--t-base)", cursor: "pointer",
            }}
              onClick={() => setLocalFilters((f) => ({ ...f, [key]: !f[key] }))}
            >
              <div style={{
                width: 18, height: 18, borderRadius: "50%", background: "white",
                position: "absolute", top: 3, left: localFilters[key] ? 23 : 3,
                transition: "left var(--t-base)", boxShadow: "1px 1px 4px rgba(0,0,0,0.2)",
              }} />
            </div>
            <span style={{ fontSize: "0.9rem" }}>{label}</span>
          </label>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <Button onClick={reset} fullWidth>Reset</Button>
        <Button variant="primary" onClick={apply} fullWidth>Apply</Button>
      </div>
    </div>
  );
}

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);

  const [filters, setFilters] = useState({
    category: searchParams.get("category") || undefined,
    min_price: searchParams.get("min_price") || undefined,
    max_price: searchParams.get("max_price") || undefined,
    in_stock: searchParams.get("in_stock") === "true" || undefined,
    on_sale: searchParams.get("on_sale") === "true" || undefined,
    search: searchParams.get("q") || undefined,
    ordering: searchParams.get("ordering") || "-created_at",
  });

  const load = useCallback((page = 1) => {
    setLoading(true);
    const params = { page, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined)) };
    getProducts(params)
      .then(({ data }) => {
        setProducts(data.results || data);
        setTotalPages(data.total_pages || 1);
        setCurrentPage(data.current_page || 1);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { load(1); }, [load]);
  useEffect(() => { getCategories().then(({ data }) => setCategories(Array.isArray(data) ? data : (data.results ?? []))); }, []);

  const sortOptions = [
    { label: "Newest", value: "-created_at" },
    { label: "Price: Low to High", value: "price" },
    { label: "Price: High to Low", value: "-price" },
    { label: "Name A–Z", value: "name" },
  ];

  return (
    <main className="main-content" style={{ padding: "24px 0 48px" }}>
      <div className="container">
        <div style={{ display: "flex", gap: 24 }}>
          {/* Sidebar – desktop */}
          <aside className="hide-mobile" style={{ width: 260, flexShrink: 0 }}>
            <div className="neu-raised" style={{ position: "sticky", top: 80 }}>
              <FilterSidebar
                filters={filters}
                setFilters={(f) => { setFilters((prev) => ({ ...prev, ...f })); }}
                categories={categories}
              />
            </div>
          </aside>

          {/* Main content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Toolbar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Products</h1>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{products.length} results</p>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <select
                  className="input-neu"
                  value={filters.ordering}
                  onChange={(e) => setFilters((f) => ({ ...f, ordering: e.target.value }))}
                  style={{ padding: "8px 12px", width: "auto" }}
                >
                  {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <Button onClick={() => setFilterOpen(true)} className="show-mobile">Filters</Button>
              </div>
            </div>

            {loading ? (
              <Spinner center />
            ) : products.length === 0 ? (
              <div style={{ textAlign: "center", padding: "64px 0" }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
                <h3>No products found</h3>
                <p style={{ color: "var(--text-muted)" }}>Try adjusting your filters</p>
              </div>
            ) : (
              <motion.div className="grid-products" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </motion.div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 32 }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => load(p)}
                    className="btn-neu"
                    style={{
                      width: 40, height: 40, padding: 0, borderRadius: "50%",
                      background: currentPage === p ? "var(--primary)" : undefined,
                      color: currentPage === p ? "white" : undefined,
                    }}
                  >{p}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {filterOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: "var(--z-modal)" }}>
          <div onClick={() => setFilterOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,20,0,0.4)" }} />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }}
            style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: "var(--bg-card)", borderRadius: "var(--r-xl) var(--r-xl) 0 0",
              maxHeight: "85vh", overflowY: "auto",
            }}
          >
            <FilterSidebar filters={filters} setFilters={setFilters} categories={categories} onClose={() => setFilterOpen(false)} />
          </motion.div>
        </div>
      )}
    </main>
  );
}
