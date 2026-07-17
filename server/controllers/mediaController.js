import mongoose from 'mongoose';
import multer from 'multer';
import { getGridFSBucket } from '../config/gridfs.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg','image/png','image/webp','image/gif'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new ApiError(400, 'Only JPEG, PNG, WebP, and GIF allowed'));
  },
});

export const uploadMiddleware = upload.single('file');

export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) throw ApiError.badRequest('No file provided');
    const bucket = getGridFSBucket();
    const filename = Date.now() + '-' + req.file.originalname.replace(/\s+/g, '-');
    const uploadStream = bucket.openUploadStream(filename, { metadata: { originalName: req.file.originalname, mimeType: req.file.mimetype, uploadedBy: req.user._id.toString(), hotelId: req.hotelId||null }, contentType: req.file.mimetype });
    uploadStream.end(req.file.buffer);
    uploadStream.on('finish', () => {
      return ApiResponse.created(res, { fileId: uploadStream.id.toString(), filename, url: '/api/v1/media/' + uploadStream.id, size: req.file.size, mimeType: req.file.mimetype }, 'File uploaded');
    });
    uploadStream.on('error', (err) => next(err));
  } catch (err) { next(err); }
};

export const streamFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    if (!mongoose.isValidObjectId(fileId)) throw ApiError.badRequest('Invalid fileId');
    const bucket = getGridFSBucket();
    const id = new mongoose.Types.ObjectId(fileId);
    const files = await bucket.find({ _id: id }).toArray();
    if (!files.length) throw ApiError.notFound('File not found');
    const file = files[0];
    res.set({ 'Content-Type': file.contentType || 'application/octet-stream', 'Cache-Control': 'public, max-age=31536000', 'Content-Disposition': 'inline' });
    const downloadStream = bucket.openDownloadStream(id);
    downloadStream.on('error', () => next(ApiError.notFound('File not found')));
    downloadStream.pipe(res);
  } catch (err) { next(err); }
};

export const deleteFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    if (!mongoose.isValidObjectId(fileId)) throw ApiError.badRequest('Invalid fileId');
    const bucket = getGridFSBucket();
    await bucket.delete(new mongoose.Types.ObjectId(fileId));
    return ApiResponse.success(res, null, 'File deleted');
  } catch (err) { next(err); }
};
