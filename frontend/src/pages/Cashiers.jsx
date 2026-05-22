import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Plus, Trash2, UserCircle, Shield, Copy, Check } from 'lucide-react';

const Cashiers = () => {
  const [cashiers, setCashiers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    loadCashiers();
  }, []);

  const loadCashiers = async () => {
    try {
      const res = await axios.get('/api/admin/cashiers', { headers });
      setCashiers(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/admin/cashiers', formData, { headers });
      setFormData({ name: '', username: '', password: '' });
      setShowForm(false);
      loadCashiers();
    } catch (e) {
      alert(e.response?.data?.error || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Kassirni o'chirmoqchimisiz?")) return;
    try {
      await axios.delete(`/api/admin/cashiers/${id}`, { headers });
      loadCashiers();
    } catch (e) {
      alert("Xatolik yuz berdi");
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let pass = '';
    for (let i = 0; i < 8; i++) pass += chars[Math.floor(Math.random() * chars.length)];
    setFormData(prev => ({ ...prev, password: pass }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kassirlar</h1>
          <p className="text-gray-500 dark:text-gray-400">Kassir hisoblarini boshqarish</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-5 h-5" /> Yangi Kassir
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="glass-panel rounded-2xl p-6 border-l-4 border-blue-500">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <UserCircle className="w-5 h-5 text-blue-500" /> Yangi Kassir Yaratish
          </h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Ism-familiya</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Kassir ismi"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Login</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="kassir1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Parol</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Parol"
                />
                <button type="button" onClick={generatePassword} className="px-3 py-3 bg-gray-100 dark:bg-slate-700 rounded-xl text-xs font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors whitespace-nowrap">
                  🎲 Avtomatik
                </button>
              </div>
            </div>
            <div className="md:col-span-3 flex gap-3">
              <button type="submit" disabled={loading} className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold transition-colors">
                {loading ? '⏳ Yaratilmoqda...' : '✅ Yaratish'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 rounded-xl font-semibold transition-colors">
                Bekor qilish
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cashiers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cashiers.map((cashier) => (
          <div key={cashier.id} className="glass-panel rounded-2xl p-5 hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/20">
                  {cashier.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{cashier.name}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Kassir</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(cashier.id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Login:</span>
                <div className="flex items-center gap-1.5">
                  <code className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">{cashier.username}</code>
                  <button
                    onClick={() => handleCopy(cashier.username, cashier.id)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded transition-colors"
                  >
                    {copied === cashier.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                  </button>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
              Yaratilgan: {new Date(cashier.createdAt).toLocaleDateString('uz-UZ')}
            </p>
          </div>
        ))}

        {cashiers.length === 0 && !showForm && (
          <div className="md:col-span-3 text-center py-16">
            <Users className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
            <h3 className="text-xl font-bold text-gray-400 dark:text-gray-500">Hali kassirlar yo'q</h3>
            <p className="text-gray-400 dark:text-gray-600 mt-1">"Yangi Kassir" tugmasini bosib birinchi kassiringizni yarating</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cashiers;
