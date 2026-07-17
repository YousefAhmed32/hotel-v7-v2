export class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode; this.success = statusCode < 400;
    this.message = message; this.data = data; this.timestamp = new Date().toISOString();
  }
  static success(res, data = null, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
  }
  static created(res, data = null, message = 'Created') {
    return res.status(201).json(new ApiResponse(201, data, message));
  }
  static paginated(res, data, pagination, message = 'Success', meta = null) {
    const body = { success: true, message, data, pagination, timestamp: new Date().toISOString() };
    if (meta) body.meta = meta;
    return res.status(200).json(body);
  }
}