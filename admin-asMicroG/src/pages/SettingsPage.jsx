import { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

// ── Shipping Settings ─────────────────────────────────────────────

function ShippingPanel() {
  const [settings, setSettings] = useState({ free_shipping_threshold: 500, shipping_cost: 50, first_order_free: false });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/orders/shipping-settings/")
      .then(({ data }) => setSettings(data))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch("/orders/admin/shipping-settings/", settings);
      setSettings(data);
      toast.success("Shipping settings saved!");
    } catch {
      toast.error("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 32 }}><div className="spinner-admin" /></div>;

  return (
    <div className="card-admin" style={{ padding: 24, marginBottom: 28 }}>
      <h3 style={{ fontSize: "1rem", marginBottom: 6 }}>🚚 Shipping & Delivery</h3>
      <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 20 }}>
        Configure free shipping threshold and delivery charges for all orders.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div>
          <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
            Free Shipping Threshold (₹)
          </label>
          <input
            type="number"
            className="input-admin"
            value={settings.free_shipping_threshold}
            min={0}
            onChange={(e) => setSettings((s) => ({ ...s, free_shipping_threshold: parseFloat(e.target.value) || 0 }))}
          />
          <p style={{ fontSize: "0.73rem", color: "var(--text-muted)", marginTop: 4 }}>
            Orders above this amount get free shipping
          </p>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
            Standard Shipping Cost (₹)
          </label>
          <input
            type="number"
            className="input-admin"
            value={settings.shipping_cost}
            min={0}
            onChange={(e) => setSettings((s) => ({ ...s, shipping_cost: parseFloat(e.target.value) || 0 }))}
          />
          <p style={{ fontSize: "0.73rem", color: "var(--text-muted)", marginTop: 4 }}>
            Charged when order is below threshold
          </p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, padding: "14px 16px", background: "var(--bg-surface)", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
        <input
          type="checkbox"
          id="first-order-free"
          checked={settings.first_order_free}
          onChange={(e) => setSettings((s) => ({ ...s, first_order_free: e.target.checked }))}
          style={{ width: 16, height: 16, accentColor: "var(--primary)", cursor: "pointer" }}
        />
        <label htmlFor="first-order-free" style={{ cursor: "pointer" }}>
          <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>First Order Free Shipping</span>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2 }}>
            New customers get free delivery on their very first order, regardless of order amount
          </p>
        </label>
      </div>

      <div style={{ padding: "12px 16px", background: "rgba(76,175,80,0.08)", borderRadius: "var(--r-md)", marginBottom: 20, fontSize: "0.82rem", color: "var(--text-secondary)" }}>
        <strong>Preview:</strong> Orders below ₹{settings.free_shipping_threshold} pay ₹{settings.shipping_cost} shipping.
        Orders above ₹{settings.free_shipping_threshold} get free shipping.
        {settings.first_order_free && " First-time customers always get free shipping."}
      </div>

      <button className="btn-admin btn-primary-admin" onClick={save} disabled={saving} style={{ padding: "10px 24px" }}>
        {saving ? "Saving…" : "Save Shipping Settings"}
      </button>
    </div>
  );
}

// ── FAQ Management ────────────────────────────────────────────────

function FAQPanel() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState({});

  const load = () => {
    api.get("/support/admin/faqs/")
      .then(({ data }) => setFaqs(data.results || data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const answer = async (id) => {
    const e = editing[id] || {};
    try {
      await api.patch(`/support/admin/faqs/${id}/answer/`, {
        answer: e.answer || "",
        is_published: e.publish !== false,
      });
      toast.success("FAQ updated!");
      setEditing((prev) => { const n = { ...prev }; delete n[id]; return n; });
      load();
    } catch {
      toast.error("Failed to update FAQ.");
    }
  };

  const togglePublish = async (faq) => {
    await api.patch(`/support/admin/faqs/${faq.id}/answer/`, { is_published: !faq.is_published });
    load();
  };

  const displayed = faqs.filter((f) =>
    filter === "all" ? true :
    filter === "pending" ? !f.answer :
    filter === "published" ? f.is_published :
    !f.is_published && f.answer
  );

  return (
    <div className="card-admin" style={{ overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontSize: "1rem", margin: 0 }}>💬 FAQ Management</h3>
        <div style={{ display: "flex", gap: 6 }}>
          {[["all", "All"], ["pending", "Pending Answer"], ["published", "Published"], ["draft", "Draft"]].map(([v, l]) => (
            <button key={v} className="btn-admin"
              style={{ padding: "4px 12px", fontSize: "0.78rem", background: filter === v ? "var(--primary-dark)" : undefined, color: filter === v ? "white" : undefined }}
              onClick={() => setFilter(v)}>{l}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 32 }}><div className="spinner-admin" /></div>
      ) : displayed.length === 0 ? (
        <p style={{ textAlign: "center", padding: 32, color: "var(--text-muted)", fontSize: "0.88rem" }}>No FAQs in this category.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {displayed.map((faq) => {
            const isEditing = editing[faq.id] !== undefined;
            return (
              <div key={faq.id} style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <span className={`badge-admin ${faq.is_published ? "badge-success" : faq.answer ? "badge-warning" : "badge-error"}`} style={{ fontSize: "0.7rem" }}>
                        {faq.is_published ? "Published" : faq.answer ? "Draft" : "Pending"}
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{faq.category} · Asked {faq.ask_count}x</span>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>by {faq.asker_name}</span>
                    </div>
                    <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: faq.answer ? 6 : 0 }}>Q: {faq.question}</p>
                    {faq.answer && !isEditing && (
                      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", paddingLeft: 12, borderLeft: "3px solid var(--primary)" }}>A: {faq.answer}</p>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button className="btn-admin" style={{ padding: "4px 10px", fontSize: "0.76rem" }}
                      onClick={() => setEditing((prev) => isEditing ? (({ [faq.id]: _, ...rest }) => rest)(prev) : { ...prev, [faq.id]: { answer: faq.answer || "", publish: faq.is_published } })}>
                      {isEditing ? "Cancel" : faq.answer ? "Edit" : "Answer"}
                    </button>
                    {faq.answer && (
                      <button className="btn-admin" style={{ padding: "4px 10px", fontSize: "0.76rem" }}
                        onClick={() => togglePublish(faq)}>
                        {faq.is_published ? "Unpublish" : "Publish"}
                      </button>
                    )}
                  </div>
                </div>
                {isEditing && (
                  <div style={{ marginTop: 10 }}>
                    <textarea
                      className="input-admin"
                      rows={3}
                      placeholder="Write the answer…"
                      value={editing[faq.id]?.answer || ""}
                      onChange={(e) => setEditing((prev) => ({ ...prev, [faq.id]: { ...prev[faq.id], answer: e.target.value } }))}
                      style={{ marginBottom: 10, resize: "vertical" }}
                    />
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                        <input type="checkbox" checked={editing[faq.id]?.publish !== false}
                          onChange={(e) => setEditing((prev) => ({ ...prev, [faq.id]: { ...prev[faq.id], publish: e.target.checked } }))}
                          style={{ accentColor: "var(--primary)" }} />
                        Publish immediately
                      </label>
                      <button className="btn-admin btn-primary-admin" style={{ padding: "6px 16px", fontSize: "0.82rem" }} onClick={() => answer(faq.id)}>
                        Save Answer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>Settings</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 28, fontSize: "0.88rem" }}>Configure store-wide settings and manage FAQ content.</p>
      <ShippingPanel />
      <FAQPanel />
    </div>
  );
}
