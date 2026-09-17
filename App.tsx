
import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { MOCK_CITIZENS, MOCK_HOSPITALS } from './mockData';
import Home from './pages/Home';
import CitizenLogin from './pages/CitizenLogin';
import HospitalLogin from './pages/HospitalLogin';
import CitizenDashboard from './pages/CitizenDashboard';
import HospitalDashboard from './pages/HospitalDashboard';
import EmergencySearch from './pages/EmergencySearch';
import Navbar from './components/Navbar';

const App: React.FC = () => {
  const [user, setUser] = useState<User>(null);
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [notification, setNotification] = useState<{message: string, type: 'info' | 'error' | 'success'} | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('blood_app_user');
    if (saved) {
      setUser(JSON.parse(saved));
    }
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('blood_app_user', JSON.stringify(userData));
    setCurrentPage(userData?.role === UserRole.CITIZEN ? 'citizen_dashboard' : 'hospital_dashboard');
    showNotification(`Welcome back, ${userData?.name}!`, 'success');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('blood_app_user');
    setCurrentPage('home');
    showNotification('Logged out successfully', 'info');
  };

  const showNotification = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <Home navigate={setCurrentPage} />;
      case 'citizen_login': return <CitizenLogin onLogin={handleLogin} navigate={setCurrentPage} />;
      case 'hospital_login': return <HospitalLogin onLogin={handleLogin} navigate={setCurrentPage} />;
      case 'emergency': return <EmergencySearch user={user} navigate={setCurrentPage} />;
      case 'citizen_dashboard': 
        return user?.role === UserRole.CITIZEN ? <CitizenDashboard user={user as any} navigate={setCurrentPage} onLogout={handleLogout} /> : <Home navigate={setCurrentPage} />;
      case 'hospital_dashboard': 
        return user?.role === UserRole.HOSPITAL ? <HospitalDashboard user={user as any} navigate={setCurrentPage} onLogout={handleLogout} /> : <Home navigate={setCurrentPage} />;
      default: return <Home navigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col transition-all duration-300">
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        currentPage={currentPage} 
        navigate={setCurrentPage} 
      />
      
      <main className="flex-grow">
        {notification && (
          <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg text-white transition-opacity duration-500 ${
            notification.type === 'success' ? 'bg-green-600' : 
            notification.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
          }`}>
            {notification.message}
          </div>
        )}
        {renderPage()}
      </main>

      <footer className="bg-slate-900 text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-400">&copy; 2024 Vision Seekers Management System. Saving lives through technology.</p>
          <div className="mt-4 flex justify-center space-x-6">
            <button onClick={() => setCurrentPage('home')} className="hover:text-red-400">Home</button>
            <button onClick={() => setCurrentPage('emergency')} className="hover:text-red-400">Emergency Search</button>
            <a href="#" className="hover:text-red-400">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
