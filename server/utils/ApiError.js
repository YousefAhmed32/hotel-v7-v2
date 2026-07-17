export class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode; this.success = false; this.errors = errors; this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
  static badRequest(msg, errs = []) { return new ApiError(400, msg, errs); }
  static unauthorized(msg = 'Unauthorized') { return new ApiError(401, msg); }
  static forbidden(msg = 'Forbidden') { return new ApiError(403, msg); }
  static notFound(msg = 'Not found') { return new ApiError(404, msg); }
  static conflict(msg = 'Conflict') { return new ApiError(409, msg); }
  static internal(msg = 'Server error') { return new ApiError(500, msg); }
}