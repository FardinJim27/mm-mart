import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/categories');
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch categories');
    }
  }
);

export const addCategory = createAsyncThunk(
  'categories/addCategory',
  async (name, { rejectWithValue }) => {
    try {
      const response = await api.post('/categories', { name });
      return response.data.name;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to add category');
    }
  }
);

export const removeCategory = createAsyncThunk(
  'categories/removeCategory',
  async (name, { rejectWithValue }) => {
    try {
      await api.delete(`/categories/${encodeURIComponent(name)}`);
      return name;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to remove category');
    }
  }
);

export const editCategory = createAsyncThunk(
  'categories/editCategory',
  async ({ oldName, newName }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/categories/${encodeURIComponent(oldName)}`, { newName });
      return { oldName, newName: response.data.name };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update category');
    }
  }
);

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const categorySlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addCategory.fulfilled, (state, action) => {
        if (!state.items.includes(action.payload)) {
          state.items.push(action.payload);
        }
      })
      .addCase(removeCategory.fulfilled, (state, action) => {
        state.items = state.items.filter((c) => c !== action.payload);
      })
      .addCase(editCategory.fulfilled, (state, action) => {
        const { oldName, newName } = action.payload;
        const index = state.items.indexOf(oldName);
        if (index !== -1) {
          state.items[index] = newName;
        }
      });
  },
});

export default categorySlice.reducer;
