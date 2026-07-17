import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  // If no SMTP configured, use mock (logs to console)
  if (!env.SMTP_HOST) {
    transporter = {
      sendMail: async (opts) => {
        logger.info(`[EMAIL MOCK] To: ${opts.to} | Subject: ${opts.subject}`);
        return { messageId: 'mock-' + Date.now() };
      },
    };
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: parseInt(env.SMTP_PORT || '587'),
    secure: env.SMTP_SECURE === 'true',
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    tls: { rejectUnauthorized: false },
  });

  return transporter;
};

const FROM = (name = 'LuxStay') => `"${name}" <${env.SMTP_FROM || 'noreply@luxstay.com'}>`;

// ── Template helpers ───────────────────────────────────────────
const baseHtml = (content, hotelName = 'LuxStay') => `
<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; background:#f5f5f5; color:#171717; }
  .wrapper { max-width:600px; margin:0 auto; background:#fff; }
  .header  { background:linear-gradient(135deg,#C9A84C,#b8922a); padding:32px 40px; }
  .header h1 { color:#fff; font-size:26px; font-weight:700; letter-spacing:-0.5px; }
  .header p  { color:rgba(255,255,255,0.8); font-size:14px; margin-top:4px; }
  .body    { padding:40px; }
  .code    { background:#fef3c7; border:1.5px solid #fbbf24; border-radius:12px; padding:16px 20px; margin:20px 0; font-family:monospace; font-size:22px; font-weight:800; color:#92400e; letter-spacing:2px; text-align:center; }
  .row     { display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #f0f0f0; font-size:14px; }
  .row:last-child { border-bottom:none; }
  .label   { color:#737373; }
  .value   { font-weight:600; color:#171717; }
  .btn     { display:block; margin:24px 0; text-align:center; }
  .btn a   { background:#C9A84C; color:#fff; text-decoration:none; padding:14px 32px; border-radius:12px; font-weight:700; font-size:15px; }
  .total   { background:#fafafa; border-radius:12px; padding:20px; margin:20px 0; }
  .total-row { display:flex; justify-content:space-between; padding:6px 0; font-size:14px; }
  .total-row.final { font-size:18px; font-weight:800; color:#C9A84C; border-top:2px solid #e5e5e5; padding-top:12px; margin-top:8px; }
  .footer  { background:#fafafa; padding:24px 40px; text-align:center; color:#a3a3a3; font-size:12px; border-top:1px solid #e5e5e5; }
  .status-badge { display:inline-block; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:700; }
  .badge-green  { background:#ecfdf5; color:#065f46; }
  .badge-red    { background:#fef2f2; color:#991b1b; }
  .badge-yellow { background:#fffbeb; color:#92400e; }
</style>
</head><body>
<div class="wrapper">
  <div class="header">
    <h1>🏨 ${hotelName}</h1>
    <p>Powered by LuxStay PMS</p>
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} ${hotelName}. All rights reserved.</p>
    <p style="margin-top:4px">This is an automated message, please do not reply.</p>
  </div>
</div>
</body></html>`;

// ── Send functions ─────────────────────────────────────────────
export const sendBookingConfirmation = async ({ booking, hotel, guest }) => {
  const nights    = booking.nights || 1;
  const hotelName = hotel?.name || 'Our Hotel';
  const subject   = `Booking Request Received — ${booking.confirmationCode}`;

  const content = `
    <h2 style="font-size:22px;font-weight:700;margin-bottom:8px;">Booking Request Submitted!</h2>
    <p style="color:#737373;margin-bottom:24px;">Hi ${guest?.name || 'Guest'}, your booking request has been received and is <strong>pending hotel approval</strong>. You'll receive a confirmation email once it's approved.</p>

    <div class="code">${booking.confirmationCode}</div>

    <div style="margin:20px 0">
      ${[
        ['Hotel',     hotelName],
        ['Room',      booking.roomId?.name || 'Room'],
        ['Check-in',  new Date(booking.checkIn).toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })],
        ['Check-out', new Date(booking.checkOut).toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })],
        ['Duration',  nights + ' night' + (nights > 1 ? 's' : '')],
        ['Guests',    (booking.adults || 1) + ' adult' + ((booking.adults || 1) > 1 ? 's' : '')],
        ['Payment',   (booking.paymentMethod || 'cash_on_arrival').replace(/_/g, ' ')],
      ].map(([l, v]) => `<div class="row"><span class="label">${l}</span><span class="value">${v}</span></div>`).join('')}
    </div>

    <div class="total">
      <div class="total-row"><span>Subtotal</span><span>$${(booking.pricing?.baseAmount || 0).toFixed(2)}</span></div>
      <div class="total-row"><span>Taxes (14%)</span><span>$${(booking.pricing?.taxAmount || 0).toFixed(2)}</span></div>
      ${booking.pricing?.discountAmount > 0 ? `<div class="total-row" style="color:#16a34a"><span>Discount</span><span>-$${(booking.pricing.discountAmount).toFixed(2)}</span></div>` : ''}
      <div class="total-row final"><span>Total</span><span>$${(booking.pricing?.totalAmount || 0).toFixed(2)}</span></div>
    </div>

    <p style="color:#737373;font-size:13px;margin-top:16px;">⏳ The hotel team will review your request and send you a confirmation. This usually takes a few hours.</p>`;

  await getTransporter().sendMail({
    from: FROM(hotelName),
    to: guest?.email,
    subject,
    html: baseHtml(content, hotelName),
  });
  logger.info(`[EMAIL] Booking confirmation sent to ${guest?.email}`);
};

export const sendBookingApproved = async ({ booking, hotel, guest }) => {
  const hotelName = hotel?.name || 'Our Hotel';

  const content = `
    <h2 style="font-size:22px;font-weight:700;margin-bottom:8px;color:#065f46;">✅ Booking Confirmed!</h2>
    <p style="color:#737373;margin-bottom:24px;">Great news, ${guest?.name || 'Guest'}! Your booking has been approved.</p>
    <div class="code">${booking.confirmationCode}</div>
    <div style="margin:20px 0">
      ${[
        ['Hotel',     hotelName],
        ['Room',      booking.roomId?.name || 'Room'],
        ['Check-in',  new Date(booking.checkIn).toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })],
        ['Check-out', new Date(booking.checkOut).toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })],
        ['Status',    '<span class="status-badge badge-green">CONFIRMED</span>'],
      ].map(([l, v]) => `<div class="row"><span class="label">${l}</span><span class="value">${v}</span></div>`).join('')}
    </div>
    <p style="color:#737373;font-size:13px">Please arrive at the hotel with a valid ID. Our team will be ready to welcome you.</p>`;

  await getTransporter().sendMail({ from: FROM(hotelName), to: guest?.email, subject: `Booking Confirmed ✓ — ${booking.confirmationCode}`, html: baseHtml(content, hotelName) });
  logger.info(`[EMAIL] Approval sent to ${guest?.email}`);
};

export const sendBookingRejected = async ({ booking, hotel, guest, reason }) => {
  const hotelName = hotel?.name || 'Our Hotel';

  const content = `
    <h2 style="font-size:22px;font-weight:700;margin-bottom:8px;color:#991b1b;">Booking Not Approved</h2>
    <p style="color:#737373;margin-bottom:24px;">We're sorry, ${guest?.name || 'Guest'}. Unfortunately, we were unable to approve your booking.</p>
    <div class="code" style="background:#fef2f2;border-color:#fca5a5;color:#991b1b">${booking.confirmationCode}</div>
    ${reason ? `<div style="background:#fef2f2;border-radius:12px;padding:16px;margin:16px 0"><p style="color:#991b1b;font-size:14px"><strong>Reason:</strong> ${reason}</p></div>` : ''}
    <p style="color:#737373;font-size:13px">You haven't been charged. Please search for other available rooms or contact us directly.</p>`;

  await getTransporter().sendMail({ from: FROM(hotelName), to: guest?.email, subject: `Booking Update — ${booking.confirmationCode}`, html: baseHtml(content, hotelName) });
};

export const sendCheckInConfirmation = async ({ booking, hotel, guest }) => {
  const hotelName = hotel?.name || 'Our Hotel';

  const content = `
    <h2 style="font-size:22px;font-weight:700;margin-bottom:8px;">Welcome to ${hotelName}! 🏨</h2>
    <p style="color:#737373;margin-bottom:24px;">You have successfully checked in. We hope you enjoy your stay!</p>
    <div class="code">${booking.confirmationCode}</div>
    <div style="margin:20px 0">
      ${[
        ['Room',       booking.roomId?.name || 'Your Room'],
        ['Check-out',  new Date(booking.checkOut).toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })],
        ['Duration',   booking.nights + ' night' + (booking.nights > 1 ? 's' : '')],
      ].map(([l, v]) => `<div class="row"><span class="label">${l}</span><span class="value">${v}</span></div>`).join('')}
    </div>
    <p style="color:#737373;font-size:13px">Need anything? Use the hotel's guest portal to request room service, cleaning, or any assistance.</p>`;

  await getTransporter().sendMail({ from: FROM(hotelName), to: guest?.email, subject: `Welcome — You're checked in! 🏨`, html: baseHtml(content, hotelName) });
};
