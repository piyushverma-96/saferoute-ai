import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useSOS } from './hooks/useSOS';
import Navbar from './components/Navbar';
import SOSModal from './components/SOSModal';
import OfflineBanner from './components/OfflineBanner';
import InstallPrompt from './components/InstallPrompt';
import UpdatePrompt from './components/UpdatePrompt';
import ProtectedRoute from './components/ProtectedRoute';
import Toast from './components/Toast';

// Pages
import LandingPage from './pages/LandingPage';
import AppPage from './pages/AppPage';
import Dashboard from './pages/Dashboard';
import ReportForm from './pages/ReportForm';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import NotFoundPage from './pages/NotFoundPage';
import TrackingPage from './pages/TrackingPage';

function App() {
  const { isSOSActive, toggleSOS, closeSOS, userId } = useSOS();

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col relative">
        <OfflineBanner />
        <Navbar onToggleSOS={toggleSOS} />
        
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/track/:userId" element={<TrackingPage />} />
            <Route path="/app" element={
              <ProtectedRoute>
                <AppPage />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/report" element={
              <ProtectedRoute>
                <ReportForm />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

        <SOSModal 
          isOpen={isSOSActive} 
          onClose={closeSOS} 
          userId={userId}
        />
        <InstallPrompt />
        <UpdatePrompt />
        <Toast />
      </div>
    </BrowserRouter>
  );
}

export default App;
