import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  BarChart3, DollarSign, TrendingUp, Users, BedDouble,
  RefreshCw, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { selectUserHotelId } from '@/features/auth/authSlice';
import { bookingApi } from '@/services/bookingApi';
import { roomApi } from '@/services/roomApi';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatCurrency, formatShortNumber } from '@/utils/formatters';
import { cn } from '@/utils/cn';

const BRAND = '#f6a003';
const BRAND_LIGHT = '#fff7e6';

const ChartTip = ({ active, payload, label, currency, t }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-neutral-100 rounded-2xl shadow-xl p-3.5 text-xs backdrop-blur-sm">
      <p className="text-neutral-400 mb-2 font-semibold tracking-wide uppercase text-[10px]">{label}</p>
      {payload.map(p => (
        <p key={p.name} className="font-bold text-sm" style={{ color: p.color }}>
          {p.name}: {currency ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

const PERIODS = [
  { label: '7D',   value: '7'   },
  { label: '30D',  value: '30'  },
  { label: '90D',  value: '90'  },
  { label: '1Y',   value: '365' },
];

const STATUS_COLORS = {
  confirmed: '#10b981', pending: '#f59e0b', cancelled: '#ef4444',
  completed: '#3b82f6', locked: '#8b5cf6', no_show: '#6b7280',
};

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const hotelId = useSelector(selectUserHotelId);
  const [stats,   setStats]   = useState(null);
  const [rooms,   setRooms]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [period,  setPeriod]  = useState('30');

  const load = async () => {
    if (!hotelId) return;
    setLoading(true);
    try {
      const from = new Date(Date.now() - parseInt(period) * 86400000).toISOString().split('T')[0];
      const [statsRes, roomsRes] = await Promise.all([
        bookingApi.getBookingStats(hotelId, { from }),
        roomApi.getRooms(hotelId, { limit: 100 }),
      ]);
      setStats(statsRes.data.data);
      setRooms(roomsRes.data.data || []);
    } catch (err) {
      console.error('Analytics load error:', err);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [hotelId, period]);

  const totalRooms     = rooms.length;
  const activeRooms    = rooms.filter(r => r.isActive).length;
  const confirmedCount = stats?.confirmedBookings || 0;
  const occupancyRate  = totalRooms > 0 ? Math.min(100, Math.round((confirmedCount / (totalRooms * parseInt(period))) * 100)) : 0;

  const pieData = stats?.statusBreakdown
    ? Object.entries(stats.statusBreakdown).filter(([, v]) => v > 0).map(([k, v]) => ({
        name: t(`booking.status_${k}`), value: v, color: STATUS_COLORS[k] || '#94a3b8',
      }))
    : [];

  const SUMMARY_CARDS = [
    {
      labelKey: 'analytics.totalRevenue', value: formatCurrency(stats?.totalRevenue || 0),
      icon: DollarSign, change: '+12%', positive: true,
      bg: '#fff7e6', border: '#fde08a', iconColor: BRAND,
    },
    {
      labelKey: 'analytics.totalBookings', value: stats?.totalBookings || 0,
      icon: Users, change: '+8%', positive: true,
      bg: '#eff6ff', border: '#bfdbfe', iconColor: '#3b82f6',
    },
    {
      labelKey: 'analytics.confirmed', value: confirmedCount,
      icon: TrendingUp, change: '+5%', positive: true,
      bg: '#f0fdf4', border: '#bbf7d0', iconColor: '#10b981',
    },
    {
      labelKey: 'analytics.occupancyRate', value: occupancyRate + '%',
      icon: BedDouble, change: occupancyRate > 50 ? '+3%' : '-2%', positive: occupancyRate > 50,
      bg: '#faf5ff', border: '#e9d5ff', iconColor: '#8b5cf6',
    },
  ];

  return (
    <div className="space-y-6 px-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl" style={{ background: BRAND_LIGHT }}>
              <BarChart3 className="w-5 h-5" style={{ color: BRAND }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">{t('analytics.title')}</h1>
              <p className="text-neutral-400 text-sm mt-0.5">{t('analytics.subtitle')}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-neutral-100 rounded-xl p-1 gap-1">
            {PERIODS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setPeriod(value)}
                className="px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all"
                style={period === value
                  ? { background: BRAND, color: '#fff', boxShadow: '0 1px 4px rgba(246,160,3,0.35)' }
                  : { color: '#737373' }
                }
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={load}
            className="p-2.5 rounded-xl border border-neutral-200 text-neutral-400 hover:text-neutral-700 hover:border-neutral-300 transition-all bg-white"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-neutral-100 border-t-[#f6a003] animate-spin" />
          <p className="text-sm text-neutral-400">{t('analytics.loading')}</p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 xs:grid-cols-2 xl:grid-cols-4 gap-4">
            {SUMMARY_CARDS.map(({ labelKey, value, icon: Icon, change, positive, bg, border, iconColor }, i) => (
              <motion.div
                key={labelKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, ease: 'easeOut' }}
                className="bg-white rounded-2xl border border-neutral-100 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 rounded-xl border" style={{ background: bg, borderColor: border }}>
                    <Icon className="w-5 h-5" style={{ color: iconColor }} />
                  </div>
                  <span
                    className="flex items-center gap-0.5 text-xs font-bold px-2 py-1 rounded-full border"
                    style={positive
                      ? { background: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0' }
                      : { background: '#fef2f2', color: '#dc2626', borderColor: '#fecaca' }
                    }
                  >
                    {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {change}
                  </span>
                </div>
                <p className="text-2xl font-bold text-neutral-900 tracking-tight">{value}</p>
                <p className="text-sm text-neutral-400 mt-0.5 font-medium">{t(labelKey)}</p>
              </motion.div>
            ))}
          </div>

          {/* Revenue chart */}
          {stats?.dailyRevenue?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-neutral-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="font-bold text-neutral-900 text-base">{t('analytics.revenueTrend')}</h3>
                  <p className="text-sm text-neutral-400 mt-0.5">{t('analytics.dailyRevenue')}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-2xl font-bold" style={{ color: BRAND }}>{formatCurrency(stats?.totalRevenue || 0)}</p>
                  <p className="text-xs text-neutral-400">{t('analytics.totalForPeriod')}</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={stats.dailyRevenue} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={BRAND} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={BRAND} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#a3a3a3', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fill: '#a3a3a3', fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => '$' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)}
                  />
                  <Tooltip content={<ChartTip currency t={t} />} />
                  <Area
                    type="monotone" dataKey="revenue" name={t('analytics.revenue')}
                    stroke={BRAND} strokeWidth={2.5} fill="url(#revGrad)"
                    dot={false} activeDot={{ r: 5, fill: BRAND, stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Bookings + Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {stats?.dailyRevenue?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl border border-neutral-100 p-6 hover:shadow-md transition-shadow"
              >
                <h3 className="font-bold text-neutral-900 text-base mb-1">{t('analytics.dailyBookings')}</h3>
                <p className="text-sm text-neutral-400 mb-5">{t('analytics.bookingsPerDay')}</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.dailyRevenue} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: '#a3a3a3', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#a3a3a3', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTip t={t} />} />
                    <Bar dataKey="bookings" name={t('analytics.bookings')} fill={BRAND} radius={[6, 6, 0, 0]} opacity={0.9} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {pieData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-white rounded-2xl border border-neutral-100 p-6 hover:shadow-md transition-shadow"
              >
                <h3 className="font-bold text-neutral-900 text-base mb-1">{t('analytics.bookingStatus')}</h3>
                <p className="text-sm text-neutral-400 mb-4">{t('analytics.statusDistribution')}</p>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={58} outerRadius={88} paddingAngle={3} dataKey="value">
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} strokeWidth={0} />)}
                    </Pie>
                    <Tooltip
                      formatter={(v, name) => [v, name]}
                      contentStyle={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                    />
                    <Legend
                      iconType="circle" iconSize={8}
                      formatter={(v) => <span className="text-xs text-neutral-600 capitalize">{v}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </div>

          {/* Top rooms */}
          {stats?.topRooms?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl border border-neutral-100 p-6 hover:shadow-md transition-shadow"
            >
              <h3 className="font-bold text-neutral-900 text-base mb-1">{t('analytics.topRooms')}</h3>
              <p className="text-sm text-neutral-400 mb-6">{t('analytics.rankedByBookings')}</p>
              <div className="space-y-4">
                {stats.topRooms.map((item, i) => {
                  const maxCount = stats.topRooms[0]?.count || 1;
                  const pct = Math.round((item.count / maxCount) * 100);
                  return (
                    <div key={item._id} className="flex items-center gap-4">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: i === 0 ? BRAND : i === 1 ? '#a3a3a3' : '#d4a574' }}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-neutral-800 truncate">{item.room?.name || t('analytics.room')}</span>
                          <span className="text-xs text-neutral-500 ml-2 flex-shrink-0 bg-neutral-50 border border-neutral-200 px-2 py-0.5 rounded-full">
                            {item.count} · {formatCurrency(item.revenue)}
                          </span>
                        </div>
                        <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: pct + '%' }}
                            transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.1 }}
                            className="h-full rounded-full"
                            style={{ background: i === 0 ? BRAND : `${BRAND}99` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Room inventory */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl border border-neutral-100 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-neutral-900 text-base">{t('analytics.roomInventory')}</h3>
                <p className="text-sm text-neutral-400 mt-0.5">{t('analytics.activeRooms', { active: activeRooms, total: totalRooms })}</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />{t('analytics.active')}
                </span>
                <span className="flex items-center gap-1.5 text-neutral-400">
                  <span className="w-2 h-2 rounded-full bg-neutral-300" />{t('analytics.inactive')}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {rooms.slice(0, 15).map(room => (
                <div
                  key={room._id}
                  className={cn('p-3.5 rounded-xl border text-sm transition-all hover:scale-[1.02]',
                    room.isActive
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-neutral-50 border-neutral-200'
                  )}
                >
                  <p className="font-semibold text-neutral-800 truncate text-sm">{room.name}</p>
                  <p className="text-xs text-neutral-500 capitalize mt-0.5">{t(`rooms.${room.type}`)}</p>
                  <p className="text-xs font-bold mt-2" style={{ color: BRAND }}>{formatCurrency(room.basePrice)}/night</p>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}