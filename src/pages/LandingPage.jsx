import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Play, Map, AlertTriangle, Radio, Users, MapPin, Brain, ShieldCheck } from 'lucide-react';
import SOSModal from '../components/SOSModal';

export default function LandingPage() {
  const navigate = useNavigate();
  const [showSOS, setShowSOS] = useState(false);
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  const handleGetStarted = () => {
    if (isLoggedIn) {
      navigate('/app');
    } else {
      navigate('/login');
    }
  };

  const handleDemo = () => {
    // Optional: could set a temporary demo session
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('saferoute_user', JSON.stringify({
      name: 'Demo User',
      email: 'demo@saferoute.ai',
      phone: '+91 98765 43210',
      loginTime: new Date().toISOString()
    }));
    navigate('/app');
  };
  return (
    <div className="min-h-screen bg-brand-bg relative overflow-hidden">
      
      {/* Background Effect */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-brand-purple opacity-20 blur-[100px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 lg:pt-32">
        
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
            Navigate Safe.<br/>
            <span className="text-gradient">Always.</span>
          </h1>
          <p className="text-xl text-brand-text-secondary mb-10 leading-relaxed">
            AI-powered routes that prioritize your safety, not just speed. Join the community mapping the safest paths home.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={handleGetStarted}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-brand rounded-full font-bold text-lg shadow-lg shadow-brand-purple/20 hover:shadow-brand-purple/40 hover:-translate-y-1 transition-all"
            >
              Get Safe Route →
            </button>
            <button 
              onClick={handleDemo}
              className="w-full sm:w-auto px-8 py-4 border-2 border-brand-border hover:border-brand-text-secondary rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-all text-brand-text-primary"
            >
              <Play fill="currentColor" size={20} />
              Try Demo
            </button>
          </div>
        </div>

        {/* Feature Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8 border-y border-brand-border/50 mb-16">
          <div 
            onClick={() => navigate('/app')}
            className="flex flex-col items-center justify-center text-center p-4 rounded-xl border border-transparent hover:border-[#7C3AED] hover:scale-[1.02] transition-all duration-200 cursor-pointer"
          >
            <Map className="text-brand-safe mb-2" size={28} />
            <h3 className="font-semibold mb-1">Safe Routing</h3>
            <p className="text-xs text-brand-text-secondary">AI-analyzed paths</p>
          </div>
          <div 
            onClick={() => setShowSOS(true)}
            className="flex flex-col items-center justify-center text-center p-4 rounded-xl border border-transparent hover:border-[#7C3AED] hover:scale-[1.02] transition-all duration-200 cursor-pointer"
          >
            <AlertTriangle className="text-brand-danger mb-2" size={28} />
            <h3 className="font-semibold mb-1">SOS Alert</h3>
            <p className="text-xs text-brand-text-secondary">Instant emergency response</p>
          </div>
          <div 
            onClick={() => navigate('/track/demo')}
            className="flex flex-col items-center justify-center text-center p-4 rounded-xl border border-transparent hover:border-[#7C3AED] hover:scale-[1.02] transition-all duration-200 cursor-pointer"
          >
            <Radio className="text-brand-info mb-2" size={28} />
            <h3 className="font-semibold mb-1">Live Tracking</h3>
            <p className="text-xs text-brand-text-secondary">Share with trusted contacts</p>
          </div>
          <div 
            onClick={() => navigate('/dashboard')}
            className="flex flex-col items-center justify-center text-center p-4 rounded-xl border border-transparent hover:border-[#7C3AED] hover:scale-[1.02] transition-all duration-200 cursor-pointer"
          >
            <Users className="text-brand-warning mb-2" size={28} />
            <h3 className="font-semibold mb-1">Crowd Reports</h3>
            <p className="text-xs text-brand-text-secondary">Real-time community updates</p>
          </div>
        </div>

        {/* Stats */}
        <div className="text-center mb-24">
          <p className="text-2xl font-semibold text-brand-text-primary">
            <span className="text-brand-safe">2M+</span> safe routes · <span className="text-brand-purple">50K+</span> users · <span className="text-brand-pink">98%</span> satisfaction
          </p>
        </div>

        {/* How It Works */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-brand-text-secondary">Three simple steps to a safer journey</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting Line (hidden on mobile) */}
            <div className="hidden md:block absolute top-1/2 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-brand-purple/20 via-brand-pink/20 to-brand-purple/20 -translate-y-1/2 z-0"></div>
            
            <div className="card-container p-8 text-center relative z-10 bg-brand-bg/80 backdrop-blur">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-surface border border-brand-purple/30 flex items-center justify-center text-brand-purple mb-6 shadow-[0_0_15px_rgba(124,58,237,0.2)]">
                <MapPin size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">Step 1: Enter your destination</h3>
              <p className="text-brand-text-secondary">Input where you are and where you want to go. Select your travel time.</p>
            </div>

            <div className="card-container p-8 text-center relative z-10 bg-brand-bg/80 backdrop-blur">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-brand flex items-center justify-center text-white mb-6 shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                <Brain size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">Step 2: AI analyzes 4 safety factors</h3>
              <p className="text-brand-text-secondary">We check street lighting, CCTV coverage, crowd density, and historical incidents.</p>
            </div>

            <div className="card-container p-8 text-center relative z-10 bg-brand-bg/80 backdrop-blur">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-surface border border-brand-pink/30 flex items-center justify-center text-brand-pink mb-6 shadow-[0_0_15px_rgba(236,72,153,0.2)]">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">Step 3: Get your safest route instantly</h3>
              <p className="text-brand-text-secondary">Choose the route that balances safety with time. Share live location with loved ones.</p>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: "Priya S.", text: "SafeRoute completely changed my commute. I no longer feel anxious walking back from work.", role: "Software Engineer" },
            { name: "Anita K.", text: "The SOS feature is brilliant. Just knowing it's there gives me immense peace of mind.", role: "Student" },
            { name: "Meera R.", text: "I love the community alerts. Knowing about broken streetlights before I get there is a lifesaver.", role: "Freelancer" }
          ].map((t, i) => (
            <div key={i} className="card-container p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-brand-surface flex items-center justify-center text-brand-purple font-bold text-xl border border-brand-border">
                  {t.name[0]}
                </div>
                <div>
                  <h4 className="font-semibold">{t.name}</h4>
                  <p className="text-xs text-brand-text-secondary">{t.role}</p>
                </div>
              </div>
              <p className="text-brand-text-secondary italic">"{t.text}"</p>
            </div>
          ))}
        </div>

      </div>

      {showSOS && (
        <SOSModal 
          isOpen={showSOS}
          onClose={() => setShowSOS(false)} 
        />
      )}
    </div>
  );
}
