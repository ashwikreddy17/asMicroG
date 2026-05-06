import api from "./api";

export const getProducts = (params) => api.get("/products/", { params });
export const getProduct = (slug) => api.get(`/products/${slug}/`);
export const getFeaturedProducts = () => api.get("/products/featured/");
export const getRelatedProducts = (slug) => api.get(`/products/${slug}/related/`);
export const getCategories = () => api.get("/products/categories/");
export const searchSuggest = (q) => api.get("/products/search/suggest/", { params: { q } });
export const getProductReviews = (slug, params) => api.get(`/reviews/products/${slug}/`, { params });
export const createReview = (data) => api.post("/reviews/", data);
export const getBanners = (position = "hero") => api.get("/banners/", { params: { position } });
