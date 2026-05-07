import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import api from "../services/api";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

function StatCard({ label, value, icon, trend, color = "var(--primary)" }) {
  return (
    <div className="stat-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 6 }}>{label}</p>
          <p style={{ fontSize: "1.6rem", fontWeight: 800, color }}>{value}</p>
          {trend && <p style={{ fontSize: "0.78rem", color: trend > 0 ? "var(--success)" : "var(--error)", marginTop: 4 }}>
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}% this month
          </p>}
        </div>
        <span style={{
          width: 40, height: 40, borderRadius: "var(--r-md)",
          background: `${color}20`, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 22,
        }}>{icon}</span>
      </div>
    </div>
  );
}

const chartDefaults = {
  plugins: { legend: { labels: { color: "#a5d6a7", font: { family: "Inter" } } } },
  scales: {
    x: { ticks: { color: "#6a9b6a" }, grid: { color: "rgba(76,175,80,0.08)" } },
    y: { ticks: { color: "#6a9b6a" }, grid: { color: "rgba(76,175,80,0.08)" } },
  },
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/analytics/dashboard/"),
      api.get("/analytics/sales/?days=30"),
      api.get("/analytics/top-products/?limit=5"),
      api.get("/analytics/low-stock/"),
    ]).then(([s, sales, top, low]) => {
      setStats(s.data);
      setSalesData(sales.data);
      setTopProducts(top.data);
      setLowStock(low.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 64 }}><div className="spinner-admin" /></div>;

  const salesChartData = {
    labels: salesData.map((d) => new Date(d.day).toLocaleDateString("en-IN", { day: "numeric", month: "short" })),
    datasets: [{
      label: "Revenue (₹)",
      data: salesData.map((d) => parseFloat(d.revenue || 0)),
      backgroundColor: "rgba(76,175,80,0.2)",
      borderColor: "rgba(76,175,80,0.8)",
      fill: true, tension: 0.4, pointRadius: 3,
    }],
  };

  const statusData = {
    labels: stats?.order_status_breakdown?.map((s) => s.status) || [],
    datasets: [{
      data: stats?.order_status_breakdown?.map((s) => s.count) || [],
      backgroundColor: ["#ffa726", "#42a5f5", "#7e57c2", "#4caf50", "#ef5350", "#ab47bc"],
      borderWidth: 0,
    }],
  };

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>Dashboard</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 24, fontSize: "0.9rem" }}>
        {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
      </p>

      {/* Stats grid */}
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: 28 }}>
        <StatCard label="Total Revenue" value={`₹${(stats?.total_revenue || 0).toLocaleString("en-IN")}`} icon="💰" color="var(--success)" />
        <StatCard label="Monthly Revenue" value={`₹${(stats?.monthly_revenue || 0).toLocaleString("en-IN")}`} icon="📈" />
        <StatCard label="Orders Today" value={stats?.orders_today || 0} icon="🧾" />
        <StatCard label="Total Customers" value={(stats?.total_customers || 0).toLocaleString("en-IN")} icon="👥" />
        <StatCard label="New Customers" value={stats?.new_customers_month || 0} icon="🆕" />
        {stats?.low_stock_count > 0 && (
          <StatCard label="Low Stock Alerts" value={stats.low_stock_count} icon="⚠️" color="var(--warning)" />
        )}
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gap: 20, gridTemplateColumns: "2fr 1fr", marginBottom: 28 }}>
        <div className="card-admin" style={{ padding: 20 }}>
          <h3 style={{ marginBottom: 16, fontSize: "0.95rem" }}>Revenue (Last 30 Days)</h3>
          <Line data={salesChartData} options={{ ...chartDefaults, responsive: true, plugins: { ...chartDefaults.plugins, legend: { display: false } } }} />
        </div>
        <div className="card-admin" style={{ padding: 20 }}>
          <h3 style={{ marginBottom: 16, fontSize: "0.95rem" }}>Orders by Status</h3>
          <Doughnut data={statusData} options={{ responsive: true, plugins: { legend: { position: "bottom", labels: { color: "#a5d6a7", font: { family: "Inter", size: 11 }, padding: 10 } } } }} />
        </div>
      </div>

      {/* Tables row */}
      <div style={{ display: "grid", gap: 20, gridTemplateColumns: "1fr 1fr" }}>
        {/* Top Products */}
        <div className="card-admin" style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: "0.95rem" }}>Top Products</h3>
            <Link to="/products" style={{ fontSize: "0.8rem", color: "var(--primary)" }}>View all →</Link>
          </div>
          <table className="table-admin">
            <thead><tr><th>Product</th><th>Sold</th><th>Revenue</th></tr></thead>
            <tbody>
              {topProducts.map((p, i) => (
                <tr key={i}>
                  <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.product__name}</td>
                  <td>{p.total_sold}</td>
                  <td>₹{parseFloat(p.revenue || 0).toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Low Stock */}
        <div className="card-admin" style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: "0.95rem" }}>⚠️ Low Stock</h3>
            <Link to="/products" style={{ fontSize: "0.8rem", color: "var(--primary)" }}>Manage →</Link>
          </div>
          {lowStock.length === 0 ? (
            <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "24px 0", fontSize: "0.9rem" }}>All products well-stocked ✓</p>
          ) : (
            <table className="table-admin">
              <thead><tr><th>Product</th><th>SKU</th><th>Stock</th></tr></thead>
              <tbody>
                {lowStock.map((p) => (
                  <tr key={p.id}>
                    <td style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{p.sku}</td>
                    <td><span className={`badge-admin ${p.stock === 0 ? "badge-error" : "badge-warning"}`}>{p.stock}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
