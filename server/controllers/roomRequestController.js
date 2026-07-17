import * as svc from '../services/roomRequestService.js';
import * as notifSvc from '../services/notificationService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

export const createRequest = async (req, res, next) => {
  try {
    const { bookingId, type, description, items, priority } = req.body;
    if (!bookingId || !type) throw ApiError.badRequest('bookingId and type required');
    const request = await svc.createRequest(req.user._id, { bookingId, type, description, items, priority });
    // Notify hotel staff
    await notifSvc.createHotelNotification({
      hotelId: request.hotelId.toString(), type: 'room_request',
      title: `New ${request.title} request`, body: description || '',
      link: `/admin/requests`, data: { requestId: request._id },
      io: req.app.get('io'),
    });
    req.app.get('io')?.to('hotel:' + request.hotelId.toString()).emit('room_request:new', request);
    return ApiResponse.created(res, { request }, 'Request submitted');
  } catch (err) { next(err); }
};

export const getMyRequests = async (req, res, next) => {
  try {
    const { bookingId } = req.query;
    const requests = await svc.getGuestRequests(req.user._id, bookingId);
    return ApiResponse.success(res, { requests });
  } catch (err) { next(err); }
};

export const getHotelRequests = async (req, res, next) => {
  try {
    const { requests, pagination } = await svc.getHotelRequests(req.hotelId, req.query);
    return ApiResponse.paginated(res, requests, pagination);
  } catch (err) { next(err); }
};

export const updateRequest = async (req, res, next) => {
  try {
    const { status, notes, assignedTo } = req.body;
    const request = await svc.updateRequestStatus(req.hotelId, req.params.requestId, { status, notes, assignedTo });
    req.app.get('io')?.to('hotel:' + req.hotelId).emit('room_request:updated', request);
    if (status === 'completed') {
      req.app.get('io')?.to('user:' + request.guestId._id?.toString()).emit('room_request:completed', { requestId: request._id, title: request.title });
    }
    return ApiResponse.success(res, { request }, 'Request updated');
  } catch (err) { next(err); }
};
