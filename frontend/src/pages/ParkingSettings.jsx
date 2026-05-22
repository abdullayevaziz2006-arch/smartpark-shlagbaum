import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Save, Bot, LinkIcon, CheckCircle, Building2 } from 'lucide-react';

const ParkingSettings = () => {
  const [lot, setLot] = useState({ name: '', telegramChatId: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    loadLot();
  }, []);

  const loadLot = async () => {
    try {
      const res = await axios.get('/api/auth/me', { headers });
      if (res.data.ownedLots && res.data.ownedLots.length > 0) {
        const currentLot = res.data.ownedLots[0];
        setLot({ name: currentLot.name || '', telegramChatId: currentLot.telegramChatId || '' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put('/api/admin/parking-lot', lot, { headers });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      alert('Xatolik: ' + (e.response?.data?.error || e.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sozlamalar</h1>
        <p className="text-gray-500 dark:text-gray-400">Parkovka va Telegram bot sozlamalari</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
        {/* Parking Info */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold">Parkovka Ma'lumotlari</h2>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5">Parkovka nomi</label>
            <input
              type="text"
              value={lot.name}
              onChange={(e) => setLot({ ...lot, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="Masalan: MarkazPark"
            />
          </div>
        </div>

        {/* Telegram Integration */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Bot className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold">Telegram Bot Ulash</h2>
          </div>

          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4 mb-4">
            <h3 className="font-semibold text-blue-700 dark:text-blue-400 mb-2">📋 Telegram botni ulash qo'llanmasi:</h3>
            <ol className="text-sm text-blue-600 dark:text-blue-300 space-y-1.5 list-decimal list-inside">
              <li>Telegramda <strong>@SmartParkControlBot</strong> ga kiring</li>
              <li><strong>/start</strong> buyrug'ini yuboring</li>
              <li>Bot sizga <strong>Chat ID</strong> raqamini beradi</li>
              <li>O'sha raqamni quyidagi maydonga yozing</li>
              <li><strong>"Saqlash"</strong> tugmasini bosing — bot sizning parkovkangizga ulanadi!</li>
            </ol>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              <span className="flex items-center gap-1.5">
                <LinkIcon className="w-4 h-4" /> Telegram Chat ID
              </span>
            </label>
            <input
              type="text"
              value={lot.telegramChatId}
              onChange={(e) => setLot({ ...lot, telegramChatId: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
              placeholder="Masalan: 1801746044"
            />
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          className={`flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white transition-all shadow-lg ${
            saved 
              ? 'bg-green-600 shadow-green-600/20' 
              : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
          }`}
        >
          {saving ? (
            '⏳ Saqlanmoqda...'
          ) : saved ? (
            <><CheckCircle className="w-5 h-5" /> Saqlandi!</>
          ) : (
            <><Save className="w-5 h-5" /> Saqlash</>
          )}
        </button>
      </form>
    </div>
  );
};

export default ParkingSettings;
