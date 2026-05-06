import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { fetchProfile, logout } from "../store/authSlice";
import api from "../services/api";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import toast from "react-hot-toast";

// ── Avatar ──────────────────────────────────────────────────────
function Avatar({ user, size = 80 }) {
  const initials = [user.first_name, user.last_name]
    .filter(Boolean).map((n) => n[0].toUpperCase()).join("") || user.email?.[0]?.toUpperCase() || "U";
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, var(--primary-dark), var(--primary-light))",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "white", fontWeight: 800, fontSize: size * 0.38,
      flexShrink: 0, boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
      userSelect: "none",
    }}>
      {initials}
    </div>
  );
}

// ── Sidebar nav items ────────────────────────────────────────────
const NAV = [
  { id: "overview",      icon: "🏠", label: "Overview"       },
  { id: "profile",       icon: "👤", label: "My Profile"     },
  { id: "orders",        icon: "📦", label: "My Orders"      },
  { id: "addresses",     icon: "📍", label: "Addresses"      },
  { id: "wishlist",      icon: "❤️",  label: "Wishlist"       },
  { id: "security",      icon: "🔒", label: "Security"       },
  { id: "notifications", icon: "🔔", label: "Notifications"  },
  { id: "help",          icon: "💬", label: "Help & Support" },
];

// ── Reusable field display ────────────────────────────────────────
function Field({ label, value, placeholder = "Not set" }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: "0.97rem", color: value ? "var(--text-primary)" : "var(--text-muted)", fontWeight: value ? 500 : 400 }}>{value || placeholder}</p>
    </div>
  );
}

// ── Overview panel ───────────────────────────────────────────────
function OverviewPanel({ user, orders, addressCount, wishlistCount, setTab }) {
  const memberSince = user.date_joined ? new Date(user.date_joined).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : null;

  const stats = [
    { icon: "📦", label: "Total Orders", value: orders.length, tab: "orders" },
    { icon: "❤️", label: "Wishlist Items", value: wishlistCount, tab: "wishlist" },
    { icon: "📍", label: "Saved Addresses", value: addressCount, tab: "addresses" },
  ];

  return (
    <div>
      {/* Profile summary card */}
      <div className="neu-raised" style={{ padding: 28, display: "flex", gap: 20, alignItems: "center", marginBottom: 24, flexWrap: "wrap" }}>
        <Avatar user={user} size={72} />
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 800, fontSize: "1.25rem", marginBottom: 2 }}>
            {[user.first_name, user.last_name].filter(Boolean).join(" ") || "—"}
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 6 }}>{user.email}</p>
          {memberSince && <span style={{ fontSize: "0.78rem", color: "var(--primary)", fontWeight: 600, background: "var(--primary-bg, #e8f5e9)", padding: "2px 10px", borderRadius: 20 }}>Member since {memberSince}</span>}
        </div>
        <Button onClick={() => setTab("profile")} size="sm">Edit Profile</Button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 28 }}>
        {stats.map((s) => (
          <button key={s.tab} onClick={() => setTab(s.tab)} style={{ all: "unset", cursor: "pointer" }}>
            <div className="neu-raised" style={{ padding: "20px 16px", textAlign: "center", borderRadius: "var(--r-xl)", transition: "transform 0.15s" }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = ""}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
              <p style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--primary)", lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 4 }}>{s.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Recent orders */}
      <div className="neu-raised" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <p style={{ fontWeight: 700, fontSize: "1rem" }}>Recent Orders</p>
          <Link to="/orders" style={{ fontSize: "0.85rem", color: "var(--primary)", fontWeight: 600 }}>View All →</Link>
        </div>
        {orders.slice(0, 3).length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center", padding: "16px 0" }}>No orders yet.</p>
        ) : (
          orders.slice(0, 3).map((o) => (
            <Link key={o.id} to={`/orders/${o.id}`} style={{ textDecoration: "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>#{o.order_number || o.id}</p>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{new Date(o.created_at).toLocaleDateString("en-IN")}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontWeight: 700, color: "var(--primary)", fontSize: "0.9rem" }}>₹{o.total_amount}</p>
                  <StatusBadge status={o.status} />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Quick links */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[
          { icon: "📍", label: "Manage Addresses", tab: "addresses" },
          { icon: "🔒", label: "Security Settings", tab: "security" },
          { icon: "🔔", label: "Notifications", tab: "notifications" },
          { icon: "💬", label: "Help & Support", tab: "help" },
        ].map((q) => (
          <button key={q.tab} onClick={() => setTab(q.tab)}
            className="neu-raised"
            style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: "var(--r-lg)", fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)" }}
          >
            <span style={{ fontSize: 20 }}>{q.icon}</span> {q.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Profile panel ────────────────────────────────────────────────
function ProfilePanel({ user, dispatch }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm({ first_name: user.first_name || "", last_name: user.last_name || "", phone: user.phone || "", bio: user.bio || "" });
  }, [user]);

  const save = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch("/auth/profile/", form);
      await dispatch(fetchProfile());
      toast.success("Profile updated!");
      setEditing(false);
    } catch {
      toast.error("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="neu-raised" style={{ padding: 28 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28, paddingBottom: 22, borderBottom: "1px solid var(--border)" }}>
          <Avatar user={user} size={80} />
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 800, fontSize: "1.2rem" }}>{[user.first_name, user.last_name].filter(Boolean).join(" ") || "—"}</p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>{user.email}</p>
          </div>
          {!editing && (
            <Button onClick={() => setEditing(true)} size="sm">✏️ Edit Profile</Button>
          )}
        </div>

        {!editing ? (
          /* View mode */
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
            <Field label="First Name" value={user.first_name} />
            <Field label="Last Name" value={user.last_name} />
            <Field label="Email" value={user.email} />
            <Field label="Phone" value={user.phone} />
            <div style={{ gridColumn: "1/-1" }}>
              <Field label="Bio" value={user.bio} placeholder="No bio added yet" />
            </div>
            {user.date_joined && (
              <div style={{ gridColumn: "1/-1" }}>
                <Field label="Member Since" value={new Date(user.date_joined).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} />
              </div>
            )}
          </div>
        ) : (
          /* Edit mode */
          <form onSubmit={save}>
            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Input label="First Name" value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} />
                <Input label="Last Name" value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} />
              </div>
              <Input label="Email" value={user.email} disabled />
              <Input label="Phone Number" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} icon="📱" placeholder="+91 00000 00000" />
              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Bio</label>
                <textarea
                  className="input-neu"
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  rows={3}
                  placeholder="Tell us about yourself…"
                  style={{ resize: "vertical" }}
                />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <Button type="button" onClick={() => { setEditing(false); setForm({ first_name: user.first_name || "", last_name: user.last_name || "", phone: user.phone || "", bio: user.bio || "" }); }}>Cancel</Button>
                <Button variant="primary" type="submit" loading={loading}>Save Changes</Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Orders panel ─────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    pending:    { bg: "#fff3cd", color: "#856404", label: "Pending"    },
    processing: { bg: "#cff4fc", color: "#055160", label: "Processing" },
    shipped:    { bg: "#d1ecf1", color: "#0c5460", label: "Shipped"    },
    delivered:  { bg: "#d4edda", color: "#155724", label: "Delivered"  },
    cancelled:  { bg: "#f8d7da", color: "#721c24", label: "Cancelled"  },
  };
  const s = map[status] || { bg: "#e2e3e5", color: "#383d41", label: status };
  return (
    <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function OrdersPanel({ orders }) {
  if (orders.length === 0)
    return (
      <div className="neu-raised" style={{ padding: 48, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
        <p style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 8 }}>No Orders Yet</p>
        <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>Looks like you haven't placed any orders.</p>
        <Link to="/products"><Button variant="primary">Start Shopping</Button></Link>
      </div>
    );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-muted)" }}>{orders.length} order{orders.length !== 1 ? "s" : ""}</p>
        <Link to="/orders" style={{ fontSize: "0.85rem", color: "var(--primary)", fontWeight: 600 }}>View All</Link>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {orders.slice(0, 8).map((o) => (
          <Link key={o.id} to={`/orders/${o.id}`} style={{ textDecoration: "none" }}>
            <div className="neu-raised" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateX(4px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = ""}
            >
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: "var(--r-md)", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>📦</div>
                <div>
                  <p style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem" }}>Order #{o.order_number || o.id}</p>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2 }}>
                    {new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    {o.items?.length ? ` · ${o.items.length} item${o.items.length > 1 ? "s" : ""}` : ""}
                  </p>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontWeight: 800, color: "var(--primary)", marginBottom: 4 }}>₹{o.total_amount}</p>
                <StatusBadge status={o.status} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Addresses panel ───────────────────────────────────────────────
const emptyAddr = { full_name: "", phone: "", address_line1: "", address_line2: "", city: "", state: "", postal_code: "", address_type: "home", is_default: false };

function AddressesPanel() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyAddr);
  const [saving, setSaving] = useState(false);

  const load = () => api.get("/auth/addresses/").then(({ data }) => {
    setAddresses(Array.isArray(data) ? data : (data.results ?? []));
    setLoading(false);
  });

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(emptyAddr); setEditingId(null); setShowForm(true); };
  const openEdit = (a) => { setForm({ ...a }); setEditingId(a.id); setShowForm(true); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.patch(`/auth/addresses/${editingId}/`, form);
        toast.success("Address updated!");
      } else {
        await api.post("/auth/addresses/", form);
        toast.success("Address added!");
      }
      setShowForm(false);
      setForm(emptyAddr);
      setEditingId(null);
      load();
    } catch {
      toast.error("Failed to save address.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Remove this address?")) return;
    await api.delete(`/auth/addresses/${id}/`);
    setAddresses((a) => a.filter((x) => x.id !== id));
    toast.success("Address removed.");
  };

  const setDefault = async (id) => {
    await api.patch(`/auth/addresses/${id}/`, { is_default: true });
    load();
  };

  const typeIcon = (t) => t === "work" ? "🏢" : t === "other" ? "📌" : "🏠";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <p style={{ fontWeight: 700, color: "var(--text-muted)", fontSize: "0.9rem" }}>{addresses.length} address{addresses.length !== 1 ? "es" : ""} saved</p>
        <Button variant="primary" size="sm" onClick={openNew}>+ Add New Address</Button>
      </div>

      {showForm && (
        <form onSubmit={save} className="neu-raised" style={{ padding: 24, marginBottom: 20, borderLeft: "3px solid var(--primary)" }}>
          <p style={{ fontWeight: 700, marginBottom: 16 }}>{editingId ? "Edit Address" : "New Address"}</p>
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input label="Full Name" value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} required />
              <Input label="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required />
            </div>
            <Input label="Address Line 1" value={form.address_line1} onChange={(e) => setForm((f) => ({ ...f, address_line1: e.target.value }))} required placeholder="Flat, House no., Building, Street" />
            <Input label="Address Line 2" value={form.address_line2} onChange={(e) => setForm((f) => ({ ...f, address_line2: e.target.value }))} placeholder="Area, Colony (optional)" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Input label="City" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} required />
              <Input label="State" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} required />
              <Input label="PIN Code" value={form.postal_code} onChange={(e) => setForm((f) => ({ ...f, postal_code: e.target.value }))} required />
            </div>
            <div>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>Address Type</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["home", "work", "other"].map((t) => (
                  <button key={t} type="button" onClick={() => setForm((f) => ({ ...f, address_type: t }))}
                    className="btn-neu"
                    style={{ padding: "6px 16px", borderRadius: "var(--r-full)", fontSize: "0.85rem",
                      background: form.address_type === t ? "var(--primary)" : undefined,
                      color: form.address_type === t ? "white" : undefined,
                    }}>
                    {typeIcon(t)} {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: "0.88rem", fontWeight: 500 }}>
              <input type="checkbox" checked={form.is_default} onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))} />
              Set as default address
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <Button type="button" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</Button>
              <Button variant="primary" type="submit" loading={saving}>Save Address</Button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>Loading…</div>
      ) : addresses.length === 0 && !showForm ? (
        <div className="neu-raised" style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📍</div>
          <p style={{ fontWeight: 700, marginBottom: 6 }}>No Addresses Saved</p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>Add a delivery address to speed up checkout.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {addresses.map((a) => (
            <div key={a.id} className="neu-raised" style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 16 }}>{typeIcon(a.address_type)}</span>
                    <span style={{ fontWeight: 700, fontSize: "0.95rem", textTransform: "capitalize" }}>{a.address_type || "Home"}</span>
                    {a.is_default && <span style={{ fontSize: "0.72rem", fontWeight: 700, background: "#d4edda", color: "#155724", padding: "1px 8px", borderRadius: 10 }}>Default</span>}
                  </div>
                  <p style={{ fontWeight: 600, marginBottom: 3 }}>{a.full_name} · {a.phone}</p>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.6 }}>
                    {a.address_line1}{a.address_line2 && `, ${a.address_line2}`}<br />
                    {a.city}, {a.state} – {a.postal_code}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {!a.is_default && (
                    <button onClick={() => setDefault(a.id)} style={{ fontSize: "0.78rem", padding: "4px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg)", cursor: "pointer", fontWeight: 600, color: "var(--primary)" }}>
                      Set Default
                    </button>
                  )}
                  <button onClick={() => openEdit(a)} style={{ fontSize: "0.78rem", padding: "4px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg)", cursor: "pointer", fontWeight: 600 }}>
                    Edit
                  </button>
                  <button onClick={() => remove(a.id)} style={{ fontSize: "0.78rem", padding: "4px 12px", borderRadius: 6, border: "1px solid #f5c6cb", background: "#fff5f5", cursor: "pointer", fontWeight: 600, color: "var(--error, #dc3545)" }}>
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Wishlist panel ────────────────────────────────────────────────
function WishlistPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/wishlist/").then(({ data }) => {
      const list = Array.isArray(data) ? data : (data.results ?? []);
      setItems(list);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: "center", padding: 40 }}>Loading…</div>;

  if (items.length === 0)
    return (
      <div className="neu-raised" style={{ padding: 48, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>❤️</div>
        <p style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 8 }}>Your Wishlist is Empty</p>
        <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>Save items you love to buy them later.</p>
        <Link to="/products"><Button variant="primary">Browse Products</Button></Link>
      </div>
    );

  return (
    <div>
      <p style={{ fontWeight: 700, color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 16 }}>{items.length} saved item{items.length !== 1 ? "s" : ""}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 }}>
        {items.map((item) => {
          const p = item.product || item;
          return (
            <Link key={item.id || p.id} to={`/products/${p.slug}`} style={{ textDecoration: "none" }}>
              <div className="neu-raised" style={{ overflow: "hidden", borderRadius: "var(--r-lg)" }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = ""}
              >
                <div style={{ aspectRatio: "1/1", overflow: "hidden", background: "var(--bg)" }}>
                  {p.primary_image || p.images?.[0]?.image
                    ? <img src={p.primary_image || p.images[0].image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>📦</div>
                  }
                </div>
                <div style={{ padding: "10px 12px" }}>
                  <p style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-primary)", marginBottom: 3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{p.name}</p>
                  <p style={{ fontWeight: 800, color: "var(--primary)", fontSize: "0.9rem" }}>₹{p.effective_price || p.price}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ── Security panel ────────────────────────────────────────────────
function SecurityPanel({ user }) {
  const [pwForm, setPwForm] = useState({ old_password: "", new_password: "", confirm_password: "" });
  const [pwLoading, setPwLoading] = useState(false);

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password) { toast.error("Passwords don't match."); return; }
    if (pwForm.new_password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    setPwLoading(true);
    try {
      await api.post("/auth/change-password/", { old_password: pwForm.old_password, new_password: pwForm.new_password });
      toast.success("Password updated successfully!");
      setPwForm({ old_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to change password.");
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Account info */}
      <div className="neu-raised" style={{ padding: 24 }}>
        <p style={{ fontWeight: 700, marginBottom: 16 }}>Account Information</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
            <div>
              <p style={{ fontSize: "0.85rem", fontWeight: 600 }}>Email Address</p>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{user.email}</p>
            </div>
            <span style={{ fontSize: "0.75rem", background: "#d4edda", color: "#155724", padding: "3px 10px", borderRadius: 12, fontWeight: 700, alignSelf: "center" }}>Verified</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
            <div>
              <p style={{ fontSize: "0.85rem", fontWeight: 600 }}>Password</p>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Last updated recently</p>
            </div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>••••••••</span>
          </div>
          {user.date_joined && (
            <div style={{ padding: "10px 0" }}>
              <p style={{ fontSize: "0.85rem", fontWeight: 600 }}>Account Created</p>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{new Date(user.date_joined).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
            </div>
          )}
        </div>
      </div>

      {/* Change password */}
      <div className="neu-raised" style={{ padding: 24 }}>
        <p style={{ fontWeight: 700, marginBottom: 4 }}>Change Password</p>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 20 }}>Use a strong password that you don't use elsewhere.</p>
        <form onSubmit={changePassword}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input label="Current Password" type="password" value={pwForm.old_password} onChange={(e) => setPwForm((f) => ({ ...f, old_password: e.target.value }))} required />
            <Input label="New Password" type="password" value={pwForm.new_password} onChange={(e) => setPwForm((f) => ({ ...f, new_password: e.target.value }))} required />
            <Input label="Confirm New Password" type="password" value={pwForm.confirm_password} onChange={(e) => setPwForm((f) => ({ ...f, confirm_password: e.target.value }))} required />
            <Button variant="primary" type="submit" loading={pwLoading} style={{ alignSelf: "flex-start" }}>Update Password</Button>
          </div>
        </form>
      </div>

      {/* Danger zone */}
      <div className="neu-raised" style={{ padding: 24, borderLeft: "3px solid var(--error, #dc3545)" }}>
        <p style={{ fontWeight: 700, color: "var(--error, #dc3545)", marginBottom: 6 }}>Danger Zone</p>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 16 }}>
          Once you delete your account, there is no going back. All your orders, addresses, and data will be permanently removed.
        </p>
        <button
          type="button"
          onClick={() => toast.error("Please contact support to delete your account.")}
          style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid var(--error, #dc3545)", background: "white", color: "var(--error, #dc3545)", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}

// ── Notifications panel ───────────────────────────────────────────
const NOTIF_DEFAULTS = {
  order_updates: true,
  promotional_emails: false,
  price_drops: true,
  new_arrivals: false,
  review_reminders: true,
  sms_updates: false,
};

function NotificationsPanel() {
  const stored = JSON.parse(localStorage.getItem("notif_prefs") || "null");
  const [prefs, setPrefs] = useState({ ...NOTIF_DEFAULTS, ...stored });

  const toggle = (key) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    localStorage.setItem("notif_prefs", JSON.stringify(updated));
    toast.success("Preference saved.");
  };

  const sections = [
    {
      title: "Order Notifications",
      items: [
        { key: "order_updates", label: "Order Status Updates", desc: "Get notified when your order is packed, shipped, or delivered" },
        { key: "sms_updates", label: "SMS Alerts", desc: "Receive order updates via SMS on your registered mobile number" },
      ],
    },
    {
      title: "Marketing & Offers",
      items: [
        { key: "promotional_emails", label: "Promotional Emails", desc: "Sale alerts, discount codes, and seasonal offers" },
        { key: "price_drops", label: "Price Drop Alerts", desc: "Get notified when wishlist items go on sale" },
        { key: "new_arrivals", label: "New Arrivals", desc: "Be the first to know about new eco products" },
      ],
    },
    {
      title: "Activity",
      items: [
        { key: "review_reminders", label: "Review Reminders", desc: "Reminders to review products you've purchased" },
      ],
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {sections.map((sec) => (
        <div key={sec.title} className="neu-raised" style={{ padding: 24 }}>
          <p style={{ fontWeight: 700, marginBottom: 16 }}>{sec.title}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {sec.items.map((item, i) => (
              <div key={item.key} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "14px 0", borderBottom: i < sec.items.length - 1 ? "1px solid var(--border)" : "none",
              }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>{item.label}</p>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2 }}>{item.desc}</p>
                </div>
                <button
                  onClick={() => toggle(item.key)}
                  style={{
                    width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                    background: prefs[item.key] ? "var(--primary)" : "#ccc",
                    position: "relative", transition: "background 0.2s", flexShrink: 0,
                  }}
                >
                  <span style={{
                    position: "absolute", top: 3, width: 18, height: 18, borderRadius: "50%",
                    background: "white", transition: "left 0.2s",
                    left: prefs[item.key] ? 23 : 3,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Help panel ────────────────────────────────────────────────────
function HelpPanel() {
  const faqs = [
    { q: "How do I track my order?", a: "Go to My Orders and click on any order to see real-time tracking information." },
    { q: "What is your return policy?", a: "We offer a 7-day hassle-free return policy. Products must be unused and in original packaging." },
    { q: "How long does delivery take?", a: "Standard delivery takes 5–7 business days. Express delivery (available at checkout) takes 1–2 days." },
    { q: "How do I cancel an order?", a: "You can cancel orders that are still in 'Pending' or 'Processing' status from the Order Detail page." },
    { q: "Are your products really eco-friendly?", a: "Yes! All products are verified sustainable. We partner only with certified eco-friendly suppliers." },
    { q: "How do I apply a coupon code?", a: "Enter your coupon code in the Checkout page in the 'Promo Code' field." },
  ];

  const [open, setOpen] = useState(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Contact options */}
      <div className="neu-raised" style={{ padding: 24 }}>
        <p style={{ fontWeight: 700, marginBottom: 16 }}>Contact Support</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          {[
            { icon: "✉️", label: "Email Us", sub: "support@asmicrog.com" },
            { icon: "💬", label: "Live Chat", sub: "Mon–Sat, 9am–6pm" },
            { icon: "📞", label: "Call Us", sub: "+91 98765 43210" },
          ].map((c) => (
            <div key={c.label} className="neu-raised" style={{ padding: "16px", textAlign: "center", borderRadius: "var(--r-lg)" }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{c.icon}</div>
              <p style={{ fontWeight: 700, fontSize: "0.88rem" }}>{c.label}</p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 3 }}>{c.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <div className="neu-raised" style={{ padding: 24 }}>
        <p style={{ fontWeight: 700, marginBottom: 16 }}>Frequently Asked Questions</p>
        {faqs.map((f, i) => (
          <div key={i} style={{ borderBottom: i < faqs.length - 1 ? "1px solid var(--border)" : "none" }}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              style={{ all: "unset", cursor: "pointer", width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", fontWeight: 600, fontSize: "0.9rem" }}
            >
              {f.q}
              <span style={{ color: "var(--primary)", fontSize: "1.1rem", lineHeight: 1 }}>{open === i ? "−" : "+"}</span>
            </button>
            {open === i && (
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.7, paddingBottom: 14 }}>{f.a}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function ProfilePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const [tab, setTab] = useState("overview");
  const [orders, setOrders] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [addressCount, setAddressCount] = useState(0);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    api.get("/orders/").then(({ data }) => setOrders(Array.isArray(data) ? data : (data.results ?? []))).catch(() => {});
    api.get("/wishlist/").then(({ data }) => setWishlistCount(Array.isArray(data) ? data.length : (data.results?.length ?? 0))).catch(() => {});
    api.get("/auth/addresses/").then(({ data }) => setAddressCount((Array.isArray(data) ? data : (data.results ?? [])).length)).catch(() => {});
  }, [user]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
    toast.success("Logged out.");
  };

  if (!user) return null;

  const PANELS = {
    overview:      <OverviewPanel user={user} orders={orders} addressCount={addressCount} wishlistCount={wishlistCount} setTab={setTab} />,
    profile:       <ProfilePanel user={user} dispatch={dispatch} />,
    orders:        <OrdersPanel orders={orders} />,
    addresses:     <AddressesPanel />,
    wishlist:      <WishlistPanel />,
    security:      <SecurityPanel user={user} />,
    notifications: <NotificationsPanel />,
    help:          <HelpPanel />,
  };

  const currentNav = NAV.find((n) => n.id === tab);

  return (
    <main className="main-content">
      <div className="container" style={{ padding: "28px 16px 60px" }}>

        {/* Mobile tab bar */}
        <div style={{ display: "none" }} className="mobile-nav-tabs">
          <div style={{ overflowX: "auto", display: "flex", gap: 6, marginBottom: 20, paddingBottom: 4 }}>
            {NAV.map((n) => (
              <button key={n.id} onClick={() => setTab(n.id)} className="btn-neu"
                style={{ flexShrink: 0, padding: "6px 14px", borderRadius: "var(--r-full)", fontSize: "0.8rem",
                  background: tab === n.id ? "var(--primary)" : undefined,
                  color: tab === n.id ? "white" : undefined,
                }}>
                {n.icon} {n.label}
              </button>
            ))}
          </div>
        </div>

        <style>{`
          @media (max-width: 720px) {
            .profile-layout { flex-direction: column !important; }
            .profile-sidebar { display: none !important; }
            .mobile-nav-tabs { display: block !important; }
          }
        `}</style>

        <div className="profile-layout" style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>

          {/* Sidebar */}
          <aside className="profile-sidebar" style={{ width: 240, flexShrink: 0, position: "sticky", top: 80 }}>
            {/* User card */}
            <div className="neu-raised" style={{ padding: 20, textAlign: "center", marginBottom: 12 }}>
              <Avatar user={user} size={64} />
              <p style={{ fontWeight: 700, marginTop: 12, fontSize: "0.95rem" }}>
                {[user.first_name, user.last_name].filter(Boolean).join(" ") || "—"}
              </p>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 3, wordBreak: "break-all" }}>{user.email}</p>
            </div>

            {/* Nav links */}
            <nav className="neu-raised" style={{ overflow: "hidden" }}>
              {NAV.map((n, i) => (
                <button
                  key={n.id}
                  onClick={() => setTab(n.id)}
                  style={{
                    all: "unset", cursor: "pointer", width: "100%",
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "13px 18px",
                    borderBottom: i < NAV.length - 1 ? "1px solid var(--border)" : "none",
                    background: tab === n.id ? "var(--primary-bg, #f0f9f0)" : "transparent",
                    color: tab === n.id ? "var(--primary)" : "var(--text-primary)",
                    fontWeight: tab === n.id ? 700 : 500,
                    fontSize: "0.875rem",
                    borderLeft: tab === n.id ? "3px solid var(--primary)" : "3px solid transparent",
                    transition: "background 0.15s",
                  }}
                >
                  <span style={{ fontSize: 16, lineHeight: 1 }}>{n.icon}</span>
                  {n.label}
                  {tab === n.id && <span style={{ marginLeft: "auto", fontSize: 12 }}>›</span>}
                </button>
              ))}

              {/* Logout */}
              <button
                onClick={handleLogout}
                style={{
                  all: "unset", cursor: "pointer", width: "100%",
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "13px 18px",
                  color: "var(--error, #dc3545)",
                  fontWeight: 600, fontSize: "0.875rem",
                  borderLeft: "3px solid transparent",
                  borderTop: "1px solid var(--border)",
                }}
              >
                <span style={{ fontSize: 16 }}>🚪</span>
                Log Out
              </button>
            </nav>
          </aside>

          {/* Main content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 800 }}>
                {currentNav?.icon} {currentNav?.label}
              </h2>
              {tab !== "overview" && (
                <button onClick={() => setTab("overview")} style={{ fontSize: "0.8rem", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>
                  ← Back to Overview
                </button>
              )}
            </div>

            {PANELS[tab]}
          </div>
        </div>
      </div>
    </main>
  );
}
