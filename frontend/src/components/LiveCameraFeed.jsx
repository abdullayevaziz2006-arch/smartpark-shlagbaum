import React, { useState } from 'react';
import axios from 'axios';
import { Camera, Unlock, AlertTriangle, CheckCircle } from 'lucide-react';

const LiveCameraFeed = ({ ip, name }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, opening, success, error
  const [errorMsg, setErrorMsg] = useState('');

  const triggerOpen = async () => {
    setLoading(true);
    setStatus('opening');
    try {
      const response = await axios.post('/api/manual-open-camera', { ip });
      if (response.data.success) {
        setStatus('success');
      } else {
        throw new Error(response.data.error || 'Qurilma buyruqni qabul qilmadi');
      }
    } catch (err) {
      console.error('Barrier open error:', err);
      setStatus('error');
      setErrorMsg(err.response?.data?.error || err.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    }
  };

  const getButtonContent = () => {
    switch (status) {
      case 'opening':
        return (
          <>
            <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full mr-1.5"></span>
            Opening...
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
            Opened
          </>
        );
      case 'error':
        return (
          <>
            <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
            Failed
          </>
        );
      default:
        return (
          <>
            <Unlock className="w-3.5 h-3.5 mr-1.5" />
            Open Barrier
          </>
        );
    }
  };

  const getButtonClass = () => {
    const baseClass = "py-2 px-4 rounded-lg font-bold text-xs flex items-center justify-center transition-all duration-300 border shrink-0";
    switch (status) {
      case 'opening':
        return `${baseClass} bg-amber-500 border-amber-500 text-white`;
      case 'success':
        return `${baseClass} bg-emerald-600 border-emerald-600 text-white`;
      case 'error':
        return `${baseClass} bg-red-600 border-red-600 text-white`;
      default:
        return `${baseClass} bg-white border-ranch-red text-ranch-red hover:bg-ranch-red hover:text-white`;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-surface-gray overflow-hidden flex flex-col">
      {/* Camera Viewport Canvas */}
      <div className="relative aspect-[16/9] bg-black flex items-center justify-center group overflow-hidden">
        {/* Blinking LIVE badge in top-left */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
          <span>LIVE</span>
        </div>

        {/* Video feed using MJPEG stream URL */}
        <img
          src={`/api/camera/stream/${ip}`}
          alt={`${name} Stream`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // If the stream fails, display a placeholder icon
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />

        {/* Fallback placeholder (hidden unless image onError triggers) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-zinc-500 gap-2" style={{ display: 'none' }}>
          <Camera className="w-8 h-8 opacity-40" />
          <p className="text-xs">Camera connection offline</p>
        </div>
      </div>

      {/* Manual Open Action Footer */}
      <div className="p-4 bg-white flex items-center justify-between gap-4 border-t border-surface-gray">
        <div>
          <h4 className="font-bold text-charcoal text-sm leading-tight">{name}</h4>
          <span className="text-[11px] text-muted-slate font-mono font-medium block mt-0.5">
            {ip}
          </span>
        </div>
        <button
          onClick={triggerOpen}
          disabled={status !== 'idle'}
          className={getButtonClass()}
        >
          {getButtonContent()}
        </button>
      </div>
      {status === 'error' && (
        <div className="px-4 pb-3 bg-white text-[10px] text-red-500 text-right font-medium truncate" title={errorMsg}>
          {errorMsg}
        </div>
      )}
    </div>
  );
};

export default LiveCameraFeed;
