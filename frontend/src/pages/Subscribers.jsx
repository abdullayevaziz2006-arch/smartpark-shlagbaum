import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Trash2, Plus, Calendar } from 'lucide-react';

const Subscribers = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(false);

  const fetchSubscribers = async () => {
    try {
      const res = await axios.get('/api/subscribers');
      setSubscribers(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    const plate = e.target.plate.value;
    const months = e.target.months.value;
    const amount = e.target.amount.value;
    const cardNo = e.target.cardNo.value;
    await axios.post('/api/subscribers', { plateNumber: plate, months, amount, cardNo });
    e.target.reset();
    fetchSubscribers();
  };

  const handleDelete = async (id) => {
    if(confirm("Haqiqatan ham abonentni o'chirmoqchimisiz?")) {
      await axios.delete(`/api/subscribers/${id}`);
      fetchSubscribers();
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      await axios.post('/api/devices/sync-subscribers');
      alert("Barcha abonentlar kameralarga muvaffaqiyatli yuborildi!");
    } catch (e) {
      alert("Xatolik yuz berdi: " + e.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setImporting(true);
    try {
      const res = await axios.post('/api/subscribers/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(`Muvaffaqiyatli! Exceldan ${res.data.importedCount} ta raqam dasturga yuklandi.`);
      fetchSubscribers();
    } catch (err) {
      alert("Yuklashda xatolik: " + err.message);
    } finally {
      setImporting(false);
      e.target.value = ''; // reset file input
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Abonentlar (Oq ro'yxat)</h1>
          <p className="text-gray-500 dark:text-gray-400">Doimiy mijozlar va ruxsat etilgan avtomobillar</p>
        </div>
        <div className="flex gap-2">
          <label className={`flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition cursor-pointer ${importing ? 'opacity-50 pointer-events-none' : ''}`}>
            {importing ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span className="font-bold text-lg">↑</span>
            )}
            Exceldan yuklash
            <input type="file" accept=".xls,.xlsx,.csv" className="hidden" onChange={handleFileUpload} />
          </label>

          <button 
            onClick={handleManualSync}
            disabled={syncing}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl transition disabled:opacity-50"
          >
            {syncing ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Plus className="w-5 h-5 rotate-45" />
            )}
            Kameralarga yuborish
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl lg:col-span-1 h-fit">
          <div className="flex items-center gap-2 mb-6">
            <Plus className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold">Yangi Abonent</h2>
          </div>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Davlat raqami</label>
              <input name="plate" required placeholder="01A123AA" className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 p-2.5 rounded-xl uppercase" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Kamera ID (Card No)</label>
              <input name="cardNo" placeholder="Masalan: 27 yoki 9999" className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 p-2.5 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Muddat (Oy)</label>
                <select name="months" className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 p-2.5 rounded-xl">
                  <option value="1">1 Oy</option>
                  <option value="3">3 Oy</option>
                  <option value="6">6 Oy</option>
                  <option value="12">1 Yil</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Narxi (UZS)</label>
                <input name="amount" type="number" required placeholder="Masalan: 150000" className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 p-2.5 rounded-xl" />
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl font-medium transition shadow-lg shadow-blue-500/20">
              Qo'shish
            </button>
          </form>
        </div>

        <div className="glass-panel rounded-2xl lg:col-span-2 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 text-sm">
              <tr>
                <th className="p-4 font-medium">Davlat raqami</th>
                <th className="p-4 font-medium">Kamera ID</th>
                <th className="p-4 font-medium">Muddat tugashi</th>
                <th className="p-4 font-medium text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="3" className="p-8 text-center text-gray-500">Yuklanmoqda...</td></tr>
              ) : subscribers.length === 0 ? (
                <tr><td colSpan="3" className="p-8 text-center text-gray-500">Abonentlar topilmadi</td></tr>
              ) : (
                subscribers.map(sub => (
                  <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-bold text-lg tracking-wider">{sub.plateNumber}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-300 font-medium">
                      {sub.cardNo ? `#${sub.cardNo}` : <span className="text-gray-400 font-normal italic">Kiritilmagan</span>}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className={new Date(sub.subscriberEnd) < new Date() ? 'text-red-500 font-medium' : ''}>
                          {new Date(sub.subscriberEnd).toLocaleDateString('uz-UZ')}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleDelete(sub.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition">
                        <Trash2 className="w-5 h-5" />
                      </button>
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

export default Subscribers;
