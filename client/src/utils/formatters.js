import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
export const formatCurrency = (amount, currency = 'USD') => new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount || 0);
export const formatDate = (date, fmt = 'MMM dd, yyyy') => { try { return format(new Date(date), fmt); } catch { return ''; } };
export const formatRelative = (date) => { try { return formatDistanceToNow(new Date(date), { addSuffix: true }); } catch { return ''; } };
export const formatNights = (checkIn, checkOut) => { const nights = differenceInDays(new Date(checkOut), new Date(checkIn)); return nights + ' night' + (nights !== 1 ? 's' : ''); };
export const formatRating = (rating) => Number(rating || 0).toFixed(1);
export const formatShortNumber = (num) => { if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'; if (num >= 1000) return (num / 1000).toFixed(1) + 'K'; return String(num || 0); };
export const capitalize = (str) => (str || '').charAt(0).toUpperCase() + (str || '').slice(1);
export const truncate = (str, length = 100) => (str || '').length > length ? str.substring(0, length) + '...' : (str || '');
