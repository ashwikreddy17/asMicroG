import { useState, useEffect } from "react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import api from "../services/api";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const CHART_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: "var(--text-secondary)", font: { size: 12 } } } },
  scales: {
    x: { ticks: { color: "var(--text-muted)" }, grid: { color: "rgba(76,175,80,0.08)" } },
    y: { ticks: { color: "var(--text-muted)" }, grid: { color: "rgba(76,175,80,0.08)" } },
  },
};

const GREEN = "rgba(76,175,80,0.8)";
const TEAL = "rgba(38,166,154,0.8)";
const AMBER = "rgba(255,193,7,0.8)";
const PALETTE = ["#4caf50","#26a69a","#ffc107","#ef5350","#7e57c2","#42a5f5","#ff7043","#ec407a"];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("30");
  const [sales, setSales] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/analytics/sales/", { params: { days: period } }),
      api.get("/analytics/monthly/"),
      api.get("/analytics/top-products/", { params: { limit: 8 } }),
      api.get("/analytics/category-breakdown/"),
    ]).then(([salesRes, monthlyRes, topRes, catRes]) => {
      setSales(salesRes.data);
      setMonthly(monthlyRes.data);
      setTopProducts(topRes.data);
      setCategories(catRes.data);
    }).finally(() => setLoading(false));
  }, [period]);

  const salesChart = sales.length ? {
    labels: sales.map((d) => d.date),
    datasets: [{
      label: "Revenue (₹)",
      data: sales.map((d) => d.revenue),
      borderColor: "#4caf50",
      backgroundColor: "rgba(76,175,80,0.15)",
      fill: true, tension: 0.4, pointRadius: 3,
    }],
  } : null;

  const monthlyChart = monthly.length ? {
    labels: monthly.map((d) => d.month),
    datasets: [
      { label: "Revenue (₹)", data: monthly.map((d) => d.revenue), backgroundColor: GREEN, borderRadius: 6 },
      { label: "Orders", data: monthly.map((d) => d.orders), backgroundColor: TEAL, borderRadius: 6 },
    ],
  } : null;

  const topChart = topProducts.length ? {
    labels: topProducts.map((p) => (p.name || "").slice(0, 22)),
    datasets: [{ label: "Units Sold", data: topProducts.map((p) => p.units_sold), backgroundColor: AMBER, borderRadius: 6 }],
  } : null;

  const catChart = categories.length ? {
    labels: categories.map((c) => c.category),
    datasets: [{
      data: categories.map((c) => c.revenue),
      backgroundColor: PALETTE,
      borderWidth: 0,
    }],
  } : null;

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 80 }}><div className="spinner-admin" /></div>;

  const empty = (msg) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)", fontSize: "0.88rem" }}>{msg}</div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1>Analytics</h1>
        <div style={{ display: "flex", gap: 6 }}>
          {[["7", "7 days"], ["30", "30 days"], ["90", "90 days"]].map(([v, l]) => (
            <button key={v} className="btn-admin"
              style={{ background: period === v ? "var(--primary-dark)" : undefined, color: period === v ? "white" : undefined }}
              onClick={() => setPeriod(v)}>{l}</button>
          ))}
        </div>
      </div>

      {/* Revenue trend */}
      <div className="card-admin" style={{ padding: 20, marginBottom: 20 }}>
        <h3 style={{ marginBottom: 16, fontSize: "0.95rem" }}>Revenue Trend — Last {period} Days</h3>
        <div style={{ height: 260 }}>
          {salesChart
            ? <Line data={salesChart} options={{ ...CHART_OPTS, plugins: { ...CHART_OPTS.plugins, legend: { display: false } } }} />
            : empty("No paid orders in this period")}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <div className="card-admin" style={{ padding: 20 }}>
          <h3 style={{ marginBottom: 16, fontSize: "0.95rem" }}>Monthly Revenue & Orders</h3>
          <div style={{ height: 240 }}>
            {monthlyChart ? <Bar data={monthlyChart} options={CHART_OPTS} /> : empty("No data yet")}
          </div>
        </div>
        <div className="card-admin" style={{ padding: 20 }}>
          <h3 style={{ marginBottom: 16, fontSize: "0.95rem" }}>Revenue by Category</h3>
          <div style={{ height: 240, display: "flex", justifyContent: "center" }}>
            {catChart
              ? <Doughnut data={catChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "right", labels: { color: "var(--text-secondary)", boxWidth: 12 } } } }} />
              : empty("No sales data")}
          </div>
        </div>
      </div>

      {topChart && (
        <div className="card-admin" style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ marginBottom: 16, fontSize: "0.95rem" }}>Top Products by Units Sold</h3>
          <div style={{ height: 240 }}>
            <Bar data={topChart} options={{ ...CHART_OPTS, indexAxis: "y" }} />
          </div>
        </div>
      )}

      {topProducts.length > 0 && (
        <div className="card-admin" style={{ overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: "0.95rem", margin: 0 }}>Top Products Detail</h3>
          </div>
          <table className="table-admin">
            <thead>
              <tr><th>#</th><th>Product</th><th>Category</th><th>Units Sold</th><th>Revenue</th><th>Avg/Unit</th></tr>
            </thead>
            <tbody>
              {topProducts.map((p, i) => (
                <tr key={p.id}>
                  <td style={{ color: "var(--text-muted)", width: 40 }}>{i + 1}</td>
                  <td style={{ fontWeight: 600, fontSize: "0.88rem" }}>{p.name}</td>
                  <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{p.category}</td>
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
