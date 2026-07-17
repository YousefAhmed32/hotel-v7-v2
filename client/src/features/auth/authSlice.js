import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '../../services/authApi.js';

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await authApi.login(credentials);
    localStorage.setItem('accessToken', data.data.accessToken);
    return data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Login failed'); }
});

export const registerUser = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await authApi.register(userData);
    localStorage.setItem('accessToken', data.data.accessToken);
    return data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Registration failed'); }
});

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try { await authApi.logout(); } catch {}
  localStorage.removeItem('accessToken');
});

export const fetchCurrentUser = createAsyncThunk('auth/fetchCurrentUser', async (_, { rejectWithValue }) => {
  try {
    const { data } = await authApi.getMe();
    return data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch user'); }
});

// بعد إنشاء الفندق — نجيب token جديد بالـ hotelId وندّي Redux المستخدم المحدّث
export const reissueTokens = createAsyncThunk('auth/reissueTokens', async (_, { rejectWithValue }) => {
  try {
    const { data } = await authApi.reissue();
    localStorage.setItem('accessToken', data.data.accessToken);
    return data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:          null,
    accessToken:   localStorage.getItem('accessToken') || null,
    isLoading:     false,
    isInitialized: false,
    error:         null,
  },
  reducers: {
    clearError:   (state) => { state.error = null; },
    clearAuth:    (state) => { state.user = null; state.accessToken = null; localStorage.removeItem('accessToken'); },
    updateUser:   (state, action) => { state.user = { ...state.user, ...action.payload }; },
  },
  extraReducers: (builder) => {
    const pending  = (state)          => { state.isLoading = true;  state.error = null; };
    const rejected = (state, action)  => { state.isLoading = false; state.error = action.payload; };

    builder
      .addCase(loginUser.pending, pending).addCase(loginUser.rejected, rejected)
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading  = false;
        state.user       = action.payload.user;
        state.accessToken= action.payload.accessToken;
      })
      .addCase(registerUser.pending, pending).addCase(registerUser.rejected, rejected)
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading  = false;
        state.user       = action.payload.user;
        state.accessToken= action.payload.accessToken;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null; state.accessToken = null;
      })
      .addCase(fetchCurrentUser.pending, (state) => { state.isLoading = true; })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading    = false;
        state.isInitialized= true;
        state.user         = action.payload.user;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.isLoading    = false;
        state.isInitialized= true;
        state.user         = null;
        state.accessToken  = null;
        localStorage.removeItem('accessToken');
      })
      .addCase(reissueTokens.fulfilled, (state, action) => {
        state.user       = action.payload.user;
        state.accessToken= action.payload.accessToken;
      });
  },
});

export const { clearError, clearAuth, updateUser } = authSlice.actions;

export const selectUser            = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => !!state.auth.user;
export const selectIsLoading       = (state) => state.auth.isLoading;
export const selectIsInitialized   = (state) => state.auth.isInitialized;
export const selectAuthError       = (state) => state.auth.error;
export const selectUserRole        = (state) => state.auth.user?.role;
export const selectUserHotelId     = (state) => state.auth.user?.hotelId;

export default authSlice.reducer;
