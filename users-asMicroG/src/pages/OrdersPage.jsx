import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { getOrders } from "../services/orderService";
import Spinner from "../components/ui/Spinner";

const STATUS_COLORS = {
  pending: { bg: "#fff3e0", color: "#e65100" },
  processing: { bg: "#e3f2fd", color: "#1565c0" },
  shipped: { bg: "#e8eaf6", color: "#3949ab" },
  delivered: { bg: "#e8f5e9", color: "#2e7d32" },
  cancelled: { bg: "#ffebee", color: "#c62828" },
  refunded: { bg: "#f3e5f5", color: "#6a1b9a" },
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    getOrders()
      .then(({ data }) => setOrders(data.results || data))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <Spinner center />;

  return (
    <main className="main-content">
      <div className="container" style={{ padding: "24px 16px 48px", maxWidth: 860 }}>
        <h1 style={{ marginBottom: 8 }}>My Orders</h1>
        <p style={{ color: "var(--text-muted)", marginBottom: 28 }}>{orders.length} order{orders.length !== 1 ? "s" : ""}</p>

        {orders.length === 0 ? (
          <div className="neu-raised" style={{ padding: "64px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📦</div>
            <h3>No orders yet</h3>
            <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>Time to start shopping!</p>
            <Link to="/products" className="btn-neu btn-primary" style={{ display: "inline-flex", borderRadius: "var(--r-full)" }}>
              Browse Products
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {orders.map((order) => {
              const sc = STATUS_COLORS[order.status] || {};
              return (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <div className="card" style={{ padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 4 }}>#{order.order_number}</p>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                          {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      </div>
                      <span style={{
                        padding: "4px 14px", borderRadius: "var(--r-full)", fontSize: "0.82rem", fontWeight: 700,
                        background: sc.bg, color: sc.color,
                      }}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: 8, overflowX: "auto", margin: "14px 0" }}>
                      {order.items?.slice(0, 4).map((item) => (
                        <img
                          key={item.id}
                          src={item.product_detail?.primary_image?.image || "/placeholder.png"}
                          alt={item.product_name}
                          style={{ width: 52, height: 52, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
                        />
                      ))}
                      {order.items?.length > 4 && (
                        <div style={{
                          width: 52, height: 52, borderRadius: 8, background: "var(--bg)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", flexShrink: 0,
                        }}>
                          +{order.items.length - 4}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{order.items?.length} item{order.items?.length !== 1 ? "s" : ""}</span>
                      <span className="price" style={{ fontSize: "1.1rem" }}>₹{order.final_amount}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
