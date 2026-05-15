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
  const [contacts, setContacts] = useState([])
  const [isAdding, setIsAdding] = useState(false)
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    relation: '',
    address: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('trusted_contacts')
    if (saved) setContacts(JSON.parse(saved))
  }, [])

  const saveContacts = (updated) => {
    setContacts(updated)
    localStorage.setItem('trusted_contacts', JSON.stringify(updated))
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    let coords = { lat: null, lng: null }
    if (newContact.address) {
      const res = await geocodeContact(newContact.address)
      if (res) coords = res
    }

    const contactToAdd = { ...newContact, ...coords }
    const updated = [...contacts, contactToAdd]
    saveContacts(updated)
    setNewContact({ name: '', phone: '', relation: '', address: '' })
    setIsAdding(false)
    setLoading(false)
  }

  const removeContact = (index) => {
    const updated = contacts.filter((_, i) => i !== index)
    saveContacts(updated)
  }

  return (
    <div className="space-y-4">
      {contacts.map((contact, i) => (
        <div key={i} className="flex items-center justify-between p-3 bg-brand-surface/50 rounded-lg border border-brand-border/30">
          <div>
            <div className="font-semibold text-brand-text-primary">{contact.name}</div>
            <div className="text-xs text-brand-text-secondary">{contact.relation} • {contact.phone}</div>
            {contact.address && (
              <div className="text-[10px] text-brand-purple flex items-center gap-1 mt-1">
                <Map size={10} /> {contact.address} {contact.lat ? '✓' : '✗'}
              </div>
            )}
          </div>
          <button 
            onClick={() => removeContact(i)}
            className="p-2 text-brand-danger hover:bg-brand-danger/10 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ))}

      {isAdding ? (
        <form onSubmit={handleAdd} className="p-4 bg-brand-surface rounded-lg border border-brand-purple/30 space-y-3">
          <input
            placeholder="Name"
            className="w-full bg-brand-bg border border-brand-border rounded-lg p-2 text-sm focus:border-brand-purple outline-none"
            value={newContact.name}
            onChange={e => setNewContact({...newContact, name: e.target.value})}
            required
          />
          <input
            placeholder="Phone Number"
            className="w-full bg-brand-bg border border-brand-border rounded-lg p-2 text-sm focus:border-brand-purple outline-none"
            value={newContact.phone}
            onChange={e => setNewContact({...newContact, phone: e.target.value})}
            required
          />
          <input
            placeholder="Relation (e.g. Mom, Friend)"
            className="w-full bg-brand-bg border border-brand-border rounded-lg p-2 text-sm focus:border-brand-purple outline-none"
            value={newContact.relation}
            onChange={e => setNewContact({...newContact, relation: e.target.value})}
          />
          <input
            placeholder="Their area/address (for safety tracking)"
            className="w-full bg-brand-bg border border-brand-border rounded-lg p-2 text-sm focus:border-brand-purple outline-none"
            value={newContact.address}
            onChange={e => setNewContact({...newContact, address: e.target.value})}
          />
          <div className="flex gap-2 pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-gradient-brand text-white p-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Geocoding...' : 'Save Contact'}
            </button>
            <button 
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 border border-brand-border rounded-lg text-sm"
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
