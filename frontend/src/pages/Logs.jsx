import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, 
  Search, 
  Filter, 
  LogIn, 
  LogOut, 
  ShieldAlert, 
  Unlock, 
  RefreshCw 
} from 'lucide-react';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const fetchLogs = async () => {
    try {
      const response = await axios.get('/api/logs');
      setLogs(response.data);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getFilteredLogs = () => {
    return logs.filter((log) => {
      // Filter by type
      const matchesType = filterType === 'ALL' || log.type === filterType;
      
      // Filter by search query (plate number)
      const matchesSearch = 
        !search || 
        (log.car?.plateNumber && log.car.plateNumber.toLowerCase().includes(search.toLowerCase())) ||
        (log.description && log.description.toLowerCase().includes(search.toLowerCase()));

      return matchesType && matchesSearch;
    });
  };

  const getLogTypeBadge = (type) => {
    const baseClass = "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider";
    switch (type) {
      case 'ENTRY':
        return (
          <span className={`${baseClass} bg-emerald-500/10 text-emerald-600`}>
            <LogIn className="w-3 h-3" />
            Kirish
          </span>
        );
      case 'EXIT':
        return (
          <span className={`${baseClass} bg-blue-500/10 text-blue-600`}>
            <LogOut className="w-3 h-3" />
            Chiqish
          </span>
        );
      case 'BLACKLIST_ATTEMPT':
        return (
          <span className={`${baseClass} bg-red-500/10 text-red-650 animate-pulse`}>
            <ShieldAlert className="w-3 h-3" />
            Taqiq
          </span>
        );
      case 'BARRIER_OPEN':
        return (
          <span className={`${baseClass} bg-yellow-500/10 text-yellow-650`}>
            <Unlock className="w-3 h-3" />
            Qo'lda ochish
          </span>
        );
      default:
        return (
          <span className={`${baseClass} bg-surface-gray text-muted-slate`}>
            <FileText className="w-3 h-3" />
            {type}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-academic-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-3 border-ranch-red border-t-transparent"></div>
      </div>
    );
  }

  const filteredLogs = getFilteredLogs();

  return (
    <div className="flex-1 p-8 bg-academic-bg space-y-8 overflow-y-auto max-h-[calc(100vh-4rem)]">
      
      {/* Control Actions & Filters */}
      <div className="bg-white p-6 rounded-xl border border-surface-gray flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-slate">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Avtomobil raqami bo'yicha qidiruv..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-surface-gray text-sm focus:outline-none focus:border-ranch-red focus:ring-2 focus:ring-ranch-red/20 transition-all font-semibold"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-muted-slate hidden sm:inline" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-surface-gray text-sm focus:outline-none focus:border-ranch-red focus:ring-2 focus:ring-ranch-red/20 transition-all font-semibold"
          >
            <option value="ALL">Barcha hodisalar</option>
            <option value="ENTRY">Kirish loglari</option>
            <option value="EXIT">Chiqish loglari</option>
            <option value="BLACKLIST_ATTEMPT">Taqiq loglari</option>
            <option value="BARRIER_OPEN">Qo'lda ochishlar</option>
          </select>

          <button
            onClick={fetchLogs}
            className="p-2.5 border border-surface-gray hover:bg-academic-bg rounded-lg text-muted-slate hover:text-charcoal transition-all"
            title="Yangilash"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-surface-gray overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-academic-bg/40 border-b border-surface-gray text-[10px] font-bold text-muted-slate uppercase tracking-wider">
                <th className="py-3.5 px-6">Vaqti</th>
                <th className="py-3.5 px-6">Turi</th>
                <th className="py-3.5 px-6">Avtomobil raqami</th>
                <th className="py-3.5 px-6">Tavsif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-gray text-sm font-medium font-mono">
              {filteredLogs.length === 0 ? (
                <tr className="font-sans">
                  <td colSpan="4" className="py-8 text-center text-muted-slate text-xs font-semibold">
                    Hech qanday tizim loglari topilmadi
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-academic-bg/30 transition-colors">
                    <td className="py-3.5 px-6 text-xs text-charcoal">
                      {new Date(log.createdAt).toLocaleDateString('uz-UZ', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric' 
                      })}{' '}
                      {new Date(log.createdAt).toLocaleTimeString('uz-UZ', { 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        second: '2-digit', 
                        hour12: false 
                      })}
                    </td>
                    <td className="py-3.5 px-6 font-sans">
                      {getLogTypeBadge(log.type)}
                    </td>
                    <td className="py-3.5 px-6 font-bold text-charcoal tracking-wide">
                      {log.car?.plateNumber || 'Tizim'}
                    </td>
                    <td className="py-3.5 px-6 text-xs text-muted-slate font-sans font-medium">
                      {log.description || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Logs;
