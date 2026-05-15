import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Map, Bell, Plus, Shield, Check, X, LogOut } from 'lucide-react';
import { useVoiceNavigation } from '../hooks/useVoiceNavigation';

const geocodeContact = async (address) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
    )
    const data = await res.json()
    if (data[0]) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      }
    }
  } catch (e) {
    console.error("Geocoding failed", e)
  }
  return null
}

const ContactManager = () => {
  const [contacts, setContacts] = useState(() =>
    JSON.parse(localStorage.getItem('trusted_contacts') || '[]')
  );

  const [form, setForm] = useState({
    name: '',
    phone: '',
    relation: '',
    address: ''
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const inputStyle = {
    width: '100%',
    background: '#0a0a0f',
    border: '1px solid #1e293b',
    borderRadius: '10px',
    padding: '12px',
    color: 'white',
    fontSize: '14px',
    marginBottom: '12px',
    outline: 'none'
  };

  const handleAddContact = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      setMsg('❌ Name aur phone zaroori hai!');
      return;
    }
    if (!form.address.trim()) {
      setMsg('❌ Address daalo — tabhi route pe dikhega!');
      return;
    }

    setLoading(true);
    setMsg('📍 Location dhundh raha hai...');

    let lat = null;
    let lng = null;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(form.address)}&format=json&limit=1`
      );
      const data = await res.json();
      if (data[0]) {
        lat = parseFloat(data[0].lat);
        lng = parseFloat(data[0].lon);
      }
    } catch (e) {
      console.error(e);
    }

    setLoading(false);

    const newContact = {
      id: Date.now(),
      name: form.name.trim(),
      phone: form.phone.trim(),
      relation: form.relation.trim() || 'Contact',
      address: form.address.trim(),
      lat,
      lng
    };

    const updated = [...contacts, newContact];
    setContacts(updated);
    localStorage.setItem('trusted_contacts', JSON.stringify(updated));

    setForm({ name: '', phone: '', relation: '', address: '' });

    setMsg(
      lat
        ? `✅ ${newContact.name} added! Route pe dikhega.`
        : `⚠️ ${newContact.name} add hua but location nahi mili. Address clear karo.`
    );

    setTimeout(() => setMsg(''), 4000);
  };

  const handleRemove = (id) => {
    const updated = contacts.filter(c => c.id !== id);
    setContacts(updated);
    localStorage.setItem('trusted_contacts', JSON.stringify(updated));
  };

  return (
    <div>
      <div style={{
        background: '#1a2332',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid #2d3748',
        marginBottom: '20px'
      }}>
        <div style={{
          color: '#a78bfa',
          fontWeight: '600',
          fontSize: '15px',
          marginBottom: '14px'
        }}>
          ➕ Naya Contact Add Karo
        </div>

        {/* Name */}
        <input
          placeholder="👤 Naam (e.g. Mom, Didi)"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          style={inputStyle}
        />

        {/* Phone */}
        <input
          placeholder="📞 Phone Number"
          value={form.phone}
          type="tel"
          onChange={e => setForm({ ...form, phone: e.target.value })}
          style={inputStyle}
        />

        {/* Relation */}
        <input
          placeholder="🔗 Rishta (Mom / Friend / Bhai)"
          value={form.relation}
          onChange={e => setForm({ ...form, relation: e.target.value })}
          style={inputStyle}
        />

        {/* Address - MOST IMPORTANT */}
        <input
          placeholder="📍 Unka area / location (e.g. Pithampur, MP)"
          value={form.address}
          onChange={e => setForm({ ...form, address: e.target.value })}
          style={{
            ...inputStyle,
            border: '1px solid #7c3aed'
          }}
        />
        <div style={{
          fontSize: '11px',
          color: '#64748b',
          marginBottom: '12px',
          marginTop: '-4px'
        }}>
          ⚠️ Yahi important hai — isi se route pe contact dikhega
        </div>

        {/* Message */}
        {msg && (
          <div style={{
            padding: '8px 12px',
            background: msg.includes('✅')
              ? 'rgba(16,185,129,0.1)'
              : msg.includes('❌')
                ? 'rgba(239,68,68,0.1)'
                : 'rgba(124,58,237,0.1)',
            border: `1px solid ${msg.includes('✅') ? '#10b981'
              : msg.includes('❌') ? '#ef4444'
                : '#7c3aed'
              }`,
            borderRadius: '8px',
            color: '#e2e8f0',
            fontSize: '12px',
            marginBottom: '10px'
          }}>
            {msg}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleAddContact}
          disabled={loading}
          style={{
            width: '100%',
            background: loading
              ? '#374151'
              : 'linear-gradient(135deg,#7c3aed,#ec4899)',
            border: 'none',
            borderRadius: '10px',
            padding: '12px',
            color: 'white',
            cursor: loading ? 'wait' : 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          {loading
            ? '📍 Location dhundh raha hai...'
            : '+ Contact Add Karo'
          }
        </button>
      </div>

      <div style={{
        color: '#a78bfa',
        fontWeight: '600',
        fontSize: '15px',
        marginBottom: '12px'
      }}>
        👥 Saved Contacts ({contacts.length})
      </div>

      {contacts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          color: '#64748b',
          padding: '20px',
          background: '#1a2332',
          borderRadius: '12px',
          fontSize: '13px'
        }}>
          Koi contact nahi hai abhi.<br />
          Upar se add karo! 👆
        </div>
      ) : (
        contacts.map(contact => (
          <div key={contact.id} style={{
            background: '#1a2332',
            padding: '14px',
            borderRadius: '12px',
            border: `1px solid ${contact.lat ? '#10b981' : '#ef4444'
              }`,
            marginBottom: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}>
            <div>
              <div style={{
                color: '#e2e8f0',
                fontWeight: '600',
                fontSize: '14px'
              }}>
                👤 {contact.name}
              </div>
              <div style={{
                color: '#64748b',
                fontSize: '12px',
                marginTop: '3px'
              }}>
                📞 {contact.phone}
              </div>
              <div style={{
                color: '#64748b',
                fontSize: '12px'
              }}>
                🔗 {contact.relation}
              </div>
              <div style={{
                fontSize: '11px',
                marginTop: '4px',
                color: contact.lat
                  ? '#10b981'
                  : '#ef4444'
              }}>
                {contact.lat
                  ? `✅ ${contact.address}`
                  : `❌ Location nahi mili`
                }
              </div>
            </div>

            <button
              onClick={() => handleRemove(contact.id)}
              style={{
                background: '#dc2626',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 10px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '12px',
                flexShrink: 0
              }}
            >
              🗑 Remove
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { speak } = useVoiceNavigation();

  useEffect(() => {
    const userData = localStorage.getItem('saferoute_user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('saferoute_user');
    speak("You have been logged out safely.");
    navigate('/login');
  };

  if (!user) return null;
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      
      {/* Profile Header */}
      <div className="card-container p-6 mb-8 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-purple/10 rounded-full blur-[80px] -z-10"></div>
        
        <div className="w-24 h-24 rounded-full bg-gradient-brand p-1 shrink-0">
          <div className="w-full h-full bg-brand-surface rounded-full flex items-center justify-center border-4 border-brand-surface">
            <User size={40} className="text-brand-purple" />
          </div>
        </div>
        
        <div className="text-center md:text-left flex-1">
          <h1 className="text-3xl font-bold text-brand-text-primary mb-1">{user.name || 'User'}</h1>
          <p className="text-brand-text-secondary mb-2">{user.email} • {user.phone}</p>
          {user.loginTime && (
            <p className="text-xs text-brand-text-muted mb-4">
              Last login: {new Date(user.loginTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          )}
          <div className="flex items-center justify-center md:justify-start gap-3">
            <button className="px-4 py-2 border border-brand-border rounded-lg text-sm hover:bg-brand-surface transition-colors">
              Edit Profile
            </button>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-brand-danger/10 text-brand-danger border border-brand-danger/30 rounded-lg text-sm hover:bg-brand-danger hover:text-white transition-all flex items-center gap-2"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
        
        <div className="hidden md:flex flex-col items-center justify-center px-6 border-l border-brand-border">
          <div className="text-3xl font-bold text-brand-safe">98</div>
          <div className="text-xs text-brand-text-secondary uppercase tracking-wider">Safety Score</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Left Column */}
        <div className="space-y-8">
          
          {/* Emergency Contacts */}
          <section>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-brand-text-primary">
              <Phone className="text-brand-danger" size={20} />
              Emergency Contacts
            </h2>
            <div className="card-container p-4">
              <ContactManager />
            </div>
          </section>

          {/* Notifications */}
          <section>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-brand-text-primary">
              <Bell className="text-brand-warning" size={20} />
              Notifications
            </h2>
            <div className="card-container p-4 space-y-4">
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-brand-text-primary">Alert when entering unsafe zone</div>
                  <div className="text-xs text-brand-text-secondary">Push notification warning</div>
                </div>
                <div className="w-6 h-6 rounded bg-brand-safe/20 text-brand-safe flex items-center justify-center">
                  <Check size={14} />
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-brand-border/50">
                <div>
                  <div className="font-medium text-brand-text-primary">Night mode auto-suggestions</div>
                  <div className="text-xs text-brand-text-secondary">Recommend safer routes after 7 PM</div>
                </div>
                <div className="w-6 h-6 rounded bg-brand-safe/20 text-brand-safe flex items-center justify-center">
                  <Check size={14} />
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-brand-border/50">
                <div>
                  <div className="font-medium text-brand-text-primary">Weekly safety report email</div>
                  <div className="text-xs text-brand-text-secondary">Summary of routes taken</div>
                </div>
                <div className="w-6 h-6 rounded bg-brand-surface border border-brand-border text-brand-text-muted flex items-center justify-center">
                  <X size={14} />
                </div>
              </div>

            </div>
          </section>
        </div>

        {/* Right Column */}
        <div>
          {/* Recent Routes */}
          <section>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-brand-text-primary">
              <Map className="text-brand-info" size={20} />
              My Recent Routes
            </h2>
            <div className="space-y-3">
              
              <div className="card-container p-4 hover:bg-brand-surface transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium group-hover:text-brand-purple transition-colors">Rajwada → Vijay Nagar</div>
                  <span className="text-xs text-brand-text-secondary">Today</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-brand-text-secondary">
                  <span className="flex items-center gap-1">
                    <Shield size={14} className="text-brand-safe" /> Safety 87
                  </span>
                  <span>4.2 km</span>
                  <span>18 min</span>
                </div>
              </div>

              <div className="card-container p-4 hover:bg-brand-surface transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium group-hover:text-brand-purple transition-colors">Palasia → LIG</div>
                  <span className="text-xs text-brand-text-secondary">Yesterday</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-brand-text-secondary">
                  <span className="flex items-center gap-1">
                    <Shield size={14} className="text-brand-warning" /> Safety 65
                  </span>
                  <span>3.5 km</span>
                  <span>14 min</span>
                </div>
              </div>

              <div className="card-container p-4 hover:bg-brand-surface transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium group-hover:text-brand-purple transition-colors">Bhawarkuan → Geeta Bhawan</div>
                  <span className="text-xs text-brand-text-secondary">3 days ago</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-brand-text-secondary">
                  <span className="flex items-center gap-1">
                    <Shield size={14} className="text-brand-safe" /> Safety 92
                  </span>
                  <span>5.1 km</span>
                  <span>22 min</span>
                </div>
              </div>

            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
