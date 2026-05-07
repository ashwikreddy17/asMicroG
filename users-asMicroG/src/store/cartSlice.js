import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";

export const fetchCart = createAsyncThunk("cart/fetch", async () => {
  const { data } = await api.get("/cart/");
  return data;
});

export const fetchShippingSettings = createAsyncThunk("cart/shippingSettings", async () => {
  const { data } = await api.get("/orders/shipping-settings/");
  return data;
});

export const addToCart = createAsyncThunk("cart/add", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/cart/add/", payload);
    return data;
  } catch (e) {
    return rejectWithValue(e.response?.data);
  }
});

export const updateCartItem = createAsyncThunk("cart/update", async ({ itemId, quantity }) => {
  const { data } = await api.patch(`/cart/items/${itemId}/`, { quantity });
  return data;
});

export const removeCartItem = createAsyncThunk("cart/remove", async (itemId) => {
  const { data } = await api.patch(`/cart/items/${itemId}/`, { quantity: 0 });
  return data;
});

export const clearCart = createAsyncThunk("cart/clear", async () => {
  const { data } = await api.delete("/cart/clear/");
  return data;
});

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    data: null,
    loading: false,
    error: null,
    drawerOpen: false,
    shipping: { free_shipping_threshold: 500, shipping_cost: 50, first_order_free: false },
  },
  reducers: {
    toggleDrawer(state) { state.drawerOpen = !state.drawerOpen; },
    closeDrawer(state) { state.drawerOpen = false; },
    openDrawer(state) { state.drawerOpen = true; },
  },
  extraReducers: (builder) => {
    const setLoading = (state) => { state.loading = true; state.error = null; };
    const setData = (state, action) => { state.data = action.payload; state.loading = false; };
    const setError = (state, action) => { state.loading = false; state.error = action.payload; };

    [fetchCart, addToCart, updateCartItem, removeCartItem, clearCart].forEach((thunk) => {
      builder
        .addCase(thunk.pending, setLoading)
        .addCase(thunk.fulfilled, setData)
        .addCase(thunk.rejected, setError);
    });

    builder.addCase(fetchShippingSettings.fulfilled, (state, action) => {
      state.shipping = action.payload;
    });
  },
});

export const { toggleDrawer, closeDrawer, openDrawer } = cartSlice.actions;
export const selectCart = (state) => state.cart.data;
export const selectCartCount = (state) => state.cart.data?.item_count || 0;
export const selectCartTotal = (state) => state.cart.data?.total || "0.00";
export const selectShipping = (state) => state.cart.shipping;
export default cartSlice.reducer;
