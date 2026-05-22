import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Video, Plus, CheckCircle2, XCircle, Trash2, Loader2, RefreshCw } from 'lucide-react';

const Devices = () => {
  const [devices, setDevices] = useState([]);
  const [deviceStatuses, setDeviceStatuses] = useState({});
  const [syncingDevices, setSyncingDevices] = useState({});

  const loadDevices = () => {
    axios.get('/api/devices').then(res => {
      setDevices(res.data);
      res.data.forEach(device => checkDeviceStatus(device.id));
    });
  };

  const checkDeviceStatus = async (id) => {
    setDeviceStatuses(prev => ({ ...prev, [id]: 'CHECKING' }));
    try {
      const res = await axios.get(`/api/devices/${id}/ping`);
      setDeviceStatuses(prev => ({ ...prev, [id]: res.data.status }));
    } catch (err) {
      setDeviceStatuses(prev => ({ ...prev, [id]: 'OFFLINE' }));
    }
  };

  const handleDeleteDevice = async (id) => {
    if (!window.confirm("Kamerani o'chirmoqchimisiz?")) return;
    try {
      await axios.delete(`/api/devices/${id}`);
      loadDevices();
    } catch(err) {
      alert("Xatolik yuz berdi");
    }
  };

  const handleSyncDevice = async (id) => {
    setSyncingDevices(prev => ({ ...prev, [id]: true }));
    try {
      const res = await axios.post(`/api/devices/${id}/sync`);
      alert(`Sinxronizatsiya muvaffaqiyatli! ${res.data.syncedCount} ta yangi kirdi-chiqdi topilib bazaga qo'shildi.`);
    } catch(err) {
      alert("Kamera bilan bog'lanishda xatolik yuz berdi. Kamera parolini tekshiring yoki qurilma onlaynligiga ishonch hosil qiling.");
    } finally {
      setSyncingDevices(prev => ({ ...prev, [id]: false }));
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const handleAddDevice = async (e) => {
    e.preventDefault();
    const data = {
      name: e.target.name.value,
      ipAddress: e.target.ipAddress.value,
      port: e.target.port.value,
      type: e.target.type.value,
      username: e.target.username?.value || '',
      password: e.target.password?.value || ''
    };
    try {
      await axios.post('/api/devices', data);
      e.target.reset();
      loadDevices();
    } catch(err) {
      alert("Xatolik yuz berdi");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Qurilmalar</h1>
        <p className="text-gray-500 dark:text-gray-400">Kameralar va shlagbaumlarni boshqarish</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl lg:col-span-1 h-fit">
          <div className="flex items-center gap-2 mb-6">
            <Plus className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold">Kamera qo'shish</h2>
          </div>
          <form onSubmit={handleAddDevice} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nomi</label>
              <input name="name" required placeholder="Asosiy kirish kamerasi" className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 p-2.5 rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Static IP yoki Ngrok URL</label>
              <input name="ipAddress" required placeholder="185.100.x.x yoki ngrok.io" className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 p-2.5 rounded-xl" />
              <p className="text-xs text-gray-500 mt-1">Global tarmoq orqali ulanish uchun</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Port</label>
                <input name="port" type="number" defaultValue="80" className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 p-2.5 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Turi</label>
                <select name="type" className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 p-2.5 rounded-xl">
                  <option value="ENTRY">Kirish (IN)</option>
                  <option value="EXIT">Chiqish (OUT)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Login (Kamera)</label>
                <input name="username" placeholder="admin" className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 p-2.5 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Parol (Kamera)</label>
                <input name="password" type="password" placeholder="***" className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 p-2.5 rounded-xl" />
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl font-medium transition shadow-lg shadow-blue-500/20">
              Qo'shish
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {devices.map(device => (
            <div key={device.id} className="glass-panel p-5 rounded-2xl flex items-center justify-between group hover:border-blue-500 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${device.type === 'ENTRY' ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'}`}>
                  <Video className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{device.name}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    {device.ipAddress}:{device.port}
                    <span className="bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs">{device.type}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {deviceStatuses[device.id] === 'CHECKING' ? (
                  <span className="flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full">
                    <Loader2 className="w-4 h-4 animate-spin" /> Tekshirilmoqda
                  </span>
                ) : deviceStatuses[device.id] === 'ONLINE' ? (
                  <span className="flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-3 py-1 rounded-full">
                    <CheckCircle2 className="w-4 h-4" /> Faol
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-3 py-1 rounded-full">
                    <XCircle className="w-4 h-4" /> Faol emas
                  </span>
                )}
                <button 
                  onClick={() => handleSyncDevice(device.id)} 
                  disabled={syncingDevices[device.id]}
                  className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors ml-4 flex items-center gap-1 text-sm font-medium" 
                  title="Kameraning ichki tarixini dasturga tortib olish (Sinxronizatsiya)"
                >
                  <RefreshCw className={`w-5 h-5 ${syncingDevices[device.id] ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Sync</span>
                </button>
                <button onClick={() => handleDeleteDevice(device.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors ml-2" title="O'chirish">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
          {devices.length === 0 && (
            <div className="glass-panel p-12 rounded-2xl flex flex-col items-center justify-center text-gray-500 text-center">
              <Video className="w-12 h-12 mb-4 opacity-20" />
              <p>Kameralar hali qo'shilmagan</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Devices;
