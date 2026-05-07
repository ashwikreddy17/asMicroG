import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: "var(--bg)" }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div style={{
        flex: 1,
        marginLeft: sidebarOpen ? "var(--sidebar-width)" : 0,
        transition: "margin-left 0.25s ease",
        minWidth: 0,
      }}>
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main style={{ padding: "24px 20px 40px" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
