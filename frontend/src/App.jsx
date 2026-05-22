import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import Subscribers from './pages/Subscribers';
import Reports from './pages/Reports';
import Devices from './pages/Devices';
import Infokiosk from './pages/Infokiosk';
import Login from './pages/Login';
import Cashiers from './pages/Cashiers';
import ParkingSettings from './pages/ParkingSettings';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  };

  if (loading) return null;

  // Not logged in — show login
  if (!user || !token) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/kiosk" element={<Infokiosk />} />
          <Route path="*" element={<Login onLogin={handleLogin} />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/kiosk" element={<Infokiosk />} />
        
        <Route path="/" element={<AdminLayout user={user} onLogout={handleLogout} />}>
          <Route index element={<Dashboard />} />
          <Route path="subscribers" element={<Subscribers />} />
          <Route path="reports" element={<Reports />} />
          <Route path="devices" element={<Devices />} />

          {/* Admin-only routes */}
          {user.role === 'ADMIN' && (
            <>
              <Route path="cashiers" element={<Cashiers />} />
              <Route path="settings" element={<ParkingSettings />} />
            </>
          )}
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
