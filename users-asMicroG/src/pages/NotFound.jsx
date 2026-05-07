import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <main style={{ minHeight: "60dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="neu-raised"
        style={{ maxWidth: 480, width: "100%", padding: 48, textAlign: "center" }}
      >
        <div style={{ fontSize: 72, marginBottom: 16 }}>🌿</div>
        <h1 className="gradient-text" style={{ fontSize: "4rem", fontWeight: 800, marginBottom: 8 }}>404</h1>
        <h2 style={{ marginBottom: 12 }}>Page Not Found</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 32 }}>
          The page you're looking for has wandered into the forest.
        </p>
        <Link to="/" className="btn-neu btn-primary" style={{ display: "inline-flex", borderRadius: "var(--r-full)", padding: "14px 36px" }}>
          Go Home →
        </Link>
      </motion.div>
    </main>
  );
}
