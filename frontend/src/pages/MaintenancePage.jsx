/**
 * Maintenance & Service Logs page.
 * Creating a log auto-sets vehicle to "In Shop".
 */
import { useState, useEffect } from 'react';
import { maintenanceAPI, vehiclesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function MaintenancePage() {
  const { hasRole } = useAuth();
  const canWrite = hasRole(['fleet_manager']);

  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    vehicle_id: '', issue: '', description: '', date: '', cost: '0',
  });
  const [editForm, setEditForm] = useState({
    issue: '', description: '', cost: '', status: '',
  });

  const fetchData = async () => {
    try {
      const [logsRes, vehiclesRes] = await Promise.all([
        maintenanceAPI.list(),
        vehiclesAPI.list().catch(() => ({ data: [] })),
      ]);
      setLogs(logsRes.data);
      setVehicles(vehiclesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await maintenanceAPI.create({
        ...form,
        vehicle_id: parseInt(form.vehicle_id),
        cost: parseFloat(form.cost || 0),
      });
      setShowModal(false);
      setForm({ vehicle_id: '', issue: '', description: '', date: '', cost: '0' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create log');
    }
  };

  const openEdit = (log) => {
    setEditItem(log);
    setEditForm({ issue: log.issue, description: log.description || '', cost: String(log.cost), status: log.status });
    setError('');
    setShowModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await maintenanceAPI.update(editItem.id, {
        ...editForm,
        cost: parseFloat(editForm.cost),
      });
      setShowModal(false);
      setEditItem(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this maintenance log?')) return;
    try {
      await maintenanceAPI.delete(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete');
    }
  };

  const columns = [
    { key: 'id', label: 'Log #', accessor: 'id', render: (row) => <span className="font-mono text-xs font-semibold">#{row.id}</span> },
    { key: 'vehicle', label: 'Vehicle', accessor: 'vehicle_name' },
    { key: 'issue', label: 'Issue', accessor: 'issue', render: (row) => (
      <div>
        <p className="font-medium text-slate-700">{row.issue}</p>
        {row.description && <p className="text-xs text-slate-400 truncate max-w-[200px]">{row.description}</p>}
      </div>
    )},
    { key: 'date', label: 'Date', accessor: 'date' },
    { key: 'cost', label: 'Cost', accessor: 'cost', render: (row) => <span className="font-semibold text-red-600">${row.cost.toLocaleString()}</span> },
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
      <PageHeader title="Maintenance & Service Logs" subtitle="Track vehicle service events and costs">
        {canWrite && (
          <button onClick={() => { setEditItem(null); setError(''); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
            <Plus size={16} /> New Log
          </button>
        )}
      </PageHeader>

      <DataTable columns={columns} data={logs} searchPlaceholder="Search maintenance logs..." />

      {/* Create / Edit Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditItem(null); }} title={editItem ? 'Edit Maintenance Log' : 'Create Maintenance Log'}>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}

        {!editItem ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Vehicle</label>
              <select value={form.vehicle_id} onChange={(e) => setForm(f => ({ ...f, vehicle_id: e.target.value }))} required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                <option value="">Select vehicle...</option>
                {vehicles.filter(v => v.status !== 'On Trip' && v.status !== 'Retired').map(v => (
                  <option key={v.id} value={v.id}>{v.name} ({v.license_plate})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Issue</label>
              <input type="text" value={form.issue} onChange={(e) => setForm(f => ({ ...f, issue: e.target.value }))} required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows="2"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Cost ($)</label>
                <input type="number" value={form.cost} onChange={(e) => setForm(f => ({ ...f, cost: e.target.value }))} min="0"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
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
              <label className="block text-sm font-medium text-slate-600 mb-1">Issue</label>
              <input type="text" value={editForm.issue} onChange={(e) => setEditForm(f => ({ ...f, issue: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Description</label>
              <textarea value={editForm.description} onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))} rows="2"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Cost ($)</label>
                <input type="number" value={editForm.cost} onChange={(e) => setEditForm(f => ({ ...f, cost: e.target.value }))} min="0"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Status</label>
                <select value={editForm.status} onChange={(e) => setEditForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
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
