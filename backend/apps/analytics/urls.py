from django.urls import path
from .views import dashboard_stats, sales_chart, monthly_revenue, top_products, category_breakdown, low_stock_products

urlpatterns = [
    path("dashboard/", dashboard_stats, name="dashboard_stats"),
    path("sales/", sales_chart, name="sales_chart"),
    path("monthly/", monthly_revenue, name="monthly_revenue"),
    path("top-products/", top_products, name="top_products"),
    path("category-breakdown/", category_breakdown, name="category_breakdown"),
    path("low-stock/", low_stock_products, name="low_stock"),
]
