import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Truck, MapPin, Wrench, DollarSign, Users, BarChart3,
  LogOut, Shield, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  {
    path: '/dashboard',
    label: 'Command Center',
    icon: LayoutDashboard,
    roles: ['fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst'],
  },
  {
    path: '/vehicles',
    label: 'Vehicle Registry',
    icon: Truck,
    roles: ['fleet_manager', 'dispatcher', 'financial_analyst'],
  },
  {
    path: '/trips',
    label: 'Trip Dispatcher',
    icon: MapPin,
    roles: ['fleet_manager', 'dispatcher', 'financial_analyst'],
  },
  {
    path: '/maintenance',
    label: 'Maintenance Logs',
    icon: Wrench,
    roles: ['fleet_manager', 'financial_analyst'],
  },
  {
    path: '/finance',
    label: 'Expenses & Fuel',
    icon: DollarSign,
    roles: ['fleet_manager', 'dispatcher', 'financial_analyst'],
  },
  {
    path: '/drivers',
    label: 'Driver Safety',
    icon: Users,
    roles: ['fleet_manager', 'dispatcher', 'safety_officer'],
  },
  {
    path: '/analytics',
    label: 'Analytics',
    icon: BarChart3,
    roles: ['fleet_manager', 'financial_analyst'],
  },
];

const ROLE_LABELS = {
  fleet_manager: 'Fleet Manager',
  dispatcher: 'Dispatcher',
  safety_officer: 'Safety Officer',
  financial_analyst: 'Financial Analyst',
};

const ROLE_COLORS = {
  fleet_manager: 'bg-blue-500',
  dispatcher: 'bg-emerald-500',
  safety_officer: 'bg-amber-500',
  financial_analyst: 'bg-purple-500',
};

export default function Sidebar() {
  const { user, logout, hasRole } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const filteredItems = NAV_ITEMS.filter(item => hasRole(item.roles));

  return (
    <aside className={`${collapsed ? 'w-20' : 'w-64'} bg-slate-900 text-white flex flex-col transition-all duration-300 min-h-screen`}>
      {/* Logo */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        {!collapsed && (
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-400" />
              FleetCommand
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">ERP System v1.0</p>
          </div>
        )}
        {collapsed && <Shield className="w-6 h-6 text-blue-400 mx-auto" />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-slate-700 text-slate-400"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* User info */}
      {!collapsed && user && (
        <div className="p-4 border-b border-slate-700">
          <p className="text-sm font-medium truncate">{user.full_name}</p>
          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider text-white ${ROLE_COLORS[user.role]}`}>
            {ROLE_LABELS[user.role]}
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-sm font-medium transition-all
              ${isActive
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon size={20} className="flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-red-600/20 hover:text-red-400 transition-all"
        >
          <LogOut size={20} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
