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
