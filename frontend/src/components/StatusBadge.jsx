/**
 * Reusable status badge component with color coding.
 */
const STATUS_STYLES = {
  // Vehicle statuses
  'Available': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'On Trip': 'bg-blue-100 text-blue-700 border-blue-200',
  'In Shop': 'bg-amber-100 text-amber-700 border-amber-200',
  'Retired': 'bg-slate-100 text-slate-500 border-slate-200',
  // Trip statuses
  'Draft': 'bg-slate-100 text-slate-600 border-slate-200',
  'Dispatched': 'bg-blue-100 text-blue-700 border-blue-200',
  'Completed': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Cancelled': 'bg-red-100 text-red-700 border-red-200',
  // Driver statuses
  'On Duty': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Off Duty': 'bg-slate-100 text-slate-500 border-slate-200',
  'Suspended': 'bg-red-100 text-red-700 border-red-200',
  // Maintenance statuses
  'Open': 'bg-red-100 text-red-700 border-red-200',
  'In Progress': 'bg-amber-100 text-amber-700 border-amber-200',
  'Resolved': 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export default function StatusBadge({ status, className = '' }) {
  const style = STATUS_STYLES[status] || 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style} ${className}`}>
      {status}
    </span>
  );
}
