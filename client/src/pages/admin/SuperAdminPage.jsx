import { useTranslation } from 'react-i18next';
import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hotel, Users, Globe, Star, Search, Eye, Plus, X,
  ToggleLeft, ToggleRight, Upload, Trash2, Loader2,
  MapPin, Phone, Mail, BedDouble, CalendarCheck,
  ChevronRight, ChevronLeft, Check, Building2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { hotelApi } from '@/services/hotelApi';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatRating } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import api from '@/services/api';

/* ─── constants ─────────────────────────────────────────── */
const COUNTRIES = [
  'Egypt','Saudi Arabia','UAE','Jordan','Morocco',
  'Tunisia','Kuwait','Qatar','Oman','Lebanon','Iraq',
];

/* ─── upload helper ─────────────────────────────────────── */
const uploadFile = async (file) => {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.post('/media/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};

/* ─── shared input class ────────────────────────────────── */
const inp =
  'w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 ' +
  'text-neutral-800 text-sm outline-none focus:border-[#f6a003] ' +
  'focus:ring-2 focus:ring-[#f6a003]/15 transition-all';

/* ─── StatCard ──────────────────────────────────────────── */
const StatCard = ({ label, value, icon: Icon, colorCls }) => (
  <div className="bg-white rounded-2xl border border-neutral-100 p-5 shadow-sm">
    <div className={cn('w-10 h-10 rounded-xl border flex items-center justify-center mb-3', colorCls)}>
      <Icon className="w-5 h-5" />
    </div>
    <p className="text-2xl font-bold text-neutral-900">{value}</p>
    <p className="text-sm text-neutral-400 mt-0.5">{label}</p>
  </div>
);

/* ══════════════════════════════════════════════════════════
   CREATE HOTEL MODAL
══════════════════════════════════════════════════════════ */
const CreateModal = ({ onClose, onCreated }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: '', starRating: 4,
    address: { city: '', country: 'Egypt' },
    contact: { phone: '', email: '' },
  });
  const [saving, setSaving] = useState(false);

  const set     = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setAddr = (k, v) => setForm(p => ({ ...p, address: { ...p.address, [k]: v } }));
  const setCont = (k, v) => setForm(p => ({ ...p, contact: { ...p.contact, [k]: v } }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.address.city.trim()) {
      toast.error(t('validation.required')); return;
    }
    setSaving(true);
    try {
      const { data } = await hotelApi.create(form);
      toast.success(t('superadmin.hotelCreated'));
      onCreated(data.data.hotel);
      onClose();
    } catch (err) { toast.error(err.response?.data?.message || t('errors.general')); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">

        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 bg-[#fff8ed]/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#f6a003] flex items-center justify-center shadow-sm">
              <Plus className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-bold text-neutral-900">{t('superadmin.addNewHotel')}</h2>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {/* name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              {t('settings.hotelName')} *
            </label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              required placeholder="Grand Nile Hotel" className={inp} autoFocus />
          </div>

          {/* city + country */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                {t('superadmin.city')} *
              </label>
              <input value={form.address.city} onChange={e => setAddr('city', e.target.value)}
                required placeholder="Cairo" className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                {t('superadmin.country')}
              </label>
              <select value={form.address.country} onChange={e => setAddr('country', e.target.value)}
                className={inp}>
                {COUNTRIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* contact */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                {t('common.phone')}
              </label>
              <input value={form.contact.phone} onChange={e => setCont('phone', e.target.value)}
                placeholder="+20 2 …" className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                {t('common.email')}
              </label>
              <input type="email" value={form.contact.email} onChange={e => setCont('email', e.target.value)}
                placeholder="hotel@…" className={inp} />
            </div>
          </div>

          {/* star rating */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              {t('settings.starRating')}
            </label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button" onClick={() => set('starRating', n)}
                  className={cn('w-9 h-9 rounded-lg border text-sm font-bold transition-all',
                    n <= form.starRating
                      ? 'bg-[#fff8ed] border-[#f6a003] text-[#f6a003]'
                      : 'border-neutral-200 text-neutral-300 hover:border-[#fde68a]')}>★</button>
              ))}
            </div>
          </div>

          {/* actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-all">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#f6a003] hover:bg-[#e09200] text-white text-sm font-bold disabled:opacity-60 transition-all shadow-sm">
              {saving
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><Plus className="w-4 h-4" /> {t('superadmin.createHotel')}</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   HOTEL DETAIL DRAWER
══════════════════════════════════════════════════════════ */
const HotelDrawer = ({ hotel, onClose, onUpdated }) => {
  const { t } = useTranslation();
  const fileRef = useRef(null);

  const [tab,       setTab]       = useState('info');   // 'info' | 'photos' | 'edit'
  const [data,      setData]      = useState(hotel);
  const [uploading, setUploading] = useState(false);
  const [deleting,  setDeleting]  = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [form,      setForm]      = useState({
    name:        hotel.name        || '',
    description: hotel.description || '',
    starRating:  hotel.starRating  || 3,
    address: {
      city:    hotel.address?.city    || '',
      country: hotel.address?.country || '',
    },
    contact: {
      phone:   hotel.contact?.phone   || '',
      email:   hotel.contact?.email   || '',
      website: hotel.contact?.website || '',
    },
  });

  /* Refresh hotel data */
  const refresh = useCallback(async () => {
    try {
      const { data: res } = await api.get(`/hotels/${hotel._id}`);
      setData(res.data.hotel);
    } catch {}
  }, [hotel._id]);

  /* ── upload cover/gallery ── */
  const handleFiles = async (files) => {
    const valid = files.filter(f => f.type.startsWith('image/') && f.size <= 15 * 1024 * 1024);
    if (!valid.length) return;
    setUploading(true);
    const newIds = [];
    for (const file of valid) {
      try {
        const res = await uploadFile(file);
        newIds.push(res.fileId);
      } catch { toast.error(t('settings.uploadFailed')); }
    }
    if (newIds.length) {
      const updated = {
        images:     [...(data.images || []), ...newIds],
        coverImage: data.coverImage || newIds[0],
      };
      await api.patch(`/hotels/${hotel._id}`, updated);
      setData(p => ({ ...p, ...updated }));
      onUpdated({ ...data, ...updated });
      toast.success(t('settings.photosUploaded', { count: newIds.length }));
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const setCover = async (fileId) => {
    await api.patch(`/hotels/${hotel._id}`, { coverImage: fileId });
    setData(p => ({ ...p, coverImage: fileId }));
    onUpdated({ ...data, coverImage: fileId });
    toast.success(t('settings.coverUpdated'));
  };

  const removePhoto = async (fileId) => {
    setDeleting(fileId);
    const newImages = (data.images || []).filter(id => id !== fileId);
    const newCover  = data.coverImage === fileId ? (newImages[0] || null) : data.coverImage;
    await api.patch(`/hotels/${hotel._id}`, { images: newImages, coverImage: newCover });
    setData(p => ({ ...p, images: newImages, coverImage: newCover }));
    onUpdated({ ...data, images: newImages, coverImage: newCover });
    toast.success(t('settings.photoRemoved'));
    setDeleting(null);
  };

  /* ── edit save ── */
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/hotels/${hotel._id}`, form);
      setData(p => ({ ...p, ...form }));
      onUpdated({ ...data, ...form });
      toast.success(t('settings.saved'));
      setTab('info');
    } catch (err) { toast.error(err.response?.data?.message || t('errors.general')); }
    finally { setSaving(false); }
  };

  /* ── toggle active ── */
  const handleToggle = async () => {
    try {
      await hotelApi.toggleStatus(hotel._id);
      const next = { ...data, isActive: !data.isActive };
      setData(next);
      onUpdated(next);
      toast.success(data.isActive ? t('superadmin.deactivated') : t('superadmin.activated'));
    } catch { toast.error(t('errors.general')); }
  };

  const images   = data.images    || [];
  const coverImg = data.coverImage || null;

  const TABS = [
    { id: 'info',   label: t('superadmin.drawerInfo') },
    { id: 'photos', label: t('superadmin.drawerPhotos') },
    { id: 'edit',   label: t('superadmin.drawerEdit') },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden">

        {/* ── Drawer header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 bg-[#fff8ed]/40 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {coverImg
              ? <img src={`/api/v1/media/${coverImg}`} alt=""
                  className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-neutral-200" />
              : <div className="w-10 h-10 rounded-xl bg-[#fff8ed] flex items-center justify-center flex-shrink-0">
                  <span className="font-serif font-bold text-[#f6a003] text-sm">{data.name?.[0]}</span>
                </div>}
            <div className="min-w-0">
              <p className="font-bold text-neutral-900 truncate">{data.name}</p>
              <p className="text-xs text-neutral-400 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {[data.address?.city, data.address?.country].filter(Boolean).join(', ')}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-400 flex-shrink-0 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-neutral-100 flex-shrink-0">
          {TABS.map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn(
                'flex-1 py-2.5 text-xs font-bold transition-colors',
                tab === id
                  ? 'text-[#f6a003] border-b-2 border-[#f6a003] bg-[#fff8ed]/40'
                  : 'text-neutral-400 hover:text-neutral-600',
              )}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab body ── */}
        <div className="flex-1 overflow-y-auto">

          {/* INFO tab */}
          {tab === 'info' && (
            <div className="p-5 space-y-5">
              {/* status + toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-neutral-100 bg-neutral-50">
                <div>
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">
                    {t('staff.status')}
                  </p>
                  <span className={cn('inline-flex items-center gap-1.5 text-sm font-bold',
                    data.isActive ? 'text-emerald-600' : 'text-neutral-400')}>
                    <span className={cn('w-2 h-2 rounded-full',
                      data.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-300')} />
                    {data.isActive ? t('staff.active') : t('staff.inactive')}
                  </span>
                </div>
                <button onClick={handleToggle}
                  className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border',
                    data.isActive
                      ? 'border-red-200 text-red-500 hover:bg-red-50'
                      : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50')}>
                  {data.isActive
                    ? <><ToggleRight className="w-3.5 h-3.5" /> {t('superadmin.deactivate')}</>
                    : <><ToggleLeft  className="w-3.5 h-3.5" /> {t('superadmin.activate')}</>}
                </button>
              </div>

              {/* key info grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: t('settings.starRating'), value: '★'.repeat(data.starRating || 3), gold: true },
                  { label: t('superadmin.rating'),   value: data.avgRating > 0 ? `${formatRating(data.avgRating)} ★ (${data.totalReviews})` : '—' },
                  { label: t('common.phone'),         value: data.contact?.phone   || '—', icon: Phone },
                  { label: t('common.email'),         value: data.contact?.email   || '—', icon: Mail  },
                  { label: t('superadmin.owner'),     value: data.ownerId?.name    || '—', icon: Users },
                  { label: t('superadmin.ownerEmail'),value: data.ownerId?.email   || '—' },
                ].map(({ label, value, gold, icon: Icon }) => (
                  <div key={label} className="bg-neutral-50 rounded-xl p-3 border border-neutral-100">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      {Icon && <Icon className="w-3 h-3" />} {label}
                    </p>
                    <p className={cn('text-sm font-semibold truncate', gold ? 'text-[#f6a003]' : 'text-neutral-800')}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {data.description && (
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                    {t('settings.description')}
                  </p>
                  <p className="text-sm text-neutral-600 leading-relaxed">{data.description}</p>
                </div>
              )}

              {/* quick links */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  {t('superadmin.quickLinks')}
                </p>
                <Link to={`/hotels/${hotel._id}`} target="_blank"
                  className="flex items-center justify-between px-4 py-3 rounded-xl border border-neutral-200 hover:border-[#fde68a] hover:bg-[#fff8ed]/30 transition-all group">
                  <span className="text-sm font-semibold text-neutral-700">{t('superadmin.viewPublicPage')}</span>
                  <Eye className="w-4 h-4 text-neutral-400 group-hover:text-[#f6a003] transition-colors" />
                </Link>
              </div>
            </div>
          )}

          {/* PHOTOS tab */}
          {tab === 'photos' && (
            <div className="p-5 space-y-5">
              {/* upload zone */}
              <div
                onClick={() => !uploading && fileRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all',
                  uploading
                    ? 'border-[#f6a003] bg-[#fff8ed] cursor-default'
                    : 'border-neutral-200 hover:border-[#f6a003] hover:bg-[#fff8ed]/30',
                )}>
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-7 h-7 text-[#f6a003] animate-spin" />
                    <p className="text-sm font-semibold text-neutral-500">{t('settings.uploading')}…</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 pointer-events-none">
                    <div className="w-12 h-12 rounded-xl bg-[#fff8ed] border border-[#fde68a] flex items-center justify-center">
                      <Upload className="w-5 h-5 text-[#f6a003]" />
                    </div>
                    <p className="text-sm font-bold text-neutral-700">{t('settings.uploadPhotos')}</p>
                    <p className="text-xs text-neutral-400">{t('settings.uploadHint')}</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={e => handleFiles(Array.from(e.target.files || []))} />
              </div>

              {/* cover highlight */}
              {coverImg && (
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                    {t('settings.coverPhoto')}
                  </p>
                  <div className="relative rounded-2xl overflow-hidden border-2 border-[#f6a003] h-40">
                    <img src={`/api/v1/media/${coverImg}`} alt="Cover"
                      className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-[#f6a003] text-white text-[9px] font-black tracking-wider">
                      ★ {t('settings.cover')}
                    </span>
                  </div>
                </div>
              )}

              {/* photo grid */}
              {images.length > 0 ? (
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                    {t('settings.allPhotos')} ({images.length})
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <AnimatePresence>
                      {images.map(fileId => (
                        <motion.div key={fileId} layout
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.85 }}
                          className={cn(
                            'relative group aspect-square rounded-xl overflow-hidden border-2 transition-all',
                            coverImg === fileId
                              ? 'border-[#f6a003] shadow-[0_0_0_3px_rgba(245,158,11,0.2)]'
                              : 'border-neutral-200 hover:border-[#fde68a]',
                          )}>
                          <img src={`/api/v1/media/${fileId}`} alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all" />

                          {/* action buttons */}
                          <div className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {coverImg !== fileId && (
                              <button onClick={() => setCover(fileId)}
                                className="p-1.5 rounded-lg bg-[#f6a003] text-white shadow-md hover:bg-[#e09200] transition-all"
                                title={t('settings.setAsCover')}>
                                <Star className="w-3 h-3" />
                              </button>
                            )}
                            <button onClick={() => removePhoto(fileId)}
                              disabled={deleting === fileId}
                              className="p-1.5 rounded-lg bg-red-500 text-white shadow-md hover:bg-red-600 transition-all disabled:opacity-60"
                              title={t('common.delete')}>
                              {deleting === fileId
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <Trash2 className="w-3 h-3" />}
                            </button>
                          </div>

                          {coverImg === fileId && (
                            <div className="absolute top-1 left-1">
                              <span className="px-1.5 py-0.5 rounded bg-[#f6a003] text-white text-[8px] font-black">★</span>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-2 flex items-center gap-1">
                    <Star className="w-3 h-3 text-[#f6a003] fill-[#f6a003]" />
                    {t('settings.coverHint')}
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building2 className="w-10 h-10 text-neutral-200 mx-auto mb-2" />
                  <p className="text-sm text-neutral-400">{t('settings.noPhotos')}</p>
                </div>
              )}
            </div>
          )}

          {/* EDIT tab */}
          {tab === 'edit' && (
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  {t('settings.hotelName')} *
                </label>
                <input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))}
                  required className={inp} />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  {t('settings.description')}
                </label>
                <textarea value={form.description}
                  onChange={e => setForm(p => ({...p, description: e.target.value}))}
                  rows={3} className={cn(inp, 'resize-none')}
                  placeholder="Describe the hotel…" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    {t('superadmin.city')}
                  </label>
                  <input value={form.address.city}
                    onChange={e => setForm(p => ({...p, address:{...p.address, city:e.target.value}}))}
                    className={inp} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    {t('superadmin.country')}
                  </label>
                  <select value={form.address.country}
                    onChange={e => setForm(p => ({...p, address:{...p.address, country:e.target.value}}))}
                    className={inp}>
                    {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  {t('settings.starRating')}
                </label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button"
                      onClick={() => setForm(p => ({...p, starRating: n}))}
                      className={cn('w-9 h-9 rounded-lg border text-sm font-bold transition-all',
                        n <= form.starRating
                          ? 'bg-[#fff8ed] border-[#f6a003] text-[#f6a003]'
                          : 'border-neutral-200 text-neutral-300 hover:border-[#fde68a]')}>
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    {t('common.phone')}
                  </label>
                  <input value={form.contact.phone}
                    onChange={e => setForm(p => ({...p, contact:{...p.contact, phone:e.target.value}}))}
                    className={inp} placeholder="+20 …" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    {t('common.email')}
                  </label>
                  <input type="email" value={form.contact.email}
                    onChange={e => setForm(p => ({...p, contact:{...p.contact, email:e.target.value}}))}
                    className={inp} placeholder="hotel@…" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  {t('settings.website')}
                </label>
                <input value={form.contact.website}
                  onChange={e => setForm(p => ({...p, contact:{...p.contact, website:e.target.value}}))}
                  className={inp} placeholder="https://…" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setTab('info')}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-all">
                  {t('common.cancel')}
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#f6a003] hover:bg-[#e09200] text-white text-sm font-bold disabled:opacity-60 transition-all shadow-sm">
                  {saving
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <><Check className="w-4 h-4" /> {t('common.save')}</>}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function SuperAdminPage() {
  const { t } = useTranslation();
  const [hotels,   setHotels]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [page,     setPage]     = useState(1);
  const [pagination, setPagination] = useState(null);
  const [createOpen,  setCreateOpen]  = useState(false);
  const [selected,    setSelected]    = useState(null);   // hotel for drawer
  const [stats,       setStats]       = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await hotelApi.getAdminAll({ page, limit: 12, search: search || undefined });
      setHotels(data.data || []);
      setPagination(data.pagination);
    } catch { toast.error(t('errors.loadFailed')); }
    finally { setLoading(false); }
  }, [page, search, t]);

  useEffect(() => { load(); }, [page]);

  /* platform stats */
  useEffect(() => {
    api.get('/hotels/admin/all', { params: { limit: 1000 } })
      .then(({ data }) => {
        const all = data.data || [];
        setStats({
          total:   all.length,
          active:  all.filter(h => h.isActive).length,
          avg:     (all.filter(h => h.avgRating > 0).reduce((s, h) => s + h.avgRating, 0)
                    / Math.max(all.filter(h => h.avgRating > 0).length, 1)),
          reviews: all.reduce((s, h) => s + (h.totalReviews || 0), 0),
        });
      }).catch(() => {});
  }, []);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); load(); };

  const handleUpdated = (updated) => {
    setHotels(p => p.map(h => h._id === updated._id ? { ...h, ...updated } : h));
    if (selected?._id === updated._id) setSelected(updated);
  };

  const STAT_CARDS = stats ? [
    { label: t('superadmin.totalHotels'),  value: stats.total,              icon: Hotel,  colorCls: 'bg-[#fff8ed] border-[#fde68a] text-[#f6a003]'   },
    { label: t('superadmin.activeHotels'), value: stats.active,             icon: Globe,  colorCls: 'bg-emerald-50 border-emerald-200 text-emerald-500' },
    { label: t('superadmin.avgRating'),    value: stats.avg.toFixed(1)+' ★',icon: Star,   colorCls: 'bg-blue-50 border-blue-200 text-blue-500'      },
    { label: t('superadmin.totalReviews'), value: stats.reviews,            icon: Users,  colorCls: 'bg-purple-50 border-purple-200 text-purple-500' },
  ] : [];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#f6a003]" />
            <h1 className="text-2xl font-semibold text-neutral-900">{t('superadmin.title')}</h1>
          </div>
          <p className="text-neutral-400 text-sm mt-1">{t('superadmin.subtitle')}</p>
        </div>
        <button onClick={() => setCreateOpen(true)}
          className="self-start flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#f6a003] hover:bg-[#e09200] text-white text-sm font-bold shadow-sm transition-all">
          <Plus className="w-4 h-4" /> {t('superadmin.addHotel')}
        </button>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-[#fde68a] to-transparent" />

      {/* ── Stats ── */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_CARDS.map(s => <StatCard key={s.label} {...s} />)}
        </div>
      )}

      {/* ── Search ── */}
      <form onSubmit={handleSearch} className="flex gap-3 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('superadmin.searchHotels')}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 outline-none focus:border-[#f6a003] focus:ring-2 focus:ring-[#f6a003]/15 transition-all text-sm" />
        </div>
        <button type="submit"
          className="px-4 py-2.5 rounded-xl bg-[#f6a003] hover:bg-[#e09200] text-white text-sm font-bold transition-all">
          {t('common.search')}
        </button>
      </form>

      {/* ── Table ── */}
      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="xl" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                {[
                  t('superadmin.hotel'),
                  t('superadmin.location'),
                  t('settings.starRating'),
                  t('superadmin.rating'),
                  t('staff.status'),
                  t('common.actions'),
                ].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hotels.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-neutral-400">
                    {t('superadmin.noHotels')}
                  </td>
                </tr>
              ) : hotels.map(hotel => (
                <motion.tr key={hotel._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="border-b border-neutral-50 hover:bg-[#fff8ed]/20 transition-colors cursor-pointer"
                  onClick={() => setSelected(hotel)}>

                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      {hotel.coverImage
                        ? <img src={`/api/v1/media/${hotel.coverImage}`} alt=""
                            className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                        : <div className="w-10 h-10 rounded-xl bg-[#fff8ed] border border-[#fde68a] flex items-center justify-center flex-shrink-0">
                            <span className="font-serif font-bold text-[#f6a003] text-sm">{hotel.name?.[0]}</span>
                          </div>}
                      <div>
                        <p className="text-sm font-semibold text-neutral-800">{hotel.name}</p>
                        <p className="text-xs text-neutral-400">{hotel.ownerId?.name || '—'}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3.5 text-sm text-neutral-600">
                    {[hotel.address?.city, hotel.address?.country].filter(Boolean).join(', ')}
                  </td>

                  <td className="px-4 py-3.5 text-[#f6a003] text-sm font-medium">
                    {'★'.repeat(hotel.starRating || 3)}
                  </td>

                  <td className="px-4 py-3.5">
                    {hotel.avgRating > 0 ? (
                      <span className="text-sm font-bold text-[#f6a003]">
                        {formatRating(hotel.avgRating)} ★{' '}
                        <span className="font-normal text-neutral-400">({hotel.totalReviews})</span>
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-400">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3.5">
                    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                      hotel.isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-neutral-100 text-neutral-400 border-neutral-200')}>
                      {hotel.isActive ? t('staff.active') : t('staff.inactive')}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <button onClick={e => { e.stopPropagation(); setSelected(hotel); }}
                      className="flex items-center gap-1 text-xs font-semibold text-[#f6a003] hover:text-[#e09200] transition-colors">
                      {t('superadmin.manage')} <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ── */}
      {pagination?.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={!pagination.hasPrev}
            className="flex items-center gap-1 px-4 py-2 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 transition-all">
            <ChevronLeft className="w-4 h-4" /> {t('superadmin.prev')}
          </button>
          <span className="text-sm text-neutral-400 px-3">
            {page} / {pagination.totalPages}
          </span>
          <button onClick={() => setPage(p => p+1)} disabled={!pagination.hasNext}
            className="flex items-center gap-1 px-4 py-2 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 transition-all">
            {t('superadmin.next')} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Modals / Drawers ── */}
      <AnimatePresence>
        {createOpen && (
          <CreateModal
            onClose={() => setCreateOpen(false)}
            onCreated={h => { setHotels(p => [h, ...p]); setCreateOpen(false); }}
          />
        )}
        {selected && (
          <HotelDrawer
            hotel={selected}
            onClose={() => setSelected(null)}
            onUpdated={handleUpdated}
          />
        )}
      </AnimatePresence>
    </div>
  );
}