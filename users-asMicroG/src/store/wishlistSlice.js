import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";

export const fetchWishlist = createAsyncThunk("wishlist/fetch", async () => {
  const { data } = await api.get("/wishlist/");
  return Array.isArray(data) ? data : (data.results ?? []);
});

export const toggleWishlist = createAsyncThunk("wishlist/toggle", async (productId, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/wishlist/toggle/", { product_id: productId });
    return { productId, action: data.action, item: data.item };
  } catch (e) {
    return rejectWithValue(e.response?.data);
  }
});

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: { items: [], ids: [], loading: false },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.items = action.payload;
        state.ids = action.payload.map((i) => i.product);
      })
      .addCase(toggleWishlist.fulfilled, (state, action) => {
        const { productId, action: act, item } = action.payload;
        if (act === "added") {
          state.items.unshift(item);
          if (!state.ids.includes(productId)) state.ids.push(productId);
        } else {
          state.items = state.items.filter((i) => i.product !== productId);
          state.ids = state.ids.filter((id) => id !== productId);
        }
      });
  },
});

export const selectIsWishlisted = (productId) => (state) =>
  state.wishlist.ids.includes(productId);

export default wishlistSlice.reducer;
