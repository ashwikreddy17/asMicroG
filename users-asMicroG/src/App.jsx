import { useEffect, lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProfile } from "./store/authSlice";
import { fetchCart } from "./store/cartSlice";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import BottomNav from "./components/layout/BottomNav";
import Spinner from "./components/ui/Spinner";

const HomePage = lazy(() => import("./pages/HomePage"));
const ProductListPage = lazy(() => import("./pages/ProductListPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const OrderDetailPage = lazy(() => import("./pages/OrderDetailPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const WishlistPage = lazy(() => import("./pages/WishlistPage"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

const NO_NAV_ROUTES = ["/auth"];

export default function App() {
  const dispatch = useDispatch();
  const location = useLocation();
  const tokens = useSelector((s) => s.auth.tokens);
  const initialized = useSelector((s) => s.auth.initialized);

  useEffect(() => {
    if (tokens?.access) {
      dispatch(fetchProfile());
      dispatch(fetchCart());
    } else {
      dispatch(fetchCart());
      // Mark auth as initialized even without tokens
      import("./store/authSlice").then(({ setInitialized }) => dispatch(setInitialized()));
    }
  }, []);

  const hideNav = NO_NAV_ROUTES.some((r) => location.pathname.startsWith(r));

  if (!initialized && tokens?.access) {
    return <Spinner center />;
  }

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <ScrollToTop />
      {!hideNav && <Navbar />}

      <div style={{ flex: 1 }}>
        <Suspense fallback={<Spinner center />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductListPage />} />
            <Route path="/products/:slug" element={<ProductDetailPage />} />
            <Route path="/search" element={<ProductListPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>

      {!hideNav && (
        <>
          <Footer />
          <BottomNav />
        </>
      )}
    </div>
  );
}
