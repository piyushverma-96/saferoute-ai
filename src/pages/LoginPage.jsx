import React from 'react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, LogIn, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useVoiceNavigation } from '../hooks/useVoiceNavigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [toast, setToast] = useState('');
  
  const navigate = useNavigate();
  const { speak } = useVoiceNavigation();

  useEffect(() => {
    speak("Welcome to SafeRoute AI. Please login to continue.");
  }, [speak]);

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    if (!email) {
      setError("Please enter your email");
      triggerShake();
      setLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      triggerShake();
      setLoading(false);
      return;
    }

    setTimeout(() => {
      // Accept ANY email + password (mock)
      if (email && password.length >= 6) {
        localStorage.setItem('saferoute_user', 
          JSON.stringify({
            email: email,
            name: email.split('@')[0],
            phone: '+91 98765 43210', // Default mock data
            emergencyContact: { name: 'Mom', phone: '+91 98XXX XXXXX' },
            loginTime: new Date().toISOString()
          })
        );
        localStorage.setItem('isLoggedIn', 'true');
        navigate('/app');
      } else {
        setError("Please enter valid credentials");
        triggerShake();
      }
      setLoading(false);
    }, 1500);
  };

  const handleDemoLogin = () => {
    setEmail("demo@saferoute.ai");
    setPassword("demo123");
    
    setTimeout(() => {
      handleLogin();
    }, 500);
  };

  const handleForgot = (e) => {
    e.preventDefault();
    setToast("Password reset link sent!");
    setTimeout(() => setToast(''), 3000);
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 3000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0A0A0F] relative overflow-hidden transition-opacity duration-500">
      
      {/* Toast Notification */}
      {toast && (
        <div className="absolute top-4 right-4 bg-brand-surface border border-brand-safe text-brand-text-primary px-4 py-2 rounded-lg shadow-lg animate-fade-in z-50">
          {toast}
        </div>
      )}

      {/* Background Glows */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-brand-purple opacity-20 blur-[120px]"></div>
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-brand text-white shadow-[0_0_20px_rgba(124,58,237,0.4)] mb-4">
            <Shield size={32} />
          </div>
          <h1 className="text-3xl font-bold text-brand-text-primary mb-2">SafeRoute AI</h1>
          <p className="text-brand-text-secondary">Your safety, our priority</p>
        </div>

        {/* Card with purple/green gradient border glow */}
        <div className="relative rounded-2xl bg-gradient-to-br from-brand-purple/50 to-brand-safe/50 p-[1px] shadow-[0_0_25px_rgba(124,58,237,0.15)]">
          <div className="bg-[#12121A] rounded-2xl p-6 sm:p-8 w-full border border-[rgba(139,92,246,0.3)]">
            <form onSubmit={handleLogin} className="space-y-5">
              
              <div>
                <label className="block text-sm font-medium text-[#A0A0B0] mb-2">Email Address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email" 
                    className="w-full bg-[rgba(255,255,255,0.05)] border border-brand-border rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple focus:shadow-[0_0_10px_rgba(124,58,237,0.3)] transition-all text-brand-text-primary min-h-[48px]"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-[#A0A0B0]">Password</label>
                  <a href="#" onClick={handleForgot} className="text-xs text-brand-purple hover:underline">Forgot Password?</a>
                </div>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password" 
                    className="w-full bg-[rgba(255,255,255,0.05)] border border-brand-border rounded-lg py-3 pl-10 pr-10 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple focus:shadow-[0_0_10px_rgba(124,58,237,0.3)] transition-all text-brand-text-primary min-h-[48px]"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-text-primary"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="remember"
                  className="w-4 h-4 rounded border-brand-border bg-[rgba(255,255,255,0.05)] text-brand-purple focus:ring-brand-purple"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-[#A0A0B0]">Remember me</label>
              </div>

              {error && (
                <div className={`text-brand-danger text-sm text-center ${shake ? 'animate-[shake_0.3s_ease-in-out]' : ''}`}>
                  {error}
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-2 bg-gradient-to-r from-brand-purple to-brand-pink text-white font-bold rounded-xl shadow-lg shadow-brand-purple/20 hover:shadow-brand-purple/40 hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2 min-h-[48px]"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Login Securely 🛡
                  </>
                )}
              </button>
            </form>

            <div className="my-6 flex items-center justify-center space-x-4">
              <div className="flex-1 border-t border-brand-border"></div>
              <span className="text-xs text-brand-text-muted">OR</span>
              <div className="flex-1 border-t border-brand-border"></div>
            </div>

            <button 
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-3 border border-dashed border-brand-border hover:border-brand-purple bg-transparent text-brand-text-primary rounded-xl transition-all flex justify-center items-center gap-2 mb-6"
            >
              🎯 Try Demo — No signup needed
            </button>
            
            <div className="flex flex-col gap-3">
              <button disabled className="w-full py-2.5 bg-[#1A1A24] text-[#A0A0B0] rounded-xl flex items-center justify-center gap-2 opacity-60 cursor-not-allowed group relative">
                <span className="font-bold">G</span> Continue with Google
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-brand-surface border border-brand-border text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Coming Soon</span>
              </button>
              <button disabled className="w-full py-2.5 bg-[#1A1A24] text-[#A0A0B0] rounded-xl flex items-center justify-center gap-2 opacity-60 cursor-not-allowed group relative">
                📱 Continue with Phone
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-brand-surface border border-brand-border text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Coming Soon</span>
              </button>
            </div>

            <div className="mt-6 text-center text-sm text-[#A0A0B0]">
              Don't have an account?{' '}
              <Link to="/signup" className="text-brand-pink font-semibold hover:underline">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
