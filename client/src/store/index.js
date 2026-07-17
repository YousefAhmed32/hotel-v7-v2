import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice.js';
import uiReducer from '../features/ui/uiSlice.js';
import bookingReducer from '../features/booking/bookingSlice.js';
import roomReducer from '../features/room/roomSlice.js';
import pricingReducer from '../features/pricing/pricingSlice.js';
import hotelReducer from '../features/hotel/hotelSlice.js';
export const store = configureStore({
  reducer: { auth: authReducer, ui: uiReducer, bookings: bookingReducer, rooms: roomReducer, pricing: pricingReducer, hotels: hotelReducer },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }),
  devTools: import.meta.env.DEV,
});
