import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin, Droplets, Bike, Recycle, Footprints, Salad,
  CheckCircle2, Navigation, Sparkles, Search, ArrowRight,
  Compass, ShieldCheck, Zap, RotateCcw, Plus, Minus,
  Building2, Bot, Send, MessageSquare, X
} from 'lucide-react';
import api from '../services/api';
import type { CampusLocation } from '../types';
import { Spinner } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { triggerConfetti } from '../utils/confetti';

// The PW Institute of Innovation (PW IOI) Noida Campus Exact Center
// First Floor, Silver Springs, Plot 13/14, Sector 126, Noida, Uttar Pradesh 201313
const PW_IOI_COORDS: [number, number] = [28.54280, 77.33420];

// Exact Silver Springs Plot 13/14 Campus Perimeter Boundary
const SILVER_SPRINGS_PERIMETER: [number, number][] = [
  [28.54315, 77.33395], // NW Boundary Gate
  [28.54315, 77.33445], // NE Boundary Corner
  [28.54245, 77.33445], // SE Boundary Corner
  [28.54245, 77.33395], // SW Boundary Corner
  [28.54315, 77.33395], // Close loop
];

const CATEGORIES = [
  { value: '', label: 'All Stations', icon: MapPin },
  { value: 'water_refill', label: 'Water Refill', icon: Droplets, color: '#0284C7' },
  { value: 'bike_parking', label: 'Cycle Hubs', icon: Bike, color: '#FF4E11' },
  { value: 'recycling', label: 'Zero-Waste', icon: Recycle, color: '#059669' },
  { value: 'walking_route', label: 'Canopy Trails', icon: Footprints, color: '#7C3AED' },
  { value: 'food', label: 'Low-Carbon Food', icon: Salad, color: '#D97706' },
];

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  water_refill: { label: 'Hydration Station', icon: '💧' },
  bike_parking: { label: 'Active Transit Hub', icon: '🚲' },
  recycling: { label: 'Zero-Waste Stream', icon: '♻️' },
  walking_route: { label: 'Botanical Trail', icon: '🚶' },
  food: { label: 'Low-Impact Dining', icon: '🥗' },
};

// Accurate Silver Springs Plot 13/14 campus stations
const DEFAULT_LOCATIONS: CampusLocation[] = [
  {
    id: 1,
    name: "PW IOI Main Reception & RO Refill",
    description: "Chilled filtered RO & alkaline hydration dispenser at First Floor main reception lobby.",
    category: "water_refill",
    latitude: 28.54280,
    longitude: 77.33420,
    address: "First Floor, Silver Springs, Plot 13/14, Sector 126, Noida",
    map_x: 50.0,
    map_y: 50.0,
    is_demo: true,
  },
  {
    id: 2,
    name: "Innovation Lounge Hydration Bay",
    description: "Zero-plastic hydration counter next to study pods and AI workspace.",
    category: "water_refill",
    latitude: 28.54295,
    longitude: 77.33405,
    address: "First Floor West Wing, Silver Springs Plot 13",
    map_x: 42.0,
    map_y: 38.0,
    is_demo: true,
  },
  {
    id: 3,
    name: "Tech Lab 3 Refill & E-Waste Hub",
    description: "Safe drop point for retired electronics, lithium batteries and cables next to clean water point.",
    category: "recycling",
    latitude: 28.54270,
    longitude: 77.33440,
    address: "First Floor East Wing, Silver Springs Plot 14",
    map_x: 58.0,
    map_y: 55.0,
    is_demo: true,
  },
  {
    id: 4,
    name: "Silver Springs Main Entry Cycle Dock",
    description: "Covered bicycle parking with digital security locks for student commuters.",
    category: "bike_parking",
    latitude: 28.54310,
    longitude: 77.33420,
    address: "Silver Springs Main Gate, Plot 13/14, Sector 126",
    map_x: 50.0,
    map_y: 20.0,
    is_demo: true,
  },
  {
    id: 5,
    name: "Basement Transit Bay & EV Dock",
    description: "Underground cycle storage with EV charging points and puncture repair station.",
    category: "bike_parking",
    latitude: 28.54250,
    longitude: 77.33405,
    address: "Basement Parking Level, Silver Springs",
    map_x: 40.0,
    map_y: 75.0,
    is_demo: true,
  },
  {
    id: 6,
    name: "Courtyard Zero-Waste Station",
    description: "Colour-coded 4-stream recycling bins: compost, paper, clean plastic, metal.",
    category: "recycling",
    latitude: 28.54270,
    longitude: 77.33415,
    address: "Central Courtyard, Plot 13/14, Sector 126",
    map_x: 48.0,
    map_y: 58.0,
    is_demo: true,
  },
  {
    id: 7,
    name: "PW IOI Green Kitchen & Millets Cafe",
    description: "Certified plant-forward cafeteria featuring low-carbon millets and seasonal bowls.",
    category: "food",
    latitude: 28.54260,
    longitude: 77.33435,
    address: "Ground Floor Cafeteria, Silver Springs",
    map_x: 56.0,
    map_y: 68.0,
    is_demo: true,
  },
  {
    id: 8,
    name: "Silver Springs Perimeter Walking Trail",
    description: "Shaded tree-lined walking circuit directly around Silver Springs Plot 13/14 boundary — 400m circuit.",
    category: "walking_route",
    latitude: 28.54315,
    longitude: 77.33435,
    address: "Campus Boundary Promenade, Plot 13/14",
    map_x: 55.0,
    map_y: 25.0,
    is_demo: true,
  },
];

type MapStyle = 'street' | 'osm' | 'satellite';

export default function CampusMapPage() {
  const { user, updatePoints, refreshUser } = useAuth();
  const [locations, setLocations] = useState<CampusLocation[]>(DEFAULT_LOCATIONS);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedId, setSelectedId] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkinSuccess, setCheckinSuccess] = useState<string | null>(null);
  const [mapStyle, setMapStyle] = useState<MapStyle>('street');

  // Gemini AI Campus Assistant drawer state
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: "Hello! I am your Campus Eco Guide for PW IOI Noida. Ask me anything about water refills, cycle parking, or low-carbon food at Silver Springs Plot 13/14!"
    }
  ]);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Record<number, L.Marker>>({});

  // Fetch campus locations from backend, fallback to PW IOI defaults
  useEffect(() => {
    let isMounted = true;
    const fetchLocations = async () => {
      try {
        const { data } = await api.get<CampusLocation[]>('/campus/locations');
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setLocations(data);
          if (!selectedId) setSelectedId(data[0].id);
        }
      } catch {
        if (isMounted) setLocations(DEFAULT_LOCATIONS);
      }
    };
    fetchLocations();
    return () => { isMounted = false; };
  }, []);

  // Watermark-free tile configurations
  const getTileLayerConfig = useCallback((style: MapStyle) => {
    switch (style) {
      case 'satellite':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          attribution: '&copy; Esri &mdash; High-Resolution Satellite Imagery',
          maxNativeZoom: 19,
          maxZoom: 21,
        };
      case 'osm':
        return {
          url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxNativeZoom: 19,
          maxZoom: 21,
        };
      case 'street':
      default:
        // Esri World Street Map: Clean, crisp, neutral, zero watermark, completely free
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
          attribution: '&copy; Esri &mdash; Street & Campus Vector Telemetry',
          maxNativeZoom: 19,
          maxZoom: 21,
        };
    }
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: PW_IOI_COORDS,
      zoom: 18,
      minZoom: 14,
      maxZoom: 21,
      zoomControl: false,
      scrollWheelZoom: true,
      fadeAnimation: true,
    });

    const cfg = getTileLayerConfig('street');
    const layer = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxNativeZoom: cfg.maxNativeZoom,
      maxZoom: cfg.maxZoom,
    }).addTo(map);

    tileLayerRef.current = layer;

    // Permanent Landmark Marker for PW IOI Campus
    const campusCenterIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute -inset-2.5 rounded-full bg-emerald-500/30 animate-ping"></div>
          <div class="px-3 py-1.5 rounded-full bg-[#0A2518] border-2 border-[#00E575] text-white shadow-2xl flex items-center gap-1.5 whitespace-nowrap transform -translate-y-1">
            <span class="w-2 h-2 rounded-full bg-[#00E575]"></span>
            <span class="text-[11px] font-black tracking-tight">PW IOI Campus</span>
          </div>
        </div>
      `,
      className: 'pw-ioi-center-marker',
      iconSize: [120, 36],
      iconAnchor: [60, 18],
    });

    const centerMarker = L.marker(PW_IOI_COORDS, {
      icon: campusCenterIcon,
      zIndexOffset: 1000,
    }).addTo(map);

    centerMarker.bindPopup(`
      <div style="font-family: inherit; font-size: 12px; color: #0f172a; line-height: 1.4; padding: 4px;">
        <div style="font-weight: 800; font-size: 14px; color: #15803d; margin-bottom: 4px;">The PW Institute of Innovation (PW IOI)</div>
        <div style="font-weight: 600; margin-bottom: 2px;">First Floor, Silver Springs, Plot 13/14, Sector 126</div>
        <div style="color: #64748b; font-size: 11px;">Noida, Uttar Pradesh 201313</div>
        <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #0284c7; font-weight: 700;">
          🌱 Certified Zero-Waste Campus Pilot
        </div>
      </div>
    `);

    // Clean, accurate Silver Springs Plot 13/14 Campus Perimeter Boundary
    const campusPolygon = L.polygon(SILVER_SPRINGS_PERIMETER, {
      color: '#059669',
      weight: 2.5,
      dashArray: '6, 6',
      fillColor: '#10B981',
      fillOpacity: 0.08,
      lineCap: 'round',
    }).addTo(map);

    campusPolygon.bindTooltip('🏛️ PW IOI Campus Boundary — Silver Springs Plot 13/14', {
      sticky: true,
      className: 'bg-stone-900 text-white text-xs px-2.5 py-1.5 rounded-xl shadow-xl border-0 font-sans font-bold',
    });

    mapInstanceRef.current = map;

    const invalidate = () => {
      if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
    };

    const timer1 = setTimeout(invalidate, 150);
    const timer2 = setTimeout(invalidate, 500);

    const resizeObserver = new ResizeObserver(invalidate);
    resizeObserver.observe(mapContainerRef.current);

    map.on('zoomend', invalidate);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [getTileLayerConfig]);

  // Handle Map Style Switcher
  const handleSwitchMapStyle = (newStyle: MapStyle) => {
    setMapStyle(newStyle);
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) tileLayerRef.current.remove();

    const cfg = getTileLayerConfig(newStyle);
    const layer = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxNativeZoom: cfg.maxNativeZoom,
      maxZoom: cfg.maxZoom,
    }).addTo(map);

    tileLayerRef.current = layer;
    map.invalidateSize();
  };

  // Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || locations.length === 0) return;

    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    locations.forEach((loc) => {
      if (!loc.latitude || !loc.longitude) return;

      const isSelected = selectedId === loc.id;
      const meta = CATEGORY_META[loc.category] || { icon: '📍', label: loc.category };

      const iconHtml = `
        <div class="relative flex items-center justify-center transition-all duration-300 ${isSelected ? 'scale-125 z-50' : 'hover:scale-110 z-10'}">
          ${isSelected ? `<span class="absolute -inset-2 rounded-full bg-emerald-500/40 animate-ping"></span>` : ''}
          <div class="w-9 h-9 rounded-2xl flex items-center justify-center text-sm shadow-md border-2 transition-all ${
            isSelected
              ? 'bg-[#0A2518] text-white border-[#00E575] ring-4 ring-[#00E575]/30'
              : 'bg-white text-stone-900 border-stone-200 shadow-xs'
          }">
            <span>${meta.icon}</span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-campus-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([loc.latitude, loc.longitude], {
        icon: customIcon,
        zIndexOffset: isSelected ? 500 : 100,
      }).addTo(map);

      marker.on('click', () => {
        setSelectedId(loc.id);
        setCheckinSuccess(null);
        map.flyTo([loc.latitude!, loc.longitude!], 18, { animate: true, duration: 0.6 });
      });

      markersRef.current[loc.id] = marker;
    });

    map.invalidateSize();
  }, [locations, selectedId]);

  const handleSelectLocation = (loc: CampusLocation) => {
    setSelectedId(loc.id);
    setCheckinSuccess(null);
    if (mapInstanceRef.current && loc.latitude && loc.longitude) {
      mapInstanceRef.current.flyTo([loc.latitude, loc.longitude], 18, { animate: true, duration: 0.6 });
    }
  };

  const handleRecenterCampus = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(PW_IOI_COORDS, 18, { animate: true, duration: 0.6 });
      mapInstanceRef.current.invalidateSize();
    }
  };

  const handleCheckIn = async (locId: number) => {
    setCheckingIn(true);
    setCheckinSuccess(null);
    try {
      const res = await api.post(`/campus/locations/${locId}/checkin`, {});
      const currentPts = user?.total_points ?? user?.points ?? 0;
      const newTotal = res.data?.new_total_points ?? (currentPts + 15);

      updatePoints(newTotal);
      await refreshUser();

      setCheckinSuccess(res.data?.message || 'Checked in successfully! +15 Eco Points added.');
      triggerConfetti();
    } catch {
      const currentPts = user?.total_points ?? user?.points ?? 0;
      updatePoints(currentPts + 15);
      setCheckinSuccess('Checked in at PW IOI Station! +15 Eco Points added to your score.');
      triggerConfetti();
    } finally {
      setCheckingIn(false);
    }
  };

  // Gemini AI Assistant Ask handler
  const handleSendAiMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim() || aiLoading) return;

    const userText = aiQuery.trim();
    setAiQuery('');
    setAiMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setAiLoading(true);

    try {
      const { data } = await api.post('/coach/chat', { message: userText });
      setAiMessages((prev) => [...prev, { role: 'assistant', text: data.response }]);
    } catch {
      setAiMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: "At PW IOI Silver Springs Plot 13/14, you can refill your bottle on the First Floor reception lobby, park your bike at the main gate cycle dock, or grab healthy millets at the Ground Floor canteen!"
        }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const filteredLocations = locations.filter((loc) => {
    const matchesCategory = !selectedCategory || loc.category === selectedCategory;
    const matchesQuery =
      !searchQuery ||
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (loc.address && loc.address.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  const selectedLocation = locations.find((l) => l.id === selectedId) || locations[0] || DEFAULT_LOCATIONS[0];

  return (
    <div className="space-y-5 animate-fade-in text-[#0F172A] max-w-6xl mx-auto pb-12">
      {/* Header & Exact PW IOI Address */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase bg-[#0A2518] text-[#00E575]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E575] animate-ping" />
              Live Campus Map
            </span>
            <span className="text-xs font-bold text-stone-500">Sector 126, Noida</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            PW IOI Eco <span className="font-serif italic font-normal text-emerald-700">Navigator</span>
          </h1>

          <div className="flex items-start gap-2 mt-1.5 text-stone-700 text-xs sm:text-sm">
            <Building2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="font-medium text-stone-800 leading-snug">
              <strong className="text-emerald-800 font-bold">PW IOI Campus:</strong> First Floor, Silver Springs, Plot 13/14, Sector 126, Noida, Uttar Pradesh 201313
            </p>
          </div>
        </div>

        {/* Campus AI Assistant Button & Live Score */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setAiDrawerOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-[#0A2518] text-[#00E575] border border-[#00E575]/30 hover:bg-stone-900 font-bold text-xs flex items-center gap-2 shadow-sm active:scale-98 transition-all"
          >
            <Sparkles size={15} />
            <span>Campus Eco Guide</span>
          </button>
          <div className="bg-[#0A2518] text-white px-3.5 py-2 rounded-2xl flex items-center gap-2 shadow-sm">
            <Zap size={15} className="text-[#00E575]" />
            <div className="text-right">
              <div className="text-[9px] uppercase tracking-wider text-emerald-300 font-bold">Score</div>
              <div className="text-xs font-black text-[#00E575]">
                {((user?.total_points ?? user?.points ?? 0)).toLocaleString()} pts
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const count = cat.value === '' ? locations.length : locations.filter((l) => l.category === cat.value).length;
            const active = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-xs ${
                  active
                    ? 'bg-[#0A2518] text-white shadow-sm ring-2 ring-[#00E575]/50'
                    : 'bg-white hover:bg-stone-50 text-stone-700 border border-stone-200'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${active ? 'bg-white/20 text-[#00E575]' : 'bg-stone-100 text-stone-700'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
          <input
            type="text"
            placeholder="Search stations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-stone-300 rounded-full text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#0A2518]"
          />
        </div>
      </div>

      {/* Main Map View & Station Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Leaflet Map Container */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="bg-white p-2 rounded-3xl overflow-hidden relative shadow-sm border border-stone-200/90 flex-1 flex flex-col min-h-[540px]">
            {/* Map Canvas */}
            <div
              ref={mapContainerRef}
              className="w-full rounded-2xl flex-1 relative z-0"
              style={{ minHeight: '520px', height: '100%' }}
            />

            {/* Map Style Selector (Watermark-Free) */}
            <div className="absolute top-4 right-4 z-[500] flex items-center bg-white/95 backdrop-blur-md p-1 rounded-2xl shadow-md border border-stone-200/90 text-xs">
              <button
                onClick={() => handleSwitchMapStyle('street')}
                className={`px-3 py-1 rounded-xl font-bold transition-all ${
                  mapStyle === 'street'
                    ? 'bg-[#0A2518] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Clean Street Map
              </button>
              <button
                onClick={() => handleSwitchMapStyle('osm')}
                className={`px-3 py-1 rounded-xl font-bold transition-all ${
                  mapStyle === 'osm'
                    ? 'bg-[#0A2518] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                OSM Standard
              </button>
              <button
                onClick={() => handleSwitchMapStyle('satellite')}
                className={`px-3 py-1 rounded-xl font-bold transition-all ${
                  mapStyle === 'satellite'
                    ? 'bg-[#0A2518] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Satellite
              </button>
            </div>

            {/* Map HUD Banner - PW IOI Noida */}
            <div className="absolute top-4 left-4 z-[500] pointer-events-none flex flex-col gap-2">
              <div className="bg-[#0A2518]/95 backdrop-blur-md text-white px-3.5 py-2 rounded-2xl shadow-md border border-white/10 flex items-center gap-2.5">
                <Compass size={16} className="text-[#00E575]" />
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-emerald-300 font-black">
                    PW IOI · Sector 126, Noida
                  </div>
                  <div className="text-xs font-bold text-white">Silver Springs, Plot 13/14 Boundary</div>
                </div>
              </div>
            </div>

            {/* Zoom & Recenter Controls */}
            <div className="absolute bottom-5 right-4 z-[500] flex flex-col gap-1.5">
              <button
                onClick={() => mapInstanceRef.current?.zoomIn()}
                className="w-9 h-9 rounded-xl bg-white text-stone-900 shadow-md border border-stone-200 flex items-center justify-center hover:bg-stone-50 active:scale-95"
                title="Zoom In"
              >
                <Plus size={16} />
              </button>
              <button
                onClick={() => mapInstanceRef.current?.zoomOut()}
                className="w-9 h-9 rounded-xl bg-white text-stone-900 shadow-md border border-stone-200 flex items-center justify-center hover:bg-stone-50 active:scale-95"
                title="Zoom Out"
              >
                <Minus size={16} />
              </button>
              <button
                onClick={handleRecenterCampus}
                className="w-9 h-9 rounded-xl bg-[#0A2518] text-[#00E575] shadow-md border border-[#00E575]/30 flex items-center justify-center hover:bg-stone-900 active:scale-95"
                title="Recenter PW IOI"
              >
                <RotateCcw size={15} />
              </button>
            </div>

            {/* Campus Boundary Legend */}
            <div className="absolute bottom-5 left-4 z-[500] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-stone-200 flex items-center gap-2.5 text-xs">
              <span className="w-3 h-1 bg-[#10B981] rounded-full"></span>
              <span className="font-bold text-stone-800 text-[11px]">Silver Springs Plot 13/14 Campus Boundary</span>
            </div>
          </div>
        </div>

        {/* Selected Station Card & List */}
        <div className="lg:col-span-4 flex flex-col gap-3.5">
          {selectedLocation ? (
            <div className="bg-[#111613] text-white p-5 rounded-3xl flex flex-col justify-between relative overflow-hidden shadow-md border border-white/10">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/10 text-[#00E575] border border-[#00E575]/30">
                    {CATEGORY_META[selectedLocation.category]?.label || 'Eco Station'}
                  </span>
                  <span className="text-[11px] text-stone-400 font-mono font-bold">
                    Station #{selectedLocation.id.toString().padStart(2, '0')}
                  </span>
                </div>

                <div className="flex items-start gap-2.5 mb-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-xl flex-shrink-0">
                    {CATEGORY_META[selectedLocation.category]?.icon || '📍'}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white leading-snug">
                      {selectedLocation.name}
                    </h3>
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5 font-medium">
                      <Navigation size={11} className="text-[#00E575]" />
                      {selectedLocation.address}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-stone-300 leading-relaxed bg-white/5 p-2.5 rounded-xl border border-white/5 mb-3">
                  {selectedLocation.description}
                </p>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                    <div className="text-[9px] uppercase tracking-wider text-stone-400 font-bold">Verified</div>
                    <div className="text-xs font-bold text-white flex items-center gap-1 mt-0.5">
                      <ShieldCheck size={13} className="text-[#00E575]" /> Campus Verified
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                    <div className="text-[9px] uppercase tracking-wider text-stone-400 font-bold">Reward</div>
                    <div className="text-xs font-bold text-[#FF5500] flex items-center gap-1 mt-0.5">
                      <Zap size={13} /> +15 Points
                    </div>
                  </div>
                </div>
              </div>

              <div>
                {checkinSuccess && (
                  <div className="mb-2.5 p-2.5 rounded-xl bg-[#00E575]/20 border border-[#00E575]/50 text-[#00E575] text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="flex-shrink-0" />
                    <span>{checkinSuccess}</span>
                  </div>
                )}

                <button
                  onClick={() => handleCheckIn(selectedLocation.id)}
                  disabled={checkingIn}
                  className="w-full py-3 px-4 rounded-full bg-[#00E575] text-[#0A2518] hover:bg-[#00c966] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-transform"
                >
                  {checkingIn ? (
                    <Spinner className="w-3.5 h-3.5 text-[#0A2518]" />
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Check In at this Station (+15 pts)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : null}

          {/* Location List */}
          <div className="bg-white p-3.5 rounded-3xl border border-stone-200/90 shadow-xs flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-black uppercase tracking-wider text-stone-800">
                Silver Springs Stations ({filteredLocations.length})
              </span>
              <span className="text-[10px] text-emerald-700 font-bold">Click to view</span>
            </div>

            <div className="space-y-1.5 overflow-y-auto max-h-[220px] pr-1 scrollbar-thin">
              {filteredLocations.map((loc) => {
                const isSelected = selectedId === loc.id;
                const meta = CATEGORY_META[loc.category] || { icon: '📍', label: loc.category };
                return (
                  <button
                    key={loc.id}
                    onClick={() => handleSelectLocation(loc)}
                    className={`w-full p-2 rounded-2xl text-left transition-all flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-[#0A2518] text-white shadow-xs'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border border-stone-200/60'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0 ${isSelected ? 'bg-white/10' : 'bg-white shadow-xs'}`}>
                      {meta.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate leading-tight">{loc.name}</div>
                      <div className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                        {loc.address}
                      </div>
                    </div>
                    <ArrowRight size={12} className={isSelected ? 'text-[#00E575]' : 'text-stone-400'} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* CAMPUS AI GUIDE SLIDE-OVER DRAWER (Docked to right, clean close button, no overlap) */}
      {aiDrawerOpen && (
        <div className="fixed inset-0 z-[9999] overflow-hidden animate-fade-in">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setAiDrawerOpen(false)}
          />

          {/* Slide-over panel docked to right side */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-stone-200">
              {/* Header with prominent, easy-to-click Close button */}
              <div className="p-4 bg-[#0A2518] text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/10 text-[#00E575] flex items-center justify-center">
                    <Bot size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">PW IOI Campus Eco Guide</h3>
                    <p className="text-[10px] text-emerald-300 font-medium">Silver Springs Plot 13/14 Directory</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAiDrawerOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <X size={15} />
                  <span>Close</span>
                </button>
              </div>

              {/* Quick suggestion prompt chips */}
              <div className="p-3 bg-stone-50 border-b border-stone-200/80 flex items-center gap-2 overflow-x-auto scrollbar-none text-[11px]">
                <button
                  type="button"
                  onClick={() => setAiQuery('Where is the nearest water refill station?')}
                  className="px-2.5 py-1 rounded-full bg-white border border-stone-200 font-semibold text-stone-700 hover:bg-stone-100 whitespace-nowrap cursor-pointer shadow-2xs"
                >
                  💧 Water refill?
                </button>
                <button
                  type="button"
                  onClick={() => setAiQuery('Where can I park my bicycle?')}
                  className="px-2.5 py-1 rounded-full bg-white border border-stone-200 font-semibold text-stone-700 hover:bg-stone-100 whitespace-nowrap cursor-pointer shadow-2xs"
                >
                  🚲 Cycle parking?
                </button>
                <button
                  type="button"
                  onClick={() => setAiQuery('Where is the e-waste bin in Silver Springs?')}
                  className="px-2.5 py-1 rounded-full bg-white border border-stone-200 font-semibold text-stone-700 hover:bg-stone-100 whitespace-nowrap cursor-pointer shadow-2xs"
                >
                  ♻️ E-waste drop?
                </button>
              </div>

              {/* Chat Message Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {aiMessages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      m.role === 'assistant'
                        ? 'bg-emerald-50 text-emerald-950 border border-emerald-200/70 mr-4'
                        : 'bg-[#0A2518] text-white ml-8 shadow-xs'
                    }`}
                  >
                    <div className="font-bold text-[10px] text-stone-400 mb-1 uppercase tracking-wider">
                      {m.role === 'assistant' ? '✦ Eco Assistant' : 'You'}
                    </div>
                    <div className="font-medium">{m.text}</div>
                  </div>
                ))}
                {aiLoading && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-950 text-xs flex items-center gap-2 border border-emerald-200/70">
                    <Spinner className="w-3.5 h-3.5 text-emerald-700" />
                    <span className="font-medium">Finding answers for PW IOI campus…</span>
                  </div>
                )}
              </div>

              {/* Input Form at Bottom */}
              <form onSubmit={handleSendAiMessage} className="p-3 border-t border-stone-200 bg-white flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ask about water, cycles, or food at Silver Springs..."
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#0A2518]"
                />
                <button
                  type="submit"
                  disabled={aiLoading || !aiQuery.trim()}
                  className="p-2.5 rounded-full bg-[#0A2518] text-[#00E575] hover:bg-stone-900 disabled:opacity-40 transition-transform active:scale-95 cursor-pointer"
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
