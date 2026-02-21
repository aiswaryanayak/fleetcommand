/**
 * Vehicle Registry – CRUD management for fleet assets.
 */
import { useState, useEffect } from 'react';
import { vehiclesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import { Plus, Edit, Trash2, Ban, Truck } from 'lucide-react';

export default function VehiclesPage() {
  const { hasRole } = useAuth();
  const canWrite = hasRole(['fleet_manager']);

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filters, setFilters] = useState({ vehicle_type: '', status: '' });
  const [form, setForm] = useState({
    name: '', model: '', license_plate: '', max_capacity: '', odometer: '0',
    vehicle_type: 'Truck', acquisition_cost: '0', region: 'Default',
  });
  const [error, setError] = useState('');

  const fetchVehicles = async () => {
    try {
      const params = {};
      if (filters.vehicle_type) params.vehicle_type = filters.vehicle_type;
      if (filters.status) params.status = filters.status;
      const res = await vehiclesAPI.list(params);
      setVehicles(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVehicles(); }, [filters]);

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: '', model: '', license_plate: '', max_capacity: '', odometer: '0', vehicle_type: 'Truck', acquisition_cost: '0', region: 'Default' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (v) => {
    setEditItem(v);
    setForm({
      name: v.name, model: v.model, license_plate: v.license_plate,
      max_capacity: String(v.max_capacity), odometer: String(v.odometer),
      vehicle_type: v.vehicle_type, acquisition_cost: String(v.acquisition_cost), region: v.region,
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const payload = {
      ...form,
      max_capacity: parseFloat(form.max_capacity),
      odometer: parseFloat(form.odometer),
      acquisition_cost: parseFloat(form.acquisition_cost),
    };
    try {
      if (editItem) {
        await vehiclesAPI.update(editItem.id, payload);
      } else {
        await vehiclesAPI.create(payload);
      }
      setShowModal(false);
      fetchVehicles();
    } catch (err) {
      setError(err.response?.data?.detail || 'Operation failed');
    }
  };

  const handleRetire = async (id) => {
    if (!confirm('Retire this vehicle? This cannot be undone.')) return;
    try {
      await vehiclesAPI.retire(id);
      fetchVehicles();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to retire');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this vehicle?')) return;
    try {
      await vehiclesAPI.delete(id);
      fetchVehicles();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete');
    }
  };

  const columns = [
    { key: 'name', label: 'Vehicle', accessor: 'name', render: (row) => (
      <div>
        <p className="font-medium text-slate-800">{row.name}</p>
        <p className="text-xs text-slate-400">{row.model}</p>
      </div>
    )},
    { key: 'license_plate', label: 'License', accessor: 'license_plate', render: (row) => (
      <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{row.license_plate}</span>
    )},
    { key: 'vehicle_type', label: 'Type', accessor: 'vehicle_type' },
    { key: 'max_capacity', label: 'Capacity (kg)', accessor: 'max_capacity', render: (row) => row.max_capacity.toLocaleString() },
    { key: 'odometer', label: 'Odometer (km)', accessor: 'odometer', render: (row) => row.odometer.toLocaleString() },
    { key: 'status', label: 'Status', accessor: 'status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'region', label: 'Region', accessor: 'region' },
    { key: 'roi', label: 'ROI', accessor: 'roi', render: (row) => (
      <span className={`font-semibold text-xs ${row.roi >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
        {(row.roi * 100).toFixed(1)}%
      </span>
    )},
  ];

  if (canWrite) {
    columns.push({
      key: 'actions', label: 'Actions', sortable: false, render: (row) => (
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); openEdit(row); }} className="p-1.5 rounded hover:bg-blue-50 text-blue-500" title="Edit">
            <Edit size={15} />
          </button>
          {row.status !== 'Retired' && (
            <button onClick={(e) => { e.stopPropagation(); handleRetire(row.id); }} className="p-1.5 rounded hover:bg-amber-50 text-amber-500" title="Retire">
              <Ban size={15} />
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }} className="p-1.5 rounded hover:bg-red-50 text-red-500" title="Delete">
            <Trash2 size={15} />
          </button>
        </div>
      ),
    });
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Vehicle Registry" subtitle="Manage fleet assets and lifecycle">
        <div className="flex gap-2">
          <select value={filters.vehicle_type} onChange={(e) => setFilters(f => ({ ...f, vehicle_type: e.target.value }))}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
            <option value="">All Types</option>
            <option value="Truck">Truck</option>
            <option value="Van">Van</option>
            <option value="Bike">Bike</option>
          </select>
          <select value={filters.status} onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="On Trip">On Trip</option>
            <option value="In Shop">In Shop</option>
            <option value="Retired">Retired</option>
          </select>
          {canWrite && (
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
              <Plus size={16} /> Add Vehicle
            </button>
          )}
        </div>
      </PageHeader>

      <DataTable columns={columns} data={vehicles} searchPlaceholder="Search vehicles..." />

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Vehicle' : 'Add Vehicle'}>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Model</label>
              <input type="text" value={form.model} onChange={(e) => setForm(f => ({ ...f, model: e.target.value }))} required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
          </div>
          {!editItem && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">License Plate</label>
              <input type="text" value={form.license_plate} onChange={(e) => setForm(f => ({ ...f, license_plate: e.target.value }))} required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Type</label>
              <select value={form.vehicle_type} onChange={(e) => setForm(f => ({ ...f, vehicle_type: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                <option value="Truck">Truck</option>
                <option value="Van">Van</option>
                <option value="Bike">Bike</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Max Capacity (kg)</label>
              <input type="number" value={form.max_capacity} onChange={(e) => setForm(f => ({ ...f, max_capacity: e.target.value }))} required min="1"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Odometer (km)</label>
              <input type="number" value={form.odometer} onChange={(e) => setForm(f => ({ ...f, odometer: e.target.value }))} min="0"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Acquisition Cost ($)</label>
              <input type="number" value={form.acquisition_cost} onChange={(e) => setForm(f => ({ ...f, acquisition_cost: e.target.value }))} min="0"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Region</label>
              <input type="text" value={form.region} onChange={(e) => setForm(f => ({ ...f, region: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setShowModal(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">{editItem ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
