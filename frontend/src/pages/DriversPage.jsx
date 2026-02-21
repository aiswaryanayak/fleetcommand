/**
 * Driver Performance & Safety page.
 * Safety Officer: full CRUD
 * Fleet Manager, Dispatcher: read-only
 */
import { useState, useEffect } from 'react';
import { driversAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import { Plus, Edit, Trash2, AlertTriangle, Shield } from 'lucide-react';

export default function DriversPage() {
  const { hasRole } = useAuth();
  const canWrite = hasRole(['safety_officer']);

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    full_name: '', license_number: '', license_expiry: '', phone: '', status: 'On Duty',
  });
  const [editForm, setEditForm] = useState({
    full_name: '', license_expiry: '', phone: '', safety_score: '', complaints: '', status: '',
  });

  const fetchDrivers = async () => {
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await driversAPI.list(params);
      setDrivers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDrivers(); }, [statusFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await driversAPI.create(form);
      setShowModal(false);
      setForm({ full_name: '', license_number: '', license_expiry: '', phone: '', status: 'On Duty' });
      fetchDrivers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create driver');
    }
  };

  const openEdit = (d) => {
    setEditItem(d);
    setEditForm({
      full_name: d.full_name, license_expiry: d.license_expiry, phone: d.phone || '',
      safety_score: String(d.safety_score), complaints: String(d.complaints), status: d.status,
    });
    setError('');
    setShowModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await driversAPI.update(editItem.id, {
        ...editForm,
        safety_score: parseFloat(editForm.safety_score),
        complaints: parseInt(editForm.complaints),
      });
      setShowModal(false);
      setEditItem(null);
      fetchDrivers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this driver?')) return;
    try {
      await driversAPI.delete(id);
      fetchDrivers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete');
    }
  };

  const columns = [
    { key: 'full_name', label: 'Driver', accessor: 'full_name', render: (row) => (
      <div className="flex items-center gap-2">
        <div>
          <p className="font-medium text-slate-800">{row.full_name}</p>
          <p className="text-xs text-slate-400">{row.phone || 'No phone'}</p>
        </div>
      </div>
    )},
    { key: 'license_number', label: 'License #', accessor: 'license_number', render: (row) => (
      <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{row.license_number}</span>
    )},
    { key: 'license_expiry', label: 'License Expiry', accessor: 'license_expiry', render: (row) => (
      <div className="flex items-center gap-1">
        <span className={row.license_expired ? 'text-red-600 font-semibold' : 'text-slate-700'}>{row.license_expiry}</span>
        {row.license_expired && <AlertTriangle size={14} className="text-red-500" />}
      </div>
    )},
    { key: 'safety_score', label: 'Safety Score', accessor: 'safety_score', render: (row) => {
      const color = row.safety_score >= 80 ? 'text-emerald-600 bg-emerald-50' : row.safety_score >= 60 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50';
      return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${color}`}><Shield size={12} /> {row.safety_score}</span>;
    }},
    { key: 'completion_rate', label: 'Completion', accessor: 'completion_rate', render: (row) => (
      <div>
        <span className="text-sm font-semibold text-slate-700">{row.completion_rate}%</span>
        <span className="text-xs text-slate-400 ml-1">({row.completed_trips}/{row.total_trips})</span>
      </div>
    )},
    { key: 'complaints', label: 'Complaints', accessor: 'complaints', render: (row) => (
      <span className={`font-semibold ${row.complaints > 2 ? 'text-red-600' : 'text-slate-600'}`}>{row.complaints}</span>
    )},
    { key: 'status', label: 'Status', accessor: 'status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  if (canWrite) {
    columns.push({
      key: 'actions', label: 'Actions', sortable: false, render: (row) => (
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); openEdit(row); }} className="p-1.5 rounded hover:bg-blue-50 text-blue-500"><Edit size={15} /></button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 size={15} /></button>
        </div>
      ),
    });
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Driver Performance & Safety" subtitle="Monitor driver safety scores, licenses, and duty status">
        <div className="flex gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
            <option value="">All Statuses</option>
            <option value="On Duty">On Duty</option>
            <option value="Off Duty">Off Duty</option>
            <option value="On Trip">On Trip</option>
            <option value="Suspended">Suspended</option>
          </select>
          {canWrite && (
            <button onClick={() => { setEditItem(null); setError(''); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
              <Plus size={16} /> Add Driver
            </button>
          )}
        </div>
      </PageHeader>

      <DataTable columns={columns} data={drivers} searchPlaceholder="Search drivers..." />

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditItem(null); }} title={editItem ? 'Edit Driver' : 'Add Driver'}>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}

        {!editItem ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Full Name</label>
              <input type="text" value={form.full_name} onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))} required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">License Number</label>
                <input type="text" value={form.license_number} onChange={(e) => setForm(f => ({ ...f, license_number: e.target.value }))} required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">License Expiry</label>
                <input type="date" value={form.license_expiry} onChange={(e) => setForm(f => ({ ...f, license_expiry: e.target.value }))} required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Phone</label>
                <input type="text" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Initial Status</label>
                <select value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                  <option value="On Duty">On Duty</option>
                  <option value="Off Duty">Off Duty</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">Create</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Full Name</label>
              <input type="text" value={editForm.full_name} onChange={(e) => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">License Expiry</label>
                <input type="date" value={editForm.license_expiry} onChange={(e) => setEditForm(f => ({ ...f, license_expiry: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Phone</label>
                <input type="text" value={editForm.phone} onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Safety Score</label>
                <input type="number" value={editForm.safety_score} onChange={(e) => setEditForm(f => ({ ...f, safety_score: e.target.value }))} min="0" max="100"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Complaints</label>
                <input type="number" value={editForm.complaints} onChange={(e) => setEditForm(f => ({ ...f, complaints: e.target.value }))} min="0"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Status</label>
                <select value={editForm.status} onChange={(e) => setEditForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                  <option value="On Duty">On Duty</option>
                  <option value="Off Duty">Off Duty</option>
                  <option value="On Trip">On Trip</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => { setShowModal(false); setEditItem(null); }} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">Update</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
