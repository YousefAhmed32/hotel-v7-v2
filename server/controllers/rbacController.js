import * as rbacService from '../services/rbacService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

export const getAllPermissions = (req, res, next) => {
  try {
    const permissions = rbacService.getAllPermissions();
    return ApiResponse.success(res, { permissions });
  } catch (err) { next(err); }
};

export const inviteStaff = async (req, res, next) => {
  try {
    const { name, email, role, tempPassword, customPermissions } = req.body;
    if (!name || !email || !role) throw ApiError.badRequest('name, email, and role are required');
    const result = await rbacService.inviteStaff({ hotelId: req.hotelId, invitedBy: req.user.email, name, email, role, tempPassword, customPermissions: customPermissions||[] });
    return ApiResponse.created(res, { user: result.user, tempPassword: result.tempPassword }, role + ' invited successfully');
  } catch (err) { next(err); }
};

export const getHotelStaff = async (req, res, next) => {
  try {
    const { staff, pagination } = await rbacService.getHotelStaff(req.hotelId, req.query);
    return ApiResponse.paginated(res, staff, pagination);
  } catch (err) { next(err); }
};

export const getStaffMember = async (req, res, next) => {
  try {
    const staff = await rbacService.getStaffMember(req.hotelId, req.params.staffId);
    return ApiResponse.success(res, { staff });
  } catch (err) { next(err); }
};

export const updateStaffRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!role) throw ApiError.badRequest('role is required');
    const staff = await rbacService.updateStaffRole(req.hotelId, req.params.staffId, role, req.user);
    return ApiResponse.success(res, { staff }, 'Role updated');
  } catch (err) { next(err); }
};

export const updateStaffPermissions = async (req, res, next) => {
  try {
    const { permissions } = req.body;
    if (!Array.isArray(permissions)) throw ApiError.badRequest('permissions must be an array');
    const staff = await rbacService.updateStaffPermissions(req.hotelId, req.params.staffId, permissions, req.user);
    return ApiResponse.success(res, { staff }, 'Permissions updated');
  } catch (err) { next(err); }
};

export const toggleStaffStatus = async (req, res, next) => {
  try {
    const staff = await rbacService.toggleStaffStatus(req.hotelId, req.params.staffId, req.user);
    return ApiResponse.success(res, { staff }, staff.isActive ? 'Staff activated' : 'Staff deactivated');
  } catch (err) { next(err); }
};

export const removeStaff = async (req, res, next) => {
  try {
    const result = await rbacService.removeStaff(req.hotelId, req.params.staffId, req.user);
    return ApiResponse.success(res, result);
  } catch (err) { next(err); }
};

export const searchUsers = async (req, res, next) => {
  try {
    const users = await rbacService.searchUsers(req.query.q, req.hotelId);
    return ApiResponse.success(res, { users });
  } catch (err) { next(err); }
};

export const assignExistingUser = async (req, res, next) => {
  try {
    const { userId, role } = req.body;
    if (!userId || !role) throw ApiError.badRequest('userId and role required');
    const user = await rbacService.assignExistingUser({ hotelId: req.hotelId, userId, role, invitedBy: req.user.email });
    return ApiResponse.success(res, { user }, role + ' assigned successfully');
  } catch (err) { next(err); }
};
