import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { setTokens, fetchProfile } from "../store/authSlice";
import { loginWithBackend, registerWithBackend, loginWithGoogle } from "../services/authService";
import api from "../services/api";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import toast from "react-hot-toast";

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("tab") === "register" ? "register" : "login");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({});
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const updateField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await loginWithGoogle();
      const idToken = await result.user.getIdToken();
      const { data } = await api.post("/auth/firebase/", { id_token: idToken });
      dispatch(setTokens(data));
      await dispatch(fetchProfile());
      toast.success("Welcome!");
      navigate("/");
    } catch (err) {
      const msg = err.response?.data?.error || "Google sign-in failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const tokens = await loginWithBackend(form.email, form.password);
      dispatch(setTokens(tokens));
      await dispatch(fetchProfile());
      toast.success("Welcome back!");
      navigate("/");
    } catch {
      toast.error("Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (form.password !== form.password2) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await registerWithBackend({ email: form.email, username: form.email, first_name: form.firstName, last_name: form.lastName, phone: form.phone, password: form.password, password2: form.password2 });
      toast.success("Account created! Please sign in.");
      setTab("login");
    } catch (err) {
      const errors = err.response?.data?.errors;
      const msg = errors ? Object.values(errors).flat().join(" ") : "Registration failed.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="neu-raised"
        style={{ width: "100%", maxWidth: 440, padding: 36 }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%", margin: "0 auto 12px",
            background: "linear-gradient(135deg, var(--primary), var(--primary-light))",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "var(--neu-raised)", color: "white", fontWeight: 800, fontSize: 22,
          }}>A</div>
          <h1 style={{ fontSize: "1.6rem", marginBottom: 4 }}>ASMICROG</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Your eco-friendly shopping destination</p>
        </div>

        {/* Tabs */}
        <div className="neu-inset" style={{ display: "flex", marginBottom: 28, borderRadius: "var(--r-full)", padding: 4 }}>
          {["login", "register"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: "10px 0", border: "none", cursor: "pointer",
                borderRadius: "var(--r-full)",
                background: tab === t ? "var(--primary)" : "transparent",
                color: tab === t ? "white" : "var(--text-muted)",
                fontWeight: 600, fontSize: "0.9rem",
                boxShadow: tab === t ? "var(--neu-raised-sm)" : "none",
                transition: "all var(--t-base)",
              }}
            >
              {t === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === "login" ? (
            <motion.form key="login" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} onSubmit={handleLogin}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
                <Input label="Email" type="email" placeholder="you@example.com" value={form.email || ""} onChange={updateField("email")} required icon="✉️" />
                <Input label="Password" type="password" placeholder="Your password" value={form.password || ""} onChange={updateField("password")} required icon="🔒" />
                <div style={{ textAlign: "right" }}>
                  <Link to="#" style={{ fontSize: "0.85rem", color: "var(--primary)" }}>Forgot password?</Link>
                </div>
              </div>
              <Button variant="primary" size="lg" fullWidth loading={loading} type="submit">Sign In</Button>
            </motion.form>
          ) : (
            <motion.form key="register" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} onSubmit={handleRegister}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Input label="First Name" placeholder="First" value={form.firstName || ""} onChange={updateField("firstName")} required />
                  <Input label="Last Name" placeholder="Last" value={form.lastName || ""} onChange={updateField("lastName")} />
                </div>
                <Input label="Email" type="email" placeholder="you@example.com" value={form.email || ""} onChange={updateField("email")} required icon="✉️" />
                <Input label="Phone" type="tel" placeholder="+91 98765 43210" value={form.phone || ""} onChange={updateField("phone")} icon="📱" />
                <Input label="Password" type="password" placeholder="Min 8 characters" value={form.password || ""} onChange={updateField("password")} required icon="🔒" />
                <Input label="Confirm Password" type="password" placeholder="Confirm password" value={form.password2 || ""} onChange={updateField("password2")} required icon="🔒" />
              </div>
              <Button variant="primary" size="lg" fullWidth loading={loading} type="submit">Create Account</Button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Google Sign-in */}
        <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <div className="divider" style={{ flex: 1, margin: 0 }} />
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>or</span>
          <div className="divider" style={{ flex: 1, margin: 0 }} />
        </div>
        <Button fullWidth onClick={handleGoogleLogin} loading={loading} style={{ marginTop: 12 }}>
          <span style={{ fontSize: 18 }}>G</span> Continue with Google
        </Button>
      </motion.div>
    </main>
  );
}
