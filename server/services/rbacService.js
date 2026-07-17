import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Hotel } from '../models/Hotel.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { PERMISSIONS, ROLE_PERMISSIONS, INVITABLE_ROLES, HOTEL_STAFF_ROLES } from '../constants/permissions.js';

const genTempPassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
  let pwd = '';
  for (let i = 0; i < 12; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  return pwd;
};

export const inviteStaff = async ({ hotelId, invitedBy, name, email, role, tempPassword, customPermissions }) => {
  if (!INVITABLE_ROLES.includes(role)) throw ApiError.badRequest(`Role must be one of: ${INVITABLE_ROLES.join(', ')}`);
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) throw ApiError.notFound('Hotel not found');
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw ApiError.conflict('Email already registered');
  if (customPermissions && customPermissions.length) {
    const validPerms = Object.values(PERMISSIONS);
    const invalid = customPermissions.filter(p => !validPerms.includes(p));
    if (invalid.length) throw ApiError.badRequest(`Invalid permissions: ${invalid.join(', ')}`);
  }
  const permissions = (customPermissions && customPermissions.length) ? customPermissions : (ROLE_PERMISSIONS[role] || []);
  const password = tempPassword || genTempPassword();
  const user = await User.create({ name, email: email.toLowerCase(), password, role, hotelId: new mongoose.Types.ObjectId(hotelId), permissions, isActive: true });
  logger.info(`Staff invited: ${user.email} (${role}) to hotel ${hotelId}`);
  return { user, tempPassword: password };
};

export const getHotelStaff = async (hotelId, query = {}) => {
  const { page=1, limit=20, role='', isActive='' } = query;
  const pageNum = Math.max(1, parseInt(page,10)); const limitNum = Math.min(50, Math.max(1, parseInt(limit,10))); const skip = (pageNum-1)*limitNum;
  const filter = { hotelId: new mongoose.Types.ObjectId(hotelId), role: { $in: HOTEL_STAFF_ROLES } };
  if (role && HOTEL_STAFF_ROLES.includes(role)) filter.role = role;
  if (isActive !== '') filter.isActive = isActive !== 'false';
  const [staff, total] = await Promise.all([User.find(filter).select('-password -refreshToken').sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(), User.countDocuments(filter)]);
  return { staff, pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total/limitNum), hasNext: pageNum < Math.ceil(total/limitNum), hasPrev: pageNum > 1 } };
};

export const getStaffMember = async (hotelId, staffId) => {
  if (!mongoose.isValidObjectId(staffId)) throw ApiError.badRequest('Invalid staffId');
  const staff = await User.findOne({ _id: new mongoose.Types.ObjectId(staffId), hotelId: new mongoose.Types.ObjectId(hotelId), role: { $in: HOTEL_STAFF_ROLES } }).select('-password -refreshToken').lean();
  if (!staff) throw ApiError.notFound('Staff member not found');
  return staff;
};

export const updateStaffRole = async (hotelId, staffId, newRole, requestingUser) => {
  if (!INVITABLE_ROLES.includes(newRole)) throw ApiError.badRequest(`Role must be one of: ${INVITABLE_ROLES.join(', ')}`);
  const staff = await User.findOne({ _id: new mongoose.Types.ObjectId(staffId), hotelId: new mongoose.Types.ObjectId(hotelId), role: { $in: HOTEL_STAFF_ROLES } });
  if (!staff) throw ApiError.notFound('Staff member not found');
  if (staff.role === 'owner') throw ApiError.forbidden('Cannot change role of hotel owner');
  if (staff._id.toString() === requestingUser._id.toString()) throw ApiError.forbidden('Cannot change your own role');
  staff.role = newRole; staff.permissions = ROLE_PERMISSIONS[newRole] || [];
  await staff.save({ validateBeforeSave: false });
  return staff;
};

export const updateStaffPermissions = async (hotelId, staffId, permissions, requestingUser) => {
  const validPerms = Object.values(PERMISSIONS);
  const invalid = permissions.filter(p => !validPerms.includes(p));
  if (invalid.length) throw ApiError.badRequest(`Invalid permissions: ${invalid.join(', ')}`);
  const staff = await User.findOne({ _id: new mongoose.Types.ObjectId(staffId), hotelId: new mongoose.Types.ObjectId(hotelId), role: { $in: HOTEL_STAFF_ROLES } });
  if (!staff) throw ApiError.notFound('Staff member not found');
  if (staff.role === 'owner') throw ApiError.forbidden('Cannot modify owner permissions');
  staff.permissions = [...new Set(permissions)];
  await staff.save({ validateBeforeSave: false });
  return staff;
};

export const toggleStaffStatus = async (hotelId, staffId, requestingUser) => {
  const staff = await User.findOne({ _id: new mongoose.Types.ObjectId(staffId), hotelId: new mongoose.Types.ObjectId(hotelId), role: { $in: HOTEL_STAFF_ROLES } });
  if (!staff) throw ApiError.notFound('Staff member not found');
  if (staff.role === 'owner') throw ApiError.forbidden('Cannot deactivate hotel owner');
  if (staff._id.toString() === requestingUser._id.toString()) throw ApiError.forbidden('Cannot deactivate your own account');
  staff.isActive = !staff.isActive;
  await staff.save({ validateBeforeSave: false });
  return staff;
};

export const removeStaff = async (hotelId, staffId, requestingUser) => {
  const staff = await User.findOne({ _id: new mongoose.Types.ObjectId(staffId), hotelId: new mongoose.Types.ObjectId(hotelId), role: { $in: HOTEL_STAFF_ROLES } });
  if (!staff) throw ApiError.notFound('Staff member not found');
  if (staff.role === 'owner') throw ApiError.forbidden('Cannot remove hotel owner');
  if (staff._id.toString() === requestingUser._id.toString()) throw ApiError.forbidden('Cannot remove yourself');
  staff.hotelId = null; staff.role = 'customer'; staff.permissions = []; staff.isActive = false;
  await staff.save({ validateBeforeSave: false });
  return { message: 'Staff member removed from hotel' };
};

export const getAllPermissions = () => {
  const grouped = {};
  for (const [key, value] of Object.entries(PERMISSIONS)) {
    const [resource] = value.split(':');
    if (!grouped[resource]) grouped[resource] = [];
    grouped[resource].push({ key, value });
  }
  return grouped;
};

// Search users to assign as staff
export const searchUsers = async (q, hotelId, limit = 10) => {
  if (!q || q.trim().length < 2) return [];
  const users = await User.find({
    $or: [{ name:{ $regex: q.trim(), $options:'i' } }, { email:{ $regex: q.trim(), $options:'i' } }],
    isActive: true,
  }).select('name email role hotelId avatar').limit(limit).lean();
  return users;
};

// Assign existing user as staff (no new account)
export const assignExistingUser = async ({ hotelId, userId, role, invitedBy }) => {
  if (!INVITABLE_ROLES.includes(role)) throw ApiError.badRequest(`Role must be: ${INVITABLE_ROLES.join(', ')}`);
  const [hotel, user] = await Promise.all([Hotel.findById(hotelId), User.findById(userId)]);
  if (!hotel) throw ApiError.notFound('Hotel not found');
  if (!user)  throw ApiError.notFound('User not found');
  if (user.hotelId && user.hotelId.toString() !== hotelId)
    throw ApiError.conflict('User already belongs to another hotel');
  user.role        = role;
  user.hotelId     = new mongoose.Types.ObjectId(hotelId);
  user.permissions = ROLE_PERMISSIONS[role] || [];
  await user.save();
  logger.info(`${user.email} assigned as ${role} to hotel ${hotelId}`);
  return user;
};
