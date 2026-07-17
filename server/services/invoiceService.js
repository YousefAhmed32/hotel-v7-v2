import PDFDocument from 'pdfkit';
import { Booking }  from '../models/Booking.js';
import { Payment }  from '../models/Payment.js';
import { ApiError } from '../utils/ApiError.js';

export const generateInvoicePDF = async (hotelId, bookingId) => {
  const [booking, payments] = await Promise.all([
    Booking.findOne({ _id: bookingId, hotelId })
      .populate('roomId',  'name type roomNumber floor basePrice')
      .populate('userId',  'name email phone')
      .populate('hotelId', 'name address contact')
      .lean(),
    Payment.find({ hotelId, bookingId, status: { $in: ['paid','partially_refunded'] } }).lean(),
  ]);

  if (!booking) throw ApiError.notFound('Booking not found');

  const totalPaid    = payments.reduce((s, p) => s + p.amount - (p.refundAmount || 0), 0);
  const balance      = (booking.pricing?.totalAmount || 0) - totalPaid;
  const invoiceNum   = payments[0]?.invoiceNumber || `DRAFT-${bookingId.toString().slice(-6).toUpperCase()}`;
  const hotelInfo    = booking.hotelId;
  const guest        = booking.userId;
  const room         = booking.roomId;

  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const GOLD    = '#C9A84C';
    const DARK    = '#171717';
    const GRAY    = '#737373';
    const LIGHT   = '#f5f5f5';
    const W       = doc.page.width - 100;

    // ── Header ──────────────────────────────────────────────
    doc.rect(50, 50, W, 80).fill(GOLD);
    doc.fillColor('#fff').fontSize(24).font('Helvetica-Bold').text(hotelInfo?.name || 'Hotel', 70, 68);
    doc.fontSize(10).font('Helvetica').text('OFFICIAL INVOICE', 70, 96);
    doc.fillColor(DARK);

    // Invoice metadata
    doc.fontSize(10).font('Helvetica-Bold').text(`Invoice #: ${invoiceNum}`, 380, 68, { align: 'right', width: 120 });
    doc.font('Helvetica').fillColor(GRAY).text(`Date: ${new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}`, 380, 84, { align: 'right', width: 120 });
    doc.text(`Ref: ${booking.confirmationCode}`, 380, 98, { align: 'right', width: 120 });

    let y = 160;

    // ── Hotel & Guest ────────────────────────────────────────
    doc.fillColor(DARK).fontSize(11).font('Helvetica-Bold').text('FROM', 50, y);
    doc.font('Helvetica').fontSize(10)
      .text(hotelInfo?.name || '—', 50, y + 16)
      .fillColor(GRAY)
      .text(hotelInfo?.address?.city ? `${hotelInfo.address.city}, ${hotelInfo.address.country}` : '', 50, y + 30)
      .text(hotelInfo?.contact?.email || '', 50, y + 44)
      .text(hotelInfo?.contact?.phone || '', 50, y + 58);

    doc.fillColor(DARK).fontSize(11).font('Helvetica-Bold').text('TO', 300, y);
    doc.font('Helvetica').fontSize(10)
      .text(guest?.name || 'Guest', 300, y + 16)
      .fillColor(GRAY)
      .text(guest?.email || '', 300, y + 30)
      .text(guest?.phone || '', 300, y + 44);

    y += 100;
    doc.moveTo(50, y).lineTo(50 + W, y).strokeColor('#e5e5e5').lineWidth(1).stroke();
    y += 20;

    // ── Stay details ─────────────────────────────────────────
    doc.fillColor(DARK).fontSize(11).font('Helvetica-Bold').text('STAY DETAILS', 50, y);
    y += 20;
    const details = [
      ['Room',      `${room?.name || '—'} (${(room?.type || '').charAt(0).toUpperCase() + (room?.type || '').slice(1)})`],
      ['Room #',    room?.roomNumber || '—'],
      ['Check-in',  new Date(booking.checkIn).toLocaleDateString('en-US', { weekday:'short', year:'numeric', month:'short', day:'numeric' })],
      ['Check-out', new Date(booking.checkOut).toLocaleDateString('en-US', { weekday:'short', year:'numeric', month:'short', day:'numeric' })],
      ['Duration',  `${booking.nights || 1} night${(booking.nights || 1) > 1 ? 's' : ''}`],
      ['Guests',    `${booking.adults || 1} adult${(booking.adults || 1) > 1 ? 's' : ''}${booking.children ? `, ${booking.children} children` : ''}`],
      ['Payment',   (booking.paymentMethod || '').replace(/_/g, ' ')],
    ];
    for (const [label, value] of details) {
      doc.rect(50, y, W, 22).fill(y % 44 === 0 ? LIGHT : '#fff');
      doc.fillColor(GRAY).font('Helvetica').fontSize(10).text(label, 60, y + 6);
      doc.fillColor(DARK).font('Helvetica-Bold').text(value, 250, y + 6);
      y += 22;
    }
    y += 20;

    // ── Pricing breakdown ────────────────────────────────────
    doc.fillColor(DARK).fontSize(11).font('Helvetica-Bold').text('PRICING BREAKDOWN', 50, y);
    y += 20;

    // Table header
    doc.rect(50, y, W, 22).fill(GOLD);
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(10)
      .text('Description', 60, y + 6)
      .text('Nights', 280, y + 6)
      .text('Rate/Night', 340, y + 6)
      .text('Amount', 450, y + 6, { align: 'right', width: 80 });
    y += 22;

    doc.rect(50, y, W, 22).fill(LIGHT);
    doc.fillColor(DARK).font('Helvetica').fontSize(10)
      .text(room?.name || 'Accommodation', 60, y + 6)
      .text(String(booking.nights || 1), 280, y + 6)
      .text(`$${((room?.basePrice || 0)).toFixed(2)}`, 340, y + 6)
      .text(`$${(booking.pricing?.baseAmount || 0).toFixed(2)}`, 450, y + 6, { align: 'right', width: 80 });
    y += 30;

    // Totals
    const lines = [
      ['Subtotal',       (booking.pricing?.baseAmount   || 0).toFixed(2), false],
      ['Taxes & Fees (14%)', (booking.pricing?.taxAmount || 0).toFixed(2), false],
      ...(booking.pricing?.discountAmount > 0 ? [['Discount', `-${(booking.pricing.discountAmount).toFixed(2)}`, false]] : []),
      ['TOTAL DUE',      (booking.pricing?.totalAmount   || 0).toFixed(2), true],
      ['Amount Paid',    totalPaid.toFixed(2), false],
      ...(balance > 0.01 ? [['Balance Due', balance.toFixed(2), false]] : []),
    ];
    for (const [label, value, isBold] of lines) {
      if (isBold) {
        y += 8;
        doc.rect(350, y, W - 300, 28).fill(GOLD);
        doc.fillColor('#fff').font('Helvetica-Bold').fontSize(12)
          .text(label, 360, y + 7)
          .text(`$${value}`, 450, y + 7, { align: 'right', width: 80 });
        y += 36;
      } else {
        doc.fillColor(GRAY).font('Helvetica').fontSize(10).text(label, 360, y + 6);
        doc.fillColor(DARK).font('Helvetica-Bold').text(`$${value}`, 450, y + 6, { align: 'right', width: 80 });
        y += 22;
      }
    }

    // ── Payment history ──────────────────────────────────────
    if (payments.length > 0) {
      y += 20;
      doc.fillColor(DARK).fontSize(11).font('Helvetica-Bold').text('PAYMENT HISTORY', 50, y);
      y += 20;
      for (const p of payments) {
        doc.fillColor(GRAY).font('Helvetica').fontSize(10).text(`${(p.method || '').replace(/_/g,' ')} — ${new Date(p.paidAt || p.createdAt).toLocaleDateString()}`, 60, y);
        doc.fillColor('#16a34a').font('Helvetica-Bold').text(`$${(p.amount - (p.refundAmount||0)).toFixed(2)}`, 450, y, { align:'right', width: 80 });
        y += 18;
      }
    }

    // ── Footer ───────────────────────────────────────────────
    y += 30;
    doc.moveTo(50, y).lineTo(50 + W, y).strokeColor('#e5e5e5').stroke();
    y += 16;
    doc.fillColor(GRAY).fontSize(9).font('Helvetica')
      .text('Thank you for choosing ' + (hotelInfo?.name || 'us') + '. We hope to welcome you again!', 50, y, { align:'center', width: W })
      .text('For inquiries: ' + (hotelInfo?.contact?.email || 'contact@hotel.com'), 50, y + 14, { align:'center', width: W });

    doc.end();
  });
};
