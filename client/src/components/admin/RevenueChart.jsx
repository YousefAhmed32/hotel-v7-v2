import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/utils/formatters';
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return <div className="luxury-card p-3 text-sm"><p className="text-neutral-400 mb-1">{label}</p><p className="text-amber-500 font-semibold">{formatCurrency(payload[0]?.value)}</p></div>;
};
export const RevenueChart = ({ data = [] }) => {
  const chartData = data.length ? data : Array.from({ length: 14 }, (_, i) => ({ date: 'Day ' + (i+1), revenue: Math.round(Math.random()*8000+2000), bookings: Math.round(Math.random()*10+2) }));
  return (
    <div className="luxury-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h3 className="text-sm font-medium text-neutral-400">Revenue Overview</h3><p className="text-2xl font-bold text-neutral-900 mt-1">{formatCurrency(chartData.reduce((s,d) => s+d.revenue,0))}</p></div>
        <span className="badge-gold text-xs">Last 30 days</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData}>
          <defs><linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3} /><stop offset="95%" stopColor="#C9A84C" stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: '#a3a3a3', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fill: '#a3a3a3', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => '$' + (v/1000).toFixed(0) + 'k'} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="revenue" stroke="#C9A84C" strokeWidth={2} fill="url(#revGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
