/**
 * Analytics & Reports — Operational analytics with charts and one-click exports.
 * Accessible to: Fleet Manager, Financial Analyst
 */
import { useState, useEffect, useRef } from 'react';
import { financeAPI, vehiclesAPI } from '../services/api';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Download, FileText, TrendingUp, DollarSign, Truck, AlertCircle, BarChart3 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';

const PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

function KPI({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}><Icon size={22} className="text-white" /></div>
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-slate-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [topExpensive, setTopExpensive] = useState([]);
  const [idleVehicles, setIdleVehicles] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [sumRes, monRes, topRes, idleRes, vehRes] = await Promise.all([
          financeAPI.summary(),
          financeAPI.monthly(),
          financeAPI.topExpensive(),
          financeAPI.idleVehicles(),
          vehiclesAPI.list(),
        ]);
        setSummary(sumRes.data);
        setMonthly(monRes.data);
        setTopExpensive(topRes.data);
        setIdleVehicles(idleRes.data);
        setVehicles(vehRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ─── Export helpers ─── */
  const exportCSV = (data, filename) => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${filename}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = (title, columns, rows, filename) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    autoTable(doc, { head: [columns], body: rows, startY: 34, styles: { fontSize: 8 } });
    doc.save(`${filename}.pdf`);
  };

  const handleExportFinancialCSV = () => {
    if (!monthly.length) return;
    exportCSV(monthly, 'fleet_monthly_finance');
  };

  const handleExportFinancialPDF = () => {
    if (!monthly.length) return;
    exportPDF(
      'Fleet Monthly Financial Report',
      ['Month', 'Fuel Cost', 'Maintenance Cost', 'Total Expenses', 'Revenue', 'Profit'],
      monthly.map(m => [m.month, m.fuel_cost, m.maintenance_cost, m.total_expenses, m.revenue, m.profit]),
      'fleet_monthly_finance',
    );
  };

  const handleExportVehicleCSV = () => {
    if (!vehicles.length) return;
    exportCSV(vehicles.map(v => ({
      license_plate: v.license_plate, make: v.make, model: v.model, type: v.type,
      status: v.status, fuel_cost: v.fuel_cost, maintenance_cost: v.maintenance_cost,
      revenue: v.revenue, roi: v.roi,
    })), 'fleet_vehicles_report');
  };

  const handleExportVehiclePDF = () => {
    if (!vehicles.length) return;
    exportPDF(
      'Fleet Vehicle Performance Report',
      ['Plate', 'Make', 'Model', 'Type', 'Status', 'Fuel $', 'Maint $', 'Revenue', 'ROI'],
      vehicles.map(v => [v.license_plate, v.make, v.model, v.type, v.status,
        v.fuel_cost?.toFixed(0), v.maintenance_cost?.toFixed(0), v.revenue?.toFixed(0), v.roi?.toFixed(1) + '%']),
      'fleet_vehicles_report',
    );
  };

  /* ─── Derived datasets ─── */
  const vehicleTypeData = vehicles.reduce((acc, v) => {
    const idx = acc.findIndex(a => a.name === v.type);
    if (idx >= 0) acc[idx].count++;
    else acc.push({ name: v.type, count: 1 });
    return acc;
  }, []);

  const vehicleStatusData = vehicles.reduce((acc, v) => {
    const idx = acc.findIndex(a => a.name === v.status);
    if (idx >= 0) acc[idx].count++;
    else acc.push({ name: v.status, count: 1 });
    return acc;
  }, []);

  const profitData = monthly.map(m => ({ month: m.month, Revenue: m.revenue, Cost: m.total_expenses, Profit: m.profit }));
  const fuelTrend = monthly.map(m => ({ month: m.month, fuel: m.fuel_cost }));

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Analytics & Reports" subtitle="Operational analytics, fleet ROI, and one-click exports">
        <div className="flex gap-2">
          <button onClick={handleExportFinancialCSV}
            className="flex items-center gap-2 px-3 py-2 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100">
            <Download size={15} /> Financial CSV
          </button>
          <button onClick={handleExportFinancialPDF}
            className="flex items-center gap-2 px-3 py-2 border border-red-200 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100">
            <FileText size={15} /> Financial PDF
          </button>
          <button onClick={handleExportVehicleCSV}
            className="flex items-center gap-2 px-3 py-2 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100">
            <Download size={15} /> Vehicle CSV
          </button>
          <button onClick={handleExportVehiclePDF}
            className="flex items-center gap-2 px-3 py-2 border border-purple-200 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100">
            <FileText size={15} /> Vehicle PDF
          </button>
        </div>
      </PageHeader>

      {/* KPI Row */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI icon={DollarSign} label="Total Fuel Cost" value={`$${summary.total_fuel_cost?.toLocaleString() ?? 0}`} color="bg-blue-500" />
          <KPI icon={TrendingUp} label="Total Revenue" value={`$${summary.total_revenue?.toLocaleString() ?? 0}`} color="bg-emerald-500" />
          <KPI icon={Truck} label="Fleet Size" value={vehicles.length} color="bg-purple-500" />
          <KPI icon={AlertCircle} label="Idle Vehicles" value={idleVehicles.length} color="bg-amber-500" />
        </div>
      )}

      {/* Charts Row 1: Revenue vs Cost, Fuel Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2"><BarChart3 size={16} /> Monthly Revenue vs Cost vs Profit</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={profitData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Cost" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Profit" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2"><TrendingUp size={16} /> Fuel Cost Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={fuelTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="fuel" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2: Fleet Composition, Fleet Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Fleet Composition by Type</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={vehicleTypeData} dataKey="count" nameKey="name" cx="50%" cy="50%"
                outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {vehicleTypeData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Fleet Status Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={vehicleStatusData} dataKey="count" nameKey="name" cx="50%" cy="50%"
                outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {vehicleStatusData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top 5 Expensive Vehicles & Idle Vehicles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Top 5 Most Expensive Vehicles</h3>
          {topExpensive.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topExpensive} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="license_plate" width={90} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total_cost" fill="#ef4444" radius={[0, 4, 4, 0]} name="Total Cost" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400 text-center py-10">No data available</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <AlertCircle size={16} className="text-amber-500" /> Dead Stock — Idle Vehicles (30+ days)
          </h3>
          {idleVehicles.length ? (
            <div className="divide-y divide-slate-100">
              {idleVehicles.map((v) => (
                <div key={v.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-slate-800">{v.license_plate}</p>
                    <p className="text-xs text-slate-400">{v.make} {v.model} &middot; {v.type}</p>
                  </div>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
                    {v.days_idle ?? '30+'} days idle
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-emerald-600 text-center py-10">All vehicles active — no dead stock!</p>
          )}
        </div>
      </div>
    </div>
  );
}
