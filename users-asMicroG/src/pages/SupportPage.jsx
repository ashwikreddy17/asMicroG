import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import api from "../services/api";
import toast from "react-hot-toast";

// ── FAQ data ─────────────────────────────────────────────────────
const FAQS = [
  { cat: "Orders", q: "How do I track my order?", a: "Go to My Orders from your profile and click on any order to see real-time tracking updates." },
  { cat: "Orders", q: "Can I cancel my order?", a: "You can cancel orders in 'Pending' or 'Processing' status. Open the order and click 'Cancel Order'. Once shipped, cancellation is not possible." },
  { cat: "Orders", q: "How long does delivery take?", a: "Standard delivery takes 5–7 business days. Express delivery delivers within 1–2 business days." },
  { cat: "Returns", q: "What is your return policy?", a: "We offer a 7-day hassle-free return policy from the date of delivery. Products must be unused and in original packaging." },
  { cat: "Returns", q: "How do I request a return or refund?", a: "Open your order from My Orders, click '↩️ Return / Refund', choose a reason, and submit. Our team reviews within 24 hours." },
  { cat: "Returns", q: "When will I get my refund?", a: "Refunds are processed within 5–7 business days after the returned item is verified at our warehouse." },
  { cat: "Payments", q: "What payment methods are accepted?", a: "We accept UPI, credit/debit cards, net banking, wallets, and Cash on Delivery." },
  { cat: "Payments", q: "My payment failed but money was deducted.", a: "Don't worry — this is usually a temporary bank hold. The amount reverses within 5–7 business days. Contact support if it takes longer." },
  { cat: "Products", q: "Are your products really eco-friendly?", a: "Every product is verified sustainable. We only partner with suppliers certified by recognized eco-friendly and organic standards bodies." },
];
const FAQ_CATS = ["All", "Orders", "Returns", "Payments", "Products"];

const TICKET_STATUS = {
  open:        { bg: "#fff3cd", color: "#856404", label: "Open"        },
  in_progress: { bg: "#cff4fc", color: "#055160", label: "In Progress" },
  resolved:    { bg: "#d4edda", color: "#155724", label: "Resolved"    },
  closed:      { bg: "#e2e3e5", color: "#383d41", label: "Closed"      },
};

// ── Chat thread ───────────────────────────────────────────────────
function TicketThread({ ticket, user, onBack, onUpdate }) {
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState(ticket.messages || []);
  const bottomRef = useRef();

  useEffect(() => {
    setMessages(ticket.messages || []);
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket]);

  const send = async () => {
    if (!msg.trim()) return;
    setSending(true);
    try {
      const { data } = await api.post(`/support/tickets/${ticket.id}/messages/`, { message: msg });
      setMessages((prev) => [...prev, data]);
      setMsg("");
      onUpdate();
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch {
      toast.error("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const ts = TICKET_STATUS[ticket.status] || {};

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Thread header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", gap: 12, alignItems: "flex-start" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--text-muted)", flexShrink: 0, marginTop: 2 }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <p style={{ fontWeight: 700, color: "var(--primary)", fontSize: "0.82rem" }}>#{ticket.ticket_number}</p>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: ts.bg, color: ts.color }}>{ts.label}</span>
          </div>
          <p style={{ fontWeight: 600, marginTop: 2, fontSize: "0.95rem" }}>{ticket.subject}</p>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12, minHeight: 0 }}>
        {/* Original description */}
        <div style={{ padding: "12px 16px", borderRadius: "var(--r-lg)", background: "var(--bg)", maxWidth: "85%", alignSelf: "flex-start" }}>
          <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 4 }}>Your initial message</p>
          <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{ticket.description}</p>
        </div>

        {messages.map((m) => {
          const isMe = !m.is_staff_reply;
          return (
            <div key={m.id} style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "80%" }}>
              <div style={{
                padding: "10px 14px", borderRadius: "var(--r-lg)",
                background: isMe ? "var(--primary)" : "var(--bg-card, white)",
                color: isMe ? "white" : "var(--text-primary)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              }}>
                <p style={{ fontSize: "0.88rem", lineHeight: 1.5 }}>{m.message}</p>
              </div>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 3, textAlign: isMe ? "right" : "left" }}>
                {isMe ? "You" : "Support Team"} · {new Date(m.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Reply box */}
      {!["resolved", "closed"].includes(ticket.status) ? (
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: 10 }}>
          <textarea
            className="input-neu"
            placeholder="Type your message…"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            rows={2}
            style={{ flex: 1, resize: "none" }}
          />
          <button onClick={send} disabled={sending || !msg.trim()}
            style={{ padding: "8px 16px", borderRadius: "var(--r-md)", border: "none", background: "var(--primary)", color: "white", cursor: "pointer", fontWeight: 700, fontSize: "0.88rem", opacity: !msg.trim() ? 0.5 : 1 }}>
            {sending ? "…" : "Send"}
          </button>
        </div>
      ) : (
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", textAlign: "center", fontSize: "0.82rem", color: "var(--text-muted)" }}>
          This ticket is {ticket.status}. <Link to="/support" onClick={() => {}} style={{ color: "var(--primary)" }}>Open a new ticket</Link> if you need more help.
        </div>
      )}
    </div>
  );
}

// ── My Tickets panel (logged-in) ─────────────────────────────────
function MyTickets({ user }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({ subject: "", description: "", priority: "medium", order: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    api.get("/support/tickets/").then(({ data }) => {
      const list = Array.isArray(data) ? data : (data.results ?? []);
      setTickets(list);
      if (selected) setSelected(list.find((t) => t.id === selected.id) || null);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    api.get("/orders/").then(({ data }) => setOrders(Array.isArray(data) ? data : (data.results ?? []))).catch(() => {});
  }, []);

  const createTicket = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { subject: form.subject, description: form.description, priority: form.priority };
      if (form.order) payload.order = form.order;
      const { data } = await api.post("/support/tickets/", payload);
      toast.success(`Ticket #${data.ticket_number} created!`);
      setShowForm(false);
      setForm({ subject: "", description: "", priority: "medium", order: "" });
      load();
      setSelected(data);
    } catch {
      toast.error("Failed to create ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  if (selected) {
    return (
      <div style={{ height: 520, display: "flex", flexDirection: "column" }} className="neu-raised" style2={{ borderRadius: "var(--r-xl)", overflow: "hidden" }}>
        <TicketThread ticket={selected} user={user} onBack={() => setSelected(null)} onUpdate={load} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ fontWeight: 700, fontSize: "1rem" }}>My Support Tickets</p>
        <button onClick={() => setShowForm(!showForm)}
          style={{ padding: "8px 16px", borderRadius: "var(--r-full)", border: "none", background: "var(--primary)", color: "white", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem" }}>
          {showForm ? "✕ Cancel" : "+ New Ticket"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createTicket} className="neu-raised" style={{ padding: 20, marginBottom: 16, borderRadius: "var(--r-xl)", borderLeft: "3px solid var(--primary)" }}>
          <p style={{ fontWeight: 700, marginBottom: 14 }}>Create Support Ticket</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Subject *</label>
              <input className="input-neu" required placeholder="What's the issue?" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Priority</label>
                <select className="input-neu" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Related Order (optional)</label>
                <select className="input-neu" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}>
                  <option value="">None</option>
                  {orders.map((o) => <option key={o.id} value={o.id}>#{o.order_number}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Describe your issue *</label>
              <textarea className="input-neu" required rows={4} placeholder="Please provide as much detail as possible…"
                value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} style={{ resize: "vertical" }} />
            </div>
            <button type="submit" disabled={submitting}
              style={{ padding: "10px", borderRadius: "var(--r-full)", border: "none", background: "var(--primary)", color: "white", cursor: "pointer", fontWeight: 700, opacity: submitting ? 0.7 : 1 }}>
              {submitting ? "Submitting…" : "Submit Ticket"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>Loading tickets…</div>
      ) : tickets.length === 0 ? (
        <div className="neu-raised" style={{ padding: 32, textAlign: "center", borderRadius: "var(--r-xl)" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
          <p style={{ fontWeight: 700, marginBottom: 6 }}>No tickets yet</p>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Click "+ New Ticket" to contact our support team.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tickets.map((t) => {
            const ts = TICKET_STATUS[t.status] || {};
            const lastMsg = t.messages?.[t.messages.length - 1];
            return (
              <button key={t.id} onClick={() => setSelected(t)}
                style={{ all: "unset", cursor: "pointer", display: "block" }}>
                <div className="neu-raised" style={{ padding: "14px 18px", borderRadius: "var(--r-lg)", borderLeft: `3px solid ${ts.color || "var(--border)"}` }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "translateX(3px)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = ""}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--primary)" }}>#{t.ticket_number}</span>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "1px 7px", borderRadius: 10, background: ts.bg, color: ts.color }}>{ts.label}</span>
                      </div>
                      <p style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: 3 }}>{t.subject}</p>
                      {lastMsg && <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", maxWidth: 260 }}>
                        {lastMsg.is_staff_reply ? "Support: " : "You: "}{lastMsg.message}
                      </p>}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{new Date(t.created_at).toLocaleDateString("en-IN")}</p>
                      {t.messages?.length > 0 && <p style={{ fontSize: "0.72rem", color: "var(--primary)", marginTop: 4 }}>{t.messages.length} message{t.messages.length !== 1 ? "s" : ""}</p>}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────
export default function SupportPage() {
  const user = useSelector((s) => s.auth.user);
  const [faqCat, setFaqCat] = useState("All");
  const [openFaq, setOpenFaq] = useState(null);
  const [search, setSearch] = useState("");

  const filtered = FAQS.filter((f) => {
    const matchCat = faqCat === "All" || f.cat === faqCat;
    const matchSearch = !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <main className="main-content">
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%)", padding: "56px 24px", textAlign: "center", color: "white" }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 800, marginBottom: 12, color: "white" }}>Help & Support</h1>
          <p style={{ color: "#c8e6c9", marginBottom: 24, fontSize: "1rem" }}>Search our FAQ or contact our support team</p>
          <div style={{ maxWidth: 460, margin: "0 auto", position: "relative" }}>
            <input placeholder="Search for help…" value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "13px 20px 13px 46px", borderRadius: "var(--r-full)", border: "none", fontSize: "0.95rem", outline: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }} />
            <span style={{ position: "absolute", left: 15, top: "50%", transform: "translateY(-50%)", fontSize: 18, pointerEvents: "none" }}>🔍</span>
          </div>
        </motion.div>
      </div>

      <div className="container" style={{ padding: "36px 16px 60px" }}>
        {/* Contact cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 40 }}>
          {[
            { icon: "✉️", label: "Email Support", sub: "support@asmicrog.com", action: "mailto:support@asmicrog.com", note: "Response within 24hrs" },
            { icon: "📞", label: "Phone Support", sub: "+91 98765 43210", action: "tel:+919876543210", note: "Mon–Sat, 9am–6pm IST" },
            { icon: "💬", label: "Live Chat", sub: "Chat with us", action: null, note: "Avg. wait < 2 minutes" },
          ].map((c) => (
            <div key={c.label} className="neu-raised" style={{ padding: "20px 16px", textAlign: "center", borderRadius: "var(--r-xl)" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{c.icon}</div>
              <p style={{ fontWeight: 700, marginBottom: 4 }}>{c.label}</p>
              {c.action
                ? <a href={c.action} style={{ color: "var(--primary)", fontWeight: 600, fontSize: "0.88rem", textDecoration: "none" }}>{c.sub}</a>
                : <button onClick={() => toast("Live chat coming soon!", { icon: "💬" })} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", fontWeight: 600, fontSize: "0.88rem" }}>{c.sub}</button>
              }
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>{c.note}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gap: 28, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>

          {/* FAQ */}
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: 16 }}>Frequently Asked Questions</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
              {FAQ_CATS.map((c) => (
                <button key={c} onClick={() => { setFaqCat(c); setOpenFaq(null); }}
                  className="btn-neu"
                  style={{ padding: "5px 14px", borderRadius: "var(--r-full)", fontSize: "0.8rem", background: faqCat === c ? "var(--primary)" : undefined, color: faqCat === c ? "white" : undefined, fontWeight: faqCat === c ? 700 : 400 }}>
                  {c}
                </button>
              ))}
            </div>

            {filtered.length === 0
              ? <p style={{ color: "var(--text-muted)", padding: "24px 0", textAlign: "center" }}>No results for "{search}"</p>
              : (
                <div className="neu-raised" style={{ borderRadius: "var(--r-xl)", overflow: "hidden" }}>
                  {filtered.map((f, i) => {
                    const key = `${f.cat}-${i}`;
                    const isOpen = openFaq === key;
                    return (
                      <div key={key} style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none" }}>
                        <button onClick={() => setOpenFaq(isOpen ? null : key)}
                          style={{ width: "100%", background: isOpen ? "var(--primary-bg, #f0f9f0)" : "transparent", border: "none", cursor: "pointer", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, textAlign: "left" }}>
                          <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text-primary)" }}>{f.q}</span>
                          <span style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, background: isOpen ? "var(--primary)" : "var(--bg)", color: isOpen ? "white" : "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: 700, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                            {isOpen ? "−" : "+"}
                          </span>
                        </button>
                        {isOpen && <div style={{ padding: "0 18px 14px", color: "var(--text-secondary)", fontSize: "0.865rem", lineHeight: 1.8 }}>{f.a}</div>}
                      </div>
                    );
                  })}
                </div>
              )
            }
          </div>

          {/* Ticket system or login prompt */}
          <div>
            {user ? (
              <MyTickets user={user} />
            ) : (
              <div>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: 16 }}>Contact Support</h2>
                <div className="neu-raised" style={{ padding: 28, borderRadius: "var(--r-xl)", textAlign: "center" }}>
                  <div style={{ fontSize: 48, marginBottom: 14 }}>🔐</div>
                  <p style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: 8 }}>Sign in to raise a ticket</p>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: 20, lineHeight: 1.6 }}>
                    Log in to create support tickets, track responses, and chat with our team.
                  </p>
                  <Link to="/auth">
                    <button style={{ padding: "12px 28px", borderRadius: "var(--r-full)", border: "none", background: "var(--primary)", color: "white", cursor: "pointer", fontWeight: 700, fontSize: "0.95rem" }}>
                      Sign In to Continue
                    </button>
                  </Link>
                  <p style={{ marginTop: 16, fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    Or email us at <a href="mailto:support@asmicrog.com" style={{ color: "var(--primary)" }}>support@asmicrog.com</a>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Policy strip */}
        <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
          {[
            { icon: "↩️", title: "7-Day Returns", desc: "Hassle-free on all orders" },
            { icon: "🔒", title: "Secure Payments", desc: "256-bit SSL encryption" },
            { icon: "🚚", title: "Free Shipping", desc: "On orders above ₹500" },
            { icon: "♻️", title: "100% Eco Products", desc: "Certified sustainable" },
          ].map((p) => (
            <div key={p.title} className="neu-raised" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, borderRadius: "var(--r-lg)" }}>
              <span style={{ fontSize: 24 }}>{p.icon}</span>
              <div>
                <p style={{ fontWeight: 700, fontSize: "0.85rem" }}>{p.title}</p>
                <p style={{ fontSize: "0.73rem", color: "var(--text-muted)", marginTop: 2 }}>{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
