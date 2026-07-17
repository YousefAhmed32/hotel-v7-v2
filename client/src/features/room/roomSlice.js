import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { roomApi } from '../../services/roomApi.js';
export const fetchRooms = createAsyncThunk('rooms/fetchAll', async ({ hotelId, params }, { rejectWithValue }) => {
  try { const { data } = await roomApi.getRooms(hotelId, params); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const createRoom = createAsyncThunk('rooms/create', async ({ hotelId, roomData }, { rejectWithValue }) => {
  try { const { data } = await roomApi.createRoom(hotelId, roomData); return data.data.room; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const updateRoom = createAsyncThunk('rooms/update', async ({ hotelId, roomId, roomData }, { rejectWithValue }) => {
  try { const { data } = await roomApi.updateRoom(hotelId, roomId, roomData); return data.data.room; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const deleteRoom = createAsyncThunk('rooms/delete', async ({ hotelId, roomId }, { rejectWithValue }) => {
  try { await roomApi.deleteRoom(hotelId, roomId); return roomId; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
const roomSlice = createSlice({
  name: 'rooms',
  initialState: { items: [], pagination: null, isLoading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRooms.pending, (state) => { state.isLoading = true; })
      .addCase(fetchRooms.fulfilled, (state, action) => { state.isLoading = false; state.items = action.payload.data; state.pagination = action.payload.pagination; })
      .addCase(fetchRooms.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(createRoom.fulfilled, (state, action) => { state.items.unshift(action.payload); })
      .addCase(updateRoom.fulfilled, (state, action) => { const idx = state.items.findIndex(r => r._id === action.payload._id); if (idx !== -1) state.items[idx] = action.payload; })
      .addCase(deleteRoom.fulfilled, (state, action) => { state.items = state.items.filter(r => r._id !== action.payload); });
  },
});
export const selectRooms = (state) => state.rooms.items;
export const selectRoomsLoading = (state) => state.rooms.isLoading;
export default roomSlice.reducer;
