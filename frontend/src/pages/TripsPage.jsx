/**
 * Trip Dispatcher – full lifecycle management for trips.
 * Create → Dispatch → Complete | Cancel
 */
import { useState, useEffect } from 'react';
import { tripsAPI, vehiclesAPI, driversAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import { Plus, Play, CheckCircle, XCircle } from 'lucide-react';

export default function TripsPage() {
  const { hasRole } = useAuth();
  const canWrite = hasRole(['dispatcher']);

  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');

  const [createForm, setCreateForm] = useState({
    vehicle_id: '', driver_id: '', cargo_weight: '', origin: '', destination: '',
    estimated_fuel_cost: '0', revenue: '0', scheduled_date: '',
  });

  const [completeForm, setCompleteForm] = useState({ distance: '', revenue: '' });

  const fetchData = async () => {
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const [tripsRes, vehiclesRes, driversRes] = await Promise.all([
        tripsAPI.list(params),
        vehiclesAPI.list({ status: 'Available' }).catch(() => ({ data: [] })),
        driversAPI.list({ status: 'On Duty' }).catch(() => ({ data: [] })),
      ]);
      setTrips(tripsRes.data);
      setVehicles(vehiclesRes.data);
      setDrivers(driversRes.data.filter(d => !d.license_expired));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [statusFilter]);

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await tripsAPI.create({
        ...createForm,
        vehicle_id: parseInt(createForm.vehicle_id),
        driver_id: parseInt(createForm.driver_id),
        cargo_weight: parseFloat(createForm.cargo_weight),
        estimated_fuel_cost: parseFloat(createForm.estimated_fuel_cost || 0),
        revenue: parseFloat(createForm.revenue || 0),
      });
      setShowCreateModal(false);
      setCreateForm({ vehicle_id: '', driver_id: '', cargo_weight: '', origin: '', destination: '', estimated_fuel_cost: '0', revenue: '0', scheduled_date: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create trip');
    }
  };

  const handleDispatch = async (id) => {
    try {
      await tripsAPI.dispatch(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to dispatch');
    }
  };

  const openComplete = (trip) => {
    setSelectedTrip(trip);
    setCompleteForm({ distance: '', revenue: String(trip.revenue || '') });
    setError('');
    setShowCompleteModal(true);
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await tripsAPI.complete(selectedTrip.id, {
        distance: parseFloat(completeForm.distance),
        revenue: completeForm.revenue ? parseFloat(completeForm.revenue) : undefined,
      });
      setShowCompleteModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to complete trip');
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this trip?')) return;
    try {
      await tripsAPI.cancel(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to cancel');
    }
  };

  const columns = [
    { key: 'id', label: 'Trip #', accessor: 'id', render: (row) => (
      <span className="font-mono text-xs font-semibold text-blue-600">#{row.id}</span>
    )},
    { key: 'vehicle', label: 'Vehicle', accessor: 'vehicle_name' },
    { key: 'driver', label: 'Driver', accessor: 'driver_name' },
    { key: 'route', label: 'Route', render: (row) => (
      <div className="text-xs">
        <span className="text-slate-700">{row.origin}</span>
        <span className="text-slate-400 mx-1">→</span>
        <span className="text-slate-700">{row.destination}</span>
      </div>
    )},
    { key: 'cargo_weight', label: 'Cargo (kg)', accessor: 'cargo_weight', render: (row) => row.cargo_weight.toLocaleString() },
    { key: 'distance', label: 'Distance', accessor: 'distance', render: (row) => row.distance > 0 ? `${row.distance} km` : '—' },
    { key: 'revenue', label: 'Revenue', accessor: 'revenue', render: (row) => `$${row.revenue.toLocaleString()}` },
    { key: 'status', label: 'Status', accessor: 'status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  if (canWrite) {
    columns.push({
      key: 'actions', label: 'Actions', sortable: false, render: (row) => (
        <div className="flex items-center gap-1">
          {row.status === 'Draft' && (
            <button onClick={(e) => { e.stopPropagation(); handleDispatch(row.id); }}
              className="p-1.5 rounded hover:bg-blue-50 text-blue-500" title="Dispatch">
              <Play size={15} />
            </button>
          )}
          {row.status === 'Dispatched' && (
            <button onClick={(e) => { e.stopPropagation(); openComplete(row); }}
              className="p-1.5 rounded hover:bg-emerald-50 text-emerald-500" title="Complete">
              <CheckCircle size={15} />
            </button>
          )}
          {(row.status === 'Draft' || row.status === 'Dispatched') && (
            <button onClick={(e) => { e.stopPropagation(); handleCancel(row.id); }}
              className="p-1.5 rounded hover:bg-red-50 text-red-500" title="Cancel">
              <XCircle size={15} />
            </button>
          )}
        </div>
      ),
    });
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Trip Dispatcher" subtitle="Manage the full trip lifecycle">
        <div className="flex gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          {canWrite && (
            <button onClick={() => { setError(''); setShowCreateModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
              <Plus size={16} /> New Trip
            </button>
          )}
        </div>
      </PageHeader>

      <DataTable columns={columns} data={trips} searchPlaceholder="Search trips..." />

      {/* Create Trip Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Trip" size="lg">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}
        <form onSubmit={handleCreateTrip} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Vehicle (Available)</label>
              <select value={createForm.vehicle_id} onChange={(e) => setCreateForm(f => ({ ...f, vehicle_id: e.target.value }))} required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                <option value="">Select vehicle...</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.name} ({v.license_plate}) – Max: {v.max_capacity}kg</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Driver (On Duty, Valid License)</label>
              <select value={createForm.driver_id} onChange={(e) => setCreateForm(f => ({ ...f, driver_id: e.target.value }))} required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                <option value="">Select driver...</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.full_name} (Safety: {d.safety_score})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Cargo Weight (kg)</label>
              <input type="number" value={createForm.cargo_weight} onChange={(e) => setCreateForm(f => ({ ...f, cargo_weight: e.target.value }))} required min="1"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Origin</label>
              <input type="text" value={createForm.origin} onChange={(e) => setCreateForm(f => ({ ...f, origin: e.target.value }))} required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Destination</label>
              <input type="text" value={createForm.destination} onChange={(e) => setCreateForm(f => ({ ...f, destination: e.target.value }))} required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Est. Fuel Cost ($)</label>
              <input type="number" value={createForm.estimated_fuel_cost} onChange={(e) => setCreateForm(f => ({ ...f, estimated_fuel_cost: e.target.value }))} min="0"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Revenue ($)</label>
              <input type="number" value={createForm.revenue} onChange={(e) => setCreateForm(f => ({ ...f, revenue: e.target.value }))} min="0"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Scheduled Date</label>
              <input type="date" value={createForm.scheduled_date} onChange={(e) => setCreateForm(f => ({ ...f, scheduled_date: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">Create Trip</button>
          </div>
        </form>
      </Modal>

      {/* Complete Trip Modal */}
      <Modal isOpen={showCompleteModal} onClose={() => setShowCompleteModal(false)} title="Complete Trip" size="sm">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}
        <form onSubmit={handleComplete} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Actual Distance (km)</label>
            <input type="number" value={completeForm.distance} onChange={(e) => setCompleteForm(f => ({ ...f, distance: e.target.value }))} required min="1"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Final Revenue ($)</label>
            <input type="number" value={completeForm.revenue} onChange={(e) => setCompleteForm(f => ({ ...f, revenue: e.target.value }))} min="0"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setShowCompleteModal(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700">Complete Trip</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
