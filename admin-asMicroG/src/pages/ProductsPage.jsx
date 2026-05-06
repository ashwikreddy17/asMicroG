import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";
import toast from "react-hot-toast";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const fileRef = useRef(null);

  const load = (p = 1) => {
    setLoading(true);
    api.get("/products/admin/products/", { params: { page: p, search } })
      .then(({ data }) => {
        setProducts(data.results || data);
        setTotalPages(data.total_pages || 1);
        setPage(data.current_page || 1);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(1); }, [search]);

  const toggleActive = async (product) => {
    await api.patch(`/products/admin/products/${product.id}/`, { is_active: !product.is_active });
    setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, is_active: !p.is_active } : p));
    toast.success(`Product ${product.is_active ? "deactivated" : "activated"}.`);
  };

  const deleteProduct = async (id) => {
    if (!confirm("Delete this product?")) return;
    await api.delete(`/products/admin/products/${id}/`);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Product deleted.");
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const { data } = await api.post("/products/admin/products/csv-import/", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(`Imported ${data.created} products.`);
      if (data.errors.length) toast.error(`${data.errors.length} errors.`);
      load(1);
    } catch {
      toast.error("Import failed.");
    }
    e.target.value = "";
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <h1>Products</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <input type="file" ref={fileRef} accept=".csv" onChange={handleCSVUpload} style={{ display: "none" }} />
          <button className="btn-admin" onClick={() => fileRef.current?.click()}>📤 CSV Import</button>
          <Link to="/products/new" className="btn-admin btn-primary-admin">+ New Product</Link>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          className="input-admin"
          placeholder="Search by name, SKU, brand…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 340 }}
        />
      </div>

      <div className="card-admin" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="table-admin">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 32 }}>
                  <div className="spinner-admin" style={{ margin: "auto" }} />
                </td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>No products found.</td></tr>
              ) : products.map((p) => (
                <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <td>
                    <img
                      src={p.primary_image?.image || "/placeholder.png"}
                      alt={p.name}
                      style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover" }}
                    />
                  </td>
                  <td style={{ maxWidth: 180 }}>
                    <p style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                    {p.is_featured && <span className="badge-admin badge-success" style={{ fontSize: "0.7rem", marginTop: 2 }}>★ Featured</span>}
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{p.sku}</td>
                  <td style={{ fontSize: "0.85rem" }}>{p.category_name}</td>
                  <td>
                    <p style={{ fontWeight: 600, color: "var(--primary)" }}>₹{p.effective_price}</p>
                    {p.discount_price && <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textDecoration: "line-through" }}>₹{p.price}</p>}
                  </td>
                  <td>
                    <span className={`badge-admin ${p.stock === 0 ? "badge-error" : p.stock <= 5 ? "badge-warning" : "badge-success"}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => toggleActive(p)}
                      style={{
                        width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
                        background: p.is_active ? "var(--primary-dark)" : "rgba(255,255,255,0.1)",
                        position: "relative", transition: "background var(--t-base)",
                      }}
                    >
                      <div style={{
                        width: 16, height: 16, borderRadius: "50%", background: "white",
                        position: "absolute", top: 3, left: p.is_active ? 21 : 3,
                        transition: "left var(--t-base)",
                      }} />
                    </button>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Link to={`/products/${p.id}/edit`} className="btn-admin" style={{ padding: "4px 10px", fontSize: "0.8rem" }}>Edit</Link>
                      <button className="btn-admin btn-danger-admin" style={{ padding: "4px 10px", fontSize: "0.8rem" }} onClick={() => deleteProduct(p.id)}>Del</button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: "16px 0" }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => load(p)} className="btn-admin"
                style={{ width: 34, height: 34, padding: 0, background: page === p ? "var(--primary-dark)" : undefined, color: page === p ? "white" : undefined }}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
