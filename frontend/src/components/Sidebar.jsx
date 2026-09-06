import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Car, 
  UserCheck, 
  Camera, 
  DollarSign, 
  FileText, 
  LogOut 
} from 'lucide-react';

const Sidebar = () => {
  const { logout, user } = useAuth();

  const links = [
    { to: '/', name: 'Dashboard', icon: LayoutDashboard },
    { to: '/sessions', name: 'Active Cars', icon: Car },
    { to: '/subscribers', name: 'Subscribers', icon: UserCheck },
    { to: '/tariffs', name: 'Tariff Settings', icon: DollarSign },
    { to: '/devices', name: 'Devices', icon: Camera },
    { to: '/logs', name: 'Logs', icon: FileText },
  ];

  return (
    <aside className="w-64 bg-white border-r border-surface-gray flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-surface-gray">
        <h1 className="font-extrabold text-ranch-red tracking-tight text-xl">SmartPark</h1>
        <p className="text-[10px] text-muted-slate font-bold uppercase tracking-wider leading-none mt-1">Management Hub</p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isActive 
                  ? 'bg-ranch-red text-white shadow-sm' 
                  : 'text-muted-slate hover:bg-academic-bg hover:text-charcoal'
              }`
            }
          >
            <link.icon className="w-5 h-5 shrink-0" />
            <span>{link.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Session Footer */}
      <div className="p-4 border-t border-surface-gray bg-academic-bg/50">
        <div className="flex items-center justify-between gap-2">
          <div className="truncate">
            <p className="text-xs font-semibold text-charcoal truncate">{user?.name || 'Administrator'}</p>
            <p className="text-[10px] text-muted-slate truncate uppercase">{user?.role || 'ADMIN'}</p>
          </div>
          <button 
            onClick={logout}
            className="p-2 text-muted-slate hover:text-ranch-red rounded-lg hover:bg-ranch-red/10 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
