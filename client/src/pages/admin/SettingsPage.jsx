import { useTranslation } from 'react-i18next';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  Settings, Save, Upload, Trash2, Star, Image as ImageIcon, Check,
  Globe, Phone, Loader2, Building2, Shield, Wifi, X, ZoomIn,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { selectUserHotelId } from '@/features/auth/authSlice';
import api from '@/services/api';
import { cn } from '@/utils/cn';

/* ── Brand ── */
const GOLD       = '#f6a003';
const GOLD_DARK  = '#d98902';
const GOLD_BG    = '#fff8ed';
const GOLD_RING  = '#fde68a';
const SURFACE    = '#fefcf7';
const BORDER     = '#f0e8d8';
const INK        = '#1a1410';
const INK2       = '#8a7560';
const INK3       = '#c4a882';

const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-[#f0e8d8] bg-white text-[#1a1410] text-sm placeholder-[#c4a882] focus:outline-none focus:border-[#f6a003] focus:ring-2 focus:ring-[#f6a003]/15 transition-all duration-200';

const AMENITIES = [
  'wifi','pool','spa','gym','restaurant','bar','parking',
  'airport shuttle','laundry','concierge','business center',
  'meeting rooms','children play area','beach access',
];
const AMENITY_ICONS = {
  wifi:'📶', pool:'🏊', spa:'💆', gym:'🏋️', restaurant:'🍽️', bar:'🍸',
  parking:'🚗', 'airport shuttle':'✈️', laundry:'👕', concierge:'🛎️',
  'business center':'💼', 'meeting rooms':'📋', 'children play area':'🎠',
  'beach access':'🏖️',
};

/* ── Upload helper ── */
const uploadFile = async (file) => {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.post('/media/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};

/* ── Sub-components ── */
const Section = ({ icon: Icon, title, description, children }) => (
  <div className="bg-white rounded-3xl border border-[#f0e8d8] overflow-hidden shadow-sm">
    <div className="flex items-center gap-3 px-6 py-4 border-b border-[#f0e8d8]"
         style={{ background: 'rgba(246,160,3,0.05)' }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-[0_2px_8px_rgba(246,160,3,0.3)]"
           style={{ background: GOLD }}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-[#1a1410]">{title}</h3>
        {description && <p className="text-[11px] text-[#8a7560]">{description}</p>}
      </div>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const Field = ({ label, hint, required, children, className }) => (
  <div className={cn('flex flex-col gap-1.5', className)}>
    <div className="flex items-baseline justify-between">
      <label className="text-[11px] font-bold text-[#5a4a38] uppercase tracking-wider">
        {label}{required && <span className="ml-0.5" style={{ color: GOLD }}>*</span>}
      </label>
      {hint && <span className="text-[10px] text-[#c4a882]">{hint}</span>}
    </div>
    {children}
  </div>
);

const SaveBtn = ({ saving, label }) => (
  <button type="submit" disabled={saving}
    className={cn('flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all',
      saving
        ? 'bg-[#f6a003]/60 cursor-not-allowed'
        : 'bg-[#f6a003] hover:bg-[#e09200] shadow-[0_4px_18px_rgba(246,160,3,0.4)] hover:shadow-[0_6px_22px_rgba(246,160,3,0.5)] active:scale-[0.98]')}>
    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
    {saving ? '…' : label}
  </button>
);

const Toggle = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-3 cursor-pointer group">
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={cn('relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0',
        checked ? 'bg-[#f6a003]' : 'bg-[#f0e8d8]')}>
      <span className={cn('absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200',
        checked ? 'left-6' : 'left-1')} />
    </button>
    <span className={cn('text-sm font-medium transition-colors', checked ? 'text-[#1a1410]' : 'text-[#8a7560]')}>
      {label}
    </span>
  </label>
);

/* ══════════════════════════════════════════════════════════════
   PHOTOS SECTION — Full-featured image manager
══════════════════════════════════════════════════════════════ */
const PhotosSection = ({ hotel, onUpdate }) => {
  const { t } = useTranslation();
  const fileRef     = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);    // upload progress 0-100
  const [preview,   setPreview]   = useState(null);  // lightbox preview fileId
  const [deleting,  setDeleting]  = useState(null);  // fileId being deleted

  const images   = hotel.images     || [];
  const coverImg = hotel.coverImage || null;

  /* ── Upload files ── */
  const handleFiles = async (files) => {
    const valid = files.filter(f => {
      if (!f.type.startsWith('image/')) { toast.error(t('settings.imageOnly')); return false; }
      if (f.size > 15 * 1024 * 1024)   { toast.error(t('settings.imageTooLarge')); return false; }
      return true;
    });
    if (!valid.length) return;

    setUploading(true);
    setProgress(0);
    const newIds = [];
    for (let i = 0; i < valid.length; i++) {
      try {
        const result = await uploadFile(valid[i]);
        newIds.push(result.fileId);
        setProgress(Math.round(((i + 1) / valid.length) * 100));
      } catch { toast.error(t('settings.uploadFailed')); }
    }
    if (newIds.length) {
      const updated = {
        images:     [...images, ...newIds],
        coverImage: coverImg || newIds[0],
      };
      await api.patch('/hotels/' + hotel._id, updated);
      onUpdate(updated);
      toast.success(t('settings.photosUploaded', { count: newIds.length }));
    }
    setUploading(false);
    setProgress(0);
    if (fileRef.current) fileRef.current.value = '';
  };

  /* ── Drag-and-drop ── */
  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  /* ── Set cover ── */
  const setCover = async (fileId) => {
    if (fileId === coverImg) return;
    try {
      await api.patch('/hotels/' + hotel._id, { coverImage: fileId });
      onUpdate({ coverImage: fileId });
      toast.success(t('settings.coverUpdated'));
    } catch { toast.error(t('errors.general')); }
  };

  /* ── Remove image ── */
  const removeImage = async (fileId) => {
    if (!window.confirm(t('settings.confirmDeletePhoto'))) return;
    setDeleting(fileId);
    try {
      const newImages = images.filter(id => id !== fileId);
      const newCover  = coverImg === fileId ? (newImages[0] || null) : coverImg;
      await api.patch('/hotels/' + hotel._id, { images: newImages, coverImage: newCover });
      onUpdate({ images: newImages, coverImage: newCover });
      toast.success(t('settings.photoRemoved'));
    } catch { toast.error(t('errors.general')); }
    finally { setDeleting(null); }
  };

  return (
    <Section
      icon={ImageIcon}
      title={t('settings.photos')}
      description={t('settings.photosDesc')}>

      {/* Upload zone — drag & drop */}
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => !uploading && fileRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-8 mb-5 text-center cursor-pointer transition-all duration-200',
          'hover:border-[#f6a003] hover:bg-[#fff8ed]/70',
          uploading ? 'border-[#f6a003] bg-[#fff8ed] cursor-default' : 'border-[#f0e8d8]',
        )}>
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-[#f6a003] animate-spin" />
            <p className="text-sm font-semibold text-[#8a7560]">{t('settings.uploading')} {progress}%</p>
            <div className="w-48 h-1.5 bg-[#f0e8d8] rounded-full overflow-hidden">
              <div className="h-full bg-[#f6a003] rounded-full transition-all duration-300"
                   style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 pointer-events-none">
            <div className="w-14 h-14 rounded-2xl bg-[#fff8ed] border border-[#f0e8d8] flex items-center justify-center">
              <Upload className="w-6 h-6 text-[#f6a003]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1a1410]">{t('settings.uploadPhotos')}</p>
              <p className="text-xs text-[#c4a882] mt-1">{t('settings.uploadHint')}</p>
            </div>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => handleFiles(Array.from(e.target.files || []))}
        />
      </div>

      {/* Empty state */}
      {images.length === 0 && !uploading && (
        <div className="text-center py-6">
          <ImageIcon className="w-12 h-12 text-[#e0d6c8] mx-auto mb-3" />
          <p className="text-sm text-[#8a7560]">{t('settings.noPhotos')}</p>
          <p className="text-xs text-[#c4a882] mt-1">{t('settings.noPhotosHint')}</p>
        </div>
      )}

      {/* Photos grid */}
      {images.length > 0 && (
        <>
          {/* Cover highlight */}
          {coverImg && (
            <div className="mb-4">
              <p className="text-[11px] font-bold text-[#5a4a38] uppercase tracking-wider mb-2.5">
                {t('settings.coverPhoto')}
              </p>
              <div className="relative rounded-2xl overflow-hidden border-2 border-[#f6a003] shadow-[0_0_0_4px_rgba(246,160,3,0.15)]"
                   style={{ height: 200 }}>
                <img
                  src={`/api/v1/media/${coverImg}`}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-lg bg-[#f6a003] text-white text-[10px] font-black tracking-wider shadow-md">
                    ★ {t('settings.cover')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreview(coverImg)}
                  className="absolute top-3 right-3 p-1.5 rounded-xl bg-white/90 hover:bg-white text-[#3a3020] shadow-md transition-colors">
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* All photos grid */}
          <div>
            <p className="text-[11px] font-bold text-[#5a4a38] uppercase tracking-wider mb-2.5">
              {t('settings.allPhotos')} ({images.length})
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
              <AnimatePresence>
                {images.map(fileId => (
                  <motion.div
                    key={fileId}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      'relative group aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200',
                      coverImg === fileId
                        ? 'border-[#f6a003] shadow-[0_0_0_3px_rgba(246,160,3,0.2)]'
                        : 'border-[#f0e8d8] hover:border-[#f6a003]/50',
                    )}>
                    {/* Image */}
                    <img
                      src={`/api/v1/media/${fileId}`}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200" />

                    {/* Action buttons — appear on hover */}
                    <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {/* Preview */}
                      <button
                        type="button"
                        onClick={() => setPreview(fileId)}
                        className="p-2 rounded-xl bg-white/90 hover:bg-white text-[#3a3020] shadow-lg transition-all hover:scale-110"
                        title={t('settings.preview')}>
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>

                      {/* Set as cover */}
                      {coverImg !== fileId && (
                        <button
                          type="button"
                          onClick={() => setCover(fileId)}
                          className="p-2 rounded-xl bg-[#f6a003] hover:bg-[#e09200] text-white shadow-lg transition-all hover:scale-110"
                          title={t('settings.setAsCover')}>
                          <Star className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => removeImage(fileId)}
                        disabled={deleting === fileId}
                        className="p-2 rounded-xl bg-red-500 hover:bg-red-400 text-white shadow-lg transition-all hover:scale-110 disabled:opacity-60"
                        title={t('common.delete')}>
                        {deleting === fileId
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Cover badge */}
                    {coverImg === fileId && (
                      <div className="absolute top-1.5 left-1.5 pointer-events-none">
                        <span className="px-1.5 py-0.5 rounded bg-[#f6a003] text-white text-[8px] font-black tracking-wider shadow">
                          ★ {t('settings.cover').toUpperCase()}
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Add more button */}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className={cn(
                  'aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5',
                  'border-[#f0e8d8] hover:border-[#f6a003] hover:bg-[#fff8ed]',
                  'text-[#c4a882] hover:text-[#f6a003] transition-all duration-200 group',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                )}>
                <Upload className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-bold uppercase tracking-wider">
                  {t('settings.addMore')}
                </span>
              </button>
            </div>
          </div>

          {/* Hint */}
          <p className="text-[11px] text-[#8a7560] mt-3 flex items-center gap-1.5">
            <Star className="w-3 h-3 text-[#f6a003] fill-[#f6a003]" />
            {t('settings.coverHint')}
          </p>
        </>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={() => setPreview(null)}>
            <button
              onClick={() => setPreview(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <motion.img
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              src={`/api/v1/media/${preview}`}
              alt="Preview"
              onClick={e => e.stopPropagation()}
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Section>
  );
};

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function SettingsPage() {
  const { t } = useTranslation();
  const hotelId = useSelector(selectUserHotelId);
  const [hotel,   setHotel]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [tab,     setTab]     = useState('general');
  const [form,    setForm]    = useState({
    name: '', description: '', starRating: 4, amenities: [],
    contact:  { phone: '', email: '', website: '' },
    policies: { checkInTime: '14:00', checkOutTime: '12:00', cancellationHours: 24, petsAllowed: false, smokingAllowed: false },
  });

  useEffect(() => {
    if (!hotelId) return;
    api.get('/hotels/' + hotelId)
      .then(({ data }) => {
        const h = data.data.hotel;
        setHotel(h);
        setForm({
          name:        h.name        || '',
          description: h.description || '',
          starRating:  h.starRating  || 4,
          amenities:   h.amenities   || [],
          contact:  h.contact  || { phone: '', email: '', website: '' },
          policies: h.policies || { checkInTime: '14:00', checkOutTime: '12:00', cancellationHours: 24, petsAllowed: false, smokingAllowed: false },
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [hotelId]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/hotels/' + hotelId, form);
      toast.success(t('settings.saved'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('errors.saveFailed'));
    } finally { setSaving(false); }
  };

  const updateHotelLocal = useCallback((updates) => setHotel(h => ({ ...h, ...updates })), []);

  const setField = (path, val) => {
    const parts = path.split('.');
    if (parts.length === 1) setForm(p => ({ ...p, [path]: val }));
    else setForm(p => ({ ...p, [parts[0]]: { ...p[parts[0]], [parts[1]]: val } }));
  };

  const toggleAmenity = (a) => setForm(p => ({
    ...p,
    amenities: p.amenities.includes(a) ? p.amenities.filter(x => x !== a) : [...p.amenities, a],
  }));

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ background: SURFACE }}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: GOLD_BG, border: `1px solid ${BORDER}` }}>
        <Settings className="w-6 h-6 animate-pulse" style={{ color: GOLD }} />
      </div>
      <p className="text-sm animate-pulse" style={{ color: INK2 }}>{t('common.loading')}</p>
    </div>
  );

  if (!hotel) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: SURFACE }}>
      <p style={{ color: INK2 }}>{t('errors.notFound')}</p>
    </div>
  );

  const TABS = [
    { id: 'general',   label: t('settings.general'),        icon: Building2   },
    { id: 'photos',    label: t('settings.photos'),         icon: ImageIcon   },
    { id: 'amenities', label: t('settings.amenities'),      icon: Wifi        },
    { id: 'contact',   label: t('settings.contactPolicies'),icon: Phone       },
  ];

  return (
    <div className="min-h-screen" style={{ background: SURFACE }}>
      <div className="h-1 w-full bg-gradient-to-r from-[#f6a003] via-[#ffc843] to-[#f6a003]" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">

        {/* Header */}
        <motion.div initial={{ opacity:0, y:-14 }} animate={{ opacity:1, y:0 }}
          className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-[0_4px_14px_rgba(246,160,3,0.35)]"
               style={{ background: GOLD }}>
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-none" style={{ color: INK }}>
              {t('settings.title')}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: INK2 }}>{t('settings.subtitle')}</p>
          </div>
        </motion.div>

        <div className="h-px bg-gradient-to-r from-transparent via-[#f0e8d8] to-transparent" />

        {/* Tabs */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn(
                'flex items-center justify-center sm:justify-start gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all border',
                tab === id
                  ? 'bg-[#f6a003] text-white border-[#f6a003] shadow-[0_3px_12px_rgba(246,160,3,0.35)]'
                  : 'bg-white text-[#8a7560] border-[#f0e8d8] hover:border-[#f6a003]/50 hover:text-[#f6a003] hover:bg-[#fff8ed]',
              )}>
              <Icon className="w-3.5 h-3.5 flex-shrink-0" /> {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div key={tab}
            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:-6 }} transition={{ duration:0.18 }}
            className="space-y-5">

            {/* ── GENERAL ── */}
            {tab === 'general' && (
              <form onSubmit={handleSave}>
                <Section icon={Building2} title={t('settings.generalInfo')} description={t('settings.generalDesc')}>
                  <div className="space-y-5">
                    <Field label={t('settings.hotelName')} required>
                      <input value={form.name} onChange={e => setField('name', e.target.value)}
                        required className={cn(inputCls, 'text-base font-semibold')} placeholder="Grand Nile Hotel" />
                    </Field>
                    <Field label={t('settings.description')} hint={`${form.description.length} / 2000`}>
                      <textarea value={form.description} onChange={e => setField('description', e.target.value)}
                        rows={4} maxLength={2000} className={cn(inputCls, 'resize-none')}
                        placeholder={t('settings.descriptionPlaceholder')} />
                    </Field>
                    <Field label={t('settings.starRating')}>
                      <div className="flex gap-2">
                        {[1,2,3,4,5].map(n => (
                          <button key={n} type="button" onClick={() => setField('starRating', n)}
                            className={cn('w-10 h-10 rounded-xl border-2 text-xl transition-all',
                              n <= form.starRating
                                ? 'bg-[#fff8ed] border-[#f6a003] text-[#f6a003] shadow-[0_2px_8px_rgba(246,160,3,0.25)]'
                                : 'border-[#f0e8d8] text-[#c4a882] hover:border-[#f6a003]/40 bg-white')}>★</button>
                        ))}
                      </div>
                    </Field>
                    <div className="pt-1"><SaveBtn saving={saving} label={t('settings.saveChanges')} /></div>
                  </div>
                </Section>
              </form>
            )}

            {/* ── PHOTOS ── */}
            {tab === 'photos' && hotel && (
              <PhotosSection hotel={hotel} onUpdate={updateHotelLocal} />
            )}

            {/* ── AMENITIES ── */}
            {tab === 'amenities' && (
              <form onSubmit={handleSave}>
                <Section icon={Wifi} title={t('settings.amenities')} description={t('settings.amenitiesDesc')}>
                  <div className="space-y-5">
                    {form.amenities.length > 0 && (
                      <p className="text-[11px] font-semibold" style={{ color: GOLD }}>
                        {form.amenities.length} {t('settings.amenitiesSelected')}
                      </p>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {AMENITIES.map(a => {
                        const active = form.amenities.includes(a);
                        return (
                          <button key={a} type="button" onClick={() => toggleAmenity(a)}
                            className={cn(
                              'flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all duration-150',
                              active
                                ? 'bg-[#fff8ed] border-[#f6a003] text-[#1a1410]'
                                : 'bg-white border-[#f0e8d8] text-[#8a7560] hover:border-[#f6a003]/50 hover:bg-[#fff8ed]/50',
                            )}>
                            <span className="text-base leading-none">{AMENITY_ICONS[a] ?? '✦'}</span>
                            <span className="text-xs font-semibold capitalize flex-1 leading-tight">{a}</span>
                            {active && (
                              <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                                   style={{ background: GOLD }}>
                                <Check className="w-2.5 h-2.5 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <div className="pt-1"><SaveBtn saving={saving} label={t('settings.saveAmenities')} /></div>
                  </div>
                </Section>
              </form>
            )}

            {/* ── CONTACT & POLICIES ── */}
            {tab === 'contact' && (
              <form onSubmit={handleSave} className="space-y-5">
                <Section icon={Phone} title={t('settings.contactInfo')} description={t('settings.contactDesc')}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label={t('common.phone')}>
                      <input value={form.contact.phone} onChange={e => setField('contact.phone', e.target.value)}
                        className={inputCls} placeholder="+20 2 1234 5678" />
                    </Field>
                    <Field label={t('common.email')}>
                      <input type="email" value={form.contact.email} onChange={e => setField('contact.email', e.target.value)}
                        className={inputCls} placeholder="info@hotel.com" />
                    </Field>
                    <Field label={t('settings.website')} className="sm:col-span-2">
                      <input value={form.contact.website} onChange={e => setField('contact.website', e.target.value)}
                        className={inputCls} placeholder="https://yourhotel.com" />
                    </Field>
                  </div>
                </Section>

                <Section icon={Shield} title={t('settings.policies')} description={t('settings.policiesDesc')}>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <Field label={t('settings.checkInTime')}>
                        <input type="time" value={form.policies.checkInTime}
                          onChange={e => setField('policies.checkInTime', e.target.value)} className={inputCls} />
                      </Field>
                      <Field label={t('settings.checkOutTime')}>
                        <input type="time" value={form.policies.checkOutTime}
                          onChange={e => setField('policies.checkOutTime', e.target.value)} className={inputCls} />
                      </Field>
                    </div>
                    <Field label={t('settings.cancellation')} hint={t('settings.hoursBeforeCheckin')}>
                      <div className="flex items-center gap-3">
                        <input type="number" min="0" max="168" value={form.policies.cancellationHours}
                          onChange={e => setField('policies.cancellationHours', parseInt(e.target.value))}
                          className={cn(inputCls, 'w-28')} />
                        <span className="text-sm" style={{ color: INK2 }}>{t('settings.hours')}</span>
                      </div>
                    </Field>
                    <div className="flex flex-col gap-4 pt-1">
                      <Toggle checked={form.policies.petsAllowed}
                        onChange={v => setField('policies.petsAllowed', v)} label={t('settings.petsAllowed')} />
                      <Toggle checked={form.policies.smokingAllowed}
                        onChange={v => setField('policies.smokingAllowed', v)} label={t('settings.smokingAllowed')} />
                    </div>
                  </div>
                </Section>

                <div><SaveBtn saving={saving} label={t('settings.saveSettings')} /></div>
              </form>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
