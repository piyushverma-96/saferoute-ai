import React from 'react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, User, Phone, PhoneCall, UserPlus, Eye, EyeOff, Loader2, Check, X, ShieldAlert } from 'lucide-react';
import { useVoiceNavigation } from '../hooks/useVoiceNavigation';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    emergencyName: '',
    emergencyPhone: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);

  const navigate = useNavigate();
  const { speak } = useVoiceNavigation();

  const handleChange = (e) => {
    let { name, value } = e.target;

    // Phone Auto-formatting
    if (name === 'phone' || name === 'emergencyPhone') {
      // Remove all non-digits
      const digits = value.replace(/\D/g, '');
      // Limit to 10 digits
      const limited = digits.substring(0, 10);
      // Add space after 5 digits
      if (limited.length > 5) {
        value = `${limited.substring(0, 5)} ${limited.substring(5)}`;
      } else {
        value = limited;
      }
    }

    setFormData({ ...formData, [name]: value });
  };

  const getPasswordStrength = () => {
    let strength = 0;
    if (formData.password.length >= 8) strength += 1;
    if (/\d/.test(formData.password)) strength += 1;
    if (/[!@#$%^&*]/.test(formData.password)) strength += 1;
    return strength;
  };

  const renderStrengthBar = () => {
    if (!formData.password) return null;
    const strength = getPasswordStrength();
    let text = "Weak";
    let color = "text-brand-danger";
    let barColors = ["bg-brand-danger", "bg-brand-surface", "bg-brand-surface"];
    
    if (strength === 2) {
      text = "Medium";
      color = "text-brand-warning";
      barColors = ["bg-brand-warning", "bg-brand-warning", "bg-brand-surface"];
    } else if (strength === 3) {
      text = "Strong";
      color = "text-brand-safe";
      barColors = ["bg-brand-safe", "bg-brand-safe", "bg-brand-safe"];
    }

    return (
      <div className="mt-2 flex items-center justify-between">
        <div className="flex gap-1 w-24">
          <div className={`h-1.5 w-full rounded-full ${barColors[0]}`}></div>
          <div className={`h-1.5 w-full rounded-full ${barColors[1]}`}></div>
          <div className={`h-1.5 w-full rounded-full ${barColors[2]}`}></div>
        </div>
        <span className={`text-xs font-medium ${color}`}>{text}</span>
      </div>
    );
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 3000);
  };

  const handleSignup = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.name.length < 2) {
      setError("Name must be at least 2 characters");
      triggerShake();
      setLoading(false); return;
    }

    const phoneRegex = /^[6-9]\d{4}\s\d{5}$/; // Indian number: starts with 6-9, followed by 4 digits, space, 5 digits
    if (!phoneRegex.test(formData.phone)) {
      setError("Please enter valid Indian mobile number");
      triggerShake();
      setLoading(false); return;
    }

    if (!formData.email) {
      setError("Please enter your email");
      triggerShake();
      setLoading(false); return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      triggerShake();
      setLoading(false); return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      triggerShake();
      setLoading(false); return;
    }

    if (!formData.emergencyName) {
      setError("Emergency contact name is required");
      triggerShake();
      setLoading(false); return;
    }

    if (!phoneRegex.test(formData.emergencyPhone)) {
      setError("Please enter valid Indian mobile number for emergency contact");
      triggerShake();
      setLoading(false); return;
    }

    if (!termsAgreed) {
      setError("Please agree to the Terms of Service");
      triggerShake();
      setLoading(false); return;
    }

    setTimeout(() => {
      const userData = {
        name: formData.name,
        email: formData.email,
        phone: '+91 ' + formData.phone,
        emergencyContact: {
          name: formData.emergencyName,
          phone: '+91 ' + formData.emergencyPhone
        },
        loginTime: new Date().toISOString(), // Keep last login time track
        createdAt: new Date().toISOString(),
        userId: 'user_' + Date.now()
      };
      
      localStorage.setItem('saferoute_user', JSON.stringify(userData));
      localStorage.setItem('isLoggedIn', 'true');
      
      speak("Account created successfully. Welcome to SafeRoute AI. You are now protected.");
      navigate('/app');
      setLoading(false);
    }, 2000);
  };

  const handleTerms = (e) => {
    e.preventDefault();
    alert("Mock Terms of Service:\n\n1. SafeRoute AI is an aid, not a guarantee of safety.\n2. We protect your location data.\n3. Stay vigilant.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0A0A0F] relative overflow-hidden py-12 transition-opacity duration-500">
      
      {/* Background Effect */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-brand-pink opacity-10 blur-[120px]"></div>
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-brand text-white shadow-[0_0_20px_rgba(236,72,153,0.3)] mb-4">
            <Shield size={32} />
          </div>
          <h1 className="text-3xl font-bold text-brand-text-primary mb-2">Create Account</h1>
          <p className="text-brand-text-secondary">Join thousands staying safe</p>
        </div>

        <div className="relative rounded-2xl bg-gradient-to-br from-brand-purple/50 to-brand-safe/50 p-[1px] shadow-[0_0_25px_rgba(124,58,237,0.15)]">
          <div className="bg-[#12121A] rounded-2xl p-6 sm:p-8 w-full border border-[rgba(139,92,246,0.3)]">
            <form onSubmit={handleSignup} className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-[#A0A0B0] mb-2">Full Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your full name" 
                    className="w-full bg-[rgba(255,255,255,0.05)] border border-brand-border rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple focus:shadow-[0_0_10px_rgba(124,58,237,0.3)] transition-all text-sm text-brand-text-primary min-h-[48px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#A0A0B0] mb-2">Phone Number</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 flex items-center gap-2">
                    <Phone size={18} className="text-brand-text-muted" />
                    <span className="text-brand-text-primary text-sm font-medium border-r border-brand-border pr-2">+91</span>
                  </div>
                  <input 
                    type="tel" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="98765 43210" 
                    className="w-full bg-[rgba(255,255,255,0.05)] border border-brand-border rounded-lg py-3 pl-[76px] pr-4 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple focus:shadow-[0_0_10px_rgba(124,58,237,0.3)] transition-all text-sm text-brand-text-primary min-h-[48px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#A0A0B0] mb-2">Email Address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com" 
                    className="w-full bg-[rgba(255,255,255,0.05)] border border-brand-border rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple focus:shadow-[0_0_10px_rgba(124,58,237,0.3)] transition-all text-sm text-brand-text-primary min-h-[48px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#A0A0B0] mb-2">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create password" 
                    className="w-full bg-[rgba(255,255,255,0.05)] border border-brand-border rounded-lg py-3 pl-10 pr-10 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple focus:shadow-[0_0_10px_rgba(124,58,237,0.3)] transition-all text-sm text-brand-text-primary min-h-[48px]"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-text-primary"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {renderStrengthBar()}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#A0A0B0] mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
                  <input 
                    type="password" 
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat password" 
                    className="w-full bg-[rgba(255,255,255,0.05)] border border-brand-border rounded-lg py-3 pl-10 pr-10 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple focus:shadow-[0_0_10px_rgba(124,58,237,0.3)] transition-all text-sm text-brand-text-primary min-h-[48px]"
                  />
                  {formData.confirmPassword && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {formData.password === formData.confirmPassword ? (
                        <Check size={18} className="text-brand-safe" />
                      ) : (
                        <X size={18} className="text-brand-danger" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <div className="text-xs font-semibold text-brand-text-muted uppercase mb-3">Emergency Contact</div>
                <div className="space-y-3">
                  <div className="relative">
                    <ShieldAlert size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
                    <input 
                      type="text" 
                      name="emergencyName"
                      value={formData.emergencyName}
                      onChange={handleChange}
                      placeholder="Trusted person's name" 
                      className="w-full bg-[rgba(255,255,255,0.05)] border border-brand-border rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple focus:shadow-[0_0_10px_rgba(124,58,237,0.3)] transition-all text-sm text-brand-text-primary min-h-[48px]"
                    />
                  </div>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 flex items-center gap-2">
                      <PhoneCall size={18} className="text-brand-text-muted" />
                      <span className="text-brand-text-primary text-sm font-medium border-r border-brand-border pr-2">+91</span>
                    </div>
                    <input 
                      type="tel" 
                      name="emergencyPhone"
                      value={formData.emergencyPhone}
                      onChange={handleChange}
                      placeholder="98765 43210" 
                      className="w-full bg-[rgba(255,255,255,0.05)] border border-brand-border rounded-lg py-3 pl-[76px] pr-4 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple focus:shadow-[0_0_10px_rgba(124,58,237,0.3)] transition-all text-sm text-brand-text-primary min-h-[48px]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-start mt-4 pt-2">
                <input 
                  type="checkbox" 
                  id="terms"
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-brand-border bg-[rgba(255,255,255,0.05)] text-brand-purple focus:ring-brand-purple"
                />
                <label htmlFor="terms" className="ml-2 text-xs text-[#A0A0B0] leading-snug">
                  I agree to SafeRoute AI <a href="#" onClick={handleTerms} className="text-brand-purple hover:underline">Terms of Service</a>
                </label>
              </div>

              {error && (
                <div className={`text-brand-danger text-sm text-center font-medium ${shake ? 'animate-[shake_0.3s_ease-in-out]' : ''}`}>
                  {error}
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-4 bg-gradient-to-r from-brand-purple to-brand-pink text-white font-bold rounded-xl shadow-lg shadow-brand-purple/20 hover:shadow-brand-purple/40 hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2 min-h-[48px]"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Setting up your account...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Create My Safe Account 🛡
                  </>
                )}
              </button>

            </form>

            <div className="mt-6 text-center text-sm text-[#A0A0B0]">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-purple font-semibold hover:underline">
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
