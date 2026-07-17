import { generateInvoicePDF } from '../services/invoiceService.js';
import { ApiError } from '../utils/ApiError.js';

export const downloadInvoice = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const hotelId = req.hotelId;
    const pdfBuffer = await generateInvoicePDF(hotelId, bookingId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${bookingId}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (err) { next(err); }
};
