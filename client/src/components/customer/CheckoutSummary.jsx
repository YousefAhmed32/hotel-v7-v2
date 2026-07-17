import { formatCurrency, formatDate, formatNights } from '@/utils/formatters';
import { Tag, X } from 'lucide-react';
import { useState } from 'react';
import { couponApi } from '@/services/couponApi';
import toast from 'react-hot-toast';
export const CheckoutSummary = ({ room, hotel, checkIn, checkOut, adults, children, onCouponApplied, couponResult }) => {
  const [couponCode, setCouponCode] = useState('');
  const [applying, setApplying] = useState(false);
  if (!room || !checkIn || !checkOut) return null;
  const nights = Math.round((new Date(checkOut) - new Date(checkIn)) / (1000*60*60*24));
  const baseAmount = room.basePrice * nights;
  const taxAmount = Math.round(baseAmount * 0.14 * 100) / 100;
  const discount = couponResult?.discountAmount || 0;
  const total = Math.round((baseAmount + taxAmount - discount) * 100) / 100;
  const handleApply = async () => {
    if (!couponCode.trim()) return;
    try {
      setApplying(true);
      const { data } = await couponApi.apply(hotel._id, { code: couponCode, roomId: room._id, checkIn, baseAmount });
      onCouponApplied(data.data);
      toast.success('Coupon applied - you save ' + formatCurrency(data.data.discountAmount));
    } catch (err) { toast.error(err.response?.data?.message || 'Invalid coupon'); }
    finally { setApplying(false); }
  };
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm space-y-4 sticky top-24">
      <div><p className="text-sm text-neutral-400">{hotel?.name}</p><h3 className="font-semibold text-neutral-900">{room.name}</h3><p className="text-xs text-neutral-300 capitalize mt-0.5">{room.type}</p></div>
      <div className="gold-divider" />
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div><p className="text-neutral-400 text-xs mb-1">Check-in</p><p className="font-medium text-neutral-900">{formatDate(checkIn)}</p></div>
        <div><p className="text-neutral-400 text-xs mb-1">Check-out</p><p className="font-medium text-neutral-900">{formatDate(checkOut)}</p></div>
        <div><p className="text-neutral-400 text-xs mb-1">Guests</p><p className="font-medium text-neutral-900">{adults} adult{adults > 1 ? 's' : ''}{children > 0 && ', ' + children + ' child'}</p></div>
        <div><p className="text-neutral-400 text-xs mb-1">Duration</p><p className="font-medium text-neutral-900">{formatNights(checkIn, checkOut)}</p></div>
      </div>
      <div className="gold-divider" />
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-neutral-400"><span>{formatCurrency(room.basePrice)} × {nights} nights</span><span>{formatCurrency(baseAmount)}</span></div>
        <div className="flex justify-between text-neutral-400"><span>Taxes & fees (14%)</span><span>{formatCurrency(taxAmount)}</span></div>
        {discount > 0 && <div className="flex justify-between text-emerald-600"><span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" />{couponResult?.coupon?.code}</span><span>-{formatCurrency(discount)}</span></div>}
        <div className="flex justify-between font-bold text-neutral-900 pt-2 border-t border-neutral-100"><span>Total</span><span className="text-amber-600 font-bold text-lg">{formatCurrency(total)}</span></div>
      </div>
      {!couponResult ? (
        <div className="space-y-2">
          <p className="text-xs text-neutral-400 flex items-center gap-1"><Tag className="w-3.5 h-3.5 text-amber-500" /> Have a coupon code?</p>
          <div className="flex gap-2">
            <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="SUMMER25" className="luxury-input flex-1 text-sm py-2 font-mono" />
            <button onClick={handleApply} disabled={applying || !couponCode} className="btn-ghost text-sm py-2 px-4 disabled:opacity-60">{applying ? '...' : 'Apply'}</button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200">
          <span className="text-sm text-emerald-600 font-mono">{couponResult.coupon?.code}</span>
          <button onClick={() => onCouponApplied(null)} className="text-emerald-600 hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
};
