/**
 * seedHelpers.js
 * ═══════════════════════════════════════════════════════════════════════════
 * Utility functions for superSeeder.js
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Random integer between min and max (inclusive)
 */
export const randInt = (min, max) => {
    if (min > max) [min, max] = [max, min];
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };
  
  /**
   * Random float between min and max, fixed to 2 decimal places
   */
  export const randFloat = (min, max) => {
    if (min > max) [min, max] = [max, min];
    return parseFloat((Math.random() * (max - min) + min).toFixed(2));
  };
  
  /**
   * Pick random item from array
   */
  export const pick = (arr) => {
    if (!arr || arr.length === 0) return undefined;
    return arr[Math.floor(Math.random() * arr.length)];
  };
  
  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  export function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  
  /**
   * Random date between two dates
   */
  export function randomDate(start, end) {
    if (!(start instanceof Date)) start = new Date(start);
    if (!(end instanceof Date)) end = new Date(end);
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }
  
  /**
   * Set date to midnight (00:00:00 UTC)
   */
  export function toMidnight(d) {
    const dt = new Date(d);
    dt.setUTCHours(0, 0, 0, 0);
    return dt;
  }
  
  /**
   * Add days to a date
   */
  export function addDays(d, n) {
    const dt = new Date(d);
    dt.setDate(dt.getDate() + n);
    return dt;
  }
  
  /**
   * Get day key in YYYY-MM-DD format
   */
  export function dayKey(roomId, date) {
    const d = date instanceof Date ? date : new Date(date);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${roomId}-${year}-${month}-${day}`;
  }
  
  /**
   * Get all date keys in range [checkIn, checkOut)
   */
  export function dateRange(roomId, checkIn, checkOut) {
    const keys = [];
    let cur = new Date(checkIn);
    
    while (cur < checkOut) {
      keys.push(dayKey(roomId, cur));
      cur.setDate(cur.getDate() + 1);
    }
    
    return keys;
  }
  
  /**
   * Calculate booking price with nightly rates, tax, and discount
   */
  export function calculatePrice(basePrice, checkIn, checkOut, discountPct = 0) {
    if (!(checkIn instanceof Date)) checkIn = new Date(checkIn);
    if (!(checkOut instanceof Date)) checkOut = new Date(checkOut);
  
    const nights = Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const nightlyRates = [];
    let baseAmount = 0;
  
    for (let i = 0; i < nights; i++) {
      const d = new Date(checkIn);
      d.setDate(d.getDate() + i);
      
      const dow = d.getDay();
      // Weekend uplift: Fri (5) & Sat (6) = +25%
      const multiplier = (dow === 5 || dow === 6) ? 1.25 : 1.0;
      const price = Math.round(basePrice * multiplier * 100) / 100;
      
      nightlyRates.push({ date: new Date(d), price });
      baseAmount += price;
    }
  
    const discountAmount = Math.round(baseAmount * discountPct / 100 * 100) / 100;
    const taxableAmount = baseAmount - discountAmount;
    const taxAmount = Math.round(taxableAmount * 0.12 * 100) / 100; // 12% tax
    const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;
  
    return {
      baseAmount: Math.round(baseAmount * 100) / 100,
      taxAmount,
      discountAmount,
      extraAmount: 0,
      totalAmount,
      currency: 'USD',
      nightlyRates,
    };
  }
  
  /**
   * Generate unique confirmation code
   */
  export function genConfCode(date) {
    const d = date instanceof Date ? date : new Date(date);
    const dateStr = d.toISOString().slice(0, 10).replace(/-/g, '');
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `LX-${dateStr}-${suffix}`;
  }
  
  /**
   * Convert string to URL-friendly slug
   */
  export function slugify(name) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 100); // Max 100 chars
  }
  
  /**
   * Utilities for logging
   */
  export const log = {
    info: (msg) => console.log(`ℹ️  ${msg}`),
    success: (msg) => console.log(`✅  ${msg}`),
    warn: (msg) => console.log(`⚠️  ${msg}`),
    error: (msg) => console.error(`❌  ${msg}`),
    section: (title) => console.log(`\n${'═'.repeat(60)}\n${title}\n${'═'.repeat(60)}\n`),
  };
  
  /**
   * Format duration from milliseconds to human-readable string
   */
  export function formatDuration(ms) {
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.round(minutes / 60);
    return `${hours}h`;
  }
  
  /**
   * Statistics helper for seed reporting
   */
  export function seedStats(data) {
    const stats = {
      totalUsers: (data.owners?.length || 0) + (data.staffUsers?.length || 0) + (data.customers?.length || 0),
      totalRecords: (data.hotels?.length || 0) +
                    (data.rooms?.length || 0) +
                    (data.bookings?.length || 0) +
                    (data.reviews?.length || 0) +
                    (data.conversations?.length || 0) +
                    (data.messages?.length || 0) +
                    (data.priceHistories?.length || 0) +
                    (data.coupons?.length || 0),
    };
    
    return {
      ...stats,
      summary: {
        owners: data.owners?.length || 0,
        staff: data.staffUsers?.length || 0,
        customers: data.customers?.length || 0,
        hotels: data.hotels?.length || 0,
        rooms: data.rooms?.length || 0,
        coupons: data.coupons?.length || 0,
        bookings: data.bookings?.length || 0,
        reviews: data.reviews?.length || 0,
        conversations: data.conversations?.length || 0,
        messages: data.messages?.length || 0,
        priceHistory: data.priceHistories?.length || 0,
      },
    };
  }
  
  /**
   * Batch processing helper (process in chunks to avoid memory issues)
   */
  export async function processBatch(items, batchSize, processFn) {
    const results = [];
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(processFn));
      results.push(...batchResults);
    }
    return results;
  }
  
  /**
   * Percentage chance helper
   */
  export function chance(percentage) {
    return Math.random() * 100 < percentage;
  }
  
  /**
   * Deep clone object (JSON safe)
   */
  export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
  
  /**
   * Merge nested objects
   */
  export function mergeObjects(target, source) {
    const result = { ...target };
    for (const key in source) {
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        result[key] = mergeObjects(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }
  
  /**
   * Generate random email
   */
  export function randomEmail(domain = 'example.com') {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let email = '';
    for (let i = 0; i < 10; i++) {
      email += chars[Math.floor(Math.random() * chars.length)];
    }
    return `${email}@${domain}`;
  }
  
  /**
   * Generate random phone number
   */
  export function randomPhone(format = '+1-XXX-555-XXXX') {
    return format.replace(/X/g, () => Math.floor(Math.random() * 10));
  }
  
  /**
   * Format number with thousand separators
   */
  export function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  
  /**
   * Calculate average from array
   */
  export function average(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }
  
  /**
   * Calculate median from array
   */
  export function median(arr) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }
  
  /**
   * Validate email address
   */
  export function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
  
  /**
   * Validate phone number (basic)
   */
  export function isValidPhone(phone) {
    const re = /^[\d\s\-\+\(\)]+$/;
    return re.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }
  
  /**
   * Batch insert with duplicate handling
   */
  export async function insertWithDuplicateHandling(model, docs, uniqueFields = []) {
    const inserted = [];
    const skipped = [];
  
    for (const doc of docs) {
      try {
        const result = await model.create(doc);
        inserted.push(result);
      } catch (err) {
        if (err.code === 11000) {
          skipped.push({ doc, error: 'Duplicate key' });
        } else {
          throw err;
        }
      }
    }
  
    return { inserted, skipped };
  }
  
  export default {
    randInt,
    randFloat,
    pick,
    shuffle,
    randomDate,
    toMidnight,
    addDays,
    dayKey,
    dateRange,
    calculatePrice,
    genConfCode,
    slugify,
    log,
    formatDuration,
    seedStats,
    processBatch,
    chance,
    deepClone,
    mergeObjects,
    randomEmail,
    randomPhone,
    formatNumber,
    average,
    median,
    isValidEmail,
    isValidPhone,
    insertWithDuplicateHandling,
  };