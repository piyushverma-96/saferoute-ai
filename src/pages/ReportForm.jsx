import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flag, MapPin, Clock, Camera, CheckCircle2, Navigation, AlertTriangle, ShieldCheck, UserX, Upload, Loader2 } from 'lucide-react';
import { useAlerts } from '../context/AlertsContext';
import { reverseGeocode } from '../utils/geocoding';
import { useOfflineStatus } from '../hooks/useOfflineStatus';
import { queueReport } from '../utils/offlineStorage';
import { useVoiceNavigation } from '../hooks/useVoiceNavigation';
import { showToast } from '../components/Toast';

const incidentTypes = [
  "Harassment",
  "Poor Lighting", 
  "Suspicious Activity",
  "Unsafe Road",
  "Crowd Alert",
  "Eve Teasing",
  "Theft/Robbery",
  "Safe Zone (positive report)"
];

export default function ReportForm() {
  const [incidentType, setIncidentType] = useState('Poor Lighting');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [photo, setPhoto] = useState(null);
  
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [wasQueued, setWasQueued] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(false);

  const { alerts, addAlert } = useAlerts();
  const { isOffline } = useOfflineStatus();
  const navigate = useNavigate();
  const { speak } = useVoiceNavigation();

  const handleAutoLocate = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const address = await reverseGeocode(latitude, longitude);
        setLocation(address);
        setIsLocating(false);
      },
      (error) => {
        console.error(error);
        setError('Unable to retrieve your location');
        setIsLocating(false);
      }
    );
  };

  const handlePhotoUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0].name);
    }
  };

  const processSubmit = () => {
    setIsSubmitting(true);
    
    setTimeout(() => {
      const newAlert = {
        type: incidentType,
        location: location,
        description: description,
        severity: severity,
        anonymous: isAnonymous,
        photo: photo
      };

      if (isOffline) {
        queueReport(newAlert);
        setWasQueued(true);
      } else {
        setWasQueued(false);
      }
      
      addAlert(newAlert);
      
      speak("Report submitted successfully. Thank you for keeping the community safe.");
      showToast(newAlert);

      setIsSubmitted(true);
      setIsSubmitting(false);

      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    }, 1500);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!incidentType || !location || description.length < 10) {
      setError("Please fill all required fields (Description must be at least 10 characters)");
      return;
    }

    // Duplicate Prevention Check
    const tenMinsAgo = Date.now() - 600000;
    const isDuplicate = alerts.some(a => 
      a.type === incidentType && 
      a.location.toLowerCase().includes(location.split(',')[0].toLowerCase()) &&
      a.timestamp > tenMinsAgo
    );

    if (isDuplicate && !duplicateWarning) {
      setDuplicateWarning(true);
      return;
    }

    processSubmit();
  };

  if (isSubmitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-brand-safe/20 text-brand-safe mb-6 animate-[scaleIn_0.5s_ease-out]">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-3xl font-bold mb-3 text-brand-text-primary">Report Submitted Successfully!</h2>
        <p className="text-brand-text-secondary text-lg mb-6">Your report is now live on the dashboard.</p>
        
        {wasQueued ? (
          <div className="text-brand-warning bg-brand-warning/10 border border-brand-warning/30 p-3 rounded-lg inline-block mb-6">
            <span className="font-bold">📡 Saved offline</span> — will sync when online
          </div>
        ) : (
          <p className="text-brand-text-secondary mb-6">Redirecting to dashboard in 3s...</p>
        )}
        
        <div className="flex justify-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple/80 transition-colors"
          >
            View Dashboard
          </button>
          <button 
            onClick={() => {
              setIsSubmitted(false);
              setDescription('');
              setDuplicateWarning(false);
            }}
            className="px-6 py-2 border border-brand-border rounded-lg text-sm hover:bg-brand-surface transition-colors"
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-text-primary mb-2 flex items-center gap-3">
          <Flag className="text-brand-purple" /> Report an Incident
        </h1>
        <p className="text-brand-text-secondary">Help others by reporting unsafe areas or incidents.</p>
      </div>

      <div className="card-container p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-2">Incident Type</label>
            <select 
              value={incidentType}
              onChange={(e) => setIncidentType(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border rounded-lg py-3 px-4 focus:outline-none focus:border-brand-purple transition-colors appearance-none"
            >
              {incidentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-2">Location</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
                <input 
                  type="text" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Area name, Indore" 
                  className="w-full bg-brand-bg border border-brand-border rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-brand-purple transition-colors"
                  required
                />
              </div>
              <button
                type="button"
                onClick={handleAutoLocate}
                disabled={isLocating}
                className="px-4 bg-brand-surface border border-brand-border rounded-lg text-brand-purple hover:bg-brand-purple/10 transition-colors flex items-center justify-center disabled:opacity-50"
                title="Use GPS"
              >
                {isLocating ? (
                  <span className="animate-spin w-5 h-5 border-2 border-brand-purple/20 border-t-brand-purple rounded-full"></span>
                ) : (
                  <span className="flex items-center gap-1 text-sm font-medium">
                    <Navigation size={18} /> GPS
                  </span>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="flex justify-between items-center text-sm font-medium text-brand-text-secondary mb-2">
              <span>Description</span>
              <span className={`text-xs ${description.length < 10 ? 'text-brand-danger' : 'text-brand-text-muted'}`}>
                {description.length}/200
              </span>
            </label>
            <textarea 
              rows="4" 
              maxLength="200"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened..."
              className="w-full bg-brand-bg border border-brand-border rounded-lg p-4 focus:outline-none focus:border-brand-purple transition-colors resize-none"
              required
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-3">Severity</label>
            <div className="grid grid-cols-3 gap-3">
              <label className="cursor-pointer">
                <input type="radio" name="severity" value="high" checked={severity === 'high'} onChange={(e) => setSeverity(e.target.value)} className="peer sr-only" />
                <div className="flex flex-col items-center justify-center py-3 border border-brand-border rounded-lg text-sm peer-checked:border-brand-danger peer-checked:bg-brand-danger/10 peer-checked:text-brand-danger transition-all">
                  <AlertTriangle size={20} className="mb-1 text-brand-danger" />
                  🔴 High Risk
                </div>
              </label>
              <label className="cursor-pointer">
                <input type="radio" name="severity" value="medium" checked={severity === 'medium'} onChange={(e) => setSeverity(e.target.value)} className="peer sr-only" />
                <div className="flex flex-col items-center justify-center py-3 border border-brand-border rounded-lg text-sm peer-checked:border-brand-warning peer-checked:bg-brand-warning/10 peer-checked:text-brand-warning transition-all">
                  <AlertTriangle size={20} className="mb-1 text-brand-warning" />
                  🟡 Moderate
                </div>
              </label>
              <label className="cursor-pointer">
                <input type="radio" name="severity" value="low" checked={severity === 'low'} onChange={(e) => setSeverity(e.target.value)} className="peer sr-only" />
                <div className="flex flex-col items-center justify-center py-3 border border-brand-border rounded-lg text-sm peer-checked:border-brand-safe peer-checked:bg-brand-safe/10 peer-checked:text-brand-safe transition-all">
                  <ShieldCheck size={20} className="mb-1 text-brand-safe" />
                  🟢 Safe/Positive
                </div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-y border-brand-border/50">
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-brand-bg peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-brand-text-secondary peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-purple border border-brand-border"></div>
              </label>
              <span className="text-sm font-medium text-brand-text-primary flex items-center gap-2">
                Report anonymously 
                {isAnonymous ? <UserX size={16} className="text-brand-purple" /> : null}
              </span>
            </div>
            {!isAnonymous && (
              <span className="text-xs text-brand-text-secondary">
                As: {JSON.parse(localStorage.getItem('saferoute_user'))?.name || 'User'}
              </span>
            )}
          </div>

          <div>
            <label className="flex items-center justify-center gap-2 w-full py-4 border border-dashed border-brand-border rounded-lg cursor-pointer hover:bg-brand-surface transition-colors text-sm text-brand-text-muted hover:text-brand-purple">
              {photo ? (
                <>
                  <CheckCircle2 size={18} className="text-brand-safe" />
                  <span className="text-brand-safe font-medium">{photo}</span>
                </>
              ) : (
                <>
                  <Camera size={18} />
                  <span>📷 Add Photo (optional)</span>
                </>
              )}
              <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
            </label>
          </div>

          {error && (
            <div className="text-brand-danger text-sm font-medium text-center">
              {error}
            </div>
          )}

          {duplicateWarning && (
            <div className="bg-brand-warning/10 border border-brand-warning/30 rounded-lg p-4 text-center">
              <p className="text-brand-warning text-sm font-bold mb-3 flex items-center justify-center gap-2">
                <AlertTriangle size={16} />
                ⚠ Similar report already exists for this area.
              </p>
              <div className="flex justify-center gap-3">
                <button 
                  type="button" 
                  onClick={processSubmit}
                  className="px-4 py-2 bg-brand-warning text-brand-bg font-bold rounded hover:bg-brand-warning/90 transition-colors text-sm"
                >
                  Yes, Submit Anyway
                </button>
                <button 
                  type="button"
                  onClick={() => setDuplicateWarning(false)}
                  className="px-4 py-2 border border-brand-border text-brand-text-secondary rounded hover:bg-brand-surface transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!duplicateWarning && (
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-brand-purple to-brand-pink text-white font-bold rounded-xl shadow-lg shadow-brand-purple/20 hover:shadow-brand-purple/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <><Loader2 size={18} className="animate-spin" /> Submitting...</>
              ) : (
                <><Upload size={18} /> Submit Report</>
              )}
            </button>
          )}

        </form>
      </div>
    </div>
  );
}
