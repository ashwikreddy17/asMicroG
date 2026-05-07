import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/login/`, form);
      // Verify staff access
      const profileRes = await axios.get(`${API}/auth/profile/`, { headers: { Authorization: `Bearer ${data.access}` } });
      if (!profileRes.data.is_staff) {
        toast.error("Access denied. Admin only.");
        return;
      }
      localStorage.setItem("admin_tokens", JSON.stringify(data));
      localStorage.setItem("admin_user", JSON.stringify(profileRes.data));
      toast.success("Welcome, Admin!");
      navigate("/");
    } catch {
      toast.error("Invalid credentials or insufficient permissions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100dvh", background: "var(--bg)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-admin"
        style={{ width: "100%", maxWidth: 400, padding: 36 }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%", margin: "0 auto 12px",
            background: "linear-gradient(135deg, var(--primary-dark), var(--primary))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 22, color: "white",
          }}>A</div>
          <h1 style={{ fontSize: "1.5rem" }}>Admin Panel</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginTop: 4 }}>ASMICROG</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: "0.82rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Username / Email</label>
            <input className="input-admin" type="text" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} required placeholder="admin@example.com" />
          </div>
          <div>
            <label style={{ fontSize: "0.82rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Password</label>
            <input className="input-admin" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required placeholder="••••••••" />
          </div>
          <button type="submit" className="btn-admin btn-primary-admin" disabled={loading} style={{ marginTop: 4, padding: "11px 0", width: "100%", fontSize: "0.95rem" }}>
            {loading ? <span className="spinner-admin" style={{ width: 20, height: 20, borderWidth: 2 }} /> : "Sign In"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
