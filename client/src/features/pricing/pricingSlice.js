import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { pricingApi } from '../../services/pricingApi.js';
export const fetchPricingSuggestions = createAsyncThunk('pricing/fetchSuggestions', async ({ hotelId, params }, { rejectWithValue }) => {
  try { const { data } = await pricingApi.getAllSuggestions(hotelId, params); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const applyPrice = createAsyncThunk('pricing/apply', async ({ hotelId, roomId, suggestedPrice, overridePrice }, { rejectWithValue }) => {
  try { const { data } = await pricingApi.applyPrice(hotelId, roomId, { suggestedPrice, overridePrice }); return { roomId, room: data.data.room }; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const ignoreSuggestion = createAsyncThunk('pricing/ignore', async ({ hotelId, roomId }, { rejectWithValue }) => {
  try { await pricingApi.ignoreSuggestion(hotelId, roomId); return roomId; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
const pricingSlice = createSlice({
  name: 'pricing',
  initialState: { suggestions: [], isLoading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPricingSuggestions.pending, (state) => { state.isLoading = true; })
      .addCase(fetchPricingSuggestions.fulfilled, (state, action) => { state.isLoading = false; state.suggestions = action.payload.suggestions || []; })
      .addCase(fetchPricingSuggestions.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(ignoreSuggestion.fulfilled, (state, action) => { state.suggestions = state.suggestions.filter(s => s.roomId !== action.payload); });
  },
});
export const selectSuggestions = (state) => state.pricing.suggestions;
export const selectPricingLoading = (state) => state.pricing.isLoading;
export default pricingSlice.reducer;
