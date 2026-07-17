import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

const signAccess  = (payload) => jwt.sign(payload, env.JWT_SECRET,         { expiresIn: env.JWT_EXPIRES_IN });
const signRefresh = (payload) => jwt.sign(payload, env.JWT_REFRESH_SECRET,  { expiresIn: env.JWT_REFRESH_EXPIRES_IN });

// hotelId دايماً في الـ payload — لو اتغير بعدين نعمل refresh
const buildPayload = (user) => ({
  sub:     user._id.toString(),
  email:   user.email,
  role:    user.role,
  hotelId: user.hotelId?.toString() ?? null,
});

const genTokens = (user) => ({
  accessToken:  signAccess(buildPayload(user)),
  refreshToken: signRefresh({ sub: user._id.toString() }),
});

export const setRefreshCookie = (res, token) =>
  res.cookie('refreshToken', token, { httpOnly: true, secure: env.isProd(), sameSite: 'strict', maxAge: 30*24*60*60*1000 });

export const clearRefreshCookie = (res) =>
  res.clearCookie('refreshToken', { httpOnly: true, secure: env.isProd(), sameSite: 'strict' });

// Register — always creates a customer by default; role upgraded when hotel is created
export const registerUser = async ({ name, email, password }) => {
  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('Email already registered');
  const user = await User.create({ name, email, password, role: 'customer' });
  const tokens = genTokens(user);
  user.refreshToken = tokens.refreshToken;
  user.lastLoginAt  = new Date();
  await user.save({ validateBeforeSave: false });
  return { user, tokens };
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password +refreshToken');
  if (!user)            throw ApiError.unauthorized('Invalid email or password');
  if (!user.isActive)   throw ApiError.forbidden('Account disabled');
  const isMatch = await user.comparePassword(password);
  if (!isMatch)         throw ApiError.unauthorized('Invalid email or password');
  const tokens = genTokens(user);
  user.refreshToken = tokens.refreshToken;
  user.lastLoginAt  = new Date();
  await user.save({ validateBeforeSave: false });
  return { user, tokens };
};

export const refreshAccessToken = async (incomingToken) => {
  if (!incomingToken) throw ApiError.unauthorized('Refresh token missing');
  let decoded;
  try { decoded = jwt.verify(incomingToken, env.JWT_REFRESH_SECRET); }
  catch { throw ApiError.unauthorized('Invalid or expired refresh token'); }
  const user = await User.findById(decoded.sub).select('+refreshToken');
  if (!user)          throw ApiError.unauthorized('User not found');
  if (!user.isActive) throw ApiError.forbidden('Account disabled');
  if (user.refreshToken !== incomingToken) {
    user.refreshToken = null;
    await user.save({ validateBeforeSave: false });
    throw ApiError.unauthorized('Refresh token reuse detected');
  }
  const tokens = genTokens(user);
  user.refreshToken = tokens.refreshToken;
  await user.save({ validateBeforeSave: false });
  return { user, tokens };
};

// بعد إنشاء فندق — بنجيب token جديد فيه الـ hotelId المحدّث
export const reissueTokensForUser = async (userId, res) => {
  const user = await User.findById(userId).select('+refreshToken');
  if (!user) throw ApiError.notFound('User not found');
  const tokens = genTokens(user);
  user.refreshToken = tokens.refreshToken;
  await user.save({ validateBeforeSave: false });
  setRefreshCookie(res, tokens.refreshToken);
  return { user, tokens };
};

export const logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, { $unset: { refreshToken: '' } });
};

export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user)          throw ApiError.notFound('User not found');
  if (!user.isActive) throw ApiError.forbidden('Account disabled');
  return user;
};

export const verifyAccessToken = (token) => {
  try { return jwt.verify(token, env.JWT_SECRET); }
  catch (err) {
    if (err.name === 'TokenExpiredError') throw ApiError.unauthorized('Access token expired');
    throw ApiError.unauthorized('Invalid access token');
  }
};

// Update user profile
export const updateProfile = async (userId, { name, phone }) => {
  const user = await User.findByIdAndUpdate(userId, { $set: { name, phone } }, { new: true, runValidators: true });
  if (!user) throw ApiError.notFound('User not found');
  return user;
};

// Change password
export const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId).select('+password');
  if (!user) throw ApiError.notFound('User not found');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw ApiError.unauthorized('Current password is incorrect');
  user.password = newPassword;
  await user.save();
  return user;
};
