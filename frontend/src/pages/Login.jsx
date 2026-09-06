import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User, AlertCircle } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Barcha maydonlarni to\'ldiring');
      return;
    }

    setError('');
    setSubmitting(true);
    const result = await login(username, password);
    setSubmitting(false);
    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-academic-bg flex flex-col justify-center items-center px-4 relative">
      {/* Decorative Branding Watermark */}
      <div className="absolute top-10 left-10 hidden md:flex items-center gap-2">
        <div className="w-8 h-8 bg-ranch-red rounded-lg flex items-center justify-center text-white font-bold text-sm">
          R
        </div>
        <span className="font-bold text-charcoal tracking-tight text-sm">RANCH UNIVERSITY</span>
      </div>

      <div className="w-full max-w-md bg-white border border-surface-gray rounded-2xl p-8 shadow-sm">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-ranch-red rounded-xl flex items-center justify-center text-white font-bold text-3xl mx-auto shadow-sm mb-4">
            R
          </div>
          <h2 className="text-2xl font-bold text-charcoal">SmartPark Hub</h2>
          <p className="text-xs text-muted-slate font-medium mt-1">Universitet shlagbaum boshqaruv tizimi</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 flex items-start gap-2 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-muted-slate uppercase tracking-wider mb-2">
              Foydalanuvchi nomi / Telefon
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-slate">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="masalan, admin yoki 998901234567"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-surface-gray text-sm focus:outline-none focus:border-ranch-red focus:ring-2 focus:ring-ranch-red/20 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-slate uppercase tracking-wider mb-2">
              Maxfiy parol
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-slate">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Parolni kiriting"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-surface-gray text-sm focus:outline-none focus:border-ranch-red focus:ring-2 focus:ring-ranch-red/20 transition-all font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-ranch-red hover:bg-ranch-red/90 text-white rounded-lg text-sm font-bold transition-all shadow-sm flex items-center justify-center disabled:opacity-70 mt-2"
          >
            {submitting ? (
              <>
                <span className="animate-spin inline-block mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                Kirilmoqda...
              </>
            ) : (
              'Tizimga kirish'
            )}
          </button>
        </form>
      </div>

      <div className="mt-8 text-center text-xs text-muted-slate font-medium">
        © {new Date().getFullYear()} RANCH University. Barcha huquqlar himoyalangan.
      </div>
    </div>
  );
};

export default Login;
