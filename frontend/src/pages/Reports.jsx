import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Banknote, Car, ArrowRightCircle, ArrowLeftCircle } from 'lucide-react';

const Reports = () => {
  const [revenueData, setRevenueData] = useState([]);
  const [trafficData, setTrafficData] = useState([]);
  const [historyData, setHistoryData] = useState([]);

  useEffect(() => {
    axios.get('/api/reports/revenue').then(res => setRevenueData(res.data));
    axios.get('/api/reports/traffic').then(res => setTrafficData(res.data));
    axios.get('/api/reports/history').then(res => setHistoryData(res.data));
  }, []);

  const totalRevenue = revenueData.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
  const totalEntries = trafficData.reduce((acc, curr) => acc + (curr.entries || 0), 0);
  const totalExits = trafficData.reduce((acc, curr) => acc + (curr.exits || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hisobotlar</h1>
        <p className="text-gray-500 dark:text-gray-400">Moliyaviy va trafik statistikasi</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 border-l-4 border-green-500">
          <div className="p-4 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-xl">
            <Banknote className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Jami Daromad</p>
            <h2 className="text-2xl lg:text-3xl font-bold">{totalRevenue.toLocaleString('uz-UZ')} UZS</h2>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 border-l-4 border-blue-500">
          <div className="p-4 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
            <ArrowRightCircle className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Jami Kirganlar</p>
            <h2 className="text-2xl lg:text-3xl font-bold">{totalEntries} ta</h2>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 border-l-4 border-orange-500">
          <div className="p-4 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-xl">
            <ArrowLeftCircle className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Jami Chiqqanlar</p>
            <h2 className="text-2xl lg:text-3xl font-bold">{totalExits} ta</h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-6">
            <Banknote className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-bold">Umumiy Daromad</h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-6">
            <Car className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold">Umumiy Trafik</h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="entries" name="Kirish" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} />
                <Line type="monotone" dataKey="exits" name="Chiqish" stroke="#10b981" strokeWidth={3} dot={{r: 4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl mt-6">
        <h2 className="text-lg font-bold mb-4">Kirib-chiqqan Mashinalar (Barcha tarix)</h2>
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 text-sm sticky top-0">
              <tr>
                <th className="p-4 font-medium">Davlat raqami</th>
                <th className="p-4 font-medium">Rusumi</th>
                <th className="p-4 font-medium">Kirish vaqti</th>
                <th className="p-4 font-medium">Chiqish vaqti</th>
                <th className="p-4 font-medium">To'lov / Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
              {historyData.map(session => (
                <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 font-bold">{session.car?.plateNumber}</td>
                  <td className="p-4 text-sm text-gray-500">Noma'lum</td>
                  <td className="p-4 text-sm">{new Date(session.entryTime).toLocaleString('uz-UZ')}</td>
                  <td className="p-4 text-sm text-gray-500">{session.exitTime ? new Date(session.exitTime).toLocaleString('uz-UZ') : '-'}</td>
                  <td className="p-4 font-medium">
                    {session.status === 'ACTIVE' ? (
                      <span className="text-blue-500 bg-blue-100 dark:bg-blue-500/20 px-2.5 py-1 rounded-full text-xs font-semibold">Ichkarida</span>
                    ) : (
                      <span className="text-green-600 font-bold">{session.fee} UZS</span>
                    )}
                  </td>
                </tr>
              ))}
              {historyData.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-gray-500">Hozircha tarix yo'q...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
