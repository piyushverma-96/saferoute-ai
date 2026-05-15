import React from 'react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Map, LayoutDashboard, Flag, User, Menu, X, LogOut, LogIn } from 'lucide-react';
import { useSOS } from '../hooks/useSOS';
import InstallButton from './InstallButton';

export default function Navbar({ onToggleSOS }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Map', path: '/app', icon: <Map size={18} /> },
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Report', path: '/report', icon: <Flag size={18} /> },
    { name: 'Profile', path: '/profile', icon: <User size={18} /> },
  ];

  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const user = isLoggedIn ? JSON.parse(localStorage.getItem('saferoute_user')) : null;

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('saferoute_user');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full bg-brand-bg/80 backdrop-blur-md border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center text-white font-bold group-hover:shadow-[0_0_15px_rgba(124,58,237,0.5)] transition-all">
                <Shield size={20} />
              </div>
              <span className="font-semibold text-lg tracking-tight hidden sm:block">
                SafeRoute <span className="text-brand-purple">AI</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-brand-purple ${
                  isActive(link.path) ? 'text-brand-purple' : 'text-brand-text-secondary'
                }`}
              >
                {link.icon}
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right Side - SOS & Mobile Toggle */}
          <div className="flex items-center gap-3 sm:gap-4">
            <InstallButton variant="navbar" />
            
            <button
              onClick={onToggleSOS}
              className="flex items-center gap-2 bg-brand-danger/10 text-brand-danger border border-brand-danger/50 px-4 py-2 rounded-full font-bold text-sm hover:bg-brand-danger hover:text-white transition-all duration-300"
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-danger opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-danger"></span>
              </span>
              SOS
            </button>

            <div className="hidden md:flex items-center gap-3">
              {isLoggedIn && user ? (
                <div className="flex items-center gap-3 bg-brand-surface border border-brand-border px-3 py-1.5 rounded-full">
                  <span className="text-sm font-medium text-brand-text-primary">
                    {user.name}
                  </span>
                  <button 
                    onClick={handleLogout}
                    className="text-brand-text-secondary hover:text-brand-danger transition-colors p-1"
                    title="Logout"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 bg-brand-purple/10 text-brand-purple border border-brand-purple/50 px-4 py-2 rounded-full font-bold text-sm hover:bg-brand-purple hover:text-white transition-all duration-300"
                >
                  <LogIn size={16} />
                  Login
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-brand-text-secondary hover:text-white"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-brand-surface border-b border-brand-border px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium ${
                isActive(link.path)
                  ? 'bg-brand-purple/10 text-brand-purple'
                  : 'text-brand-text-primary hover:bg-brand-card'
              }`}
            >
              {link.icon}
              {link.name}
            </Link>
          ))}
          <div className="border-t border-brand-border mt-2 pt-2 pb-1">
            {isLoggedIn && user ? (
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm font-medium text-brand-text-primary">{user.name}</span>
                <button 
                  onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                  className="flex items-center gap-2 text-brand-danger font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-brand-danger/10"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium text-brand-purple hover:bg-brand-purple/10"
              >
                <LogIn size={18} />
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
