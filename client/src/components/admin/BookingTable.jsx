import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { MoreVertical, Eye, XCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatCurrency } from '@/utils/formatters';
const STATUS_STYLES = { confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20', cancelled: 'bg-red-500/10 text-red-400 border-red-500/20', completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20', locked: 'bg-purple-500/10 text-purple-400 border-purple-500/20', no_show: 'bg-gray-500/10 text-gray-400 border-gray-500/20' };
const BookingRow = ({ booking, onStatusUpdate, onView }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-neutral-200/50 hover:bg-neutral-100/30 transition-colors">
      <td className="px-4 py-3"><span className="text-sm font-mono text-amber-500">{booking.confirmationCode}</span></td>
      <td className="px-4 py-3"><div><p className="text-sm font-medium text-neutral-900">{booking.userId?.name || 'Guest'}</p><p className="text-xs text-neutral-400">{booking.userId?.email}</p></div></td>
      <td className="px-4 py-3"><p className="text-sm text-neutral-900">{booking.roomId?.name || 'Room'}</p><p className="text-xs text-neutral-400 capitalize">{booking.roomId?.type}</p></td>
      <td className="px-4 py-3"><p className="text-sm text-neutral-900">{booking.checkIn ? format(new Date(booking.checkIn), 'MMM dd') : '-'} → {booking.checkOut ? format(new Date(booking.checkOut), 'MMM dd, yyyy') : '-'}</p><p className="text-xs text-neutral-400">{booking.nights} nights</p></td>
      <td className="px-4 py-3"><p className="text-sm font-semibold text-neutral-900">{formatCurrency(booking.pricing?.totalAmount || 0)}</p></td>
      <td className="px-4 py-3"><span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize', STATUS_STYLES[booking.status] || STATUS_STYLES.pending)}>{booking.status?.replace('_',' ')}</span></td>
      <td className="px-4 py-3">
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-1.5 rounded-lg hover:bg-neutral-200 text-neutral-400 hover:text-neutral-900 transition-colors"><MoreVertical className="w-4 h-4" /></button>
          {menuOpen && (
            <div className="absolute right-0 top-8 w-48 luxury-card shadow-card-hover z-50 py-1">
              <button onClick={() => { onView(booking); setMenuOpen(false); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-neutral-900 hover:bg-neutral-100"><Eye className="w-4 h-4 text-amber-500" /> View Details</button>
              {booking.status === 'confirmed' && <button onClick={() => { onStatusUpdate(booking._id, 'completed'); setMenuOpen(false); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-emerald-400 hover:bg-neutral-100"><CheckCircle className="w-4 h-4" /> Mark Completed</button>}
              {['confirmed','pending'].includes(booking.status) && <button onClick={() => { onStatusUpdate(booking._id, 'cancelled'); setMenuOpen(false); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-neutral-100"><XCircle className="w-4 h-4" /> Cancel</button>}
            </div>
          )}
        </div>
      </td>
    </motion.tr>
  );
};
export const BookingTable = ({ bookings = [], onStatusUpdate, onView, isLoading }) => {
  if (isLoading) return <div className="luxury-card overflow-hidden"><div className="p-6 space-y-3">{[...Array(5)].map((_,i) => <div key={i} className="skeleton h-14 rounded-lg" />)}</div></div>;
  return (
    <div className="luxury-card overflow-hidden"><div className="overflow-x-auto">
      <table className="w-full">
        <thead><tr className="border-b border-neutral-200">{['Ref','Guest','Room','Dates','Amount','Status',''].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">{h}</th>)}</tr></thead>
        <tbody>
          {bookings.length === 0 ? <tr><td colSpan={7} className="px-4 py-12 text-center text-neutral-400 text-sm">No bookings found</td></tr>
          : bookings.map(booking => <BookingRow key={booking._id} booking={booking} onStatusUpdate={onStatusUpdate} onView={onView} />)}
        </tbody>
      </table>
    </div></div>
  );
};
