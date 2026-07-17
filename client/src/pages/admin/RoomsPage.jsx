import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, BedDouble, LayoutGrid, List,
  SlidersHorizontal, X, ChevronDown, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchRooms, createRoom, updateRoom, deleteRoom,
  selectRooms, selectRoomsLoading,
} from '@/features/room/roomSlice';
import { selectUserHotelId } from '@/features/auth/authSlice';
import { RoomCard } from '@/components/admin/RoomCard';
import { RoomFormModal } from '@/components/admin/RoomFormModal';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { cn } from '@/utils/cn';

/* ─── Design Tokens ───────────────────────────────────────────────── */
// Primary:   #f6a003  (brand gold)
// Surface:   #fefcf7  (warm white)
// Card:      #ffffff
// Border:    #f0e8d8
// Text:      #1a1410  (deep warm black)
// Muted:     #8a7560  (warm taupe)
// Accent bg: #fff8ed  (pale gold wash)

const TYPES = ['all','standard','deluxe','suite','penthouse','villa','studio'];

const TYPE_ICONS = {
  all: '✦',
  standard: '⬜',
  deluxe: '◈',
  suite: '◉',
  penthouse: '▲',
  villa: '⬡',
  studio: '◎',
};

/* ─── Sub-components ──────────────────────────────────────────────── */

function StatBadge({ label, value, sub }) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-3 rounded-2xl bg-[#fff8ed] border border-[#f0e8d8] min-w-[90px]">
      <span className="text-2xl font-bold text-[#f6a003] leading-none">{value}</span>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[#8a7560] mt-0.5">{label}</span>
      {sub && <span className="text-[9px] text-[#c4a882] mt-0.5">{sub}</span>}
    </div>
  );
}

function TypePill({ type, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-all duration-200 whitespace-nowrap border',
        active
          ? 'bg-[#f6a003] text-white border-[#f6a003] shadow-[0_4px_14px_rgba(246,160,3,0.35)]'
          : 'bg-white text-[#8a7560] border-[#f0e8d8] hover:border-[#f6a003] hover:text-[#f6a003] hover:bg-[#fff8ed]'
      )}
    >
      <span className="text-[10px]">{TYPE_ICONS[type]}</span>
      {type}
      {count !== undefined && (
        <span className={cn(
          'text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none',
          active ? 'bg-white/30 text-white' : 'bg-[#f0e8d8] text-[#8a7560] group-hover:bg-[#fde7b0] group-hover:text-[#c47d00]'
        )}>
          {count}
        </span>
      )}
    </button>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────── */

export default function RoomsPage() {
  const { t } = useTranslation();
  const dispatch  = useDispatch();
  const hotelId   = useSelector(selectUserHotelId);
  const rooms     = useSelector(selectRooms);
  const isLoading = useSelector(selectRoomsLoading);

  const [modalOpen,   setModalOpen]   = useState(false);
  const [editing,     setEditing]     = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [search,      setSearch]      = useState('');
  const [typeFilter,  setTypeFilter]  = useState('all');
  const [viewMode,    setViewMode]    = useState('grid'); // grid | list
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (hotelId) dispatch(fetchRooms({ hotelId, params: { isActive: 'all', limit: 100 } }));
  }, [dispatch, hotelId]);

  /* counts per type for pills */
  const typeCounts = TYPES.reduce((acc, t) => {
    acc[t] = t === 'all' ? rooms.length : rooms.filter(r => r.type === t).length;
    return acc;
  }, {});

  const filtered = rooms.filter(r => {
    const matchSearch = !search || r.name?.toLowerCase().includes(search.toLowerCase()) || r.roomNumber?.includes(search);
    const matchType   = typeFilter === 'all' || r.type === typeFilter;
    return matchSearch && matchType;
  });

  const activeCount   = rooms.filter(r => r.isActive).length;
  const occupiedCount = rooms.filter(r => r.status === 'occupied').length;

  const openAdd  = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (r) => { setEditing(r); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const handleSubmit = async (data) => {
    if (!hotelId) return;
    setSaving(true);
    try {
      if (editing) {
        await dispatch(updateRoom({ hotelId, roomId: editing._id, roomData: data })).unwrap();
        toast.success('Room updated successfully');
      } else {
        await dispatch(createRoom({ hotelId, roomData: data })).unwrap();
        toast.success('Room created successfully');
      }
      closeModal();
    } catch (err) {
      toast.error(err || 'Failed to save room');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (roomId) => {
    if (!confirm('Deactivate this room? Active bookings will not be affected.')) return;
    try {
      await dispatch(deleteRoom({ hotelId, roomId })).unwrap();
      toast.success('Room deactivated');
    } catch (err) {
      toast.error(err || 'Failed');
    }
  };

  /* ── render ──────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#fefcf7] font-sans">
      {/* ── decorative top accent bar ── */}
      <div className="h-1 w-full bg-gradient-to-r from-[#f6a003] via-[#ffc843] to-[#f6a003]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">

        {/* ══ HEADER ══════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5"
        >
          {/* left: title + stats */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#f6a003] flex items-center justify-center shadow-[0_4px_14px_rgba(246,160,3,0.35)]">
                <BedDouble className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1410] tracking-tight leading-none">
                  Rooms
                </h1>
                <p className="text-[#8a7560] text-sm mt-0.5">Manage your property's room inventory</p>
              </div>
            </div>

            {/* stat pills */}
            <div className="flex flex-wrap gap-2">
              <StatBadge label="Total"    value={rooms.length}    />
              <StatBadge label="Active"   value={activeCount}     />
              <StatBadge label="Occupied" value={occupiedCount}   />
              <StatBadge label="Vacant"   value={activeCount - occupiedCount} />
            </div>
          </div>

          {/* right: add button */}
          <button
            onClick={openAdd}
            className="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#f6a003] text-white text-sm font-semibold shadow-[0_4px_18px_rgba(246,160,3,0.4)] hover:bg-[#e09200] hover:shadow-[0_6px_22px_rgba(246,160,3,0.5)] active:scale-[0.97] transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Add Room
          </button>
        </motion.div>

        {/* thin divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#f0e8d8] to-transparent" />

        {/* ══ TOOLBAR ═════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          className="flex flex-col gap-4"
        >
          {/* row 1: search + view toggle + filter toggle */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c4a882]" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or room number…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#f0e8d8] bg-white text-[#1a1410] text-sm placeholder-[#c4a882] focus:outline-none focus:border-[#f6a003] focus:ring-2 focus:ring-[#f6a003]/20 transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c4a882] hover:text-[#f6a003] transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {/* view mode toggle */}
              <div className="flex items-center bg-white border border-[#f0e8d8] rounded-xl p-1 gap-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-1.5 rounded-lg transition-all',
                    viewMode === 'grid' ? 'bg-[#f6a003] text-white shadow-sm' : 'text-[#8a7560] hover:text-[#f6a003]'
                  )}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-1.5 rounded-lg transition-all',
                    viewMode === 'list' ? 'bg-[#f6a003] text-white shadow-sm' : 'text-[#8a7560] hover:text-[#f6a003]'
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* filter toggle (mobile) */}
              <button
                onClick={() => setShowFilters(v => !v)}
                className={cn(
                  'sm:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all',
                  showFilters
                    ? 'bg-[#f6a003] text-white border-[#f6a003]'
                    : 'bg-white border-[#f0e8d8] text-[#8a7560]'
                )}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
              </button>
            </div>
          </div>

          {/* row 2: type filter pills */}
          <div className={cn(
            'flex flex-wrap gap-2',
            'sm:flex', // always visible on sm+
            showFilters ? 'flex' : 'hidden sm:flex' // toggle on mobile
          )}>
            {TYPES.map(t => (
              <TypePill
                key={t}
                type={t}
                active={typeFilter === t}
                count={typeCounts[t]}
                onClick={() => setTypeFilter(t)}
              />
            ))}
            {(search || typeFilter !== 'all') && (
              <button
                onClick={() => { setSearch(''); setTypeFilter('all'); }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-[#c47d00] bg-[#fff0cc] border border-[#fcd97a] hover:bg-[#ffe8a0] transition-colors"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>

          {/* results count */}
          {(search || typeFilter !== 'all') && !isLoading && (
            <p className="text-xs text-[#8a7560]">
              Showing <span className="font-semibold text-[#f6a003]">{filtered.length}</span> of {rooms.length} rooms
            </p>
          )}
        </motion.div>

        {/* ══ CONTENT ═════════════════════════════════════════════════ */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#fff8ed] border border-[#f0e8d8] flex items-center justify-center">
              <BedDouble className="w-6 h-6 text-[#f6a003] animate-pulse" />
            </div>
            <p className="text-sm text-[#8a7560] animate-pulse">Loading rooms…</p>
          </div>
        ) : filtered.length === 0 ? (
          /* empty state */
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-[#f0e8d8] p-16 text-center shadow-sm"
          >
            <div className="w-16 h-16 rounded-3xl bg-[#fff8ed] border border-[#f0e8d8] flex items-center justify-center mx-auto mb-4">
              <BedDouble className="w-8 h-8 text-[#c4a882]" />
            </div>
            <h3 className="text-lg font-semibold text-[#1a1410] mb-1">
              {search || typeFilter !== 'all' ? 'No rooms match your filters' : 'No rooms yet'}
            </h3>
            <p className="text-sm text-[#8a7560] mb-6">
              {search || typeFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Start by adding your first room to the property'}
            </p>
            {!search && typeFilter === 'all' && (
              <button
                onClick={openAdd}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#f6a003] text-white text-sm font-semibold shadow-[0_4px_18px_rgba(246,160,3,0.35)] hover:bg-[#e09200] transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Your First Room
              </button>
            )}
          </motion.div>
        ) : (
          /* room grid / list */
          <motion.div
            layout
            className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5'
                : 'flex flex-col gap-3'
            )}
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((room, i) => (
                <motion.div
                  key={room._id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                >
                  <RoomCard
                    room={room}
                    viewMode={viewMode}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* ── Modal ── */}
      <RoomFormModal
        open={modalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        initialData={editing}
        isLoading={saving}
      />
    </div>
  );
}