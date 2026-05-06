import api from "./api";

export const getOrders = (params) => api.get("/orders/", { params });
export const getOrder = (id) => api.get(`/orders/${id}/`);
export const createOrder = (data) => api.post("/orders/create/", data);
export const cancelOrder = (id) => api.post(`/orders/${id}/cancel/`);
export const validateCoupon = (data) => api.post("/coupons/validate/", data);
export const createRazorpayOrder = (orderId) => api.post("/payments/razorpay/create/", { order_id: orderId });
export const verifyRazorpayPayment = (data) => api.post("/payments/razorpay/verify/", data);
export const createStripeIntent = (orderId) => api.post("/payments/stripe/intent/", { order_id: orderId });
