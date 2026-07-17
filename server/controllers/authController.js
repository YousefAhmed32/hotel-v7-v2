import * as authService from '../services/authService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) throw ApiError.badRequest('Name, email and password are required');
    if (password.length < 8) throw ApiError.badRequest('Password must be at least 8 characters');
    const { user, tokens } = await authService.registerUser({ name, email, password });
    authService.setRefreshCookie(res, tokens.refreshToken);
    return ApiResponse.created(res, { user, accessToken: tokens.accessToken }, 'Registration successful');
  } catch (err) { next(err); }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw ApiError.badRequest('Email and password are required');
    const { user, tokens } = await authService.loginUser({ email, password });
    authService.setRefreshCookie(res, tokens.refreshToken);
    return ApiResponse.success(res, { user, accessToken: tokens.accessToken }, 'Login successful');
  } catch (err) { next(err); }
};

export const refresh = async (req, res, next) => {
  try {
    const incomingToken = req.cookies?.refreshToken;
    const { user, tokens } = await authService.refreshAccessToken(incomingToken);
    authService.setRefreshCookie(res, tokens.refreshToken);
    return ApiResponse.success(res, { user, accessToken: tokens.accessToken }, 'Token refreshed');
  } catch (err) { next(err); }
};

export const logout = async (req, res, next) => {
  try {
    await authService.logoutUser(req.user._id);
    authService.clearRefreshCookie(res);
    return ApiResponse.success(res, null, 'Logged out successfully');
  } catch (err) { next(err); }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user._id);
    return ApiResponse.success(res, { user });
  } catch (err) { next(err); }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    if (!name || name.trim().length < 2) throw ApiError.badRequest('Name must be at least 2 characters');
    const user = await authService.updateProfile(req.user._id, { name: name.trim(), phone: phone || null });
    return ApiResponse.success(res, { user }, 'Profile updated');
  } catch (err) { next(err); }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) throw ApiError.badRequest('Both passwords are required');
    if (newPassword.length < 8) throw ApiError.badRequest('New password must be at least 8 characters');
    await authService.changePassword(req.user._id, { currentPassword, newPassword });
    return ApiResponse.success(res, null, 'Password changed successfully');
  } catch (err) { next(err); }
};

// Re-issue tokens with updated hotelId — called after hotel creation
export const reissueTokens = async (req, res, next) => {
  try {
    const { user, tokens } = await authService.reissueTokensForUser(req.user._id, res);
    return ApiResponse.success(res, { user, accessToken: tokens.accessToken }, 'Token refreshed with latest data');
  } catch (err) { next(err); }
};
