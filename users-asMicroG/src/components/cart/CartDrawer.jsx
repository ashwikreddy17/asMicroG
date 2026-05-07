import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { closeDrawer, selectCart, selectShipping, fetchCart, updateCartItem, removeCartItem } from "../../store/cartSlice";
import Spinner from "../ui/Spinner";
import toast from "react-hot-toast";

function CartItem({ item }) {
  const dispatch = useDispatch();
  const [busy, setBusy] = useState(false);
  const img = item.product_detail?.primary_image?.image || "/placeholder.png";

  const handleQty = async (qty) => {
    if (busy) return;
    setBusy(true);
    try {
      let result;
      if (qty < 1) {
        result = await dispatch(removeCartItem(item.id));
        if (removeCartItem.rejected.match(result)) throw new Error();
        toast.success("Item removed from cart");
      } else {
        result = await dispatch(updateCartItem({ itemId: item.id, quantity: qty }));
        if (updateCartItem.rejected.match(result)) throw new Error();
      }
    } catch {
      toast.error("Could not update cart. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await dispatch(removeCartItem(item.id));
      if (removeCartItem.rejected.match(result)) throw new Error();
      toast.success("Item removed from cart");
    } catch {
      toast.error("Could not remove item. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div style={{
      display: "flex", gap: 12, padding: "12px 0",
      borderBottom: "1px solid var(--border-light)",
      opacity: busy ? 0.55 : 1,
      transition: "opacity 0.2s",
      pointerEvents: busy ? "none" : "auto",
    }}>
      <img src={img} alt={item.product_detail?.name}
        style={{ width: 64, height: 64, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: 2, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", color: "var(--text-primary)" }}>
          {item.product_detail?.name}
        </p>
        {item.variant_detail && (
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 4 }}>
            {item.variant_detail.name}: {item.variant_detail.value}
          </p>
        )}
        <p className="price" style={{ fontSize: "1rem" }}>₹{item.subtotal}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 0, marginTop: 8 }}>
          {/* Qty controls */}
          <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--border-light)", borderRadius: 10, overflow: "hidden" }}>
            <button
              onClick={() => handleQty(item.quantity - 1)}
              style={{ padding: "4px 12px", background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}
              title="Decrease quantity"
            >
              −
            </button>
            <span style={{ padding: "4px 10px", fontWeight: 700, fontSize: "0.95rem", borderLeft: "1.5px solid var(--border-light)", borderRight: "1.5px solid var(--border-light)", color: "var(--text-primary)" }}>
              {busy ? "…" : item.quantity}
            </span>
            <button
              onClick={() => handleQty(item.quantity + 1)}
              style={{ padding: "4px 12px", background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}
            >
              +
            </button>
          </div>
          {/* Delete */}
          <button
            onClick={handleRemove}
            style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--error)", fontSize: 16, padding: "4px 6px", borderRadius: 6, display: "flex", alignItems: "center" }}
            aria-label="Remove item"
            title="Remove from cart"
          >
            🗑
          </button>
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
  const shippingSettings = useSelector(selectShipping);

  useEffect(() => {
    if (drawerOpen && !cart) dispatch(fetchCart());
  }, [drawerOpen]);

  const initialLoading = loading && !cart;

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
            <div style={{ padding: "20px 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-light)" }}>
              <h2 style={{ margin: 0, fontSize: "1.25rem", color: "var(--text-primary)" }}>
                Shopping Cart{" "}
                {cart?.item_count > 0 && (
                  <span className="badge badge-primary" style={{ fontSize: "0.8rem", marginLeft: 8 }}>{cart.item_count}</span>
                )}
              </h2>
              <button
                onClick={() => dispatch(closeDrawer())}
                style={{ background: "none", border: "1.5px solid var(--border-light)", borderRadius: "50%", width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", color: "var(--text-muted)" }}
                aria-label="Close cart"
              >
                ✕
              </button>
            </div>

            {/* Items */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0 20px" }}>
              {initialLoading && <Spinner center />}

              {!initialLoading && !cart?.items?.length && (
                <div style={{ textAlign: "center", padding: "48px 20px" }}>
                  <div style={{ fontSize: 56, marginBottom: 16 }}>🛒</div>
                  <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>Your cart is empty</p>
                  <Link
                    to="/products"
                    onClick={() => dispatch(closeDrawer())}
                    style={{
                      display: "inline-flex", padding: "12px 28px", borderRadius: "var(--r-full)",
                      background: "linear-gradient(135deg, var(--primary-dark), var(--primary))",
                      color: "white", fontWeight: 700, fontSize: "0.95rem",
                    }}
                  >
                    Shop Now
                  </Link>
                </div>
              )}

              {cart?.items?.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>

            {/* Footer */}
            {cart?.items?.length > 0 && (
              <div style={{ padding: 20, borderTop: "1px solid var(--border-light)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: "1rem", color: "var(--text-primary)" }}>Subtotal</span>
                  <span className="price" style={{ fontSize: "1.1rem" }}>₹{cart.total}</span>
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 14 }}>
                  Free shipping on orders above ₹{shippingSettings.free_shipping_threshold} · ₹{shippingSettings.shipping_cost} otherwise
                </p>
                <Link
                  to="/checkout"
                  onClick={() => dispatch(closeDrawer())}
                  style={{
                    display: "flex", justifyContent: "center", width: "100%",
                    borderRadius: "var(--r-full)", fontSize: "1rem", padding: "13px",
                    background: "linear-gradient(135deg, var(--primary-dark), var(--primary))",
                    color: "white", fontWeight: 700, textDecoration: "none",
                    boxShadow: "0 4px 12px rgba(46,125,50,0.3)",
                  }}
                >
                  Checkout →
                </Link>
                <Link
                  to="/cart"
                  onClick={() => dispatch(closeDrawer())}
                  style={{ display: "block", textAlign: "center", marginTop: 12, color: "var(--text-muted)", fontSize: "0.9rem" }}
                >
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
