import { useTranslation } from 'react-i18next';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, X, Search, ToggleLeft, ToggleRight,
  Trash2, Crown, ShieldCheck, ChevronDown, Check,
  Mail, User, Loader2, UserPlus, Link as LinkIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { selectUserHotelId } from '@/features/auth/authSlice';
import { staffApi } from '@/services/staffApi';
import { formatDate } from '@/utils/formatters';
import { cn } from '@/utils/cn';

/* ─── constants ─────────────────────────────────────────── */
const ROLES = ['manager', 'receptionist'];
const ROLE_CFG = {
  manager:      { color: '#9333ea', bg: '#faf5ff', border: '#e9d5ff' },
  receptionist: { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  owner:        { color: '#c47d00', bg: '#fff8ed', border: '#fde7b0' },
};

const inputCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-[#f0e8d8] bg-white text-[#1a1410] text-sm ' +
  'placeholder-[#c4a882] focus:outline-none focus:border-[#f6a003] focus:ring-2 ' +
  'focus:ring-[#f6a003]/15 transition-all duration-200';

/* ─── tiny helpers ───────────────────────────────────────── */
const Avatar = ({ name, size = 'md' }) => {
  const sz =
    size === 'sm' ? 'w-8 h-8 text-xs' :
    size === 'lg' ? 'w-12 h-12 text-base' : 'w-10 h-10 text-sm';
  return (
    <div className={cn(
      sz,
      'rounded-2xl bg-gradient-to-br from-[#f6a003] to-[#e07b00]',
      'text-white flex items-center justify-center font-bold flex-shrink-0',
      'shadow-[0_2px_8px_rgba(246,160,3,0.35)]',
    )}>
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
};

const RoleBadge = ({ role }) => {
  const cfg = ROLE_CFG[role] ?? { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' };
  const label = role === 'owner' ? 'Owner' : role === 'manager' ? 'Manager' : 'Receptionist';
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize border"
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
      {role === 'owner' && <Crown className="w-3 h-3" />}
      {label}
    </span>
  );
};

/* ─── RoleSelector ───────────────────────────────────────── */
const RoleSelector = ({ value, onChange }) => {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-2 gap-2">
      {ROLES.map(r => {
        const cfg = ROLE_CFG[r];
        return (
          <button key={r} type="button" onClick={() => onChange(r)}
            className={cn(
              'py-2.5 px-3 rounded-xl border-2 text-xs font-bold capitalize transition-all',
              value === r
                ? 'border-[#f6a003] bg-[#fff8ed] text-[#c47d00]'
                : 'border-[#f0e8d8] text-[#8a7560] hover:border-[#f6a003]/50',
            )}>
            {r === 'manager' ? t('staff.manager') : t('staff.receptionist')}
          </button>
        );
      })}
    </div>
  );
};

/* ─── UserSearchInput ────────────────────────────────────── */
const UserSearchInput = ({ hotelId, onSelect, selected, onClear }) => {
  const { t } = useTranslation();
  const [q,       setQ]       = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open,    setOpen]    = useState(false);
  const timer  = useRef(null);
  const wrapRef = useRef(null);

  /* close dropdown on outside click */
  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doSearch = useCallback(async (val) => {
    if (val.trim().length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const { data } = await staffApi.searchUsers(hotelId, val.trim());
      setResults(data.data.users || []);
      setOpen(true);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, [hotelId]);

  const handleChange = (e) => {
    const val = e.target.value;
    setQ(val);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => doSearch(val), 280);
    if (!val) { setResults([]); setOpen(false); }
  };

  const pick = (user) => {
    onSelect(user);
    setQ(user.name + ' (' + user.email + ')');
    setOpen(false);
    setResults([]);
  };

  if (selected) return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#fff8ed] border-2 border-[#f6a003]">
      <Avatar name={selected.name} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#1a1410] truncate">{selected.name}</p>
        <p className="text-xs text-[#8a7560] truncate">{selected.email}</p>
      </div>
      <button type="button" onClick={onClear}
        className="p-1 rounded-lg hover:bg-red-50 text-[#c4a882] hover:text-red-400 transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c4a882]" />
        <input
          value={q}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={t('staff.searchPlaceholder')}
          className={cn(inputCls, 'pl-10 pr-9')}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#f6a003] animate-spin" />
        )}
        {q && !loading && (
          <button type="button" onClick={() => { setQ(''); setResults([]); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c4a882] hover:text-[#f6a003] transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1.5 bg-white rounded-2xl shadow-xl border border-[#f0e8d8] overflow-hidden">

            {results.length === 0 ? (
              <div className="px-4 py-5 text-center">
                <p className="text-sm font-semibold text-[#8a7560]">{t('staff.noUsersFound')} "{q}"</p>
                <p className="text-xs text-[#c4a882] mt-1">{t('staff.searchHint')}</p>
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto divide-y divide-[#f0e8d8]">
                {results.map(u => (
                  <button key={u._id} type="button" onClick={() => pick(u)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#fff8ed] transition-colors text-left">
                    <Avatar name={u.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1a1410] truncate">{u.name}</p>
                      <p className="text-xs text-[#8a7560] truncate">{u.email}</p>
                    </div>
                    <RoleBadge role={u.role} />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── AddStaffModal ──────────────────────────────────────── */
const AddStaffModal = ({ hotelId, onClose, onAdded }) => {
  const { t } = useTranslation();
  const [tab,      setTab]      = useState('assign');   // 'assign' | 'invite'
  const [selected, setSelected] = useState(null);
  const [role,     setRole]     = useState('receptionist');
  const [saving,   setSaving]   = useState(false);
  const [tempPwd,  setTempPwd]  = useState(null);

  /* invite-new form */
  const [form, setForm] = useState({ name: '', email: '', role: 'receptionist' });

  /* ── assign existing ── */
  const handleAssign = async () => {
    if (!selected) { toast.error(t('staff.selectUser')); return; }
    setSaving(true);
    try {
      const { data } = await staffApi.assignExisting(hotelId, { userId: selected._id, role });
      toast.success(t('staff.assignedSuccessfully'));
      onAdded(data.data.user);
      onClose();
    } catch (err) { toast.error(err.response?.data?.message || t('errors.general')); }
    finally { setSaving(false); }
  };

  /* ── invite new ── */
  const handleInvite = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { toast.error(t('validation.required')); return; }
    setSaving(true);
    try {
      const { data } = await staffApi.inviteStaff(hotelId, form);
      setTempPwd(data.data.tempPassword);
      onAdded(data.data.user);
      toast.success(t('staff.invited'));
    } catch (err) { toast.error(err.response?.data?.message || t('errors.general')); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
         style={{ background: 'rgba(26,20,16,0.55)', backdropFilter: 'blur(6px)' }}>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1    }}
        exit={{    opacity: 0, y: 40, scale: 0.97 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="w-full sm:max-w-md bg-white sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl">

        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0e8d8]"
             style={{ background: 'rgba(246,160,3,0.06)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#f6a003] flex items-center justify-center shadow-[0_2px_8px_rgba(246,160,3,0.3)]">
              <UserPlus className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-bold text-[#1a1410]">{t('staff.addStaff')}</h2>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#c4a882] hover:text-[#f6a003] hover:bg-[#fff8ed] transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── success screen ── */}
        {tempPwd ? (
          <div className="p-6 space-y-4">
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 border-2 border-emerald-200 flex items-center justify-center">
                <Check className="w-7 h-7 text-emerald-500" />
              </div>
              <p className="font-bold text-[#1a1410]">{t('staff.inviteSuccess')}</p>
              <p className="text-xs text-[#8a7560] text-center">{t('staff.inviteSuccessDesc')}</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#fff8ed] border border-[#f6a003]/30">
              <p className="text-[10px] font-bold text-[#8a7560] uppercase tracking-widest mb-2">
                {t('staff.temporaryPassword')}
              </p>
              <p className="font-mono text-xl font-black text-[#f6a003] tracking-[.15em] text-center py-2 bg-white rounded-xl border border-[#f0e8d8]">
                {tempPwd}
              </p>
              <p className="text-[10px] text-[#8a7560] text-center mt-2">{t('staff.changePassword')}</p>
            </div>
            <button onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-[#f6a003] text-white text-sm font-bold hover:bg-[#e09200] transition-all shadow-[0_4px_14px_rgba(246,160,3,0.35)]">
              {t('common.done')}
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[#f5f0e8]">
              {[
                { id: 'assign', icon: LinkIcon,  label: t('staff.assignExisting') },
                { id: 'invite', icon: UserPlus,  label: t('staff.inviteNew') },
              ].map(({ id, icon: Icon, label }) => (
                <button key={id} type="button" onClick={() => setTab(id)}
                  className={cn(
                    'flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all',
                    tab === id
                      ? 'bg-white text-[#1a1410] shadow-sm'
                      : 'text-[#8a7560] hover:text-[#1a1410]',
                  )}>
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:block">{label}</span>
                  <span className="sm:hidden">{id === 'assign' ? t('staff.existing') : t('staff.new')}</span>
                </button>
              ))}
            </div>

            {/* ── assign tab ── */}
            {tab === 'assign' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-[#5a4a38] uppercase tracking-wider block mb-1.5">
                    {t('staff.searchUser')}
                  </label>
                  <UserSearchInput
                    hotelId={hotelId}
                    selected={selected}
                    onSelect={setSelected}
                    onClear={() => setSelected(null)}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#5a4a38] uppercase tracking-wider block mb-1.5">
                    {t('staff.assignAs')}
                  </label>
                  <RoleSelector value={role} onChange={setRole} />
                </div>

                <button type="button" onClick={handleAssign} disabled={saving || !selected}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all',
                    saving || !selected
                      ? 'bg-[#f6a003]/50 cursor-not-allowed'
                      : 'bg-[#f6a003] hover:bg-[#e09200] shadow-[0_4px_14px_rgba(246,160,3,0.35)] active:scale-[0.98]',
                  )}>
                  {saving
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('staff.assigning')}</>
                    : <><ShieldCheck className="w-4 h-4" /> {t('staff.assign')} {role}</>}
                </button>
              </div>
            )}

            {/* ── invite tab ── */}
            {tab === 'invite' && (
              <form onSubmit={handleInvite} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#5a4a38] uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3 h-3 text-[#f6a003]" /> {t('staff.name')} *
                  </label>
                  <input
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    required placeholder={t('staff.namePlaceholder')}
                    className={inputCls}
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#5a4a38] uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-[#f6a003]" /> {t('auth.email')} *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    required placeholder={t('staff.emailPlaceholder')}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#5a4a38] uppercase tracking-wider">
                    {t('staff.role')} *
                  </label>
                  <RoleSelector
                    value={form.role}
                    onChange={r => setForm(p => ({ ...p, role: r }))}
                  />
                </div>
                <button type="submit" disabled={saving}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all mt-1',
                    saving
                      ? 'bg-[#f6a003]/50 cursor-not-allowed'
                      : 'bg-[#f6a003] hover:bg-[#e09200] shadow-[0_4px_14px_rgba(246,160,3,0.35)] active:scale-[0.98]',
                  )}>
                  {saving
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('staff.inviting')}</>
                    : <><ShieldCheck className="w-4 h-4" /> {t('staff.invite')}</>}
                </button>
              </form>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

/* ─── RoleChangeModal ────────────────────────────────────── */
const RoleChangeModal = ({ member, hotelId, onClose, onUpdated }) => {
  const { t } = useTranslation();
  const [role, setRole] = useState(member.role);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (role === member.role) { onClose(); return; }
    setSaving(true);
    try {
      await staffApi.updateRole(hotelId, member._id, { role });
      toast.success(t('staff.roleUpdated'));
      onUpdated(member._id, role);
      onClose();
    } catch (err) { toast.error(err.response?.data?.message || t('errors.general')); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(26,20,16,0.55)', backdropFilter: 'blur(6px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        exit={{    opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl w-full max-w-xs shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#f0e8d8]" style={{ background: 'rgba(246,160,3,0.06)' }}>
          <p className="font-bold text-[#1a1410]">{t('staff.changeRole')} {member.name}</p>
        </div>
        <div className="p-5 space-y-4">
          <RoleSelector value={role} onChange={setRole} />
          <div className="flex gap-2">
            <button onClick={onClose}
              className="flex-1 py-2 rounded-xl border border-[#f0e8d8] text-sm font-semibold text-[#8a7560] hover:bg-[#f5f0e8] transition-all">
              {t('common.cancel')}
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2 rounded-xl bg-[#f6a003] text-white text-sm font-bold hover:bg-[#e09200] disabled:opacity-60 transition-all shadow-[0_3px_10px_rgba(246,160,3,0.3)]">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('staff.saveRole')}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/* ─── Mobile staff card ──────────────────────────────────── */
const MobileCard = ({ member, onToggle, onRemove, onChangeRole }) => {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-[#f0e8d8] p-4 flex items-center gap-3 shadow-sm">
      <Avatar name={member.name} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold text-[#1a1410] truncate">{member.name}</p>
          <RoleBadge role={member.role} />
        </div>
        <p className="text-xs text-[#8a7560] truncate mt-0.5">{member.email}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={cn('w-1.5 h-1.5 rounded-full', member.isActive ? 'bg-emerald-500' : 'bg-[#c4a882]')} />
          <span className={cn('text-[11px] font-semibold', member.isActive ? 'text-emerald-600' : 'text-[#8a7560]')}>
            {member.isActive ? t('staff.active') : t('staff.inactive')}
          </span>
        </div>
      </div>
      {member.role !== 'owner' && (
        <div className="flex flex-col gap-1 flex-shrink-0">
          <button onClick={() => onChangeRole(member)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#c4a882] hover:text-[#f6a003] hover:bg-[#fff8ed] transition-all">
            <ChevronDown className="w-4 h-4" />
          </button>
          <button onClick={() => onToggle(member._id)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#c4a882] hover:text-[#f6a003] hover:bg-[#fff8ed] transition-all">
            {member.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
          </button>
          <button onClick={() => onRemove(member._id)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#c4a882] hover:text-red-400 hover:bg-red-50 transition-all">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════ */
export default function StaffPage() {
  const { t } = useTranslation();
  const hotelId = useSelector(selectUserHotelId);
  const [staff,       setStaff]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [modalOpen,   setModalOpen]   = useState(false);
  const [roleTarget,  setRoleTarget]  = useState(null);

  const load = useCallback(async () => {
    if (!hotelId) return;
    try {
      setLoading(true);
      const { data } = await staffApi.getStaff(hotelId, { limit: 50 });
      setStaff(data.data || []);
    } catch {} finally { setLoading(false); }
  }, [hotelId]);

  useEffect(() => { load(); }, [load]);

  const filtered = staff.filter(s =>
    !search ||
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = async (id) => {
    try {
      const { data } = await staffApi.toggleStatus(hotelId, id);
      setStaff(p => p.map(s => s._id === id ? data.data.staff : s));
      toast.success(data.message);
    } catch (err) { toast.error(err.response?.data?.message || t('errors.general')); }
  };

  const handleRemove = async (id) => {
    if (!confirm(t('staff.confirmRemove'))) return;
    try {
      await staffApi.removeStaff(hotelId, id);
      setStaff(p => p.filter(s => s._id !== id));
      toast.success(t('staff.removed'));
    } catch (err) { toast.error(err.response?.data?.message || t('errors.general')); }
  };

  const handleAdded = (user) => {
    setStaff(p => [user, ...p.filter(s => s._id !== user._id)]);
  };

  const handleRoleUpdated = (id, role) => {
    setStaff(p => p.map(s => s._id === id ? { ...s, role } : s));
  };

  const activeCount   = staff.filter(s => s.isActive).length;
  const inactiveCount = staff.length - activeCount;

  return (
    <div className="min-h-screen bg-[#fefcf7]">
      <div className="h-1 w-full bg-gradient-to-r from-[#f6a003] via-[#ffc843] to-[#f6a003]" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#f6a003] flex items-center justify-center shadow-[0_4px_14px_rgba(246,160,3,0.35)]">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1410] tracking-tight leading-none">
                  {t('staff.title')}
                </h1>
                <p className="text-[#8a7560] text-sm mt-0.5">{t('staff.subtitle')}</p>
              </div>
            </div>

            {/* stat pills */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: t('common.total'),    value: staff.length,   active: false },
                { label: t('staff.active'),    value: activeCount,    active: true  },
                { label: t('staff.inactive'),  value: inactiveCount,  active: false },
              ].map(s => (
                <div key={s.label}
                  className="flex flex-col items-center justify-center px-5 py-2.5 rounded-2xl bg-[#fff8ed] border border-[#f0e8d8] min-w-[80px]">
                  <span className="text-xl font-bold text-[#f6a003] leading-none">{s.value}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#8a7560] mt-0.5">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => setModalOpen(true)}
            className="self-start flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#f6a003] text-white text-sm font-bold shadow-[0_4px_18px_rgba(246,160,3,0.4)] hover:bg-[#e09200] hover:shadow-[0_6px_22px_rgba(246,160,3,0.5)] active:scale-[0.97] transition-all">
            <Plus className="w-4 h-4" /> {t('staff.addStaff')}
          </button>
        </motion.div>

        <div className="h-px bg-gradient-to-r from-transparent via-[#f0e8d8] to-transparent" />

        {/* ── Search bar ── */}
        {staff.length > 0 && (
          <div className="relative max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c4a882]" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t('common.search') + '…'}
              className={cn(inputCls, 'pl-10')} />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c4a882] hover:text-[#f6a003] transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* ── Content ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#fff8ed] border border-[#f0e8d8] flex items-center justify-center">
              <Users className="w-6 h-6 text-[#f6a003] animate-pulse" />
            </div>
            <p className="text-sm text-[#8a7560] animate-pulse">{t('common.loading')}</p>
          </div>

        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-[#f0e8d8] p-16 text-center shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-[#fff8ed] border border-[#f0e8d8] flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-[#c4a882]" />
            </div>
            <h3 className="text-lg font-semibold text-[#1a1410] mb-1">
              {search ? t('staff.noMatch') : t('staff.noStaff')}
            </h3>
            <p className="text-sm text-[#8a7560] mb-6">
              {search ? t('staff.tryDifferent') : t('staff.addFirstMember')}
            </p>
            {!search && (
              <button onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#f6a003] text-white text-sm font-bold shadow-[0_4px_18px_rgba(246,160,3,0.35)] hover:bg-[#e09200] transition-all">
                <Plus className="w-4 h-4" /> {t('staff.addStaff')}
              </button>
            )}
          </motion.div>

        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block bg-white rounded-3xl border border-[#f0e8d8] overflow-hidden shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#f0e8d8]" style={{ background: 'rgba(246,160,3,0.05)' }}>
                    {[t('staff.member'), t('staff.role'), t('staff.status'), t('staff.joined'), t('common.actions')].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold text-[#8a7560] uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filtered.map((member, i) => (
                      <motion.tr key={member._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { delay: i * 0.04 } }}
                        exit={{ opacity: 0 }}
                        className="border-b border-[#f0e8d8]/60 last:border-0 hover:bg-[#fff8ed]/40 transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={member.name} size="sm" />
                            <div>
                              <p className="text-sm font-semibold text-[#1a1410]">{member.name}</p>
                              <p className="text-xs text-[#8a7560]">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <RoleBadge role={member.role} />
                            {member.role !== 'owner' && (
                              <button onClick={() => setRoleTarget(member)}
                                className="w-6 h-6 rounded-lg flex items-center justify-center text-[#c4a882] hover:text-[#f6a003] hover:bg-[#fff8ed] transition-all opacity-0 group-hover:opacity-100">
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold', member.isActive ? 'text-emerald-600' : 'text-[#8a7560]')}>
                            <span className={cn('w-1.5 h-1.5 rounded-full', member.isActive ? 'bg-emerald-500' : 'bg-[#c4a882]')} />
                            {member.isActive ? t('staff.active') : t('staff.inactive')}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-[#8a7560]">
                          {formatDate(member.createdAt, 'MMM d, yyyy')}
                        </td>
                        <td className="px-5 py-4">
                          {member.role !== 'owner' && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleToggle(member._id)}
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#c4a882] hover:text-[#f6a003] hover:bg-[#fff8ed] transition-all"
                                title={member.isActive ? t('staff.toggleDeactivate') : t('staff.toggleActivate')}>
                                {member.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                              </button>
                              <button onClick={() => handleRemove(member._id)}
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#c4a882] hover:text-red-400 hover:bg-red-50 transition-all"
                                title={t('common.delete')}>
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>

              <div className="px-5 py-3 border-t border-[#f0e8d8]" style={{ background: 'rgba(246,160,3,0.03)' }}>
                <p className="text-[11px] text-[#8a7560]">
                  {t('common.showing')} <span className="font-bold text-[#f6a003]">{filtered.length}</span>{' '}
                  {t('common.of')} {staff.length} {t('staff.teamMembers')}
                </p>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-2.5">
              {filtered.map(member => (
                <MobileCard key={member._id} member={member}
                  onToggle={handleToggle}
                  onRemove={handleRemove}
                  onChangeRole={setRoleTarget} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {modalOpen && (
          <AddStaffModal
            hotelId={hotelId}
            onClose={() => setModalOpen(false)}
            onAdded={handleAdded}
          />
        )}
        {roleTarget && (
          <RoleChangeModal
            member={roleTarget}
            hotelId={hotelId}
            onClose={() => setRoleTarget(null)}
            onUpdated={handleRoleUpdated}
          />
        )}
      </AnimatePresence>
    </div>
  );
}