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
  const [contacts, setContacts] = useState(() => {
    return JSON.parse(localStorage.getItem('trusted_contacts') || '[]')
  })
  const [isAdding, setIsAdding] = useState(false)
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    relation: '',
    address: '',
    lat: null,
    lng: null
  })
  const [loading, setLoading] = useState(false)

  const geocodeAddress = async (address) => {
    if (!address || address.length < 3) return null
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
    } catch(e) {
      console.error('Geocode failed:', e)
    }
    return null
  }

  const loadDemoContacts = () => {
    const DEMO_CONTACTS = [
      { id: 1, name: 'Mom', phone: '9876543210', relation: 'Family', address: 'Pithampur, Madhya Pradesh', lat: 22.6177, lng: 75.6953 },
      { id: 2, name: 'Best Friend', phone: '9123456789', relation: 'Friend', address: 'Mhow, Indore', lat: 22.5518, lng: 75.7587 },
      { id: 3, name: 'Uncle', phone: '9988776655', relation: 'Family', address: 'Sanwer, Indore', lat: 22.9728, lng: 75.8309 },
      { id: 4, name: 'Colleague', phone: '9876512345', relation: 'Work', address: 'Vijay Nagar, Indore', lat: 22.7533, lng: 75.8937 }
    ]
    localStorage.setItem('trusted_contacts', JSON.stringify(DEMO_CONTACTS))
    setContacts(DEMO_CONTACTS)
    alert('Demo contacts loaded ✅\nNow go to Map and search any route!')
  }

  const addContact = async (e) => {
    e.preventDefault()
    if (!newContact.name || !newContact.phone) {
      alert('Name and phone required!')
      return
    }

    setLoading(true)
    let lat = null, lng = null

    if (newContact.address) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(newContact.address)}&format=json&limit=1`
        )
        const data = await res.json()
        if (data[0]) {
          lat = parseFloat(data[0].lat)
          lng = parseFloat(data[0].lon)
        }
      } catch(e) {
        console.error('Geocode error:', e)
      }
    }

    const contact = {
      id: Date.now(),
      name: newContact.name,
      phone: newContact.phone,
      relation: newContact.relation || 'Contact',
      address: newContact.address || '',
      lat,
      lng
    }

    const updated = [...contacts, contact]
    setContacts(updated)
    localStorage.setItem('trusted_contacts', JSON.stringify(updated))

    alert(`${contact.name} added! ${
      lat ? 'Location found ✅' 
          : '❌ Location not found - be more specific'
    }`)

    setNewContact({ name:'', phone:'', relation:'', address:'', lat:null, lng:null })
    setIsAdding(false)
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <button 
        onClick={loadDemoContacts}
        className="w-full p-3 text-xs bg-brand-surface border border-brand-purple/30 text-brand-purple rounded-lg hover:bg-brand-purple/5 transition-all flex items-center justify-center gap-2 font-medium mb-2"
      >
        🎯 Load Demo Contacts (for testing)
      </button>

      {contacts.map((c, i) => (
        <div key={i} className="flex items-center justify-between p-3 bg-brand-surface/50 rounded-lg border border-brand-border/30">
          <div>
            <div className="font-semibold text-brand-text-primary">👤 {c.name}</div>
            <div className="text-xs text-brand-text-secondary">📞 {c.phone} • 🔗 {c.relation}</div>
            <div className="text-[10px] text-brand-text-muted mt-1 flex items-center gap-1">
              📍 {c.address || 'No address saved'}
              {c.lat ? <span className="text-brand-safe font-bold">✅</span> : <span className="text-brand-danger font-bold">❌ No Location</span>}
            </div>
          </div>
          <button 
            onClick={() => {
              const updated = contacts.filter((_, idx) => idx !== i)
              setContacts(updated)
              localStorage.setItem('trusted_contacts', JSON.stringify(updated))
            }}
            className="p-2 text-brand-danger hover:bg-brand-danger/10 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ))}

      {isAdding ? (
        <form onSubmit={addContact} className="p-4 bg-brand-surface rounded-lg border border-brand-purple/30 space-y-3">
          <input
            placeholder="Full Name *"
            className="w-full bg-brand-bg border border-brand-border rounded-lg p-2 text-sm focus:border-brand-purple outline-none"
            value={newContact.name}
            onChange={e => setNewContact({...newContact, name: e.target.value})}
            required
          />
          <input
            placeholder="Phone Number *"
            className="w-full bg-brand-bg border border-brand-border rounded-lg p-2 text-sm focus:border-brand-purple outline-none"
            value={newContact.phone}
            onChange={e => setNewContact({...newContact, phone: e.target.value})}
            required
          />
          <input
            placeholder="Relation (Mom/Friend/etc)"
            className="w-full bg-brand-bg border border-brand-border rounded-lg p-2 text-sm focus:border-brand-purple outline-none"
            value={newContact.relation}
            onChange={e => setNewContact({...newContact, relation: e.target.value})}
          />
          <input
            placeholder="Their area/address e.g. Vijay Nagar, Indore *"
            className="w-full bg-brand-bg border border-brand-border rounded-lg p-2 text-sm focus:border-brand-purple outline-none"
            value={newContact.address}
            onChange={e => setNewContact({...newContact, address: e.target.value})}
            required
          />
          <div className="text-[10px] text-brand-text-muted italic">
            ⚠ Address is required to show them on your route map.
          </div>
          <div className="flex gap-2 pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-gradient-brand text-white p-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Finding Location...' : '+ Add Contact'}
            </button>
            <button 
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 border border-brand-border rounded-lg text-sm text-brand-text-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full flex items-center justify-center gap-2 p-3 text-sm text-brand-purple hover:bg-brand-purple/5 border border-dashed border-brand-purple/30 rounded-lg transition-colors font-medium"
        >
          <Plus size={16} /> Add Trusted Contact
        </button>
      )}
    </div>
  )
}

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
