import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, Clock, HelpCircle, Save, CheckCircle } from 'lucide-react';

const Tariffs = () => {
  const [pricePerMin, setPricePerMin] = useState(100);
  const [freeMinutes, setFreeMinutes] = useState(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchTariff = async () => {
      try {
        const response = await axios.get('/api/tariff');
        setPricePerMin(response.data.pricePerMin);
        setFreeMinutes(response.data.freeMinutes);
      } catch (err) {
        console.error('Error fetching tariff:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTariff();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      await axios.post('/api/tariff', {
        pricePerMin: parseFloat(pricePerMin),
        freeMinutes: parseInt(freeMinutes)
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Tarifni saqlashda xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-academic-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-3 border-ranch-red border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 bg-academic-bg flex items-center justify-center">
      
      <div className="w-full max-w-lg bg-white border border-surface-gray rounded-2xl p-8 shadow-sm space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-surface-gray">
          <div className="w-10 h-10 bg-ranch-red/10 text-ranch-red rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-charcoal text-base">Tarif Sozlamalari</h3>
            <p className="text-xs text-muted-slate font-medium">Avtomatik hisob-kitob qoidalari</p>
          </div>
        </div>

        {/* Info alerts */}
        <div className="p-4 bg-academic-bg border border-surface-gray rounded-xl space-y-2 text-xs font-semibold text-muted-slate">
          <div className="flex gap-2">
            <Clock className="w-4 h-4 shrink-0 text-ranch-red" />
            <p>Bepul daqiqalardan so'ng har bir daqiqa uchun belgilangan to'lov hisoblanadi.</p>
          </div>
          <div className="flex gap-2">
            <HelpCircle className="w-4 h-4 shrink-0 text-ranch-red" />
            <p>Obuna bo'lgan talabalar va xodimlar uchun to'lov muddati tugagunga qadar bepul hisoblanadi.</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            
            {/* Price Per Minute Input */}
            <div>
              <label className="block text-xs font-bold text-muted-slate uppercase tracking-wider mb-2">
                Har bir daqiqa uchun to'lov (UZS)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-slate font-bold text-sm">
                  so'm
                </span>
                <input
                  type="number"
                  required
                  min="0"
                  value={pricePerMin}
                  onChange={(e) => setPricePerMin(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-surface-gray text-sm focus:outline-none focus:border-ranch-red focus:ring-2 focus:ring-ranch-red/20 transition-all font-semibold font-sans"
                />
              </div>
            </div>

            {/* Free Minutes Input */}
            <div>
              <label className="block text-xs font-bold text-muted-slate uppercase tracking-wider mb-2">
                Bepul vaqt muddati (Daqiqa)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-slate font-bold text-sm">
                  daq
                </span>
                <input
                  type="number"
                  required
                  min="0"
                  value={freeMinutes}
                  onChange={(e) => setFreeMinutes(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-surface-gray text-sm focus:outline-none focus:border-ranch-red focus:ring-2 focus:ring-ranch-red/20 transition-all font-semibold font-sans"
                />
              </div>
            </div>

          </div>

          {/* Action buttons */}
          <div className="pt-2 flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-ranch-red hover:bg-ranch-red/90 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {saving ? (
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
              ) : saved ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Muvaffaqiyatli saqlandi!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Tarifni saqlash
                </>
              )}
            </button>
          </div>

        </form>

      </div>

    </div>
  );
};

export default Tariffs;
