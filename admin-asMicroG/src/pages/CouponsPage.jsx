import { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

const empty = { code: "", description: "", discount_type: "percentage", value: "", min_order_amount: 0, max_uses: "", per_user_limit: 1, valid_until: "", is_active: true };

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    api.get("/coupons/admin/coupons/").then(({ data }) => setCoupons(data.results || data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/coupons/admin/coupons/${editing}/`, form);
        toast.success("Coupon updated.");
      } else {
        await api.post("/coupons/admin/coupons/", form);
        toast.success("Coupon created.");
      }
      setShowForm(false);
      setForm(empty);
      setEditing(null);
      load();
    } catch {
      toast.error("Failed to save coupon.");
    }
  };

  const deleteCoupon = async (id) => {
    if (!confirm("Delete this coupon?")) return;
    await api.delete(`/coupons/admin/coupons/${id}/`);
    setCoupons((c) => c.filter((x) => x.id !== id));
    toast.success("Coupon deleted.");
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1>Coupons</h1>
        <button className="btn-admin btn-primary-admin" onClick={() => { setForm(empty); setEditing(null); setShowForm(true); }}>+ New Coupon</button>
      </div>

      {showForm && (
        <form onSubmit={save} className="card-admin" style={{ padding: 24, marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>{editing ? "Edit Coupon" : "New Coupon"}</h3>
          <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            {[["code", "Code *"], ["description", "Description"]].map(([k, l]) => (
              <div key={k}>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>{l}</label>
                <input className="input-admin" value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} required={k === "code"} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Type</label>
              <select className="input-admin" value={form.discount_type} onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value }))}>
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat (₹)</option>
              </select>
            </div>
            {[["value", "Value *"], ["min_order_amount", "Min Order ₹"], ["max_uses", "Max Uses (blank=∞)"], ["per_user_limit", "Per User Limit"]].map(([k, l]) => (
              <div key={k}>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>{l}</label>
                <input className="input-admin" type="number" value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} required={k === "value"} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Expiry Date</label>
              <input className="input-admin" type="datetime-local" value={form.valid_until} onChange={(e) => setForm((f) => ({ ...f, valid_until: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button type="button" className="btn-admin" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn-admin btn-primary-admin">Save Coupon</button>
          </div>
        </form>
      )}

      <div className="card-admin" style={{ overflow: "hidden" }}>
        <table className="table-admin">
          <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Uses</th><th>Status</th><th>Expires</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 32 }}><div className="spinner-admin" style={{ margin: "auto" }} /></td></tr>
            ) : coupons.map((c) => (
              <tr key={c.id}>
                <td><span style={{ fontWeight: 700, color: "var(--accent)", fontFamily: "monospace" }}>{c.code}</span></td>
                <td style={{ textTransform: "capitalize", fontSize: "0.85rem" }}>{c.discount_type}</td>
                <td>{c.discount_type === "percentage" ? `${c.value}%` : `₹${c.value}`}</td>
                <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{c.uses_count}{c.max_uses ? `/${c.max_uses}` : ""}</td>
                <td><span className={`badge-admin ${c.is_active ? "badge-success" : "badge-error"}`}>{c.is_active ? "Active" : "Inactive"}</span></td>
                <td style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{c.valid_until ? new Date(c.valid_until).toLocaleDateString("en-IN") : "No expiry"}</td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn-admin" style={{ padding: "4px 10px", fontSize: "0.8rem" }} onClick={() => { setForm(c); setEditing(c.id); setShowForm(true); }}>Edit</button>
                    <button className="btn-admin btn-danger-admin" style={{ padding: "4px 10px", fontSize: "0.8rem" }} onClick={() => deleteCoupon(c.id)}>Del</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
