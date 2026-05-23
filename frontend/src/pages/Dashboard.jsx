import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Car, CreditCard, Clock, CheckCircle2, XCircle, ShieldAlert, Banknote, Smartphone, Activity, ArrowRightCircle, ArrowLeftCircle } from 'lucide-react';

const socket = io();

const Dashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ activeCars: 0 });
  const [alerts, setAlerts] = useState([]);
  const [checkoutSession, setCheckoutSession] = useState(null);

  const loadDashboard = () => {
    axios.get('/api/sessions').then(res => setSessions(res.data));
    axios.get('/api/stats').then(res => setStats(res.data));
    axios.get('/api/logs').then(res => setLogs(res.data));
  };

  useEffect(() => {
    loadDashboard();
    
    socket.on('car_entry', () => loadDashboard());
    socket.on('car_exit', (data) => {
      loadDashboard();
      if (data.fee > 0) {
        setCheckoutSession({ 
          id: data.sessionId, 
          plate: data.plateNumber, 
          fee: data.fee,
          entryTime: data.entryTime,
          durationMins: data.durationMins
        });
      }
    });
    socket.on('alert', (data) => setAlerts(prev => [...prev, data.message]));

    return () => {
      socket.off('car_entry');
      socket.off('car_exit');
      socket.off('alert');
    };
  }, []);

  const openBarrier = async () => {
    try {
      await axios.post('/api/barrier/open', {});
      alert("Shlagbaum ochildi!");
    } catch(e) {
      alert("Xatolik");
    }
  };

  const handleManualEntry = async () => {
    const plate = prompt("Kameradan ko'rilgan mashina davlat raqamini kiriting (Masalan: 01A111AA):");
    if (!plate) return;
    try {
      await axios.post('/api/manual-entry', { plateNumber: plate.toUpperCase().replace(/\s/g, '') });
      alert("Mashina bazaga qo'shildi va hisob-kitob boshlandi!");
      loadDashboard();
    } catch(e) {
      alert("Xatolik yuz berdi");
    }
  };

  const [isProcessingTerminal, setIsProcessingTerminal] = useState(false);

  const handlePayment = async (method) => {
    if (!checkoutSession) return;
    try {
      if (method === 'TERMINAL') {
        setIsProcessingTerminal(true);
        await axios.post('/api/payment/terminal', {
          sessionId: checkoutSession.id,
          amount: checkoutSession.fee
        });
        setIsProcessingTerminal(false);
      } else {
        await axios.post('/api/payment/pay', {
          sessionId: checkoutSession.id,
          method: method,
          amount: checkoutSession.fee
        });
      }
      setCheckoutSession(null);
      loadDashboard();
      openBarrier(); // To'lovdan so'ng shlagbaumni ochish
    } catch(e) {
      setIsProcessingTerminal(false);
      alert("To'lovda xatolik yuz berdi");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Real vaqt monitoringi va boshqaruv</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleManualEntry} className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-green-500/30 transition-all flex items-center gap-2">
            <Car className="w-5 h-5" />
            Qo'lda kiritish
          </button>
          <button onClick={openBarrier} className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Ochish (Majburiy)
          </button>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium">Diqqat!</p>
            {alerts.map((a, i) => <p key={i} className="text-sm">{a}</p>)}
          </div>
          <button onClick={() => setAlerts([])} className="ml-auto text-red-500 hover:text-red-700">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div className="p-4 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
            <Car className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ichkaridagi mashinalar</p>
            <h2 className="text-3xl font-bold">{stats.activeCars}</h2>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div className="p-4 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-xl">
            <CreditCard className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Kutilayotgan To'lovlar</p>
            <h2 className="text-3xl font-bold">
              {sessions.filter(s => s.status === 'UNPAID').length}
            </h2>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div className="p-4 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Kunlik aylanma (Trafik)</p>
            <h2 className="text-3xl font-bold">{sessions.filter(s => new Date(s.entryTime).toDateString() === new Date().toDateString()).length}</h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Table */}
        <div className="xl:col-span-2 glass-panel rounded-2xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center">
            <h2 className="text-lg font-bold">Faol & Oxirgi Seanslar</h2>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 text-sm">
                <tr>
                  <th className="p-4 font-medium">Davlat raqami</th>
                  <th className="p-4 font-medium">Kirish vaqti</th>
                  <th className="p-4 font-medium">Chiqish vaqti</th>
                  <th className="p-4 font-medium">Holat</th>
                  <th className="p-4 font-medium">Summa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                {sessions.slice(0,10).map(session => (
                  <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-bold">{session.car?.plateNumber}</td>
                    <td className="p-4 text-sm">{new Date(session.entryTime).toLocaleString('uz-UZ')}</td>
                    <td className="p-4 text-sm text-gray-500">{session.exitTime ? new Date(session.exitTime).toLocaleString('uz-UZ') : '-'}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        session.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                        session.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                        'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                      }`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="p-4 font-medium">{session.fee > 0 ? `${session.fee} UZS` : '0 UZS'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cashier Checkout UI */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Banknote className="w-5 h-5 text-green-500" />
              Kassir Paneli
            </h2>
            <a href="/kiosk" target="_blank" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
              Infokiosk rejimiga o'tish →
            </a>
          </div>
          
          {checkoutSession ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-500 dark:text-gray-400 border-2 border-dashed border-blue-500/50 rounded-xl animate-pulse">
              <Car className="w-12 h-12 mb-3 text-blue-500" />
              <p className="font-bold text-blue-600 dark:text-blue-400">To'lov modal oynasi ochilgan</p>
              <p className="text-sm mt-2">Mashina raqami: <strong>{checkoutSession.plate}</strong></p>
              <button 
                onClick={() => setCheckoutSession({ ...checkoutSession })} 
                className="mt-4 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg text-sm hover:bg-blue-700 transition"
              >
                Modalni ochish
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
              <CheckCircle2 className="w-12 h-12 mb-3 opacity-20" />
              <p>Hozircha kutilayotgan to'lovlar yo'q</p>
              <p className="text-sm mt-2">Kamera orqali mashina chiqqanda to'lov oynasi avtomatik ochiladi.</p>
            </div>
          )}
        </div>
      </div>

      {/* Logs section */}
      <div className="glass-panel rounded-2xl p-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Oxirgi kirdi-chiqdi hodisalari
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto pr-2">
          {logs.map(log => (
            <div key={log.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700/50">
              <div className={`p-2 rounded-lg ${log.type === 'ENTRY' ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400' : log.type === 'EXIT' ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400' : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400'}`}>
                {log.type === 'ENTRY' ? <ArrowRightCircle className="w-5 h-5" /> : log.type === 'EXIT' ? <ArrowLeftCircle className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">{log.type === 'BARRIER_OPEN' ? 'Qo\'lda ochildi' : (log.car?.plateNumber || 'Noma\'lum')}</p>
                <p className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString('uz-UZ')}</p>
              </div>
              <div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${log.type === 'ENTRY' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : log.type === 'EXIT' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' : 'bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-gray-300'}`}>
                  {log.type === 'ENTRY' ? 'Kirdi' : log.type === 'EXIT' ? 'Chiqdi' : log.type}
                </span>
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="text-gray-500 text-sm col-span-full">Hozircha hodisalar yo'q...</p>
          )}
        </div>
      </div>

      {/* Chiqish To'lovi Modal Oynasi */}
      {checkoutSession && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-800 flex flex-col scale-up">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-orange-500 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Car className="w-6 h-6 animate-pulse" />
                <h3 className="text-xl font-bold">Chiqish to'lovi kutilmoqda</h3>
              </div>
              <button 
                onClick={() => setCheckoutSession(null)} 
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 flex-1">
              {/* Plate Number (Real License Plate Style) */}
              <div className="flex justify-center">
                <div className="relative border-4 border-slate-950 dark:border-slate-100 rounded-xl bg-white text-slate-950 font-bold px-8 py-3 text-3xl tracking-widest shadow-md flex items-center gap-3">
                  <div className="flex flex-col items-center justify-between text-[10px] border-r border-slate-950 pr-2 mr-1">
                    <span className="text-blue-600 font-extrabold text-[12px] leading-none">UZ</span>
                  </div>
                  <span>{checkoutSession.plate}</span>
                </div>
              </div>

              {/* Details List */}
              <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-4 space-y-3 border border-gray-100 dark:border-slate-800">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400">⏱️ Parkovka vaqti:</span>
                  <span className="font-semibold text-lg text-slate-850 dark:text-white">
                    {(() => {
                      const mins = checkoutSession.durationMins;
                      if (!mins) return 'Noma\'lum';
                      if (mins < 60) return `${mins} daqiqa`;
                      const hrs = Math.floor(mins / 60);
                      const remMins = mins % 60;
                      return remMins > 0 ? `${hrs} soat ${remMins} daqiqa` : `${hrs} soat`;
                    })()}
                  </span>
                </div>
                {checkoutSession.entryTime && (
                  <div className="flex justify-between items-center text-sm border-t border-gray-200/50 dark:border-slate-700/50 pt-2">
                    <span className="text-gray-500 dark:text-gray-400">📥 Kirish vaqti:</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {new Date(checkoutSession.entryTime).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm border-t border-gray-200/50 dark:border-slate-700/50 pt-2">
                  <span className="text-gray-500 dark:text-gray-400">📤 Chiqish vaqti:</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Total Fee Display */}
              <div className="text-center bg-red-500/10 border border-red-500/20 rounded-2xl py-4">
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">Jami to'lov summasi</p>
                <p className="text-4xl font-extrabold text-red-600 dark:text-red-500 mt-1">
                  {checkoutSession.fee.toLocaleString()} <span className="text-lg font-bold">UZS</span>
                </p>
              </div>

              {/* Actions or Loading State */}
              {isProcessingTerminal ? (
                <div className="flex flex-col items-center justify-center text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800/30">
                  <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <h4 className="font-bold text-blue-800 dark:text-blue-300">Terminalga ulanildi...</h4>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Mijoz terminalga PIN kod kiritishini kuting.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  <button 
                    onClick={() => handlePayment('CASH')} 
                    className="flex items-center justify-center gap-3 w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-green-600/20 transition-all hover:scale-[1.01]"
                  >
                    <Banknote className="w-6 h-6" />
                    <span>To'landi (Naqd Pul)</span>
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => handlePayment('TERMINAL')} 
                      className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all hover:scale-[1.01]"
                    >
                      <CreditCard className="w-5 h-5" />
                      <span className="text-sm">Karta (Terminal)</span>
                    </button>
                    <button 
                      onClick={() => handlePayment('APP')} 
                      className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all hover:scale-[1.01]"
                    >
                      <Smartphone className="w-5 h-5" />
                      <span className="text-sm">Ilova (App)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
