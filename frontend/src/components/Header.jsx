import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, User } from 'lucide-react';

const Header = () => {
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
      case '/sessions':
        return 'SmartPark Control Hub';
      case '/subscribers':
        return 'Subscribers Management';
      case '/devices':
        return 'Devices Configuration';
      case '/tariffs':
        return 'Tariff Settings';
      case '/logs':
        return 'System Logs';
      default:
        return 'SmartPark Control Hub';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-surface-gray px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold text-charcoal">{getPageTitle()}</h2>
        
        {/* System Online Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-status-pulse"></span>
          <span>System Online</span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-muted-slate">
        {/* Notification Bell */}
        <button className="p-2 hover:bg-academic-bg hover:text-charcoal rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        {/* User profile */}
        <button className="p-2 hover:bg-academic-bg hover:text-charcoal rounded-lg transition-colors">
          <User className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;
