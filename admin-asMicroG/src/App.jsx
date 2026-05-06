import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import AdminLayout from "./components/layout/AdminLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import ProductFormPage from "./pages/ProductFormPage";
import OrdersPage from "./pages/OrdersPage";
import CustomersPage from "./pages/CustomersPage";
import CouponsPage from "./pages/CouponsPage";
import SupportPage from "./pages/SupportPage";
import BannersPage from "./pages/BannersPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import CategoriesPage from "./pages/CategoriesPage";

function RequireAuth({ children }) {
  const tokens = JSON.parse(localStorage.getItem("admin_tokens") || "null");
  const user = JSON.parse(localStorage.getItem("admin_user") || "null");
  if (!tokens || (!user?.is_staff && !user?.is_superuser)) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <AdminLayout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/new" element={<ProductFormPage />} />
                <Route path="/products/:id/edit" element={<ProductFormPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/coupons" element={<CouponsPage />} />
                <Route path="/support" element={<SupportPage />} />
                <Route path="/banners" element={<BannersPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </AdminLayout>
          </RequireAuth>
        }
      />
    </Routes>
  );
}
