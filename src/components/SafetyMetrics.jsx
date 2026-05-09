import React from 'react';
import { Lightbulb, Camera, Users } from 'lucide-react';

export default function SafetyMetrics({ metrics }) {
  const { lighting, cctv, crowd } = metrics;

  const MetricBar = ({ icon: Icon, value, label, colorClass }) => (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center text-xs">
        <span className="flex items-center gap-1 text-brand-text-secondary">
          <Icon size={12} /> {label}
        </span>
        <span className="font-medium text-brand-text-primary">{Math.round(value)}%</span>
      </div>
      <div className="w-full bg-brand-bg rounded-full h-1.5 overflow-hidden">
        <div 
          className={`h-full rounded-full ${colorClass}`} 
          style={{ width: `${Math.max(5, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-brand-border/50">
      <MetricBar 
        icon={Lightbulb} 
        value={lighting} 
        label="Lighting" 
        colorClass={lighting >= 70 ? 'bg-brand-safe' : lighting >= 40 ? 'bg-brand-warning' : 'bg-brand-danger'} 
      />
      <MetricBar 
        icon={Camera} 
        value={cctv} 
        label="CCTV" 
        colorClass={cctv >= 70 ? 'bg-brand-safe' : cctv >= 40 ? 'bg-brand-warning' : 'bg-brand-danger'} 
      />
      <MetricBar 
        icon={Users} 
        value={crowd} 
        label="Crowd" 
        colorClass={crowd >= 70 ? 'bg-brand-safe' : crowd >= 40 ? 'bg-brand-warning' : 'bg-brand-danger'} 
      />
    </div>
  );
}
