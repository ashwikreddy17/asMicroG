import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";

export const fetchProfile = createAsyncThunk("auth/fetchProfile", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/auth/profile/");
    return data;
  } catch (e) {
    return rejectWithValue(e.response?.data);
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    tokens: JSON.parse(localStorage.getItem("tokens") || "null"),
    loading: false,
    initialized: false,
  },
  reducers: {
    setTokens(state, action) {
      state.tokens = action.payload;
      if (action.payload) localStorage.setItem("tokens", JSON.stringify(action.payload));
      else localStorage.removeItem("tokens");
    },
    setUser(state, action) {
      state.user = action.payload;
    },
    logout(state) {
      state.user = null;
      state.tokens = null;
      localStorage.removeItem("tokens");
    },
    setInitialized(state) {
      state.initialized = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => { state.loading = true; })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
        state.initialized = true;
      })
      .addCase(fetchProfile.rejected, (state) => {
        state.loading = false;
        state.initialized = true;
      });
  },
});

export const { setTokens, setUser, logout, setInitialized } = authSlice.actions;
export default authSlice.reducer;
