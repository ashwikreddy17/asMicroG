import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Modal({ open, onClose, title, children, maxWidth = 520 }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed", inset: 0, zIndex: "var(--z-modal)",
            background: "rgba(0,20,0,0.35)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="neu-raised"
            style={{ width: "100%", maxWidth, maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            {title && (
              <div style={{
                padding: "20px 24px 0",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <h3 style={{ margin: 0 }}>{title}</h3>
                <button
                  onClick={onClose}
                  className="btn-neu"
                  style={{ padding: 8, borderRadius: "50%", width: 36, height: 36 }}
                  aria-label="Close"
                >✕</button>
              </div>
            )}
            <div style={{ padding: 24 }}>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
