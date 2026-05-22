import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { CreditCard, Banknote, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

const socket = io();

const Infokiosk = () => {
  const [checkoutSession, setCheckoutSession] = useState(null);
  const [status, setStatus] = useState('IDLE'); // IDLE, WAITING_PIN, DISPENSING, SUCCESS, ERROR
  const [insertedCash, setInsertedCash] = useState(0);

  useEffect(() => {
    // Kiosk uchun maxsus ovozlar yoki animatsiyalar qoshish mumkin
    socket.on('car_exit', (data) => {
      if (data.fee > 0) {
        setCheckoutSession({ id: data.sessionId, plate: data.plateNumber, fee: data.fee });
        setStatus('IDLE');
        setInsertedCash(0);
      }
    });

    return () => {
      socket.off('car_exit');
    };
  }, []);

  const handleCardPayment = async () => {
    if (!checkoutSession) return;
    setStatus('WAITING_PIN');
    try {
      await axios.post('/api/payment/terminal', {
        sessionId: checkoutSession.id,
        amount: checkoutSession.fee
      });
      setStatus('SUCCESS');
      triggerBarrierOpen();
    } catch(e) {
      setStatus('ERROR');
      setTimeout(() => setStatus('IDLE'), 3000);
    }
  };

  const handleCashSimulation = () => {
    // Haqiqiy hayotda bu Cash Acceptor apparatidan keladigan signal bo'ladi.
    // Simulyatsiya uchun mijoz har bosganda 10 000 so'm solyapti deb faraz qilamiz
    setInsertedCash(prev => prev + 10000);
  };

  useEffect(() => {
    if (checkoutSession && insertedCash >= checkoutSession.fee && status === 'IDLE') {
      processCashPayment();
    }
  }, [insertedCash, checkoutSession, status]);

  const processCashPayment = async () => {
    setStatus('DISPENSING');
    try {
      await axios.post('/api/payment/cash', {
        sessionId: checkoutSession.id,
        fee: checkoutSession.fee,
        insertedAmount: insertedCash
      });
      setStatus('SUCCESS');
      triggerBarrierOpen();
    } catch(e) {
      setStatus('ERROR');
      setTimeout(() => setStatus('IDLE'), 3000);
    }
  };

  const triggerBarrierOpen = async () => {
    await axios.post('/api/barrier/open', {});
    setTimeout(() => {
      setCheckoutSession(null);
      setStatus('IDLE');
      setInsertedCash(0);
    }, 5000);
  };

  if (!checkoutSession) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-6">
        <div className="w-full max-w-4xl text-center space-y-8">
          <div className="animate-pulse">
            <ShieldCheck className="w-32 h-32 mx-auto text-blue-500 mb-6" />
          </div>
          <h1 className="text-5xl font-black tracking-wider">Xush Kelibsiz!</h1>
          <p className="text-2xl text-slate-400">Mashina shlagbaumga yaqinlashishini kuting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col text-white">
      {/* Header */}
      <header className="p-8 text-center bg-slate-800/50 border-b border-slate-700">
        <h1 className="text-6xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
          {checkoutSession.plate}
        </h1>
        <p className="text-xl text-slate-400 mt-2">Iltimos, to'lovni amalga oshiring</p>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        
        {status === 'SUCCESS' ? (
          <div className="text-center space-y-6 animate-in zoom-in duration-500">
            <div className="w-48 h-48 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-green-500/50">
              <ShieldCheck className="w-24 h-24 text-white" />
            </div>
            <h2 className="text-5xl font-bold text-green-400">To'lov Muvaffaqiyatli!</h2>
            <p className="text-3xl text-slate-300">Oq yo'l, xayr-salomat bo'ling!</p>
          </div>
        ) : status === 'ERROR' ? (
          <div className="text-center space-y-6">
            <AlertCircle className="w-32 h-32 mx-auto text-red-500" />
            <h2 className="text-4xl font-bold text-red-400">Xatolik Yuz Berdi</h2>
            <p className="text-xl text-slate-400">Iltimos, qayta urinib ko'ring yoki operatorga murojaat qiling.</p>
          </div>
        ) : status === 'WAITING_PIN' ? (
          <div className="text-center space-y-8">
            <RefreshCw className="w-32 h-32 mx-auto text-blue-500 animate-spin" />
            <h2 className="text-5xl font-bold text-blue-400">Terminalga Ulanildi</h2>
            <p className="text-3xl text-slate-300">Iltimos, kartangizni terminalga tiqing va PIN kodni kiriting.</p>
            <div className="bg-slate-800 p-8 rounded-3xl mt-8 border border-slate-700">
              <p className="text-slate-400 mb-2">Yechiladigan summa:</p>
              <p className="text-6xl font-black text-white">{checkoutSession.fee} UZS</p>
            </div>
          </div>
        ) : status === 'DISPENSING' ? (
          <div className="text-center space-y-8">
            <Banknote className="w-32 h-32 mx-auto text-green-500 animate-bounce" />
            <h2 className="text-5xl font-bold text-green-400">To'lov qabul qilindi</h2>
            <p className="text-3xl text-slate-300">Qaytim hisoblanmoqda va berilmoqda... Iltimos kuting.</p>
          </div>
        ) : (
          <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Payment Details */}
            <div className="bg-slate-800 rounded-3xl p-10 flex flex-col justify-center text-center border border-slate-700 shadow-2xl">
              <p className="text-slate-400 text-2xl mb-4">To'lov Summasi</p>
              <h2 className="text-7xl font-black text-red-500 mb-12">{checkoutSession.fee} <span className="text-4xl">UZS</span></h2>
              
              {insertedCash > 0 && (
                <div className="bg-green-500/10 border border-green-500/30 p-6 rounded-2xl">
                  <p className="text-green-400 text-xl mb-2">Kiritilgan naqd pul:</p>
                  <p className="text-4xl font-bold text-green-500">{insertedCash} UZS</p>
                  <p className="text-slate-400 mt-2">Qolgan qism: {Math.max(0, checkoutSession.fee - insertedCash)} UZS</p>
                </div>
              )}
            </div>

            {/* Payment Methods */}
            <div className="space-y-6 flex flex-col justify-center">
              <button 
                onClick={handleCardPayment}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-3xl p-10 flex items-center gap-8 transition-transform active:scale-95 shadow-xl shadow-blue-900/50"
              >
                <div className="p-6 bg-white/10 rounded-2xl">
                  <CreditCard className="w-16 h-16" />
                </div>
                <div className="text-left">
                  <h3 className="text-4xl font-bold mb-2">Karta Orqali</h3>
                  <p className="text-xl text-blue-200">Humo yoki Uzcard</p>
                </div>
              </button>

              <div className="w-full bg-green-600/20 border-2 border-green-500/50 rounded-3xl p-10 flex items-center gap-8 shadow-xl">
                <div className="p-6 bg-green-500/20 rounded-2xl">
                  <Banknote className="w-16 h-16 text-green-400" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="text-4xl font-bold text-green-400 mb-2">Naqd Pul</h3>
                  <p className="text-xl text-green-200">Pulni qabul qilgichga kiriting</p>
                </div>
                {/* SIMULYATSIYA TUGMASI - HAQIQIYDA BUNI APPARAT BAJARADI */}
                <button onClick={handleCashSimulation} className="bg-green-500 text-white px-6 py-4 rounded-xl font-bold text-lg hover:bg-green-400">
                  +10 000 kirgizish (Simulyatsiya)
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Infokiosk;
