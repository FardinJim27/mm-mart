import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/cart');
    return res.data.cart;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const addToCart = createAsyncThunk('cart/add', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/cart/add', data);
    return res.data.cart;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const updateCartItem = createAsyncThunk('cart/update', async ({ itemId, quantity }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/cart/${itemId}`, { quantity });
    return res.data.cart;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const removeFromCart = createAsyncThunk('cart/remove', async (itemId, { rejectWithValue }) => {
  try {
    const res = await api.delete(`/cart/${itemId}`);
    return res.data.cart;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const clearCart = createAsyncThunk('cart/clear', async () => {
  await api.delete('/cart');
  return { items: [] };
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: { cart: null, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    const setCart = (state, action) => { state.loading = false; state.cart = action.payload; };
    const pending = (state) => { state.loading = true; };
    const rejected = (state, action) => { state.loading = false; state.error = action.payload; };

    builder
      .addCase(fetchCart.pending, pending).addCase(fetchCart.fulfilled, setCart).addCase(fetchCart.rejected, rejected)
      .addCase(addToCart.pending, pending).addCase(addToCart.fulfilled, setCart).addCase(addToCart.rejected, rejected)
      .addCase(updateCartItem.fulfilled, setCart)
      .addCase(removeFromCart.fulfilled, setCart)
      .addCase(clearCart.fulfilled, setCart);
  },
});

export default cartSlice.reducer;
