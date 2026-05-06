import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"];
const RETURN_STATUSES = ["pending", "approved", "rejected", "completed"];

const RETURN_STATUS_COLORS = {
  pending: "badge-warning",
  approved: "badge-info",
  rejected: "badge-error",
  completed: "badge-success",
};

// ── Orders Tab ────────────────────────────────────────────────────

function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = (p = 1) => {
    setLoading(true);
    const params = { page: p };
    if (statusFilter) params.status = statusFilter;
    if (search) params.search = search;
    api.get("/orders/admin/orders/", { params })
      .then(({ data }) => {
        setOrders(data.results || data);
        setTotalPages(data.total_pages || 1);
        setPage(p);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(1); }, [statusFilter, search]);

  const updateStatus = async (orderId, newStatus) => {
    await api.post(`/orders/admin/orders/${orderId}/status/`, { status: newStatus });
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
    toast.success("Status updated!");
  };

  const markCodPaid = async (orderId) => {
    try {
      await api.post(`/orders/admin/orders/${orderId}/mark-paid/`);
      setOrders((prev) =>
        prev.map((o) => o.id === orderId ? { ...o, payment_status: "paid" } : o)
      );
      toast.success("Marked as paid!");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to mark as paid.");
    }
  };

  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", padding: "4px 0" }}>
        <button
          className="btn-admin"
          onClick={() => setStatusFilter("")}
          style={{ background: !statusFilter ? "var(--primary-dark)" : undefined, color: !statusFilter ? "white" : undefined, flexShrink: 0 }}
        >
          All
        </button>
        {ORDER_STATUSES.map((s) => (
          <button
            key={s}
            className="btn-admin"
            onClick={() => setStatusFilter(s)}
            style={{
              flexShrink: 0, textTransform: "capitalize",
              background: statusFilter === s ? "var(--primary-dark)" : undefined,
              color: statusFilter === s ? "white" : undefined,
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          className="input-admin"
          placeholder="Search by order number, customer email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 380 }}
        />
      </div>

      <div className="card-admin" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="table-admin">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 32 }}><div className="spinner-admin" style={{ margin: "auto" }} /></td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>No orders found.</td></tr>
              ) : orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <span style={{ fontWeight: 700, color: "var(--primary)", fontSize: "0.85rem" }}>#{order.order_number}</span>
                  </td>
                  <td style={{ fontSize: "0.85rem" }}>{order.user?.email || "—"}</td>
                  <td>{order.items?.length || 0}</td>
                  <td style={{ fontWeight: 600 }}>₹{order.final_amount}</td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
                      <span className={`badge-admin ${order.payment_status === "paid" ? "badge-success" : "badge-warning"}`}>
                        {order.payment_status}
                      </span>
                      {order.payment_method === "cod" && order.payment_status !== "paid" && (
                        <button
                          className="btn-admin"
                          onClick={() => markCodPaid(order.id)}
                          style={{ padding: "2px 8px", fontSize: "0.72rem", background: "var(--primary)", color: "white", marginTop: 2 }}
                        >
                          Mark Paid
                        </button>
                      )}
                      {order.payment_method === "cod" && (
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>COD</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <select
                      className="input-admin"
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      style={{ padding: "4px 8px", fontSize: "0.82rem", width: "auto", minHeight: 30 }}
                    >
                      {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </td>
                  <td style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    {new Date(order.created_at).toLocaleDateString("en-IN")}
                  </td>
                  <td>
                    <Link to={`/orders/${order.id}`} className="btn-admin" style={{ padding: "4px 10px", fontSize: "0.8rem" }}>View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: "16px 0" }}>
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => load(p)} className="btn-admin"
                style={{ width: 34, height: 34, padding: 0, background: page === p ? "var(--primary-dark)" : undefined }}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ── Return Detail Panel ───────────────────────────────────────────

function ReturnDetailPanel({ rr, onClose, onUpdated }) {
  const [newStatus, setNewStatus] = useState(rr.status);
  const [adminNote, setAdminNote] = useState(rr.admin_note || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/orders/admin/returns/${rr.id}/update/`, {
        status: newStatus,
        admin_note: adminNote,
      });
      toast.success("Return request updated.");
      onUpdated(data);
    } catch {
      toast.error("Failed to update.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card-admin" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontWeight: 700, color: "var(--primary)", fontSize: "0.9rem" }}>
            Order #{rr.order_number}
          </p>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 2 }}>{rr.user_email}</p>
        </div>
        <button className="btn-admin" style={{ padding: "4px 8px" }} onClick={onClose}>✕</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 2 }}>Type</p>
          <p style={{ fontWeight: 600, textTransform: "capitalize" }}>{rr.request_type_display}</p>
        </div>
        <div>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 2 }}>Reason</p>
          <p style={{ fontWeight: 600 }}>{rr.reason_display}</p>
        </div>
      </div>

      {rr.description && (
        <div style={{ background: "var(--bg)", borderRadius: "var(--r-md)", padding: 12 }}>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 4 }}>Customer note</p>
          <p style={{ fontSize: "0.88rem" }}>{rr.description}</p>
        </div>
      )}

      <div>
        <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Update Status</label>
        <select
          className="input-admin"
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value)}
          style={{ width: "100%" }}
        >
          {RETURN_STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Admin Note (visible to customer)</label>
        <textarea
          className="input-admin"
          rows={3}
          placeholder="Explain the decision, next steps, refund timeline…"
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
          style={{ width: "100%", resize: "vertical" }}
        />
      </div>

      <button
        className="btn-admin btn-primary-admin"
        onClick={save}
        disabled={saving}
        style={{ alignSelf: "flex-end", padding: "8px 20px" }}
      >
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}

// ── Returns Tab ───────────────────────────────────────────────────

function ReturnsTab() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = (p = 1) => {
    setLoading(true);
    const params = { page: p };
    if (statusFilter) params.status = statusFilter;
    if (typeFilter) params.request_type = typeFilter;
    api.get("/orders/admin/returns/", { params })
      .then(({ data }) => {
        setReturns(data.results || data);
        setTotalPages(data.total_pages || 1);
        setPage(p);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(1); }, [statusFilter, typeFilter]);

  const handleUpdated = (updated) => {
    setReturns((prev) => prev.map((r) => r.id === updated.id ? updated : r));
    setSelected(updated);
  };

  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[["", "All Status"], ["pending", "Pending"], ["approved", "Approved"], ["rejected", "Rejected"], ["completed", "Completed"]].map(([val, label]) => (
            <button key={val} className="btn-admin"
              style={{ flexShrink: 0, background: statusFilter === val ? "var(--primary-dark)" : undefined, color: statusFilter === val ? "white" : undefined }}
              onClick={() => setStatusFilter(val)}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[["", "All Types"], ["return", "Return"], ["refund", "Refund"]].map(([val, label]) => (
            <button key={val} className="btn-admin"
              style={{ flexShrink: 0, background: typeFilter === val ? "var(--primary)" : undefined, color: typeFilter === val ? "white" : undefined }}
              onClick={() => setTypeFilter(val)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gap: 20, gridTemplateColumns: selected ? "3fr 2fr" : "1fr" }}>
        <div className="card-admin" style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="table-admin">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: 32 }}><div className="spinner-admin" style={{ margin: "auto" }} /></td></tr>
                ) : returns.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>No return requests found.</td></tr>
                ) : returns.map((rr) => (
                  <tr key={rr.id} onClick={() => setSelected(selected?.id === rr.id ? null : rr)}
                    style={{ cursor: "pointer", background: selected?.id === rr.id ? "var(--bg-surface)" : undefined }}>
                    <td style={{ fontWeight: 600, color: "var(--primary)", fontSize: "0.82rem" }}>{rr.id}</td>
                    <td style={{ fontSize: "0.82rem", fontWeight: 600 }}>#{rr.order_number}</td>
                    <td style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{rr.user_email}</td>
                    <td>
                      <span className={`badge-admin ${rr.request_type === "refund" ? "badge-warning" : "badge-info"}`}
                        style={{ textTransform: "capitalize" }}>
                        {rr.request_type_display}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.82rem" }}>{rr.reason_display}</td>
                    <td>
                      <span className={`badge-admin ${RETURN_STATUS_COLORS[rr.status] || "badge-info"}`}
                        style={{ textTransform: "capitalize" }}>
                        {rr.status_display || rr.status}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      {new Date(rr.created_at).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: "16px 0" }}>
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => load(p)} className="btn-admin"
                  style={{ width: 34, height: 34, padding: 0, background: page === p ? "var(--primary-dark)" : undefined }}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {selected && (
          <ReturnDetailPanel
            key={selected.id}
            rr={selected}
            onClose={() => setSelected(null)}
            onUpdated={handleUpdated}
          />
        )}
      </div>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [tab, setTab] = useState("orders");

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1>Orders</h1>
        <div style={{ display: "flex", gap: 4, background: "var(--bg-surface)", borderRadius: "var(--r-md)", padding: 4 }}>
          {[["orders", "Orders"], ["returns", "Returns / Refunds"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} className="btn-admin"
              style={{ padding: "6px 16px", background: tab === key ? "var(--primary)" : "transparent", color: tab === key ? "white" : undefined, border: "none" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "orders" ? <OrdersTab /> : <ReturnsTab />}
    </div>
  );
}
