import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useDispatch } from "react-redux";
import { addToCart, openDrawer } from "../store/cartSlice";
import { toggleWishlist } from "../store/wishlistSlice";
import { getProduct, getProductReviews, createReview } from "../services/productService";
import Spinner from "../components/ui/Spinner";
import StarRating from "../components/ui/StarRating";
import ProductCard from "../components/products/ProductCard";
import Button from "../components/ui/Button";
import toast from "react-hot-toast";

function ImageGallery({ images }) {
  const [active, setActive] = useState(0);
  if (!images?.length) return <div className="neu-raised" style={{ aspectRatio: "1/1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>📦</div>;

  return (
    <div>
      <div style={{
        aspectRatio: "1/1", overflow: "hidden", borderRadius: "var(--r-xl)",
        boxShadow: "var(--neu-raised-lg)", marginBottom: 12, background: "var(--bg)",
      }}>
        <motion.img
          key={active}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          src={images[active].image}
          alt={images[active].alt_text}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "4px 0" }}>
        {images.map((img, i) => (
          <button
            key={img.id}
            onClick={() => setActive(i)}
            style={{
              flexShrink: 0, width: 72, height: 72, borderRadius: "var(--r-md)",
              border: "none", overflow: "hidden", cursor: "pointer",
              boxShadow: i === active ? "0 0 0 3px var(--primary)" : "var(--neu-raised-sm)",
              transition: "box-shadow var(--t-base)", background: "var(--bg)",
            }}
          >
            <img src={img.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </button>
        ))}
      </div>
    </div>
  );
}

function ReviewForm({ productId, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createReview({ product: productId, rating, title, comment });
      toast.success("Review submitted!");
      onSubmitted?.();
    } catch {
      toast.error("Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="neu-raised" style={{ padding: 24, marginTop: 24 }}>
      <h4 style={{ marginBottom: 16 }}>Write a Review</h4>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>Your Rating</label>
        <StarRating rating={rating} interactive onChange={setRating} size={28} />
      </div>
      <input className="input-neu" placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} style={{ marginBottom: 12 }} />
      <textarea
        className="input-neu"
        placeholder="Share your experience…"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        required
        rows={4}
        style={{ resize: "vertical", marginBottom: 16 }}
      />
      <Button variant="primary" loading={submitting} type="submit">Submit Review</Button>
    </form>
  );
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const loadProduct = async () => {
    try {
      const [{ data: p }, { data: r }] = await Promise.all([
        getProduct(slug),
        getProductReviews(slug),
      ]);
      setProduct(p);
      setReviews(r.results || r);
    } catch {
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProduct(); }, [slug]);

  const handleAddToCart = async () => {
    setAddingToCart(true);
    const variantId = Object.values(selectedVariants)[0];
    try {
      await dispatch(addToCart({ product_id: product.id, variant_id: variantId, quantity: qty })).unwrap();
      dispatch(openDrawer());
      toast.success("Added to cart!");
    } catch (err) {
      toast.error(err?.error || "Insufficient stock.");
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) return <Spinner center />;
  if (!product) return <div className="container" style={{ padding: "48px 0", textAlign: "center" }}><h2>Product not found</h2><Link to="/products">Browse products</Link></div>;

  const variantGroups = product.variants.reduce((acc, v) => {
    if (!acc[v.variant_type]) acc[v.variant_type] = [];
    acc[v.variant_type].push(v);
    return acc;
  }, {});

  return (
    <main className="main-content">
      <div className="container" style={{ padding: "24px 16px 48px" }}>
        {/* Breadcrumb */}
        <nav style={{ marginBottom: 24, fontSize: "0.85rem", color: "var(--text-muted)" }}>
          <Link to="/">Home</Link> → <Link to="/products">Products</Link> → <Link to={`/products?category=${product.category?.slug}`}>{product.category?.name}</Link> → <span style={{ color: "var(--text-primary)" }}>{product.name}</span>
        </nav>

        <div style={{ display: "grid", gap: 40, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          {/* Image gallery — left column */}
          <div style={{ position: "sticky", top: 80, alignSelf: "start" }}>
            <ImageGallery images={product.images} />
          </div>

          {/* Product info — right column */}
          <div>
              <p style={{ fontSize: "0.85rem", color: "var(--primary)", fontWeight: 600, marginBottom: 6 }}>{product.category?.name} {product.brand && `· ${product.brand}`}</p>
              <h1 style={{ fontSize: "1.75rem", marginBottom: 12 }}>{product.name}</h1>

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <StarRating rating={product.average_rating} size={16} />
                <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{product.average_rating} ({product.review_count} reviews)</span>
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 20 }}>
                <span className="price" style={{ fontSize: "1.75rem" }}>₹{product.effective_price}</span>
                {product.discount_price && <span className="price-original" style={{ fontSize: "1rem" }}>₹{product.price}</span>}
                {product.discount_percent > 0 && <span className="discount-badge" style={{ position: "static", background: "var(--error)" }}>-{product.discount_percent}%</span>}
              </div>

              <p style={{ lineHeight: 1.8, marginBottom: 24, color: "var(--text-secondary)" }}>{product.short_description || product.description}</p>

              {/* Variants */}
              {Object.entries(variantGroups).map(([type, variants]) => (
                <div key={type} style={{ marginBottom: 20 }}>
                  <p style={{ fontWeight: 600, marginBottom: 8, textTransform: "capitalize" }}>{type}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {variants.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariants((prev) => ({ ...prev, [type]: v.id }))}
                        disabled={!v.is_active || v.stock === 0}
                        className="btn-neu"
                        style={{
                          padding: "6px 16px", borderRadius: "var(--r-full)", fontSize: "0.9rem",
                          background: selectedVariants[type] === v.id ? "var(--primary)" : undefined,
                          color: selectedVariants[type] === v.id ? "white" : undefined,
                          opacity: v.stock === 0 ? 0.4 : 1,
                        }}
                      >
                        {v.value}
                        {v.price_adjustment > 0 && ` (+₹${v.price_adjustment})`}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Qty + Cart */}
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div className="neu-raised" style={{ display: "flex", alignItems: "center", gap: 16, padding: "8px 16px", borderRadius: "var(--r-full)" }}>
                  <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "var(--primary)", fontWeight: 700 }}>−</button>
                  <span style={{ fontWeight: 700, fontSize: "1.1rem", minWidth: 24, textAlign: "center" }}>{qty}</span>
                  <button onClick={() => setQty(Math.min(product.stock, qty + 1))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "var(--primary)", fontWeight: 700 }}>+</button>
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  loading={addingToCart}
                  onClick={handleAddToCart}
                  disabled={!product.in_stock}
                  style={{ flex: 1, minWidth: 180 }}
                >
                  {product.in_stock ? "Add to Cart" : "Out of Stock"}
                </Button>
                <Button size="lg" onClick={() => dispatch(toggleWishlist(product.id))} aria-label="Wishlist" style={{ borderRadius: "50%", padding: 14 }}>♡</Button>
              </div>

              <div style={{ marginTop: 16, padding: "12px 16px", background: "var(--bg)", borderRadius: "var(--r-md)", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                {product.in_stock ? `✓ In Stock (${product.stock} available)` : "✗ Currently out of stock"}
                {product.stock > 0 && product.stock <= 5 && <span style={{ color: "var(--warning)", marginLeft: 8 }}>• Only {product.stock} left!</span>}
              </div>
          </div>
        </div>

        {/* Description */}
        <div className="neu-raised" style={{ marginTop: 40, padding: 28 }}>
          <h2 style={{ marginBottom: 16 }}>Product Description</h2>
          <div style={{ lineHeight: 1.9, color: "var(--text-secondary)", whiteSpace: "pre-line" }}>{product.description}</div>
        </div>

        {/* Reviews */}
        <div style={{ marginTop: 40 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h2>Customer Reviews ({product.review_count})</h2>
            <Button onClick={() => setShowReviewForm(!showReviewForm)}>
              {showReviewForm ? "Cancel" : "Write a Review"}
            </Button>
          </div>

          {showReviewForm && <ReviewForm productId={product.id} onSubmitted={() => { setShowReviewForm(false); loadProduct(); }} />}

          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
            {reviews.length === 0 ? (
              <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "32px 0" }}>No reviews yet. Be the first!</p>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="neu-raised" style={{ padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>{r.user_name}</span>
                      {r.is_verified_purchase && <span className="badge badge-green" style={{ marginLeft: 8 }}>✓ Verified</span>}
                    </div>
                    <StarRating rating={r.rating} size={14} />
                  </div>
                  {r.title && <p style={{ fontWeight: 600, marginBottom: 6 }}>{r.title}</p>}
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>{r.comment}</p>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 8 }}>
                    {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
