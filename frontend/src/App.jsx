import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import ActiveCars from './pages/ActiveCars';
import Subscribers from './pages/Subscribers';
import Devices from './pages/Devices';
import Tariffs from './pages/Tariffs';
import Logs from './pages/Logs';
import Login from './pages/Login';

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-academic-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-3 border-ranch-red border-t-transparent"></div>
      </div>
    );
  }

  // Redirect to Login if not authenticated
  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="flex h-screen w-screen overflow-hidden bg-academic-bg">
        {/* Left Navigation Sidebar */}
        <Sidebar />

        {/* Right Content Space */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top AppBar */}
          <Header />

          {/* Main Pages Router */}
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/sessions" element={<ActiveCars />} />
            <Route path="/subscribers" element={<Subscribers />} />
            <Route path="/devices" element={<Devices />} />
            <Route path="/tariffs" element={<Tariffs />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
