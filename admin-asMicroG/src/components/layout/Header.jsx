import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function Header({ onMenuClick }) {
  const [admin, setAdmin] = useState(() => JSON.parse(localStorage.getItem("admin_user") || "null"));
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/auth/profile/").then(({ data }) => {
      setAdmin(data);
      localStorage.setItem("admin_user", JSON.stringify(data));
    }).catch(() => {});
  }, []);

  const logout = () => {
    localStorage.removeItem("admin_tokens");
    localStorage.removeItem("admin_user");
    navigate("/login");
  };

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "rgba(26,43,26,0.9)", backdropFilter: "blur(10px)",
      borderBottom: "1px solid var(--border)",
      padding: "0 20px", height: 60,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <button onClick={onMenuClick} className="btn-admin" style={{ padding: 8 }} aria-label="Toggle sidebar">
        ☰
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontWeight: 600, fontSize: "0.88rem", lineHeight: 1 }}>{admin?.first_name || "Admin"}</p>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Administrator</p>
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "linear-gradient(135deg, var(--primary-dark), var(--primary))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, color: "white",
        }}>
          {admin?.first_name?.[0]?.toUpperCase() || "A"}
        </div>
        <button className="btn-admin" style={{ padding: "5px 10px", fontSize: "0.78rem" }} onClick={logout}>
          Logout
        </button>
      </div>
    </header>
  );
}
