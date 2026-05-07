import { useState, useEffect, useRef } from "react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import api from "../services/api";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const CHART_OPTIONS = (title) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: "var(--text-secondary)" } }, title: { display: !!title, text: title, color: "var(--text-primary)" } },
  scales: {
    x: { ticks: { color: "var(--text-muted)" }, grid: { color: "rgba(255,255,255,0.04)" } },
    y: { ticks: { color: "var(--text-muted)" }, grid: { color: "rgba(255,255,255,0.04)" } },
  },
});

const GREEN = "rgba(76,175,80,0.85)";
const GREEN_BORDER = "#4caf50";
const TEAL = "rgba(38,166,154,0.8)";
const AMBER = "rgba(255,193,7,0.8)";

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("30");
  const [sales, setSales] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/analytics/admin/sales-chart/", { params: { days: period } }),
      api.get("/analytics/admin/monthly-revenue/"),
      api.get("/analytics/admin/top-products/", { params: { limit: 8 } }),
      api.get("/analytics/admin/category-breakdown/"),
    ]).then(([salesRes, monthlyRes, topRes, catRes]) => {
      setSales(salesRes.data);
      setMonthly(monthlyRes.data);
      setTopProducts(topRes.data.results || topRes.data);
      setCategoryBreakdown(catRes.data);
    }).finally(() => setLoading(false));
  }, [period]);

  const salesChart = sales ? {
    labels: sales.map((d) => d.date),
    datasets: [{
      label: "Revenue (₹)",
      data: sales.map((d) => d.revenue),
      borderColor: GREEN_BORDER,
      backgroundColor: "rgba(76,175,80,0.18)",
      fill: true,
      tension: 0.4,
      pointRadius: 3,
    }],
  } : null;

  const monthlyChart = monthly ? {
    labels: monthly.map((d) => d.month),
    datasets: [
      { label: "Revenue (₹)", data: monthly.map((d) => d.revenue), backgroundColor: GREEN, borderRadius: 6 },
      { label: "Orders", data: monthly.map((d) => d.orders), backgroundColor: TEAL, borderRadius: 6 },
    ],
  } : null;

  const topProductsChart = topProducts.length ? {
    labels: topProducts.map((p) => p.name?.slice(0, 20)),
    datasets: [{ label: "Units Sold", data: topProducts.map((p) => p.units_sold), backgroundColor: AMBER, borderRadius: 6 }],
  } : null;

  const categoryChart = categoryBreakdown ? {
    labels: categoryBreakdown.map((c) => c.category),
    datasets: [{
      data: categoryBreakdown.map((c) => c.revenue),
      backgroundColor: ["#4caf50", "#26a69a", "#ffc107", "#ef5350", "#7e57c2", "#42a5f5", "#ff7043"],
    }],
  } : null;

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 80 }}><div className="spinner-admin" /></div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1>Analytics</h1>
        <div style={{ display: "flex", gap: 8 }}>
          {[["7", "7 days"], ["30", "30 days"], ["90", "90 days"]].map(([v, l]) => (
            <button key={v} className="btn-admin"
              style={{ background: period === v ? "var(--primary-dark)" : undefined, color: period === v ? "white" : undefined }}
              onClick={() => setPeriod(v)}>{l}</button>
          ))}
        </div>
      </div>

      {/* Revenue trend */}
      {salesChart && (
        <div className="card-admin" style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ marginBottom: 16, fontSize: "0.95rem", color: "var(--text-secondary)" }}>Revenue Trend — Last {period} Days</h3>
          <div style={{ height: 260 }}>
            <Line data={salesChart} options={{
              ...CHART_OPTIONS(),
              plugins: { ...CHART_OPTIONS().plugins, legend: { display: false } },
            }} />
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Monthly bar */}
        {monthlyChart && (
          <div className="card-admin" style={{ padding: 20 }}>
            <h3 style={{ marginBottom: 16, fontSize: "0.95rem", color: "var(--text-secondary)" }}>Monthly Revenue & Orders</h3>
            <div style={{ height: 240 }}>
              <Bar data={monthlyChart} options={CHART_OPTIONS()} />
            </div>
          </div>
        )}

        {/* Category doughnut */}
        {categoryChart && (
          <div className="card-admin" style={{ padding: 20 }}>
            <h3 style={{ marginBottom: 16, fontSize: "0.95rem", color: "var(--text-secondary)" }}>Revenue by Category</h3>
            <div style={{ height: 240, display: "flex", justifyContent: "center" }}>
              <Doughnut data={categoryChart} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "right", labels: { color: "var(--text-secondary)", boxWidth: 12 } } },
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Top products chart */}
      {topProductsChart && (
        <div className="card-admin" style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ marginBottom: 16, fontSize: "0.95rem", color: "var(--text-secondary)" }}>Top Products by Units Sold</h3>
          <div style={{ height: 240 }}>
            <Bar data={topProductsChart} options={{ ...CHART_OPTIONS(), indexAxis: "y" }} />
          </div>
        </div>
      )}

      {/* Top products table */}
      {topProducts.length > 0 && (
        <div className="card-admin" style={{ overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: "0.95rem", color: "var(--text-secondary)", margin: 0 }}>Top Products Detail</h3>
          </div>
          <table className="table-admin">
            <thead>
              <tr><th>#</th><th>Product</th><th>Units Sold</th><th>Revenue</th><th>Avg Order Value</th></tr>
            </thead>
            <tbody>
              {topProducts.map((p, i) => (
                <tr key={p.id}>
                  <td style={{ color: "var(--text-muted)", width: 40 }}>{i + 1}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {p.image && <img src={p.image} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover" }} />}
                      <div>
                        <p style={{ fontWeight: 600, fontSize: "0.88rem" }}>{p.name}</p>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{p.category}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, color: "var(--primary-light)" }}>{p.units_sold}</td>
                  <td style={{ fontWeight: 600 }}>₹{Number(p.revenue || 0).toLocaleString("en-IN")}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    ₹{p.units_sold ? Math.round(p.revenue / p.units_sold).toLocaleString("en-IN") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
