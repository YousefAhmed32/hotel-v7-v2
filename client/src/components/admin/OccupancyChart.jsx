import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
export const OccupancyGauge = ({ rate = 0 }) => {
  const data = [{ name: 'Occupied', value: rate, fill: '#C9A84C' }, { name: 'Available', value: 100 - rate, fill: '#e5e5e5' }];
  return (
    <div className="luxury-card p-6">
      <h3 className="text-sm font-medium text-neutral-400 mb-4">Occupancy Rate</h3>
      <div className="relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart><Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>{data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}</Pie>
            <Tooltip formatter={(v) => [v + '%', '']} contentStyle={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', color: '#171717' }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center"><p className="text-3xl font-bold text-amber-600 font-bold">{rate}%</p><p className="text-xs text-neutral-400">Occupied</p></div>
        </div>
      </div>
      <div className="flex justify-center gap-6 mt-2">
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /><span className="text-xs text-neutral-400">Occupied ({rate}%)</span></div>
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-neutral-100" /><span className="text-xs text-neutral-400">Available ({100-rate}%)</span></div>
      </div>
    </div>
  );
};
