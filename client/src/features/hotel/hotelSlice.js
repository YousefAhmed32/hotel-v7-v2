import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api.js';
export const fetchHotels = createAsyncThunk('hotels/fetchAll', async (params, { rejectWithValue }) => {
  try { const { data } = await api.get('/hotels', { params }); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch hotels'); }
});
export const fetchHotelById = createAsyncThunk('hotels/fetchById', async (id, { rejectWithValue }) => {
  try { const { data } = await api.get('/hotels/' + id); return data.data.hotel; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
const hotelSlice = createSlice({
  name: 'hotels',
  initialState: { items: [], current: null, pagination: null, isLoading: false, error: null },
  reducers: { clearCurrent: (state) => { state.current = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHotels.pending, (state) => { state.isLoading = true; })
      .addCase(fetchHotels.fulfilled, (state, action) => { state.isLoading = false; state.items = action.payload.data; state.pagination = action.payload.pagination; })
      .addCase(fetchHotels.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(fetchHotelById.pending, (state) => { state.isLoading = true; state.current = null; })
      .addCase(fetchHotelById.fulfilled, (state, action) => { state.isLoading = false; state.current = action.payload; })
      .addCase(fetchHotelById.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; });
  },
});
export const { clearCurrent } = hotelSlice.actions;
export const selectHotels = (state) => state.hotels.items;
export const selectCurrentHotel = (state) => state.hotels.current;
export const selectHotelPagination = (state) => state.hotels.pagination;
export const selectHotelsLoading = (state) => state.hotels.isLoading;
export default hotelSlice.reducer;
