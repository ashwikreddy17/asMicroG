import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { selectCart, selectShipping, fetchCart, updateCartItem, removeCartItem } from "../store/cartSlice";
import Spinner from "../components/ui/Spinner";
import toast from "react-hot-toast";

function CartItemRow({ item }) {
  const dispatch = useDispatch();
  const img = item.product_detail?.primary_image?.image || "/placeholder.png";

  const adjust = async (qty) => {
    if (qty < 1) {
      await dispatch(removeCartItem(item.id));
      toast.success("Item removed");
    } else {
      await dispatch(updateCartItem({ itemId: item.id, quantity: qty }));
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      style={{ display: "flex", gap: 16, padding: "20px 0", borderBottom: "1px solid var(--border-light)" }}
    >
      <Link to={`/products/${item.product_detail?.slug}`}>
        <img src={img} alt={item.product_detail?.name} style={{ width: 90, height: 90, borderRadius: 12, objectFit: "cover", flexShrink: 0, display: "block" }} />
      </Link>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link to={`/products/${item.product_detail?.slug}`} style={{ fontWeight: 700, fontSize: "0.98rem", color: "var(--text-primary)", display: "block", marginBottom: 4 }}>
          {item.product_detail?.name}
        </Link>
        {item.variant_detail && (
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 8 }}>
            {item.variant_detail.name}: {item.variant_detail.value}
          </p>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 0, border: "1.5px solid var(--border-light)", borderRadius: 10, overflow: "hidden" }}>
            <button onClick={() => adjust(item.quantity - 1)} style={{ padding: "6px 14px", background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", color: "var(--text-primary)", fontWeight: 700 }}>−</button>
            <span style={{ padding: "6px 10px", fontWeight: 700, fontSize: "0.95rem", borderLeft: "1.5px solid var(--border-light)", borderRight: "1.5px solid var(--border-light)" }}>{item.quantity}</span>
            <button onClick={() => adjust(item.quantity + 1)} style={{ padding: "6px 14px", background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", color: "var(--text-primary)", fontWeight: 700 }}>+</button>
          </div>
          <button onClick={() => adjust(0)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--error)", fontSize: "0.82rem", fontWeight: 600, padding: "6px 0" }}>
            Remove
          </button>
        </div>
      </div>
      <div style={{ flexShrink: 0, textAlign: "right", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <span className="price" style={{ fontSize: "1.05rem" }}>₹{item.subtotal}</span>
        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>₹{item.unit_price} × {item.quantity}</span>
      </div>
    </motion.div>
  );
}

export default function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cart = useSelector(selectCart);
  const loading = useSelector((s) => s.cart.loading);
  const shippingSettings = useSelector(selectShipping);

  useEffect(() => { dispatch(fetchCart()); }, []);

  const subtotal = parseFloat(cart?.total || 0);
  const threshold = shippingSettings.free_shipping_threshold;
  const shippingCost = shippingSettings.shipping_cost;
  const shipping = subtotal >= threshold ? 0 : shippingCost;
  const finalTotal = (subtotal + shipping).toFixed(2);
  const toFreeShipping = Math.max(0, threshold - subtotal).toFixed(0);

  if (loading) return <Spinner center />;

  return (
    <main className="main-content">
      <div className="container" style={{ padding: "32px 16px 64px", maxWidth: 1100 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "var(--text-muted)", padding: 4 }}>←</button>
          <h1 style={{ margin: 0 }}>Shopping Cart</h1>
          {cart?.item_count > 0 && (
            <span className="badge badge-primary" style={{ fontSize: "0.82rem" }}>{cart.item_count} item{cart.item_count !== 1 ? "s" : ""}</span>
          )}
        </div>

        {!cart?.items?.length ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ fontSize: 80, marginBottom: 20, opacity: 0.6 }}>🛒</div>
            <h2 style={{ marginBottom: 8, color: "var(--text-primary)" }}>Your cart is empty</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 32 }}>Looks like you haven't added anything yet</p>
            <Link to="/products" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "linear-gradient(135deg, var(--primary-dark), var(--primary))",
              color: "white", borderRadius: "var(--r-full)", padding: "14px 32px",
              fontWeight: 700, fontSize: "1rem", textDecoration: "none",
            }}>
              Start Shopping →
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 28, gridTemplateColumns: "1fr min(360px, 100%)" }}>
            {/* Items */}
            <div>
              <div className="card" style={{ padding: "8px 24px" }}>
                {cart.items.map((item) => <CartItemRow key={item.id} item={item} />)}
              </div>
              <Link to="/products" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 16, color: "var(--text-muted)", fontSize: "0.88rem" }}>
                ← Continue Shopping
              </Link>
            </div>

            {/* Summary */}
            <div>
              <div className="card" style={{ padding: 24, position: "sticky", top: 80 }}>
                <h3 style={{ marginBottom: 20 }}>Order Summary</h3>

                <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
                  {[
                    ["Subtotal", `₹${subtotal.toFixed(2)}`],
                    ["Shipping", shipping === 0 ? "FREE" : `₹${shipping}`],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                      <span>{label}</span>
                      <span style={{ color: val === "FREE" ? "var(--success)" : "inherit", fontWeight: val === "FREE" ? 700 : 400 }}>{val}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: 14, display: "flex", justifyContent: "space-between", fontWeight: 800 }}>
                    <span style={{ color: "var(--text-primary)" }}>Total</span>
                    <span className="price">₹{finalTotal}</span>
                  </div>
                </div>

                {toFreeShipping > 0 && (
                  <div style={{ fontSize: "0.8rem", color: "var(--primary-dark)", marginBottom: 16, padding: "10px 14px", background: "#e8f5e9", borderRadius: 10, fontWeight: 600 }}>
                    🚚 Add ₹{toFreeShipping} more for FREE shipping (above ₹{threshold})!
                  </div>
                )}

                <Link to="/checkout" style={{
                  display: "flex", justifyContent: "center", alignItems: "center",
                  width: "100%", borderRadius: "var(--r-full)", padding: "14px",
                  background: "linear-gradient(135deg, var(--primary-dark), var(--primary))",
                  color: "white", fontWeight: 700, fontSize: "1rem", textDecoration: "none",
                  boxShadow: "0 4px 12px rgba(46,125,50,0.3)",
                }}>
                  Proceed to Checkout →
                </Link>

                <div style={{ marginTop: 20, padding: "14px 0", borderTop: "1px solid var(--border-light)" }}>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", textAlign: "center", marginBottom: 10 }}>We accept</p>
                  <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
                    {["UPI", "Cards", "Net Banking", "COD"].map((m) => (
                      <span key={m} style={{ fontSize: "0.72rem", padding: "3px 10px", border: "1px solid var(--border-light)", borderRadius: 6, color: "var(--text-muted)" }}>{m}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
