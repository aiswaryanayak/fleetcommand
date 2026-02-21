/**
 * Command Center – main dashboard with KPIs, filters, and fleet overview.
 */
import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import KPICard from '../components/KPICard';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Truck, AlertTriangle, Activity, Package, Users, MapPin,
  Wrench, PieChart
} from 'lucide-react';

export default function DashboardPage() {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ vehicle_type: '', status: '', region: '' });

  const fetchKPIs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.vehicle_type) params.vehicle_type = filters.vehicle_type;
      if (filters.region) params.region = filters.region;
      const res = await dashboardAPI.getKPIs(params);
      setKpis(res.data);
    } catch (err) {
      console.error('Failed to fetch KPIs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchKPIs(); }, [filters]);

  if (loading || !kpis) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Command Center"
        subtitle="Real-time fleet overview and operational intelligence"
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={filters.vehicle_type}
          onChange={(e) => setFilters(f => ({ ...f, vehicle_type: e.target.value }))}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">All Vehicle Types</option>
          <option value="Truck">Truck</option>
          <option value="Van">Van</option>
          <option value="Bike">Bike</option>
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">All Statuses</option>
          <option value="Available">Available</option>
          <option value="On Trip">On Trip</option>
          <option value="In Shop">In Shop</option>
          <option value="Retired">Retired</option>
        </select>
        <select
          value={filters.region}
          onChange={(e) => setFilters(f => ({ ...f, region: e.target.value }))}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">All Regions</option>
          <option value="North">North</option>
          <option value="South">South</option>
          <option value="East">East</option>
          <option value="West">West</option>
          <option value="Central">Central</option>
        </select>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard title="Active Fleet" value={kpis.active_fleet} subtitle="Vehicles on trip" icon={Truck} color="blue" />
        <KPICard title="Maintenance Alerts" value={kpis.maintenance_alerts} subtitle="Vehicles in shop" icon={AlertTriangle} color="amber" />
        <KPICard title="Utilization Rate" value={`${kpis.utilization_rate}%`} subtitle="Fleet capacity usage" icon={Activity} color="emerald" />
        <KPICard title="Pending Cargo" value={kpis.pending_cargo} subtitle="Draft trips" icon={Package} color="purple" />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard title="Total Fleet" value={kpis.total_vehicles} subtitle={`${kpis.available_vehicles} available`} icon={Truck} color="slate" />
        <KPICard title="Total Drivers" value={kpis.total_drivers} subtitle={`${kpis.on_duty_drivers} on duty`} icon={Users} color="indigo" />
        <KPICard title="Total Trips" value={kpis.total_trips} subtitle={`${kpis.completed_trips} completed`} icon={MapPin} color="cyan" />
        <KPICard title="Open Maintenance" value={kpis.open_maintenance} subtitle="Unresolved issues" icon={Wrench} color="red" />
      </div>

      {/* Fleet Status Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Vehicle Status Breakdown</h3>
          <div className="space-y-3">
            {[
              { label: 'Available', value: kpis.available_vehicles, total: kpis.total_vehicles, color: 'bg-emerald-500' },
              { label: 'On Trip', value: kpis.active_fleet, total: kpis.total_vehicles, color: 'bg-blue-500' },
              { label: 'In Shop', value: kpis.maintenance_alerts, total: kpis.total_vehicles, color: 'bg-amber-500' },
              { label: 'Retired', value: kpis.retired_vehicles, total: kpis.total_vehicles, color: 'bg-slate-400' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{item.label}</span>
                  <span className="font-semibold text-slate-700">{item.value}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color} transition-all duration-500`}
                    style={{ width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Driver Status Breakdown</h3>
          <div className="space-y-3">
            {[
              { label: 'On Duty', value: kpis.on_duty_drivers, total: kpis.total_drivers, color: 'bg-emerald-500' },
              { label: 'On Trip', value: kpis.on_trip_drivers, total: kpis.total_drivers, color: 'bg-blue-500' },
              { label: 'Other', value: kpis.total_drivers - kpis.on_duty_drivers - kpis.on_trip_drivers, total: kpis.total_drivers, color: 'bg-slate-400' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{item.label}</span>
                  <span className="font-semibold text-slate-700">{item.value}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color} transition-all duration-500`}
                    style={{ width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
