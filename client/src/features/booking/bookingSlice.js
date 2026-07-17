import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { bookingApi } from '../../services/bookingApi.js';
export const fetchHotelBookings = createAsyncThunk('bookings/fetchHotel', async ({ hotelId, params }, { rejectWithValue }) => {
  try { const { data } = await bookingApi.getHotelBookings(hotelId, params); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const fetchBookingStats = createAsyncThunk('bookings/fetchStats', async ({ hotelId, params }, { rejectWithValue }) => {
  try { const { data } = await bookingApi.getBookingStats(hotelId, params); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const updateBookingStatus = createAsyncThunk('bookings/updateStatus', async ({ hotelId, bookingId, status, notes }, { rejectWithValue }) => {
  try { const { data } = await bookingApi.updateBookingStatus(hotelId, bookingId, { status, notes }); return data.data.booking; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const fetchMyBookings = createAsyncThunk('bookings/fetchMine', async (params, { rejectWithValue }) => {
  try { const { data } = await bookingApi.getMyBookings(params); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const lockBookingSlot = createAsyncThunk('bookings/lock', async (payload, { rejectWithValue }) => {
  try { const { data } = await bookingApi.lockBooking(payload); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const confirmBookingThunk = createAsyncThunk('bookings/confirm', async ({ bookingId, hotelId, lockToken, paymentMethod, couponId, couponDiscount }, { rejectWithValue }) => {
  try {
    const { data } = await bookingApi.confirmBooking(bookingId, {
      hotelId,        // ← ده اللي كان بيتضيع
      lockToken,
      paymentMethod,
      couponId,
      couponDiscount,
    });
    return data.data.booking;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});
const bookingSlice = createSlice({
  name: 'bookings',
  initialState: { items: [], myBookings: [], stats: null, pagination: null, currentLock: null, isLoading: false, isLocking: false, isConfirming: false, error: null },
  reducers: { clearBookingError: (state) => { state.error = null; }, clearLock: (state) => { state.currentLock = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHotelBookings.pending, (state) => { state.isLoading = true; })
      .addCase(fetchHotelBookings.fulfilled, (state, action) => { state.isLoading = false; state.items = action.payload.data; state.pagination = action.payload.pagination; })
      .addCase(fetchHotelBookings.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(fetchBookingStats.fulfilled, (state, action) => { state.stats = action.payload; })
      .addCase(updateBookingStatus.fulfilled, (state, action) => { const idx = state.items.findIndex(b => b._id === action.payload._id); if (idx !== -1) state.items[idx] = action.payload; })
      .addCase(fetchMyBookings.pending, (state) => { state.isLoading = true; })
      .addCase(fetchMyBookings.fulfilled, (state, action) => { state.isLoading = false; state.myBookings = action.payload.data; state.pagination = action.payload.pagination; })
      .addCase(fetchMyBookings.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(lockBookingSlot.pending, (state) => { state.isLocking = true; state.error = null; })
      .addCase(lockBookingSlot.fulfilled, (state, action) => { state.isLocking = false; state.currentLock = action.payload; })
      .addCase(lockBookingSlot.rejected, (state, action) => { state.isLocking = false; state.error = action.payload; })
      .addCase(confirmBookingThunk.pending, (state) => { state.isConfirming = true; })
      .addCase(confirmBookingThunk.fulfilled, (state, action) => { state.isConfirming = false; state.currentLock = null; state.myBookings.unshift(action.payload); })
      .addCase(confirmBookingThunk.rejected, (state, action) => { state.isConfirming = false; state.error = action.payload; });
  },
});
export const { clearBookingError, clearLock } = bookingSlice.actions;
export const selectBookings = (state) => state.bookings.items;
export const selectMyBookings = (state) => state.bookings.myBookings;
export const selectBookingStats = (state) => state.bookings.stats;
export const selectBookingPagination = (state) => state.bookings.pagination;
export const selectBookingsLoading = (state) => state.bookings.isLoading;
export const selectCurrentLock = (state) => state.bookings.currentLock;
export const selectIsLocking = (state) => state.bookings.isLocking;
export const selectIsConfirming = (state) => state.bookings.isConfirming;
export const selectBookingError = (state) => state.bookings.error;
export default bookingSlice.reducer;
