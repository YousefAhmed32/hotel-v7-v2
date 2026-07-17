import jwt  from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { ROLE_PERMISSIONS } from '../constants/permissions.js';

const extractToken = (req) => {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.split(' ')[1];
  return null;
};

export const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) throw ApiError.unauthorized('No token provided');
    let decoded;
    try { decoded = jwt.verify(token, env.JWT_SECRET); }
    catch (e) {
      if (e.name === 'TokenExpiredError') throw ApiError.unauthorized('Token expired');
      throw ApiError.unauthorized('Invalid token');
    }
    const user = await User.findById(decoded.sub);
    if (!user)          throw ApiError.unauthorized('User not found');
    if (!user.isActive) throw ApiError.forbidden('Account disabled');
    req.user    = user;
    req.hotelId = user.hotelId?.toString() || null;
    next();
  } catch (err) { next(err); }
};

export const optionalAuthenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) return next();
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user    = await User.findById(decoded.sub);
      if (user?.isActive) { req.user = user; req.hotelId = user.hotelId?.toString() || null; }
    } catch {}
    next();
  } catch { next(); }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) return next(ApiError.forbidden(`Role '${req.user.role}' not allowed`));
  next();
};

// ── KEY FIX: falls back to ROLE_PERMISSIONS if user.permissions is empty ──
export const requirePermission = (...permissions) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized());

  const role = req.user.role;

  // superadmin and owner always pass
  if (role === 'superadmin' || role === 'owner') return next();

  // Build effective permissions: user.permissions (custom) OR role defaults
  const effectivePerms = (req.user.permissions?.length > 0)
    ? req.user.permissions
    : (ROLE_PERMISSIONS[role] || []);

  // Check ALL required permissions (AND logic)
  const missing = permissions.filter(p => !effectivePerms.includes(p));
  if (missing.length > 0) {
    return next(ApiError.forbidden(`Missing permission: ${missing.join(', ')}`));
  }

  next();
};

// Ensure staff has any one of the given permissions (OR logic)
export const requireAnyPermission = (...permissions) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  const role = req.user.role;
  if (role === 'superadmin' || role === 'owner') return next();
  const effectivePerms = (req.user.permissions?.length > 0) ? req.user.permissions : (ROLE_PERMISSIONS[role] || []);
  if (permissions.some(p => effectivePerms.includes(p))) return next();
  return next(ApiError.forbidden(`Requires one of: ${permissions.join(', ')}`));
};
