import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { fetchWishlist } from "../store/wishlistSlice";
import ProductCard from "../components/products/ProductCard";
import Spinner from "../components/ui/Spinner";

export default function WishlistPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const { items, loading } = useSelector((s) => s.wishlist);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    dispatch(fetchWishlist());
  }, [user]);

  if (loading) return <Spinner center />;

  return (
    <main className="main-content">
      <div className="container" style={{ padding: "24px 16px 48px" }}>
        <h1 style={{ marginBottom: 8 }}>My Wishlist</h1>
        <p style={{ color: "var(--text-muted)", marginBottom: 28 }}>{items.length} item{items.length !== 1 ? "s" : ""}</p>

        {items.length === 0 ? (
          <div className="neu-raised" style={{ padding: "64px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>♡</div>
            <h3>Your wishlist is empty</h3>
            <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>Save products you love for later!</p>
            <Link to="/products" className="btn-neu btn-primary" style={{ display: "inline-flex", borderRadius: "var(--r-full)" }}>
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid-products">
            {items.map((item) => item.product_detail && <ProductCard key={item.id} product={item.product_detail} />)}
          </div>
        )}
      </div>
    </main>
  );
}
