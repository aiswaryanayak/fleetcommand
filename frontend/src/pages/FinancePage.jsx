/**
 * Expense & Fuel Logging page – record and view financial transactions.
 */
import { useState, useEffect } from 'react';
import { financeAPI, vehiclesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import KPICard from '../components/KPICard';
import { Plus, Fuel, Receipt, Trash2, DollarSign, TrendingUp } from 'lucide-react';

export default function FinancePage() {
  const { hasRole } = useAuth();
  const canWrite = hasRole(['financial_analyst']);

  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('fuel');
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [error, setError] = useState('');

  const [fuelForm, setFuelForm] = useState({ vehicle_id: '', date: '', liters: '', cost: '', odometer_reading: '0' });
  const [expenseForm, setExpenseForm] = useState({ vehicle_id: '', category: '', description: '', amount: '', date: '' });

  const fetchData = async () => {
    try {
      const [fuelRes, expRes, vehRes, sumRes] = await Promise.all([
        financeAPI.fuelLogs(),
        financeAPI.expenses(),
        vehiclesAPI.list().catch(() => ({ data: [] })),
        financeAPI.summary().catch(() => ({ data: {} })),
      ]);
      setFuelLogs(fuelRes.data);
      setExpenses(expRes.data);
      setVehicles(vehRes.data);
      setSummary(sumRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateFuel = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await financeAPI.createFuelLog({
        vehicle_id: parseInt(fuelForm.vehicle_id),
        date: fuelForm.date,
        liters: parseFloat(fuelForm.liters),
        cost: parseFloat(fuelForm.cost),
        odometer_reading: parseFloat(fuelForm.odometer_reading || 0),
      });
      setShowFuelModal(false);
      setFuelForm({ vehicle_id: '', date: '', liters: '', cost: '', odometer_reading: '0' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create fuel log');
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await financeAPI.createExpense({
        vehicle_id: parseInt(expenseForm.vehicle_id),
        category: expenseForm.category,
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount),
        date: expenseForm.date,
      });
      setShowExpenseModal(false);
      setExpenseForm({ vehicle_id: '', category: '', description: '', amount: '', date: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create expense');
    }
  };

  const fuelColumns = [
    { key: 'id', label: '#', accessor: 'id' },
    { key: 'vehicle', label: 'Vehicle', accessor: 'vehicle_name' },
    { key: 'date', label: 'Date', accessor: 'date' },
    { key: 'liters', label: 'Liters', accessor: 'liters', render: (row) => `${row.liters} L` },
    { key: 'cost', label: 'Cost', accessor: 'cost', render: (row) => <span className="font-semibold text-red-600">${row.cost.toLocaleString()}</span> },
    { key: 'odometer', label: 'Odometer', accessor: 'odometer_reading', render: (row) => `${row.odometer_reading.toLocaleString()} km` },
  ];

  if (canWrite) {
    fuelColumns.push({
      key: 'actions', label: '', sortable: false, render: (row) => (
        <button onClick={() => { financeAPI.deleteFuelLog(row.id).then(fetchData); }} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 size={15} /></button>
      ),
    });
  }

  const expenseColumns = [
    { key: 'id', label: '#', accessor: 'id' },
    { key: 'vehicle', label: 'Vehicle', accessor: 'vehicle_name' },
    { key: 'category', label: 'Category', accessor: 'category', render: (row) => (
      <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">{row.category}</span>
    )},
    { key: 'description', label: 'Description', accessor: 'description' },
    { key: 'amount', label: 'Amount', accessor: 'amount', render: (row) => <span className="font-semibold text-red-600">${row.amount.toLocaleString()}</span> },
    { key: 'date', label: 'Date', accessor: 'date' },
  ];

  if (canWrite) {
    expenseColumns.push({
      key: 'actions', label: '', sortable: false, render: (row) => (
        <button onClick={() => { financeAPI.deleteExpense(row.id).then(fetchData); }} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 size={15} /></button>
      ),
    });
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Expenses & Fuel Logging" subtitle="Track fuel consumption and operational expenses">
        {canWrite && (
          <div className="flex gap-2">
            <button onClick={() => { setError(''); setShowFuelModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700">
              <Fuel size={16} /> Log Fuel
            </button>
            <button onClick={() => { setError(''); setShowExpenseModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
              <Receipt size={16} /> Add Expense
            </button>
          </div>
        )}
      </PageHeader>

      {/* Summary KPIs */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard title="Total Fuel Cost" value={`$${summary.total_fuel_cost?.toLocaleString() || 0}`} icon={Fuel} color="amber" />
          <KPICard title="Total Expenses" value={`$${summary.total_expenses?.toLocaleString() || 0}`} icon={Receipt} color="red" />
          <KPICard title="Total Revenue" value={`$${summary.total_revenue?.toLocaleString() || 0}`} icon={DollarSign} color="emerald" />
          <KPICard title="Fuel Efficiency" value={`${summary.fuel_efficiency_km_per_liter || 0} km/L`} icon={TrendingUp} color="blue" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-lg w-fit">
        <button onClick={() => setActiveTab('fuel')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'fuel' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
          Fuel Logs ({fuelLogs.length})
        </button>
        <button onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'expenses' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
          Expenses ({expenses.length})
        </button>
      </div>

      {activeTab === 'fuel' ? (
        <DataTable columns={fuelColumns} data={fuelLogs} searchPlaceholder="Search fuel logs..." />
      ) : (
        <DataTable columns={expenseColumns} data={expenses} searchPlaceholder="Search expenses..." />
      )}

      {/* Fuel Log Modal */}
      <Modal isOpen={showFuelModal} onClose={() => setShowFuelModal(false)} title="Record Fuel Log">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}
        <form onSubmit={handleCreateFuel} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Vehicle</label>
            <select value={fuelForm.vehicle_id} onChange={(e) => setFuelForm(f => ({ ...f, vehicle_id: e.target.value }))} required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
              <option value="">Select vehicle...</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.license_plate})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Liters</label>
              <input type="number" value={fuelForm.liters} onChange={(e) => setFuelForm(f => ({ ...f, liters: e.target.value }))} required min="0.1" step="0.1"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Cost ($)</label>
              <input type="number" value={fuelForm.cost} onChange={(e) => setFuelForm(f => ({ ...f, cost: e.target.value }))} required min="0.01" step="0.01"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Date</label>
              <input type="date" value={fuelForm.date} onChange={(e) => setFuelForm(f => ({ ...f, date: e.target.value }))} required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Odometer Reading</label>
              <input type="number" value={fuelForm.odometer_reading} onChange={(e) => setFuelForm(f => ({ ...f, odometer_reading: e.target.value }))} min="0"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setShowFuelModal(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700">Save</button>
          </div>
        </form>
      </Modal>

      {/* Expense Modal */}
      <Modal isOpen={showExpenseModal} onClose={() => setShowExpenseModal(false)} title="Add Expense">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Vehicle</label>
            <select value={expenseForm.vehicle_id} onChange={(e) => setExpenseForm(f => ({ ...f, vehicle_id: e.target.value }))} required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
              <option value="">Select vehicle...</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.license_plate})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Category</label>
              <select value={expenseForm.category} onChange={(e) => setExpenseForm(f => ({ ...f, category: e.target.value }))} required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                <option value="">Select...</option>
                <option value="Tolls">Tolls</option>
                <option value="Parking">Parking</option>
                <option value="Insurance">Insurance</option>
                <option value="Registration">Registration</option>
                <option value="Fines">Fines</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Amount ($)</label>
              <input type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm(f => ({ ...f, amount: e.target.value }))} required min="0.01" step="0.01"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Description</label>
            <input type="text" value={expenseForm.description} onChange={(e) => setExpenseForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Date</label>
            <input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm(f => ({ ...f, date: e.target.value }))} required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setShowExpenseModal(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
