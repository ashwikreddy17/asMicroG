import { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

export default function CustomersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    api.get("/auth/admin/users/", { params: { search } })
      .then(({ data }) => setUsers(data.results || data))
      .finally(() => setLoading(false));
  }, [search]);

  const handleBan = async (user) => {
    const reason = user.is_banned ? null : prompt("Reason for ban:");
    if (!user.is_banned && !reason) return;
    try {
      if (user.is_banned) {
        await api.post(`/auth/admin/users/${user.id}/unban/`);
        toast.success("User unbanned.");
      } else {
        await api.post(`/auth/admin/users/${user.id}/ban/`, { reason });
        toast.success("User banned.");
      }
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_banned: !u.is_banned, is_active: u.is_banned } : u));
    } catch {
      toast.error("Action failed.");
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: 20 }}>Customers</h1>
      <input className="input-admin" placeholder="Search by name, email, phone…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 340, marginBottom: 16 }} />
      <div className="card-admin" style={{ overflow: "hidden" }}>
        <table className="table-admin">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Joined</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 32 }}><div className="spinner-admin" style={{ margin: "auto" }} /></td></tr>
            ) : users.map((u) => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {u.avatar ? (
                      <img src={u.avatar} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--primary-dark)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.85rem" }}>
                        {u.first_name?.[0] || u.username?.[0] || "?"}
                      </div>
                    )}
                    <span style={{ fontWeight: 500 }}>{u.first_name} {u.last_name}</span>
                  </div>
                </td>
                <td style={{ fontSize: "0.85rem" }}>{u.email}</td>
                <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{u.phone || "—"}</td>
                <td style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  {new Date(u.date_joined).toLocaleDateString("en-IN")}
                </td>
                <td>
                  <span className={`badge-admin ${u.is_banned ? "badge-error" : u.is_verified ? "badge-success" : "badge-warning"}`}>
                    {u.is_banned ? "Banned" : u.is_verified ? "Verified" : "Active"}
                  </span>
                </td>
                <td>
                  <button
                    className={`btn-admin ${u.is_banned ? "" : "btn-danger-admin"}`}
                    style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                    onClick={() => handleBan(u)}
                  >
                    {u.is_banned ? "Unban" : "Ban"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
