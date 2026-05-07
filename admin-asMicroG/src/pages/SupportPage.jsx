import { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

const PRIORITY_COLORS = { low: "badge-info", medium: "badge-warning", high: "badge-warning", urgent: "badge-error" };
const STATUS_COLORS = { open: "badge-warning", in_progress: "badge-info", resolved: "badge-success", closed: "badge-error" };

export default function SupportPage() {
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const load = () => {
    const params = filter ? { status: filter } : {};
    api.get("/support/admin/tickets/", { params })
      .then(({ data }) => setTickets(data.results || data))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filter]);

  const loadTicket = (id) => {
    api.get(`/support/admin/tickets/${id}/`).then(({ data }) => setSelected(data)).catch(() => {});
    // find in list for quick preview
    const t = tickets.find((t) => t.id === id);
    if (t) setSelected(t);
  };

  const sendReply = async () => {
    if (!reply.trim() || !selected) return;
    try {
      const { data } = await api.patch(`/support/admin/tickets/${selected.id}/reply/`, { reply, status: "in_progress" });
      setSelected(data);
      setReply("");
      toast.success("Reply sent.");
      load();
    } catch {
      toast.error("Failed to send reply.");
    }
  };

  const updateStatus = async (id, status) => {
    await api.patch(`/support/admin/tickets/${id}/reply/`, { status });
    setTickets((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
    if (selected?.id === id) setSelected((s) => ({ ...s, status }));
    toast.success("Status updated.");
  };

  return (
    <div>
      <h1 style={{ marginBottom: 20 }}>Support Tickets</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto" }}>
        {["", "open", "in_progress", "resolved", "closed"].map((s) => (
          <button key={s} className="btn-admin"
            style={{ flexShrink: 0, background: filter === s ? "var(--primary-dark)" : undefined, color: filter === s ? "white" : undefined }}
            onClick={() => setFilter(s)}>
            {s === "" ? "All" : s.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gap: 20, gridTemplateColumns: selected ? "1fr 1fr" : "1fr" }}>
        {/* List */}
        <div className="card-admin" style={{ overflow: "hidden" }}>
          <table className="table-admin">
            <thead>
              <tr><th>Ticket</th><th>Customer</th><th>Priority</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 32 }}><div className="spinner-admin" style={{ margin: "auto" }} /></td></tr>
              ) : tickets.map((t) => (
                <tr key={t.id} onClick={() => loadTicket(t.id)} style={{ cursor: "pointer", background: selected?.id === t.id ? "var(--bg-surface)" : undefined }}>
                  <td>
                    <p style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--primary)" }}>#{t.ticket_number}</p>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", maxWidth: 160 }}>{t.subject}</p>
                  </td>
                  <td style={{ fontSize: "0.82rem" }}>{t.user?.email || "—"}</td>
                  <td><span className={`badge-admin ${PRIORITY_COLORS[t.priority] || "badge-info"}`}>{t.priority}</span></td>
                  <td>
                    <select className="input-admin" value={t.status} onChange={(e) => { e.stopPropagation(); updateStatus(t.id, e.target.value); }}
                      style={{ padding: "3px 7px", fontSize: "0.78rem", width: "auto", minHeight: 28 }}>
                      {["open", "in_progress", "resolved", "closed"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                    </select>
                  </td>
                  <td style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{new Date(t.created_at).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="card-admin" style={{ padding: 20, display: "flex", flexDirection: "column", maxHeight: 600, overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <p style={{ fontWeight: 700, color: "var(--primary)" }}>#{selected.ticket_number}</p>
                <p style={{ fontWeight: 600, marginTop: 2 }}>{selected.subject}</p>
              </div>
              <button className="btn-admin" style={{ padding: 6 }} onClick={() => setSelected(null)}>✕</button>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: 16, padding: "12px", background: "var(--bg)", borderRadius: "var(--r-md)" }}>
              {selected.description}
            </p>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
              {selected.messages?.map((m) => (
                <div key={m.id} style={{
                  padding: "10px 14px", borderRadius: "var(--r-md)",
                  background: m.is_staff_reply ? "rgba(76,175,80,0.1)" : "var(--bg)",
                  alignSelf: m.is_staff_reply ? "flex-end" : "flex-start",
                  maxWidth: "85%", borderLeft: m.is_staff_reply ? "3px solid var(--primary)" : "none",
                }}>
                  <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: 4 }}>
                    {m.is_staff_reply ? "You (Staff)" : m.sender_name}
                  </p>
                  <p style={{ fontSize: "0.88rem" }}>{m.message}</p>
                </div>
              ))}
            </div>

            {/* Reply box */}
            <div style={{ display: "flex", gap: 8 }}>
              <textarea
                className="input-admin"
                placeholder="Type your reply…"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={2}
                style={{ flex: 1, resize: "none" }}
                onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) sendReply(); }}
              />
              <button className="btn-admin btn-primary-admin" onClick={sendReply} style={{ alignSelf: "flex-end", padding: "8px 14px" }}>Send</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
