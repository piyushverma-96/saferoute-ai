import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-brand-bg relative overflow-hidden">
      
      {/* Background Effect */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-brand-danger opacity-10 blur-[120px]"></div>
      </div>

      <div className="text-center relative z-10 max-w-md">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-brand-danger/10 text-brand-danger border border-brand-danger/30 shadow-lg shadow-brand-danger/10 mb-8 animate-pulse">
          <ShieldAlert size={48} />
        </div>
        
        <h1 className="text-6xl font-black text-brand-text-primary mb-4 tracking-tighter">404</h1>
        
        <h2 className="text-xl font-bold text-brand-text-primary mb-4">
          You seem lost. This route doesn't exist.
        </h2>
        
        <p className="text-brand-text-secondary mb-10">
          The page you are looking for has either been moved or doesn't exist anymore. Let's get you back on a safe path.
        </p>
        
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-brand text-white font-bold rounded-xl shadow-lg shadow-brand-purple/20 hover:shadow-brand-purple/40 hover:-translate-y-0.5 transition-all"
        >
          <Home size={20} />
          Go Home
        </Link>
      </div>
    </div>
  );
}
