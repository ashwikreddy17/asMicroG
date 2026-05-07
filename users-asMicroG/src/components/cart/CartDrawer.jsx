import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { closeDrawer, selectCart, fetchCart, updateCartItem, removeCartItem } from "../../store/cartSlice";
import Spinner from "../ui/Spinner";
import toast from "react-hot-toast";

function CartItem({ item }) {
  const dispatch = useDispatch();
  const img = item.product_detail?.primary_image?.image || "/placeholder.png";

  const handleQty = async (qty) => {
    if (qty < 1) {
      await dispatch(removeCartItem(item.id));
    } else {
      await dispatch(updateCartItem({ itemId: item.id, quantity: qty }));
    }
  };

  return (
    <div style={{
      display: "flex", gap: 12, padding: "12px 0",
      borderBottom: "1px solid rgba(46,125,50,0.1)",
    }}>
      <img src={img} alt={item.product_detail?.name} style={{ width: 64, height: 64, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: 2, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
          {item.product_detail?.name}
        </p>
        {item.variant_detail && (
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 4 }}>
            {item.variant_detail.name}: {item.variant_detail.value}
          </p>
        )}
        <p className="price" style={{ fontSize: "1rem" }}>₹{item.subtotal}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
          <button onClick={() => handleQty(item.quantity - 1)} className="btn-neu" style={{ padding: "2px 10px", borderRadius: 8, fontSize: "1.1rem" }}>−</button>
          <span style={{ fontWeight: 600, minWidth: 20, textAlign: "center" }}>{item.quantity}</span>
          <button onClick={() => handleQty(item.quantity + 1)} className="btn-neu" style={{ padding: "2px 10px", borderRadius: 8, fontSize: "1.1rem" }}>+</button>
          <button onClick={() => dispatch(removeCartItem(item.id))} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--error)", fontSize: 18 }} aria-label="Remove">🗑</button>
        </div>
      </div>
    </div>
  );
}

export default function CartDrawer() {
  const dispatch = useDispatch();
  const drawerOpen = useSelector((s) => s.cart.drawerOpen);
  const cart = useSelector(selectCart);
  const loading = useSelector((s) => s.cart.loading);

  useEffect(() => {
    if (drawerOpen && !cart) dispatch(fetchCart());
  }, [drawerOpen]);

  return (
    <AnimatePresence>
      {drawerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dispatch(closeDrawer())}
            style={{ position: "fixed", inset: 0, background: "rgba(0,20,0,0.35)", backdropFilter: "blur(4px)", zIndex: "var(--z-modal)" }}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              position: "fixed", right: 0, top: 0, bottom: 0,
              width: "min(420px, 100vw)", zIndex: "calc(var(--z-modal) + 1)",
              background: "var(--bg-card)",
              boxShadow: "-4px 0 24px rgba(0,50,0,0.15)",
              display: "flex", flexDirection: "column",
            }}
            aria-label="Shopping cart"
            role="dialog"
          >
            {/* Header */}
            <div style={{ padding: "20px 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(46,125,50,0.1)" }}>
              <h2 style={{ margin: 0, fontSize: "1.25rem" }}>
                Shopping Cart {cart?.item_count > 0 && <span className="badge badge-primary" style={{ fontSize: "0.8rem", marginLeft: 8 }}>{cart.item_count}</span>}
              </h2>
              <button onClick={() => dispatch(closeDrawer())} className="btn-neu" style={{ padding: 8, borderRadius: "50%", width: 36, height: 36 }} aria-label="Close cart">✕</button>
            </div>

            {/* Items */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0 20px" }}>
              {loading && <Spinner center />}
              {!loading && (!cart?.items?.length) && (
                <div style={{ textAlign: "center", padding: "48px 20px" }}>
                  <div style={{ fontSize: 56, marginBottom: 16 }}>🛒</div>
                  <p style={{ color: "var(--text-muted)" }}>Your cart is empty</p>
                  <Link to="/products" onClick={() => dispatch(closeDrawer())} className="btn-neu btn-primary" style={{ marginTop: 20, display: "inline-flex", borderRadius: "var(--r-full)" }}>
                    Shop Now
                  </Link>
                </div>
              )}
              {!loading && cart?.items?.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>

            {/* Footer */}
            {cart?.items?.length > 0 && (
              <div style={{ padding: 20, borderTop: "1px solid rgba(46,125,50,0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <span style={{ fontWeight: 600, fontSize: "1rem" }}>Subtotal</span>
                  <span className="price" style={{ fontSize: "1.1rem" }}>₹{cart.total}</span>
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 12 }}>
                  Free shipping on orders above ₹500
                </p>
                <Link
                  to="/checkout"
                  onClick={() => dispatch(closeDrawer())}
                  className="btn-neu btn-primary"
                  style={{ display: "flex", justifyContent: "center", width: "100%", borderRadius: "var(--r-full)", fontSize: "1rem" }}
                >
                  Checkout →
                </Link>
                <Link to="/cart" onClick={() => dispatch(closeDrawer())} style={{ display: "block", textAlign: "center", marginTop: 12, color: "var(--text-muted)", fontSize: "0.9rem" }}>
                  View full cart
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
