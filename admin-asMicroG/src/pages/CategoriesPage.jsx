import { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

const empty = { name: "", description: "", parent: "", is_active: true };

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.get("/products/admin/categories/")
      .then(({ data }) => setCategories(data.results || data))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openNew = () => {
    setForm(empty);
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (c) => {
    setForm({ name: c.name, description: c.description || "", parent: c.parent || "", is_active: c.is_active });
    setEditing(c.id);
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, parent: form.parent || null };
      if (editing) {
        await api.patch(`/products/admin/categories/${editing}/`, payload);
        toast.success("Category updated.");
      } else {
        await api.post("/products/admin/categories/", payload);
        toast.success("Category created.");
      }
      setShowForm(false);
      setForm(empty);
      setEditing(null);
      load();
    } catch (err) {
      toast.error("Failed to save category.");
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (id) => {
    if (!confirm("Delete this category? Products in it will lose their category.")) return;
    try {
      await api.delete(`/products/admin/categories/${id}/`);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Category deleted.");
    } catch {
      toast.error("Failed to delete — it may have products assigned.");
    }
  };

  const topLevel = categories.filter((c) => !c.parent);
  const children = (parentId) => categories.filter((c) => c.parent === parentId);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1>Categories</h1>
        <button className="btn-admin btn-primary-admin" onClick={openNew}>+ New Category</button>
      </div>

      {showForm && (
        <form onSubmit={save} className="card-admin" style={{ padding: 24, marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>{editing ? "Edit Category" : "New Category"}</h3>
          <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Name *</label>
              <input className="input-admin" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Parent Category</label>
              <select className="input-admin" value={form.parent} onChange={(e) => setForm((f) => ({ ...f, parent: e.target.value }))}>
                <option value="">— None (top level) —</option>
                {categories.filter((c) => c.id !== editing && !c.parent).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Description</label>
              <input className="input-admin" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 20 }}>
              <input type="checkbox" id="is_active" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
              <label htmlFor="is_active" style={{ fontSize: "0.88rem", cursor: "pointer" }}>Active</label>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button type="button" className="btn-admin" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn-admin btn-primary-admin" disabled={saving}>
              {saving ? "Saving…" : "Save Category"}
            </button>
          </div>
        </form>
      )}

      <div className="card-admin" style={{ overflow: "hidden" }}>
        <table className="table-admin">
          <thead>
            <tr><th>Name</th><th>Parent</th><th>Products</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: 32 }}><div className="spinner-admin" style={{ margin: "auto" }} /></td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>No categories yet. Create one to get started.</td></tr>
            ) : topLevel.map((cat) => (
              <>
                <tr key={cat.id} style={{ background: "rgba(76,175,80,0.04)" }}>
                  <td>
                    <span style={{ fontWeight: 700, fontSize: "0.92rem" }}>{cat.name}</span>
                    {cat.description && <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>{cat.description}</p>}
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>—</td>
                  <td style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{cat.product_count ?? "—"}</td>
                  <td><span className={`badge-admin ${cat.is_active ? "badge-success" : "badge-error"}`}>{cat.is_active ? "Active" : "Inactive"}</span></td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn-admin" style={{ padding: "4px 10px", fontSize: "0.8rem" }} onClick={() => openEdit(cat)}>Edit</button>
                      <button className="btn-admin btn-danger-admin" style={{ padding: "4px 10px", fontSize: "0.8rem" }} onClick={() => deleteCategory(cat.id)}>Del</button>
                    </div>
                  </td>
                </tr>
                {children(cat.id).map((sub) => (
                  <tr key={sub.id}>
                    <td style={{ paddingLeft: 32 }}>
                      <span style={{ color: "var(--text-muted)", marginRight: 6 }}>↳</span>
                      <span style={{ fontSize: "0.88rem" }}>{sub.name}</span>
                    </td>
                    <td style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{cat.name}</td>
                    <td style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{sub.product_count ?? "—"}</td>
                    <td><span className={`badge-admin ${sub.is_active ? "badge-success" : "badge-error"}`}>{sub.is_active ? "Active" : "Inactive"}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn-admin" style={{ padding: "4px 10px", fontSize: "0.8rem" }} onClick={() => openEdit(sub)}>Edit</button>
                        <button className="btn-admin btn-danger-admin" style={{ padding: "4px 10px", fontSize: "0.8rem" }} onClick={() => deleteCategory(sub.id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
