import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Plus, Minus, Upload, Trash2, Star,
  Image as ImageIcon, Loader2, BedDouble,
  Users, Ruler, DollarSign, Tag, AlignLeft,
  CheckCircle2, ChevronRight
} from 'lucide-react';
import { cn } from '@/utils/cn';
import api from '@/services/api';
import toast from 'react-hot-toast';

/* ─── constants ─────────────────────────────────────────────────── */
const ROOM_TYPES = ['standard','deluxe','suite','penthouse','villa','studio','connecting','accessible'];
const AMENITIES  = ['wifi','tv','minibar','jacuzzi','balcony','oceanView','aircon','safe','bathrobe','parking'];
const BED_TYPES  = ['single','double','queen','king','sofa','bunk'];

const AMENITY_ICONS = {
  wifi:'📶', tv:'📺', minibar:'🍸', jacuzzi:'🛁', balcony:'🌿',
  oceanView:'🌊', aircon:'❄️', safe:'🔒', bathrobe:'🩱', parking:'🚗',
};

const TYPE_LABELS = {
  standard:'Standard', deluxe:'Deluxe', suite:'Suite',
  penthouse:'Penthouse', villa:'Villa', studio:'Studio',
  connecting:'Connecting', accessible:'Accessible',
};

const defaultForm = {
  name:'', roomNumber:'', type:'standard', description:'',
  maxAdults:2, maxChildren:0, sizeM2:'', floor:'',
  basePrice:'', currency:'USD',
  beds:[{ type:'queen', count:1 }],
  amenities:[], view:'none',
  coverImage: null,
  images: [],
};

/* ─── upload helper ─────────────────────────────────────────────── */
const uploadFile = async (file) => {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.post('/media/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};

/* ─── Section wrapper ───────────────────────────────────────────── */
const Section = ({ icon: Icon, title, children, className }) => (
  <div className={cn('space-y-4', className)}>
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-[#fff8ed] border border-[#f0e8d8] flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-[#f6a003]" />
      </div>
      <span className="text-sm font-semibold text-[#1a1410] tracking-wide uppercase" style={{ letterSpacing: '0.06em', fontSize: '11px' }}>
        {title}
      </span>
      <div className="flex-1 h-px bg-[#f0e8d8]" />
    </div>
    {children}
  </div>
);

/* ─── Form field ────────────────────────────────────────────────── */
const Field = ({ label, required, hint, children, className }) => (
  <div className={cn('flex flex-col gap-1.5', className)}>
    <div className="flex items-baseline justify-between">
      <label className="text-[12px] font-semibold text-[#5a4a38] uppercase tracking-wider">
        {label}{required && <span className="text-[#f6a003] ml-0.5">*</span>}
      </label>
      {hint && <span className="text-[10px] text-[#c4a882]">{hint}</span>}
    </div>
    {children}
  </div>
);

/* ─── Input styles ──────────────────────────────────────────────── */
const inputCls = `
  w-full px-3.5 py-2.5 rounded-xl border border-[#f0e8d8] bg-white
  text-[#1a1410] text-sm placeholder-[#c4a882]
  focus:outline-none focus:border-[#f6a003] focus:ring-2 focus:ring-[#f6a003]/15
  transition-all duration-200
`.trim();

/* ─── Thumb ─────────────────────────────────────────────────────── */
const Thumb = ({ fileId, isCover, onSetCover, onRemove, uploading }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    className={cn(
      'relative group rounded-2xl overflow-hidden border-2 transition-all duration-200 aspect-square',
      isCover
        ? 'border-[#f6a003] shadow-[0_0_0_3px_rgba(246,160,3,0.18)]'
        : 'border-[#f0e8d8] hover:border-[#f6a003]/50'
    )}
  >
    {uploading ? (
      <div className="w-full h-full bg-[#fff8ed] flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-[#f6a003] animate-spin" />
      </div>
    ) : (
      <>
        <img
          src={`/api/v1/media/${fileId}`}
          alt="Room"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute inset-0 flex items-end justify-center gap-1.5 pb-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isCover && (
            <button
              type="button"
              onClick={onSetCover}
              title="Set as cover"
              className="p-1.5 rounded-lg bg-[#f6a003] text-white hover:bg-[#e09200] transition-colors shadow-lg"
            >
              <Star className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            onClick={onRemove}
            title="Remove"
            className="p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-400 transition-colors shadow-lg"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
        {isCover && (
          <div className="absolute top-1.5 left-1.5">
            <span className="px-2 py-0.5 rounded-md bg-[#f6a003] text-white text-[9px] font-bold tracking-wider shadow-sm">
              COVER
            </span>
          </div>
        )}
      </>
    )}
  </motion.div>
);

/* ─── Stepper ───────────────────────────────────────────────────── */
const Stepper = ({ value, onChange, min = 0, max = 20 }) => (
  <div className="flex items-center gap-0 rounded-xl border border-[#f0e8d8] overflow-hidden bg-white">
    <button
      type="button"
      onClick={() => onChange(Math.max(min, value - 1))}
      disabled={value <= min}
      className="w-9 h-9 flex items-center justify-center text-[#8a7560] hover:bg-[#fff8ed] hover:text-[#f6a003] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
    >
      <Minus className="w-3.5 h-3.5" />
    </button>
    <span className="flex-1 text-center text-sm font-semibold text-[#1a1410] tabular-nums select-none">
      {value}
    </span>
    <button
      type="button"
      onClick={() => onChange(Math.min(max, value + 1))}
      disabled={value >= max}
      className="w-9 h-9 flex items-center justify-center text-[#8a7560] hover:bg-[#fff8ed] hover:text-[#f6a003] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
    >
      <Plus className="w-3.5 h-3.5" />
    </button>
  </div>
);

/* ─── Main Modal ────────────────────────────────────────────────── */
export const RoomFormModal = ({ open, onClose, onSubmit, initialData, isLoading }) => {
  const [form, setForm]              = useState(defaultForm);
  const [uploadingIds, setUploading] = useState(new Set());
  const fileInputRef                 = useRef(null);

  useEffect(() => {
    if (initialData) setForm({ ...defaultForm, ...initialData });
    else setForm(defaultForm);
    setUploading(new Set());
  }, [initialData, open]);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));
  const handleChange = e => set(e.target.name, e.target.value);
  const toggleAmenity = a => setForm(p => ({
    ...p,
    amenities: p.amenities.includes(a)
      ? p.amenities.filter(x => x !== a)
      : [...p.amenities, a],
  }));

  const handleBedChange = (idx, field, value) =>
    setForm(p => {
      const beds = [...p.beds];
      beds[idx] = { ...beds[idx], [field]: value };
      return { ...p, beds };
    });

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    e.target.value = '';
    for (const file of files) {
      if (!file.type.startsWith('image/')) { toast.error('Only image files allowed'); continue; }
      if (file.size > 15 * 1024 * 1024)   { toast.error('Max file size is 15 MB');    continue; }
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      setUploading(s => new Set([...s, tempId]));
      setForm(p => ({ ...p, images: [...p.images, tempId] }));
      try {
        const result = await uploadFile(file);
        const realId = result.fileId;
        setForm(p => {
          const newImages = p.images.map(id => id === tempId ? realId : id);
          const newCover  = p.coverImage === tempId
            ? realId
            : (p.coverImage || (newImages.length === 1 ? realId : p.coverImage));
          return { ...p, images: newImages, coverImage: newCover };
        });
      } catch {
        toast.error('Upload failed');
        setForm(p => ({ ...p, images: p.images.filter(id => id !== tempId) }));
      } finally {
        setUploading(s => { const n = new Set(s); n.delete(tempId); return n; });
      }
    }
  };

  const removeImage = fileId => setForm(p => {
    const newImages = p.images.filter(id => id !== fileId);
    return { ...p, images: newImages, coverImage: p.coverImage === fileId ? (newImages[0] || null) : p.coverImage };
  });

  const handleSubmit = e => {
    e.preventDefault();
    if (uploadingIds.size > 0) { toast.error('Wait for uploads to finish'); return; }
    onSubmit({
      ...form,
      basePrice:   parseFloat(form.basePrice),
      maxAdults:   parseInt(form.maxAdults, 10),
      maxChildren: parseInt(form.maxChildren, 10),
      sizeM2:      form.sizeM2 ? parseFloat(form.sizeM2)  : null,
      floor:       form.floor  ? parseInt(form.floor, 10) : null,
    });
  };

  const isSubmitting = isLoading || uploadingIds.size > 0;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">

          {/* backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* panel */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1     }}
            exit={{   opacity: 0, y: 40, scale: 0.97   }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className={cn(
              'relative w-full sm:max-w-2xl bg-[#fefcf7] overflow-hidden flex flex-col',
              'rounded-t-3xl sm:rounded-3xl',
              'shadow-[0_-4px_60px_rgba(0,0,0,0.18)] sm:shadow-[0_8px_60px_rgba(0,0,0,0.18)]',
              'max-h-[95vh] sm:max-h-[90vh]',
            )}
          >

            {/* ── top accent bar ── */}
            <div className="h-1 w-full bg-gradient-to-r from-[#f6a003] via-[#ffc843] to-[#f6a003] flex-shrink-0" />

            {/* ── mobile drag indicator ── */}
            <div className="flex justify-center pt-2 pb-0 sm:hidden flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-[#f0e8d8]" />
            </div>

            {/* ── header ── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0e8d8] flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#f6a003] flex items-center justify-center shadow-[0_3px_12px_rgba(246,160,3,0.35)]">
                  <BedDouble className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#1a1410] leading-none">
                    {initialData ? 'Edit Room' : 'New Room'}
                  </h2>
                  <p className="text-[11px] text-[#8a7560] mt-0.5">
                    {initialData ? `Editing: ${initialData.name}` : 'Fill in the room details below'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#8a7560] hover:bg-[#f0e8d8] hover:text-[#1a1410] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── scrollable form body ── */}
            <form
              onSubmit={handleSubmit}
              className="overflow-y-auto flex-1 px-6 py-6 space-y-8"
              style={{ overscrollBehavior: 'contain' }}
            >

              {/* ══ PHOTOS ══════════════════════════════════════════ */}
              <Section icon={ImageIcon} title="Room Photos">
                <div className={cn(
                  'grid gap-2.5',
                  form.images.length === 0
                    ? 'grid-cols-1'
                    : 'grid-cols-3 sm:grid-cols-5'
                )}>
                  <AnimatePresence>
                    {form.images.map(fileId => (
                      <Thumb
                        key={fileId}
                        fileId={fileId}
                        isCover={form.coverImage === fileId}
                        uploading={uploadingIds.has(fileId)}
                        onSetCover={() => set('coverImage', fileId)}
                        onRemove={() => removeImage(fileId)}
                      />
                    ))}
                  </AnimatePresence>

                  {/* upload zone */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'rounded-2xl border-2 border-dashed border-[#f0e8d8]',
                      'flex flex-col items-center justify-center gap-2',
                      'hover:border-[#f6a003] hover:bg-[#fff8ed] transition-all duration-200',
                      'text-[#c4a882] hover:text-[#f6a003] cursor-pointer group',
                      form.images.length === 0 ? 'col-span-1 py-12' : 'aspect-square'
                    )}
                  >
                    <div className={cn(
                      'rounded-xl bg-[#fff8ed] border border-[#f0e8d8] flex items-center justify-center transition-all',
                      'group-hover:bg-[#f6a003] group-hover:border-[#f6a003]',
                      form.images.length === 0 ? 'w-12 h-12' : 'w-8 h-8'
                    )}>
                      <Upload className={cn(
                        'transition-colors group-hover:text-white text-[#f6a003]',
                        form.images.length === 0 ? 'w-5 h-5' : 'w-4 h-4'
                      )} />
                    </div>
                    {form.images.length === 0 ? (
                      <div className="text-center">
                        <p className="text-sm font-semibold">Upload Photos</p>
                        <p className="text-xs text-[#c4a882] mt-0.5">JPEG, PNG, WebP · max 15 MB</p>
                      </div>
                    ) : (
                      <span className="text-[9px] font-semibold uppercase tracking-wider">Add</span>
                    )}
                  </button>
                </div>

                {form.images.length > 0 && (
                  <p className="text-[11px] text-[#8a7560] flex items-center gap-1.5">
                    <Star className="w-3 h-3 text-[#f6a003] fill-[#f6a003]" />
                    Hover a photo and tap the star to set it as the cover image
                  </p>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </Section>

              {/* ══ BASIC INFO ══════════════════════════════════════ */}
              <Section icon={Tag} title="Basic Info">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Room Name" required>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      className={inputCls}
                      placeholder="e.g. Nile View Suite"
                    />
                  </Field>
                  <Field label="Room Number" hint="Optional">
                    <input
                      name="roomNumber"
                      value={form.roomNumber}
                      onChange={handleChange}
                      className={inputCls}
                      placeholder="e.g. 501"
                    />
                  </Field>
                </div>

                {/* room type chips */}
                <Field label="Room Type" required>
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {ROOM_TYPES.map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => set('type', t)}
                        className={cn(
                          'px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all duration-150 border',
                          form.type === t
                            ? 'bg-[#f6a003] text-white border-[#f6a003] shadow-[0_3px_10px_rgba(246,160,3,0.35)]'
                            : 'bg-white text-[#8a7560] border-[#f0e8d8] hover:border-[#f6a003] hover:text-[#f6a003] hover:bg-[#fff8ed]'
                        )}
                      >
                        {TYPE_LABELS[t]}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Description" hint="Recommended">
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    className={cn(inputCls, 'resize-none')}
                    placeholder="Describe what makes this room special…"
                  />
                </Field>
              </Section>

              {/* ══ PRICING ═════════════════════════════════════════ */}
              <Section icon={DollarSign} title="Pricing">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Base Price" required hint="Per night">
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#c4a882] text-sm font-medium">$</span>
                      <input
                        name="basePrice"
                        type="number"
                        min="1"
                        step="0.01"
                        value={form.basePrice}
                        onChange={handleChange}
                        required
                        className={cn(inputCls, 'pl-7')}
                        placeholder="299.00"
                      />
                    </div>
                  </Field>
                  <Field label="Floor" hint="Optional">
                    <input
                      name="floor"
                      type="number"
                      min="0"
                      value={form.floor}
                      onChange={handleChange}
                      className={inputCls}
                      placeholder="e.g. 5"
                    />
                  </Field>
                </div>
              </Section>

              {/* ══ CAPACITY ════════════════════════════════════════ */}
              <Section icon={Users} title="Capacity & Size">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <Field label="Max Adults">
                    <Stepper
                      value={Number(form.maxAdults)}
                      onChange={v => set('maxAdults', v)}
                      min={1}
                      max={20}
                    />
                  </Field>
                  <Field label="Max Children">
                    <Stepper
                      value={Number(form.maxChildren)}
                      onChange={v => set('maxChildren', v)}
                      min={0}
                      max={10}
                    />
                  </Field>
                  <Field label="Size (m²)" hint="Optional" className="col-span-2 sm:col-span-1">
                    <div className="relative">
                      <input
                        name="sizeM2"
                        type="number"
                        min="1"
                        value={form.sizeM2}
                        onChange={handleChange}
                        className={cn(inputCls, 'pr-10')}
                        placeholder="45"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#c4a882] text-xs">m²</span>
                    </div>
                  </Field>
                </div>
              </Section>

              {/* ══ BEDS ════════════════════════════════════════════ */}
              <Section icon={BedDouble} title="Bed Configuration">
                <div className="space-y-2.5">
                  <AnimatePresence>
                    {form.beds.map((bed, idx) => (
                      <motion.div
                        key={idx}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex gap-2.5 items-center bg-white border border-[#f0e8d8] rounded-xl px-3 py-2"
                      >
                        <span className="text-[#c4a882] text-xs font-bold w-4 text-center shrink-0">
                          {idx + 1}
                        </span>
                        <select
                          value={bed.type}
                          onChange={e => handleBedChange(idx, 'type', e.target.value)}
                          className="flex-1 bg-transparent border-0 text-[#1a1410] text-sm font-medium focus:outline-none capitalize cursor-pointer"
                        >
                          {BED_TYPES.map(t => (
                            <option key={t} value={t} className="capitalize">{t} bed</option>
                          ))}
                        </select>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleBedChange(idx, 'count', Math.max(1, bed.count - 1))}
                            className="w-6 h-6 rounded-lg bg-[#f0e8d8] text-[#8a7560] hover:bg-[#f6a003] hover:text-white transition-all flex items-center justify-center"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-sm font-bold text-[#1a1410] tabular-nums">
                            {bed.count}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleBedChange(idx, 'count', Math.min(5, bed.count + 1))}
                            className="w-6 h-6 rounded-lg bg-[#f0e8d8] text-[#8a7560] hover:bg-[#f6a003] hover:text-white transition-all flex items-center justify-center"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        {form.beds.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setForm(p => ({ ...p, beds: p.beds.filter((_, i) => i !== idx) }))}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#c4a882] hover:bg-red-50 hover:text-red-400 transition-all shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  <button
                    type="button"
                    onClick={() => setForm(p => ({ ...p, beds: [...p.beds, { type: 'double', count: 1 }] }))}
                    className="w-full py-2 rounded-xl border border-dashed border-[#f0e8d8] text-xs font-semibold text-[#8a7560] hover:border-[#f6a003] hover:text-[#f6a003] hover:bg-[#fff8ed] transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Another Bed Type
                  </button>
                </div>
              </Section>

              {/* ══ AMENITIES ═══════════════════════════════════════ */}
              <Section icon={CheckCircle2} title="Amenities">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AMENITIES.map(a => {
                    const active = form.amenities.includes(a);
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => toggleAmenity(a)}
                        className={cn(
                          'flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all duration-150',
                          active
                            ? 'bg-[#fff8ed] border-[#f6a003] text-[#1a1410]'
                            : 'bg-white border-[#f0e8d8] text-[#8a7560] hover:border-[#f6a003]/50 hover:bg-[#fff8ed]/50'
                        )}
                      >
                        <span className="text-base leading-none">{AMENITY_ICONS[a]}</span>
                        <span className="text-xs font-semibold capitalize flex-1">{a === 'aircon' ? 'Air Con' : a === 'oceanView' ? 'Ocean View' : a}</span>
                        {active && (
                          <div className="w-4 h-4 rounded-full bg-[#f6a003] flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                {form.amenities.length > 0 && (
                  <p className="text-[11px] text-[#8a7560]">
                    {form.amenities.length} amenit{form.amenities.length === 1 ? 'y' : 'ies'} selected
                  </p>
                )}
              </Section>

            </form>

            {/* ── footer actions ── */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-[#f0e8d8] bg-[#fefcf7] flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-[#f0e8d8] text-sm font-semibold text-[#8a7560] hover:bg-[#f0e8d8] hover:text-[#1a1410] transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="room-form"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className={cn(
                  'flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all',
                  isSubmitting
                    ? 'bg-[#f6a003]/60 cursor-not-allowed'
                    : 'bg-[#f6a003] hover:bg-[#e09200] shadow-[0_4px_18px_rgba(246,160,3,0.4)] hover:shadow-[0_6px_22px_rgba(246,160,3,0.5)] active:scale-[0.98]'
                )}
              >
                {uploadingIds.size > 0 ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                ) : isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {initialData ? 'Save Changes' : 'Create Room'}
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};