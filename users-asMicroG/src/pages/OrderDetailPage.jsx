import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { getOrder, cancelOrder } from "../services/orderService";
import api from "../services/api";
import Spinner from "../components/ui/Spinner";
import Button from "../components/ui/Button";
import toast from "react-hot-toast";

const STATUS_COLORS = {
  pending:    { bg: "#fff3e0", color: "#e65100" },
  processing: { bg: "#e3f2fd", color: "#1565c0" },
  shipped:    { bg: "#e8eaf6", color: "#3949ab" },
  delivered:  { bg: "#e8f5e9", color: "#2e7d32" },
  cancelled:  { bg: "#ffebee", color: "#c62828" },
  refunded:   { bg: "#f3e5f5", color: "#6a1b9a" },
};
const PAYMENT_LABELS = { razorpay: "Razorpay", stripe: "Stripe", cod: "Cash on Delivery" };
const STEPS = ["pending", "processing", "shipped", "delivered"];
const RETURN_REASONS = [
  { value: "damaged",          label: "Damaged / Defective product" },
  { value: "wrong_item",       label: "Wrong item received" },
  { value: "not_as_described", label: "Not as described" },
  { value: "change_of_mind",   label: "Change of mind" },
  { value: "other",            label: "Other" },
];
const RETURN_STATUS_MAP = {
  pending:   { bg: "#fff3cd", color: "#856404", label: "Pending Review" },
  approved:  { bg: "#cff4fc", color: "#055160", label: "Approved"       },
  rejected:  { bg: "#f8d7da", color: "#721c24", label: "Rejected"       },
  completed: { bg: "#d4edda", color: "#155724", label: "Completed"      },
};

function ReturnModal({ order, onClose, onSuccess }) {
  const [form, setForm] = useState({ request_type: "return", reason: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.reason) { toast.error("Please select a reason."); return; }
    setSubmitting(true);
    try {
      await api.post(`/orders/${order.id}/returns/`, form);
      toast.success(`${form.request_type === "return" ? "Return" : "Refund"} request submitted!`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div ref={ref} className="neu-raised" style={{ width: "100%", maxWidth: 480, padding: 28, borderRadius: "var(--r-xl)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <h3 style={{ margin: 0 }}>Request Return / Refund</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "var(--text-muted)" }}>✕</button>
        </div>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 18 }}>Order #{order.order_number}</p>
        <form onSubmit={submit}>
          <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
            {[["return", "↩️ Return Item"], ["refund", "💰 Refund Money"]].map(([v, l]) => (
              <button key={v} type="button" onClick={() => setForm((f) => ({ ...f, request_type: v }))}
                style={{
                  flex: 1, padding: "10px", borderRadius: "var(--r-lg)", border: "2px solid",
                  borderColor: form.request_type === v ? "var(--primary)" : "var(--border)",
                  background: form.request_type === v ? "var(--primary-bg, #e8f5e9)" : "var(--bg)",
                  cursor: "pointer", fontWeight: form.request_type === v ? 700 : 500,
                  color: form.request_type === v ? "var(--primary)" : "var(--text-secondary)", fontSize: "0.88rem",
                }}>
                {l}
              </button>
            ))}
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Reason *</label>
            <select className="input-neu" value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} required>
              <option value="">Select a reason…</option>
              {RETURN_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Additional Details</label>
            <textarea className="input-neu" rows={3} placeholder="Describe the issue in detail (optional)…"
              value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              style={{ resize: "vertical" }} />
          </div>
          <div style={{ padding: "12px 16px", background: "var(--bg)", borderRadius: "var(--r-md)", marginBottom: 20, fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
            {form.request_type === "return"
              ? "📦 Items will be picked up within 3–5 business days. Refund processed after inspection."
              : "💳 Refund credited to your original payment method within 5–7 business days."}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Button type="button" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
            <Button type="submit" variant="primary" loading={submitting} style={{ flex: 1 }}>Submit Request</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  const load = () =>
    getOrder(id)
      .then(({ data }) => setOrder(data))
      .catch(() => { toast.error("Order not found."); navigate("/orders"); })
      .finally(() => setLoading(false));

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    load();
  }, [id, user]);

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setCancelling(true);
    try {
      const { data } = await cancelOrder(id);
      setOrder(data);
      toast.success("Order cancelled.");
    } catch {
      toast.error("Cannot cancel this order.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <Spinner center />;
  if (!order) return null;

  const sc = STATUS_COLORS[order.status] || {};
  const canCancel = ["pending", "processing"].includes(order.status);
  const existingReturn = order.return_requests?.[0];
  const canReturn = order.status === "delivered" && !existingReturn;
  const currentStep = STEPS.indexOf(order.status);
  const addr = order.shipping_address;

  return (
    <main className="main-content">
      {showReturnModal && <ReturnModal order={order} onClose={() => setShowReturnModal(false)} onSuccess={load} />}

      <div className="container" style={{ padding: "24px 16px 48px", maxWidth: 860 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <button onClick={() => navigate("/orders")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "var(--text-muted)" }}>←</button>
          <h1 style={{ margin: 0 }}>Order #{order.order_number}</h1>
        </div>
        <p style={{ color: "var(--text-muted)", marginBottom: 28, paddingLeft: 36 }}>
          Placed on {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        {!["cancelled", "refunded"].includes(order.status) && (
          <div className="neu-raised" style={{ padding: "20px 24px", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              {STEPS.map((s, i) => {
                const done = currentStep > i, active = currentStep === i;
                return (
                  <div key={s} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, zIndex: 1 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: done || active ? "var(--primary)" : "var(--bg)", color: done || active ? "white" : "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.85rem", boxShadow: "var(--neu-raised-sm)" }}>
                        {done ? "✓" : i + 1}
                      </div>
                      <span style={{ fontSize: "0.72rem", fontWeight: 600, color: active ? "var(--primary)" : "var(--text-muted)", whiteSpace: "nowrap", textTransform: "capitalize" }}>{s}</span>
                    </div>
                    {i < STEPS.length - 1 && <div style={{ flex: 1, height: 3, background: done ? "var(--primary)" : "rgba(0,0,0,0.08)", margin: "0 4px", marginBottom: 22, borderRadius: 2 }} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: existingReturn ? 12 : 20, flexWrap: "wrap", gap: 10 }}>
          <span style={{ padding: "6px 18px", borderRadius: "var(--r-full)", fontWeight: 700, fontSize: "0.9rem", background: sc.bg, color: sc.color }}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {canCancel && <Button variant="danger" size="sm" loading={cancelling} onClick={handleCancel} style={{ color: "var(--error)" }}>Cancel Order</Button>}
            {canReturn && <Button size="sm" onClick={() => setShowReturnModal(true)}>↩️ Return / Refund</Button>}
            <Link to="/support"><Button size="sm">💬 Get Help</Button></Link>
          </div>
        </div>

        {existingReturn && (() => {
          const rs = RETURN_STATUS_MAP[existingReturn.status] || {};
          return (
            <div style={{ padding: "14px 18px", borderRadius: "var(--r-lg)", marginBottom: 20, background: rs.bg, border: `1px solid ${rs.color}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                <div>
                  <p style={{ fontWeight: 700, marginBottom: 3, color: rs.color }}>
                    {existingReturn.request_type === "return" ? "↩️ Return" : "💰 Refund"} Request — {rs.label}
                  </p>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Reason: {existingReturn.reason_display || existingReturn.reason}</p>
                  {existingReturn.admin_note && <p style={{ fontSize: "0.82rem", marginTop: 4, fontStyle: "italic", color: "var(--text-secondary)" }}>Admin: {existingReturn.admin_note}</p>}
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", alignSelf: "flex-start" }}>{new Date(existingReturn.created_at).toLocaleDateString("en-IN")}</span>
              </div>
            </div>
          );
        })()}

        <div style={{ display: "grid", gap: 20 }}>
          <div className="neu-raised" style={{ padding: 20 }}>
            <h3 style={{ marginBottom: 16 }}>Items Ordered</h3>
            {order.items.map((item) => (
              <div key={item.id} style={{ display: "flex", gap: 14, padding: "12px 0", borderBottom: "1px solid rgba(46,125,50,0.08)" }}>
                <img src={item.product_detail?.primary_image?.image || "/placeholder.png"} alt={item.product_name} style={{ width: 60, height: 60, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600 }}>{item.product_name}</p>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.83rem", marginTop: 2 }}>SKU: {item.product_sku}</p>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.83rem" }}>Qty: {item.quantity} × ₹{item.price}</p>
                </div>
                <span className="price" style={{ fontSize: "1rem", flexShrink: 0 }}>₹{item.subtotal}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            <div className="neu-raised" style={{ padding: 20 }}>
              <h3 style={{ marginBottom: 16 }}>Price Details</h3>
              {[["Subtotal", `₹${order.total_amount}`], order.discount_amount > 0 && ["Discount", `-₹${order.discount_amount}`], ["Shipping", order.shipping_amount > 0 ? `₹${order.shipping_amount}` : "FREE"]].filter(Boolean).map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  <span>{l}</span><span style={{ color: l === "Discount" ? "var(--success)" : "inherit" }}>{v}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid rgba(46,125,50,0.12)", paddingTop: 12, marginTop: 4, display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                <span>Total Paid</span><span className="price">₹{order.final_amount}</span>
              </div>
              <div style={{ marginTop: 12, fontSize: "0.83rem", color: "var(--text-muted)" }}>
                <p>Payment: {PAYMENT_LABELS[order.payment_method] || order.payment_method}</p>
                <p style={{ marginTop: 4, textTransform: "capitalize" }}>
                  Status: <span style={{ color: order.payment_status === "paid" ? "var(--success)" : "var(--warning)", fontWeight: 600 }}>{order.payment_status}</span>
                  {order.payment_method === "cod" && order.payment_status !== "paid" && <span style={{ marginLeft: 6, fontSize: "0.75rem" }}>(Pay on delivery)</span>}
                </p>
              </div>
            </div>

            {addr && (
              <div className="neu-raised" style={{ padding: 20 }}>
                <h3 style={{ marginBottom: 16 }}>Delivery Address</h3>
                <p style={{ fontWeight: 600 }}>{addr.full_name}</p>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: 6, lineHeight: 1.7 }}>
                  {addr.address_line1}{addr.address_line2 && `, ${addr.address_line2}`}<br />{addr.city}, {addr.state} – {addr.postal_code}
                </p>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 8 }}>📱 {addr.phone}</p>
              </div>
            )}
          </div>

          {order.tracking_number && (
            <div className="neu-raised" style={{ padding: 20 }}>
              <h3 style={{ marginBottom: 8 }}>Tracking</h3>
              <p style={{ fontFamily: "monospace", fontSize: "1.05rem", color: "var(--primary)", fontWeight: 700 }}>{order.tracking_number}</p>
              {order.estimated_delivery && <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 6 }}>Estimated delivery: {new Date(order.estimated_delivery).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>}
            </div>
          )}

          {order.status_history?.length > 0 && (
            <div className="neu-raised" style={{ padding: 20 }}>
              <h3 style={{ marginBottom: 16 }}>Order Timeline</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[...order.status_history].reverse().map((h) => {
                  const hsc = STATUS_COLORS[h.status] || {};
                  return (
                    <div key={h.id} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                      <span style={{ padding: "3px 10px", borderRadius: "var(--r-full)", fontSize: "0.75rem", fontWeight: 700, background: hsc.bg, color: hsc.color, flexShrink: 0, marginTop: 2, textTransform: "capitalize" }}>{h.status}</span>
                      <div>
                        {h.note && <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)" }}>{h.note}</p>}
                        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2 }}>{new Date(h.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: 28, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Button onClick={() => navigate("/orders")}>← All Orders</Button>
          <Button variant="primary" onClick={() => navigate("/products")}>Continue Shopping</Button>
          {canReturn && <Button onClick={() => setShowReturnModal(true)}>↩️ Return / Refund</Button>}
        </div>
      </div>
    </main>
  );
}
