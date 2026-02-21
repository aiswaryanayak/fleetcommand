/**
 * Reusable KPI card component for dashboards.
 */
export default function KPICard({ title, value, subtitle, icon: Icon, color = 'blue', trend }) {
  const colorMap = {
    blue: 'from-blue-500 to-blue-600',
    emerald: 'from-emerald-500 to-emerald-600',
    amber: 'from-amber-500 to-amber-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    slate: 'from-slate-500 to-slate-600',
    indigo: 'from-indigo-500 to-indigo-600',
    cyan: 'from-cyan-500 to-cyan-600',
  };

  const bgColorMap = {
    blue: 'bg-blue-50 border-blue-100',
    emerald: 'bg-emerald-50 border-emerald-100',
    amber: 'bg-amber-50 border-amber-100',
    red: 'bg-red-50 border-red-100',
    purple: 'bg-purple-50 border-purple-100',
    slate: 'bg-slate-50 border-slate-100',
    indigo: 'bg-indigo-50 border-indigo-100',
    cyan: 'bg-cyan-50 border-cyan-100',
  };

  const textColorMap = {
    blue: 'text-blue-600',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
    slate: 'text-slate-600',
    indigo: 'text-indigo-600',
    cyan: 'text-cyan-600',
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow ${bgColorMap[color] || bgColorMap.blue}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${textColorMap[color] || textColorMap.blue}`}>{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <p className={`text-xs mt-1 font-medium ${trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg bg-gradient-to-br ${colorMap[color] || colorMap.blue} text-white`}>
            <Icon size={22} />
          </div>
        )}
      </div>
    </div>
  );
}
