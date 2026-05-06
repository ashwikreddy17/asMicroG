import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, openDrawer } from "../../store/cartSlice";
import { toggleWishlist, selectIsWishlisted } from "../../store/wishlistSlice";
import StarRating from "../ui/StarRating";
import toast from "react-hot-toast";

export default function ProductCard({ product }) {
  const dispatch = useDispatch();
  const isWishlisted = useSelector(selectIsWishlisted(product.id));
  const [addingToCart, setAddingToCart] = useState(false);

  const img = product.primary_image?.image || "/placeholder.png";

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (addingToCart) return;
    setAddingToCart(true);
    try {
      await dispatch(addToCart({ product_id: product.id, quantity: 1 })).unwrap();
      dispatch(openDrawer());
      toast.success("Added to cart!");
    } catch (err) {
      toast.error(err?.error || "Failed to add to cart.");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    dispatch(toggleWishlist(product.id));
    toast.success(isWishlisted ? "Removed from wishlist" : "Added to wishlist");
  };

  return (
    <motion.div
      className="card"
      whileHover={{ y: -4 }}
      style={{ position: "relative", display: "flex", flexDirection: "column" }}
    >
      {product.discount_percent > 0 && (
        <span className="discount-badge">-{product.discount_percent}%</span>
      )}

      {/* Wishlist button */}
      <button
        onClick={handleWishlist}
        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        style={{
          position: "absolute", top: 12, right: 12, zIndex: 2,
          width: 36, height: 36, borderRadius: "50%", border: "none",
          background: "rgba(232,245,233,0.85)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, cursor: "pointer", color: isWishlisted ? "#e53935" : "var(--text-muted)",
          boxShadow: "var(--neu-raised-sm)",
        }}
      >
        {isWishlisted ? "♥" : "♡"}
      </button>

      <Link to={`/products/${product.slug}`} style={{ display: "block" }}>
        {/* Image */}
        <div style={{
          aspectRatio: "1/1", overflow: "hidden", background: "var(--bg)",
          borderRadius: "var(--r-lg) var(--r-lg) 0 0",
        }}>
          <img
            src={img}
            alt={product.primary_image?.alt_text || product.name}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s ease" }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.06)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          />
        </div>

        {/* Info */}
        <div style={{ padding: "16px" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 4 }}>
            {product.category_name}
          </p>
          <h3 style={{
            fontSize: "0.95rem", fontWeight: 600, marginBottom: 6,
            overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}>
            {product.name}
          </h3>

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <StarRating rating={product.average_rating} size={13} />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              ({product.review_count})
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="price">₹{product.effective_price}</span>
            {product.discount_price && (
              <span className="price-original">₹{product.price}</span>
            )}
          </div>

          {product.stock === 0 && (
            <span className="badge badge-red" style={{ marginTop: 8, display: "inline-flex" }}>Out of Stock</span>
          )}
        </div>
      </Link>

      {/* Add to cart */}
      <div style={{ padding: "0 16px 16px" }}>
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0 || addingToCart}
          className="btn-neu btn-primary"
          style={{
            width: "100%", borderRadius: "var(--r-md)",
            opacity: product.stock === 0 ? 0.5 : 1,
          }}
        >
          {addingToCart ? "Adding…" : product.stock === 0 ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    </motion.div>
  );
}
