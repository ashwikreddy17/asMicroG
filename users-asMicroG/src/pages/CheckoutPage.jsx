import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { selectCart, selectShipping } from "../store/cartSlice";
import { createOrder, validateCoupon, createRazorpayOrder, verifyRazorpayPayment } from "../services/orderService";
import api from "../services/api";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import toast from "react-hot-toast";

const STEPS = ["Address", "Order Summary", "Payment"];

function Step({ active, done, num, label }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 700, fontSize: "0.9rem",
        background: done ? "var(--primary)" : active ? "var(--primary-light)" : "var(--bg)",
        color: done || active ? "white" : "var(--text-muted)",
        boxShadow: "var(--neu-raised-sm)",
      }}>
        {done ? "✓" : num}
      </div>
      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: active ? "var(--primary)" : "var(--text-muted)" }}>{label}</span>
    </div>
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const cart = useSelector(selectCart);
  const shippingSettings = useSelector(selectShipping);
  const [step, setStep] = useState(0);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    api.get("/auth/addresses/").then(({ data }) => {
      const list = Array.isArray(data) ? data : (data.results ?? []);
      setAddresses(list);
      const def = list.find((a) => a.is_default) || list[0];
      if (def) setSelectedAddress(def.id);
    });
  }, [user]);

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    try {
      const total = cart?.total || 0;
      const { data } = await validateCoupon({ code: coupon.toUpperCase(), order_amount: total });
      setDiscount(data);
      toast.success(`Coupon applied! -₹${data.discount}`);
    } catch (err) {
      toast.error(err.response?.data?.errors?.error || "Invalid coupon.");
    }
  };

  const subtotal = parseFloat(cart?.total || 0);
  const discountAmt = discount ? parseFloat(discount.discount) : 0;
  const shipping = subtotal - discountAmt >= shippingSettings.free_shipping_threshold ? 0 : shippingSettings.shipping_cost;
  const total = Math.max(0, subtotal - discountAmt + shipping);

  const placeOrder = async () => {
    if (!selectedAddress) { toast.error("Please select a delivery address."); return; }
    setLoading(true);
    try {
      const { data: createdOrder } = await createOrder({
        shipping_address_id: selectedAddress,
        payment_method: paymentMethod,
        coupon_code: discount ? coupon : "",
      });
      setOrder(createdOrder);

      if (paymentMethod === "razorpay") {
        const { data: rz } = await createRazorpayOrder(createdOrder.id);
        const rzOptions = {
          key: rz.key,
          amount: rz.amount,
          currency: rz.currency,
          name: "ASMICROG",
          description: `Order #${rz.order_number}`,
          order_id: rz.razorpay_order_id,
          handler: async (response) => {
            try {
              await verifyRazorpayPayment(response);
              toast.success("Payment successful!");
              navigate(`/orders/${createdOrder.id}`);
            } catch {
              toast.error("Payment verification failed.");
            }
          },
          theme: { color: "#2e7d32" },
          prefill: { email: user?.email, contact: user?.phone },
        };
        const rzScript = document.createElement("script");
        rzScript.src = "https://checkout.razorpay.com/v1/checkout.js";
        rzScript.onload = () => new window.Razorpay(rzOptions).open();
        document.body.appendChild(rzScript);
      } else {
        navigate(`/orders/${createdOrder.id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.errors?.error || "Failed to place order.");
    } finally {
      setLoading(false);
    }
  };

  if (!cart?.items?.length) {
    return (
      <div style={{ textAlign: "center", padding: "64px 16px" }}>
        <h2>Your cart is empty</h2>
        <Button variant="primary" onClick={() => navigate("/products")} style={{ marginTop: 20 }}>Shop Now</Button>
      </div>
    );
  }

  return (
    <main className="main-content">
      <div className="container" style={{ padding: "24px 16px 48px", maxWidth: 860 }}>
        <h1 style={{ marginBottom: 28 }}>Checkout</h1>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 36 }}>
          {STEPS.map((label, i) => (
            <div key={label} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <Step num={i + 1} label={label} active={step === i} done={step > i} />
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 2, background: step > i ? "var(--primary)" : "var(--bg)", margin: "0 8px", borderRadius: 2, marginBottom: 20 }} />
              )}
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gap: 24, gridTemplateColumns: "1fr" }}>
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 style={{ marginBottom: 16 }}>Delivery Address</h3>
                {addresses.length === 0 ? (
                  <div className="neu-raised" style={{ padding: 24, textAlign: "center" }}>
                    <p>No addresses found.</p>
                    <Button variant="primary" onClick={() => navigate("/profile")} style={{ marginTop: 16 }}>Add Address</Button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddress(addr.id)}
                        className="neu-raised"
                        style={{
                          padding: 18, cursor: "pointer",
                          border: `2px solid ${selectedAddress === addr.id ? "var(--primary)" : "transparent"}`,
                          transition: "border-color var(--t-base)",
                        }}
                      >
                        <p style={{ fontWeight: 600 }}>{addr.full_name} · {addr.phone}</p>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: 4 }}>
                          {addr.address_line1}{addr.address_line2 && `, ${addr.address_line2}`}, {addr.city}, {addr.state} – {addr.postal_code}
                        </p>
                        {addr.is_default && <span className="badge badge-green" style={{ marginTop: 6 }}>Default</span>}
                      </div>
                    ))}
                  </div>
                )}
                <Button variant="primary" size="lg" fullWidth style={{ marginTop: 20 }} onClick={() => setStep(1)} disabled={!selectedAddress}>
                  Continue →
                </Button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 style={{ marginBottom: 16 }}>Order Summary</h3>
                <div className="neu-raised" style={{ padding: 20, marginBottom: 20 }}>
                  {cart.items.map((item) => (
                    <div key={item.id} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "1px solid rgba(46,125,50,0.1)" }}>
                      <img src={item.product_detail?.primary_image?.image || "/placeholder.png"} alt="" style={{ width: 52, height: 52, borderRadius: 8, objectFit: "cover" }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>{item.product_detail?.name}</p>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Qty: {item.quantity}</p>
                      </div>
                      <span className="price" style={{ fontSize: "1rem" }}>₹{item.subtotal}</span>
                    </div>
                  ))}
                </div>

                {/* Coupon */}
                <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                  <Input placeholder="Enter coupon code" value={coupon} onChange={(e) => setCoupon(e.target.value)} icon="🎟" />
                  <Button onClick={applyCoupon} disabled={!coupon.trim()} style={{ flexShrink: 0 }}>Apply</Button>
                </div>

                {/* Totals */}
                <div className="neu-raised" style={{ padding: 20 }}>
                  {[
                    ["Subtotal", `₹${subtotal.toFixed(2)}`],
                    discount && ["Discount", `-₹${discountAmt.toFixed(2)}`],
                    ["Shipping", shipping === 0 ? "FREE" : `₹${shipping}`],
                  ].filter(Boolean).map(([l, v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, color: "var(--text-secondary)" }}>
                      <span>{l}</span>
                      <span style={{ color: l === "Discount" ? "var(--success)" : "inherit" }}>{v}</span>
                    </div>
                  ))}
                  <div className="divider" />
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                    <span>Total</span>
                    <span className="price">₹{total.toFixed(2)}</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                  <Button fullWidth onClick={() => setStep(0)}>← Back</Button>
                  <Button variant="primary" fullWidth onClick={() => setStep(2)}>Continue →</Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 style={{ marginBottom: 16 }}>Payment Method</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                  {[
                    { id: "razorpay", label: "Razorpay", desc: "UPI, Cards, Net Banking, Wallets", icon: "💳" },
                    { id: "stripe", label: "Stripe", desc: "International cards, Apple Pay", icon: "💰" },
                    { id: "cod", label: "Cash on Delivery", desc: "Pay when you receive", icon: "💵" },
                  ].map((method) => (
                    <div
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className="neu-raised"
                      style={{
                        padding: 16, cursor: "pointer", display: "flex", gap: 14, alignItems: "center",
                        border: `2px solid ${paymentMethod === method.id ? "var(--primary)" : "transparent"}`,
                        transition: "border-color var(--t-base)",
                      }}
                    >
                      <span style={{ fontSize: 28 }}>{method.icon}</span>
                      <div>
                        <p style={{ fontWeight: 600 }}>{method.label}</p>
                        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{method.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <Button fullWidth onClick={() => setStep(1)}>← Back</Button>
                  <Button variant="primary" fullWidth loading={loading} onClick={placeOrder}>
                    Place Order – ₹{total.toFixed(2)}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
