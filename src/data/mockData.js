export const mockRoutes = [
  {
    id: 1,
    name: "Safest Route",
    score: 87,
    dist: "4.2 km",
    time: "18 min",
    color: "var(--color-brand-safe)",
    tags: ["Well-lit", "CCTV covered", "Police patrol", "Busy road"],
    metrics: { lighting: 88, cctv: 85, crowd: 72 }
  },
  {
    id: 2,
    name: "Balanced Route",
    score: 65,
    dist: "3.5 km",
    time: "14 min",
    color: "var(--color-brand-warning)",
    tags: ["Some CCTV", "Moderate crowd", "Faster"],
    metrics: { lighting: 60, cctv: 55, crowd: 50 }
  },
  {
    id: 3,
    name: "Fastest Route",
    score: 42,
    dist: "2.8 km",
    time: "10 min",
    color: "var(--color-brand-danger)",
    tags: ["Poor lighting", "Isolated area", "Past incidents"],
    metrics: { lighting: 28, cctv: 22, crowd: 20 }
  }
];

export const mockAlerts = [
  { id: 1, color: "var(--color-brand-danger)", time: "10 min ago", text: "Dark stretch near Annapurna area reported" },
  { id: 2, color: "var(--color-brand-warning)", time: "45 min ago", text: "Suspicious vehicle on Sapna-Sangeeta Rd" },
  { id: 3, color: "var(--color-brand-safe)", time: "2 hr ago", text: "New CCTV installed at MG Rd crossing" },
  { id: 4, color: "var(--color-brand-danger)", time: "5 hr ago", text: "Incident at Old Palasia lane" }
];

export const mockStats = {
  routesToday: 1247,
  sosAlerts: 3,
  incidents: 12,
  activeUsers: 89
};

export const mockContacts = [
  {
    id: 1,
    name: 'Mom',
    phone: '+91 98765 43210',
    avatar: '👩',
    location: {
      lat: 22.7250,
      lng: 75.8800,
      address: 'Vijay Nagar, Indore'
    },
    isOnline: true,
    lastSeen: 'Just now'
  },
  {
    id: 2,
    name: 'Best Friend',
    phone: '+91 87654 32109',
    avatar: '👧',
    location: {
      lat: 22.7150,
      lng: 75.8650,
      address: 'Palasia, Indore'
    },
    isOnline: true,
    lastSeen: '2 min ago'
  },
  {
    id: 3,
    name: 'Sister',
    phone: '+91 76543 21098',
    avatar: '👱‍♀️',
    location: {
      lat: 22.7300,
      lng: 75.8750,
      address: 'Rajwada, Indore'
    },
    isOnline: false,
    lastSeen: '15 min ago'
  },
  {
    id: 4,
    name: 'College Friend',
    phone: '+91 65432 10987',
    avatar: '🧑',
    location: {
      lat: 22.7180,
      lng: 75.8900,
      address: 'MG Road, Indore'
    },
    isOnline: true,
    lastSeen: 'Just now'
  }
]

export const safeStops = [
  {
    id: 1,
    name: 'Mom',
    avatar: '👩',
    phone: '+91 98765 43210',
    position: 0.3,
    isOnline: true,
    address: 'Near Palasia Square'
  },
  {
    id: 2,
    name: 'Best Friend',
    avatar: '👧',
    phone: '+91 87654 32109',
    position: 0.6,
    isOnline: true,
    address: 'Near Vijay Nagar'
  },
  {
    id: 3,
    name: 'Sister',
    avatar: '👱‍♀️',
    phone: '+91 76543 21098',
    position: 0.8,
    isOnline: false,
    address: 'Near MG Road'
  }
]
