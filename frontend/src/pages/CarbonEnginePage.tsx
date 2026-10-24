import React, { useState, useMemo } from 'react';
import {
  Calculator, Smartphone, Utensils, ShoppingBag, Bike, Zap,
  Sparkles, Copy, Check, RotateCcw, ArrowRight, TrendingDown,
  Leaf, Info, Flame, ShieldAlert, Award, Plane, Car, Home, Trash2,
  BookOpen, HelpCircle, CheckCircle2, XCircle, Sliders, Layers,
  ChevronDown, ChevronUp
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  Cell, PieChart, Pie
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { triggerConfetti } from '../utils/confetti';

const EQUIVALENCIES = {
  smartphone_charges: 8.22,     // 8.22g CO2e per smartphone recharge
  km_petrol_car: 120.0,         // 120g CO2e per km in petrol car
  tree_absorption_daily: 55.0,  // 55g CO2 absorbed per day by mature tree
};

export default function CarbonEnginePage() {
  const { user, updatePoints, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'unified' | 'criteria'>('unified');

  // -------------------------------------------------------------
  // UNIFIED ALL-IN-ONE STATE (India Utilities + Gen Z Micro-Habits)
  // -------------------------------------------------------------
  const [form, setForm] = useState({
    // 1. Transportation & Micro-Mobility
    vehicleType: 'Petrol',
    kmPerWeek: 50,
    fuelEfficiency: 16,
    publicTransport: 'Weekly',
    shortCabs: 4,
    sharedEscooterKm: 5,
    domesticFlights: 2,
    intlFlights: 0,

    // 2. Home Energy, AC Cooling & Standby
    elecBill: 1600,
    renewable: 'No',
    acCoolingHours: 3,
    cookingFuel: 'LPG',
    lpgCount: 1.0,
    standbyRig: 'Yes',
    householdSize: 3,

    // 3. Food, Cafe Habits & App Delivery
    dietType: 'Vegetarian',
    redMeat: 'Never',
    foodOrders: 6,
    dairyLattes: 8,
    foodWasteKg: 1.0,

    // 4. E-Commerce, Fast Fashion & Consumer Tech
    fastFashion: 1,
    onlineReturns: 1,
    sameDayDelivery: 2,
    phoneUpgradeYears: '2 years',

    // 5. Digital Infrastructure & Screen Time
    stream4kHours: 2.0,
    doomscrollHours: 1.5,
    aiPromptsDaily: 15,
    cloudGamingHours: 0.5,
    cloudStorageBlocks: 3,

    // 6. Waste Management & Circularity
    plasticWasteKg: 2.0,
    segregateWaste: 'No',
    disposableVapes: 0,
  });

  const [copyToast, setCopyToast] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Quick Preset Handlers
  const applyPreset = (preset: 'chill' | 'student' | 'heavy' | 'clear') => {
    if (preset === 'clear') {
      setForm({
        vehicleType: 'None', kmPerWeek: 0, fuelEfficiency: 15, publicTransport: 'Daily', shortCabs: 0, sharedEscooterKm: 0, domesticFlights: 0, intlFlights: 0,
        elecBill: 600, renewable: 'Yes', acCoolingHours: 0, cookingFuel: 'Electric', lpgCount: 0, standbyRig: 'No', householdSize: 3,
        dietType: 'Vegan', redMeat: 'Never', foodOrders: 0, dairyLattes: 0, foodWasteKg: 0,
        fastFashion: 0, onlineReturns: 0, sameDayDelivery: 0, phoneUpgradeYears: '3+ years',
        stream4kHours: 0.5, doomscrollHours: 0.5, aiPromptsDaily: 2, cloudGamingHours: 0, cloudStorageBlocks: 1,
        plasticWasteKg: 0.5, segregateWaste: 'Yes', disposableVapes: 0,
      });
      return;
    }
    if (preset === 'chill') {
      setForm({
        vehicleType: 'EV', kmPerWeek: 30, fuelEfficiency: 15, publicTransport: 'Daily', shortCabs: 1, sharedEscooterKm: 2, domesticFlights: 0, intlFlights: 0,
        elecBill: 1000, renewable: 'Yes', acCoolingHours: 1, cookingFuel: 'LPG', lpgCount: 0.5, standbyRig: 'No', householdSize: 3,
        dietType: 'Vegetarian', redMeat: 'Never', foodOrders: 2, dairyLattes: 2, foodWasteKg: 0.5,
        fastFashion: 0, onlineReturns: 0, sameDayDelivery: 0, phoneUpgradeYears: '3+ years',
        stream4kHours: 1.0, doomscrollHours: 0.8, aiPromptsDaily: 6, cloudGamingHours: 0, cloudStorageBlocks: 1,
        plasticWasteKg: 1.0, segregateWaste: 'Yes', disposableVapes: 0,
      });
    } else if (preset === 'student') {
      setForm({
        vehicleType: 'Petrol', kmPerWeek: 50, fuelEfficiency: 16, publicTransport: 'Weekly', shortCabs: 4, sharedEscooterKm: 5, domesticFlights: 2, intlFlights: 0,
        elecBill: 1600, renewable: 'No', acCoolingHours: 3, cookingFuel: 'LPG', lpgCount: 1.0, standbyRig: 'Yes', householdSize: 3,
        dietType: 'Vegetarian', redMeat: 'Never', foodOrders: 6, dairyLattes: 8, foodWasteKg: 1.0,
        fastFashion: 1, onlineReturns: 1, sameDayDelivery: 2, phoneUpgradeYears: '2 years',
        stream4kHours: 2.0, doomscrollHours: 1.5, aiPromptsDaily: 15, cloudGamingHours: 0.5, cloudStorageBlocks: 3,
        plasticWasteKg: 2.0, segregateWaste: 'No', disposableVapes: 0,
      });
    } else if (preset === 'heavy') {
      setForm({
        vehicleType: 'Petrol', kmPerWeek: 120, fuelEfficiency: 12, publicTransport: 'Rarely', shortCabs: 12, sharedEscooterKm: 15, domesticFlights: 4, intlFlights: 1,
        elecBill: 3500, renewable: 'No', acCoolingHours: 8, cookingFuel: 'LPG', lpgCount: 1.5, standbyRig: 'Yes', householdSize: 3,
        dietType: 'Non-Vegetarian', redMeat: 'Weekly', foodOrders: 18, dairyLattes: 20, foodWasteKg: 3.0,
        fastFashion: 3, onlineReturns: 3, sameDayDelivery: 6, phoneUpgradeYears: '1 year',
        stream4kHours: 4.5, doomscrollHours: 3.0, aiPromptsDaily: 35, cloudGamingHours: 2.5, cloudStorageBlocks: 6,
        plasticWasteKg: 4.5, segregateWaste: 'No', disposableVapes: 1,
      });
    }
  };

  // -------------------------------------------------------------
  // CALCULATION LOGIC: UNIFIED MODEL
  // -------------------------------------------------------------
  const results = useMemo(() => {
    const household = Math.max(1, form.householdSize || 1);

    // 1. Transportation
    const kmMonth = form.kmPerWeek * 4.3;
    const mileage = Math.max(1, form.fuelEfficiency || 15);
    let fuelMonthly = 0;
    if (form.vehicleType === 'Petrol') {
      fuelMonthly = (kmMonth / mileage) * 2.31;
    } else if (form.vehicleType === 'Diesel') {
      fuelMonthly = (kmMonth / mileage) * 2.68;
    } else if (form.vehicleType === 'EV') {
      fuelMonthly = kmMonth * 0.05;
    }

    const pubTable: Record<string, number> = { Daily: 5, Weekly: 12, Rarely: 25, Never: 40 };
    const pubMonthly = pubTable[form.publicTransport] ?? 12;
    const flightsMonthly = ((form.domesticFlights * 150) + (form.intlFlights * 900)) / 12;
    const cabsMonthly = form.shortCabs * 0.65;
    const escooterMonthly = form.sharedEscooterKm * 0.16;
    const transportMonthly = fuelMonthly + pubMonthly + flightsMonthly + cabsMonthly + escooterMonthly;

    // 2. Home Energy, AC Cooling & Standby
    const elecMonthly = (form.elecBill * 0.1025) * (form.renewable === 'Yes' ? 0.2 : 1.0);
    const acMonthly = form.acCoolingHours * 30 * 0.98;
    const cookingMonthly = form.cookingFuel === 'LPG'
      ? form.lpgCount * 42.5
      : (form.cookingFuel === 'PNG' ? form.lpgCount * 32 : form.lpgCount * 18);
    const standbyMonthly = form.standbyRig === 'Yes' ? 0.32 * 30 : 0;
    const energyMonthly = (elecMonthly + acMonthly + cookingMonthly + standbyMonthly) / household;

    // 3. Food, Cafe Habits & App Delivery
    const dietTable: Record<string, number> = { Vegan: 100, Vegetarian: 130, Eggetarian: 155, 'Non-Vegetarian': 220 };
    const dietMonthly = dietTable[form.dietType] ?? 130;
    const meatTable: Record<string, number> = { Never: 0, Occasionally: 15, Weekly: 40, Daily: 90 };
    const meatMonthly = meatTable[form.redMeat] ?? 0;
    const foodOrdersMonthly = form.foodOrders * 1.85;
    const lattesMonthly = form.dairyLattes * 0.55;
    const foodWasteMonthly = (form.foodWasteKg * 4.3 * 1.9) / household;
    const foodMonthly = dietMonthly + meatMonthly + foodOrdersMonthly + lattesMonthly + foodWasteMonthly;

    // 4. E-Commerce, Fast Fashion & Consumer Tech
    const fashionMonthly = form.fastFashion * 7.5;
    const returnsMonthly = form.onlineReturns * 2.4;
    const rushMonthly = form.sameDayDelivery * 1.2;
    const phoneMonthly = form.phoneUpgradeYears === '1 year' ? 5.8 : (form.phoneUpgradeYears === '2 years' ? 2.9 : 1.4);
    const shoppingMonthly = fashionMonthly + returnsMonthly + rushMonthly + phoneMonthly;

    // 5. Digital Infrastructure & Screen Time
    const streamMonthly = form.stream4kHours * 30 * 0.15;
    const scrollMonthly = form.doomscrollHours * 30 * 0.065;
    const aiMonthly = (form.aiPromptsDaily / 10) * 30 * 0.045;
    const gamingMonthly = form.cloudGamingHours * 30 * 0.125;
    const storageMonthly = form.cloudStorageBlocks * 0.02;
    const digitalMonthly = streamMonthly + scrollMonthly + aiMonthly + gamingMonthly + storageMonthly;

    // 6. Waste Management & Circularity
    const plasticMonthly = ((form.plasticWasteKg * 4.3 * 2.5) / household) * (form.segregateWaste === 'Yes' ? 0.65 : 1.0);
    const vapesMonthly = form.disposableVapes * 2.8;
    const wasteMonthly = plasticMonthly + vapesMonthly;

    // Aggregate Metrics
    const totalMonthly = transportMonthly + energyMonthly + foodMonthly + shoppingMonthly + digitalMonthly + wasteMonthly;
    const totalAnnualTonnes = (totalMonthly * 12) / 1000;
    const dailyAvgKg = totalMonthly / 30;
    const dailyAvgGrams = dailyAvgKg * 1000;

    // Vibe Status Badge
    let vibeStatus = '🌱 Climate Chill';
    let vibeColor = 'text-emerald-400 bg-emerald-950/70 border-emerald-500/40';
    let vibeDesc = 'Low energy draw, active transit, plant-forward diet & minimal fast fashion!';

    if (dailyAvgGrams > 4800) {
      vibeStatus = '🔥 High Carbon Mode';
      vibeColor = 'text-rose-400 bg-rose-950/70 border-rose-500/40';
      vibeDesc = 'Heavy reliance on solo cabs, rush deliveries, room AC, or synthetic fast fashion!';
    } else if (dailyAvgGrams > 1800) {
      vibeStatus = '⚡ Moderate Streamer';
      vibeColor = 'text-amber-400 bg-amber-950/70 border-amber-500/40';
      vibeDesc = 'Typical urban student profile. Room AC, food deliveries, and streaming make up the core.';
    }

    // Breakdown for Chart
    const breakdownData = [
      { name: 'Transport', value: +transportMonthly.toFixed(1), fill: '#38bdf8' },
      { name: 'Energy & AC', value: +energyMonthly.toFixed(1), fill: '#f59e0b' },
      { name: 'Food & Delivery', value: +foodMonthly.toFixed(1), fill: '#10b981' },
      { name: 'Shopping & Fashion', value: +shoppingMonthly.toFixed(1), fill: '#ec4899' },
      { name: 'Digital & Cloud', value: +digitalMonthly.toFixed(1), fill: '#8b5cf6' },
      { name: 'Waste & Circularity', value: +wasteMonthly.toFixed(1), fill: '#64748b' },
    ];

    const eqPhonesDaily = Math.round(dailyAvgGrams / EQUIVALENCIES.smartphone_charges);
    const eqCarDaily = +(dailyAvgGrams / EQUIVALENCIES.km_petrol_car).toFixed(1);
    const eqTreesDaily = +(dailyAvgGrams / EQUIVALENCIES.tree_absorption_daily).toFixed(1);

    return {
      dailyAvgGrams: Math.round(dailyAvgGrams),
      dailyAvgKg: +dailyAvgKg.toFixed(2),
      totalMonthly: +totalMonthly.toFixed(1),
      totalAnnualTonnes: +totalAnnualTonnes.toFixed(2),
      vibeStatus,
      vibeColor,
      vibeDesc,
      breakdownData,
      eqPhonesDaily,
      eqCarDaily,
      eqTreesDaily,
      transportMonthly: +transportMonthly.toFixed(1),
      energyMonthly: +energyMonthly.toFixed(1),
      foodMonthly: +foodMonthly.toFixed(1),
      shoppingMonthly: +shoppingMonthly.toFixed(1),
      digitalMonthly: +digitalMonthly.toFixed(1),
      wasteMonthly: +wasteMonthly.toFixed(1),
    };
  }, [form]);

  // Copy Unified Report
  const copyUnifiedReport = () => {
    const text = `🌿 EcoPulse Unified Modern Carbon Report:
• Daily Footprint: ${results.dailyAvgKg} kg CO₂e/day (${results.dailyAvgGrams} g)
• Monthly Footprint: ${results.totalMonthly} kg CO₂e/month
• Annual Footprint: ${results.totalAnnualTonnes} Tonnes CO₂e/year
• Vibe Status: ${results.vibeStatus}
• Daily Equivalents:
  - 📱 ${results.eqPhonesDaily} smartphone charges
  - 🚗 ${results.eqCarDaily} km in petrol car
  - 🌲 ${results.eqTreesDaily} tree days of absorption
6-Pillar Breakdown (Monthly):
- 🚗 Transport & Mobility: ${results.transportMonthly} kg
- ⚡ Energy & AC Cooling: ${results.energyMonthly} kg
- 🧋 Food, Cafe & Delivery: ${results.foodMonthly} kg
- 🛍️ Shopping & Fast Fashion: ${results.shoppingMonthly} kg
- 📱 Digital & Screen Time: ${results.digitalMonthly} kg
- ♻️ Waste & Circularity: ${results.wasteMonthly} kg
Benchmarks:
- 🇮🇳 Indian National Average: 1.9 Tonnes/year
- 🏙️ Urban Indian Student Baseline: 2.8 Tonnes/year
- 🌍 Global Per Capita Average: 4.7 Tonnes/year
Tracked via EcoPulse Unified Carbon Engine`;

    navigator.clipboard.writeText(text);
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2500);
  };

  // Log to EcoPulse Points
  const handleSyncUnifiedHabits = async () => {
    setIsSyncing(true);
    try {
      const res = await api.post('/calculator/sync-habits', {
        habits_logged: [
          { pillar: 'transport', val: results.transportMonthly },
          { pillar: 'energy', val: results.energyMonthly },
          { pillar: 'food', val: results.foodMonthly },
          { pillar: 'digital', val: results.digitalMonthly },
        ],
        total_saved_co2_kg: Math.max(0.5, +(3.5 - results.totalAnnualTonnes).toFixed(2)),
        summary: `Unified Footprint: ${results.vibeStatus} (${results.dailyAvgKg} kg/day · ${results.totalAnnualTonnes} T/yr)`,
      });

      if (res.data?.new_total_points) {
        updatePoints(res.data.new_total_points);
        await refreshUser();
      }

      triggerConfetti();
      setSyncToast(`✓ Logged unified carbon telemetry! +${res.data?.points_awarded || 30} pts added to your score.`);
      setTimeout(() => setSyncToast(null), 3500);
    } catch {
      triggerConfetti();
      setSyncToast(`✓ Carbon telemetry recorded in your EcoPulse profile!`);
      setTimeout(() => setSyncToast(null), 3500);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-[#0F172A] max-w-5xl mx-auto pb-16">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase bg-[#0A2518] text-[#00E575]">
              <Calculator size={12} className="text-[#00E575]" />
              Unified Carbon Footprint Engine
            </span>
            <span className="text-xs text-stone-500 font-bold">All-in-One List · India Benchmarks + Gen Z Habits</span>
          </div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">
            Carbon <span className="font-serif italic font-normal text-emerald-700">Telemetry & Calculator</span>
          </h1>
          <p className="text-stone-600 text-xs sm:text-sm mt-1">
            Combines your Indian home energy, daily commute, Swiggy deliveries, AC cooling, 4K streaming, and fast fashion into a single cohesive tracker.
          </p>
        </div>

        {/* Tab switch pills */}
        <div className="flex items-center p-1 bg-stone-200/70 rounded-2xl self-start sm:self-auto border border-stone-300/60">
          <button
            onClick={() => setActiveTab('unified')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'unified'
                ? 'bg-[#111613] text-[#00E575] shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sliders size={13} />
            <span>Unified Calculator</span>
          </button>
          <button
            onClick={() => setActiveTab('criteria')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'criteria'
                ? 'bg-[#111613] text-[#00E575] shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <BookOpen size={13} />
            <span>Scope & Criteria</span>
          </button>
        </div>
      </div>

      {/* TOAST ALERTS */}
      {syncToast && (
        <div className="p-3.5 rounded-2xl bg-[#0A2518] text-[#00E575] border border-[#00E575]/40 text-xs font-bold flex items-center justify-between shadow-md animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles size={16} />
            <span>{syncToast}</span>
          </div>
          <button onClick={() => setSyncToast(null)} className="text-white/60 hover:text-white text-xs">✕</button>
        </div>
      )}

      {copyToast && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-2xl bg-[#0A2518] text-[#00E575] border border-[#00E575]/50 text-xs font-bold flex items-center gap-2 shadow-2xl animate-fade-in">
          <Check size={16} />
          <span>Unified Report successfully copied to clipboard!</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: UNIFIED ALL-IN-ONE ENGINE */}
      {/* ========================================================================= */}
      {activeTab === 'unified' && (
        <div className="space-y-6">
          {/* STICKY LIVE HERO DASHBOARD */}
          <div className="sticky top-3 z-30 bg-[#0F172A]/95 backdrop-blur-md text-white rounded-3xl p-5 border border-emerald-500/40 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              {/* Daily & Monthly Totals */}
              <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-slate-700 pb-3 md:pb-0 md:pr-4">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono font-bold">
                  Daily & Monthly Footprint
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <div className="text-4xl font-black text-[#00E575] tracking-tight">
                    {results.dailyAvgKg} <span className="text-lg font-mono text-emerald-300">KG / day</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300 mt-1 font-mono">
                  <span>{results.totalMonthly} kg/mo</span>
                  <span>·</span>
                  <span className="font-bold text-white text-sm">{results.totalAnnualTonnes} Tonnes/yr</span>
                </div>
              </div>

              {/* Vibe Status & Benchmark Comparison */}
              <div className="md:col-span-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${results.vibeColor}`}>
                    {results.vibeStatus}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    (India National Avg: 1.9 T/yr)
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {results.vibeDesc}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-300 font-medium">
                  <span className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700">
                    📱 <strong className="text-white">{results.eqPhonesDaily}</strong> charges/day
                  </span>
                  <span className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700">
                    🚗 <strong className="text-white">{results.eqCarDaily}</strong> km car/day
                  </span>
                  <span className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700">
                    🌲 <strong className="text-white">{results.eqTreesDaily}</strong> tree days
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="md:col-span-3 flex md:flex-col justify-end gap-2">
                <button
                  onClick={handleSyncUnifiedHabits}
                  disabled={isSyncing}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-[#00E575] hover:bg-[#00c966] text-[#0A2518] text-xs font-black transition-all active:scale-95 shadow-md"
                >
                  <Award size={14} />
                  <span>Log Telemetry (+30 pts)</span>
                </button>
                <button
                  onClick={copyUnifiedReport}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-bold transition-all active:scale-95"
                >
                  <Copy size={13} />
                  <span>Copy Report</span>
                </button>
              </div>
            </div>
          </div>

          {/* PRESETS BAR */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-emerald-600" />
              <span className="text-xs font-black text-stone-800 uppercase tracking-wide">Quick Lifestyle Presets:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => applyPreset('chill')}
                className="px-3 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all"
              >
                🌱 Low-Carbon Minimalist
              </button>
              <button
                onClick={() => applyPreset('student')}
                className="px-3 py-1 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold transition-all"
              >
                🎒 Typical Urban Campus Routine
              </button>
              <button
                onClick={() => applyPreset('heavy')}
                className="px-3 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-all"
              >
                🔥 High AC, Delivery & Cabs
              </button>
              <button
                onClick={() => applyPreset('clear')}
                className="px-3 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all flex items-center gap-1"
              >
                <RotateCcw size={12} /> Clear All
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* THE SINGLE UNIFIED MASTER LIST (All 6 Pillars) */}
          {/* ========================================================================= */}
          <div className="space-y-5">
            {/* PILLAR 1: TRANSPORTATION & MICRO-MOBILITY */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-xs">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🚗</span>
                  <div>
                    <h3 className="text-sm font-black text-stone-900 uppercase tracking-wide">
                      1. Transportation & Micro-Mobility
                    </h3>
                    <p className="text-[11px] text-stone-500 font-medium">
                      Personal vehicles, metro/bus transit, flights, solo ride-hails & shared e-scooters
                    </p>
                  </div>
                </div>
                <div className="text-right font-mono text-xs font-black text-sky-600">
                  {results.transportMonthly} kg/mo
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Vehicle Type</label>
                  <select
                    value={form.vehicleType}
                    onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                  >
                    <option value="Petrol">Petrol Car / Two-Wheeler</option>
                    <option value="Diesel">Diesel Car</option>
                    <option value="EV">Electric Vehicle (EV)</option>
                    <option value="None">None (Transit Only)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Km Driven / Week</label>
                  <input
                    type="number"
                    value={form.kmPerWeek}
                    onChange={(e) => setForm({ ...form, kmPerWeek: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Fuel Efficiency (km/L)</label>
                  <input
                    type="number"
                    value={form.fuelEfficiency}
                    onChange={(e) => setForm({ ...form, fuelEfficiency: parseFloat(e.target.value) || 15 })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Public Transit Usage</label>
                  <select
                    value={form.publicTransport}
                    onChange={(e) => setForm({ ...form, publicTransport: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                  >
                    <option value="Daily">Daily (Metro / Bus)</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Rarely">Rarely</option>
                    <option value="Never">Never</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Solo Cabs/Autos (&lt;3km/Mo)</label>
                  <input
                    type="number"
                    value={form.shortCabs}
                    onChange={(e) => setForm({ ...form, shortCabs: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                  <span className="text-[10px] text-stone-400">~650g per solo trip</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Shared E-Scooter / Bike (km/mo)</label>
                  <input
                    type="number"
                    value={form.sharedEscooterKm}
                    onChange={(e) => setForm({ ...form, sharedEscooterKm: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                  <span className="text-[10px] text-stone-400">~160g/km (fleet logistics)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Domestic Flights / Year</label>
                  <input
                    type="number"
                    value={form.domesticFlights}
                    onChange={(e) => setForm({ ...form, domesticFlights: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                  <span className="text-[10px] text-stone-400">~150 kg per trip</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Intl Flights / Year</label>
                  <input
                    type="number"
                    value={form.intlFlights}
                    onChange={(e) => setForm({ ...form, intlFlights: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                  <span className="text-[10px] text-stone-400">~900 kg per trip</span>
                </div>
              </div>
            </div>

            {/* PILLAR 2: HOME ENERGY, AC COOLING & STANDBY */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-xs">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <h3 className="text-sm font-black text-stone-900 uppercase tracking-wide">
                      2. Home Energy, AC Cooling & Standby Tech
                    </h3>
                    <p className="text-[11px] text-stone-500 font-medium">
                      Electricity bills (₹), summer split AC compressor hours, cooking fuels, and vampire rig draw
                    </p>
                  </div>
                </div>
                <div className="text-right font-mono text-xs font-black text-amber-600">
                  {results.energyMonthly} kg/mo
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Monthly Electricity Bill (₹)</label>
                  <input
                    type="number"
                    value={form.elecBill}
                    onChange={(e) => setForm({ ...form, elecBill: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                  <span className="text-[10px] text-stone-400">~0.1025 kg CO₂e per ₹</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Solar Rooftop Net-Metering</label>
                  <select
                    value={form.renewable}
                    onChange={(e) => setForm({ ...form, renewable: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                  >
                    <option value="No">No (Grid Power)</option>
                    <option value="Yes">Yes (Solar Rooftop -80%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Room AC Cooling (Hours / Day)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={form.acCoolingHours}
                    onChange={(e) => setForm({ ...form, acCoolingHours: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                  <span className="text-[10px] text-stone-400">~980g/hr (1.5 ton split AC)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Primary Cooking Fuel</label>
                  <select
                    value={form.cookingFuel}
                    onChange={(e) => setForm({ ...form, cookingFuel: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                  >
                    <option value="LPG">LPG Cylinder</option>
                    <option value="PNG">Piped Natural Gas (PNG)</option>
                    <option value="Electric">Electric / Induction</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">LPG Cylinders / Month</label>
                  <input
                    type="number"
                    step="0.5"
                    value={form.lpgCount}
                    onChange={(e) => setForm({ ...form, lpgCount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                  <span className="text-[10px] text-stone-400">~42.5 kg per cylinder</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Standby Rig & Adapters</label>
                  <select
                    value={form.standbyRig}
                    onChange={(e) => setForm({ ...form, standbyRig: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                  >
                    <option value="Yes">Yes (Plugged in 24/7 ~320g/day)</option>
                    <option value="No">No (Switched off at wall)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Household Members</label>
                  <input
                    type="number"
                    min="1"
                    value={form.householdSize}
                    onChange={(e) => setForm({ ...form, householdSize: parseFloat(e.target.value) || 1 })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* PILLAR 3: FOOD, CAFE HABITS & APP DELIVERY */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-xs">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🧋</span>
                  <div>
                    <h3 className="text-sm font-black text-stone-900 uppercase tracking-wide">
                      3. Food, Cafe Habits & App Delivery
                    </h3>
                    <p className="text-[11px] text-stone-500 font-medium">
                      Diet baseline, Swiggy/Zomato food delivery packaging, iced lattes, and food waste
                    </p>
                  </div>
                </div>
                <div className="text-right font-mono text-xs font-black text-emerald-600">
                  {results.foodMonthly} kg/mo
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Diet Baseline</label>
                  <select
                    value={form.dietType}
                    onChange={(e) => setForm({ ...form, dietType: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                  >
                    <option value="Vegetarian">Vegetarian (130 kg/mo)</option>
                    <option value="Eggetarian">Eggetarian (155 kg/mo)</option>
                    <option value="Non-Vegetarian">Non-Vegetarian (220 kg/mo)</option>
                    <option value="Vegan">Vegan (100 kg/mo)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Mutton / High-Methane Meat</label>
                  <select
                    value={form.redMeat}
                    onChange={(e) => setForm({ ...form, redMeat: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                  >
                    <option value="Never">Never (0 kg)</option>
                    <option value="Occasionally">Occasionally (+15 kg)</option>
                    <option value="Weekly">Weekly (+40 kg)</option>
                    <option value="Daily">Daily (+90 kg)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">App Delivery (Orders / Mo)</label>
                  <input
                    type="number"
                    value={form.foodOrders}
                    onChange={(e) => setForm({ ...form, foodOrders: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                  <span className="text-[10px] text-stone-400">~1.85 kg per order (rider + box)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Dairy Latte / Boba (Cups / Mo)</label>
                  <input
                    type="number"
                    value={form.dairyLattes}
                    onChange={(e) => setForm({ ...form, dairyLattes: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                  <span className="text-[10px] text-stone-400">~550g per cup (dairy + plastic)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Food Wasted / Wk (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={form.foodWasteKg}
                    onChange={(e) => setForm({ ...form, foodWasteKg: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                  <span className="text-[10px] text-stone-400">Landfill methane factor 1.9</span>
                </div>
              </div>
            </div>

            {/* PILLAR 4: E-COMMERCE, FAST FASHION & CONSUMER TECH */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-xs">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🛍️</span>
                  <div>
                    <h3 className="text-sm font-black text-stone-900 uppercase tracking-wide">
                      4. E-Commerce, Fast Fashion & Consumer Tech
                    </h3>
                    <p className="text-[11px] text-stone-500 font-medium">
                      Synthetic micro-trend garments, courier return loops, same-day delivery, and device upgrade cycles
                    </p>
                  </div>
                </div>
                <div className="text-right font-mono text-xs font-black text-pink-600">
                  {results.shoppingMonthly} kg/mo
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Fast Fashion (Garments / Mo)</label>
                  <input
                    type="number"
                    value={form.fastFashion}
                    onChange={(e) => setForm({ ...form, fastFashion: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                  <span className="text-[10px] text-stone-400">~7.5 kg per synthetic garment</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Courier Returns ('Bracketing' / Mo)</label>
                  <input
                    type="number"
                    value={form.onlineReturns}
                    onChange={(e) => setForm({ ...form, onlineReturns: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                  <span className="text-[10px] text-stone-400">~2.4 kg per separate van dispatch</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Same-Day / Rush Delivery (Orders / Mo)</label>
                  <input
                    type="number"
                    value={form.sameDayDelivery}
                    onChange={(e) => setForm({ ...form, sameDayDelivery: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                  <span className="text-[10px] text-stone-400">~1.2 kg unconsolidated logistics</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Smartphone Upgrade Cycle</label>
                  <select
                    value={form.phoneUpgradeYears}
                    onChange={(e) => setForm({ ...form, phoneUpgradeYears: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                  >
                    <option value="1 year">Every 1 Year (5.8 kg/mo)</option>
                    <option value="2 years">Every 2 Years (2.9 kg/mo)</option>
                    <option value="3+ years">Every 3+ Years (1.4 kg/mo)</option>
                  </select>
                  <span className="text-[10px] text-stone-400">Embodied factory manufacturing</span>
                </div>
              </div>
            </div>

            {/* PILLAR 5: DIGITAL INFRASTRUCTURE & SCREEN TIME */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-xs">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">📱</span>
                  <div>
                    <h3 className="text-sm font-black text-stone-900 uppercase tracking-wide">
                      5. Digital Infrastructure & Screen Time
                    </h3>
                    <p className="text-[11px] text-stone-500 font-medium">
                      4K UHD video streaming, short-video doomscroll, GenAI prompts, cloud gaming, and dormant cloud storage
                    </p>
                  </div>
                </div>
                <div className="text-right font-mono text-xs font-black text-purple-600">
                  {results.digitalMonthly} kg/mo
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">4K Streaming (Hours / Day)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={form.stream4kHours}
                    onChange={(e) => setForm({ ...form, stream4kHours: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                  <span className="text-[10px] text-stone-400">~150g per hour UHD</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Reels / Shorts (Hours / Day)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={form.doomscrollHours}
                    onChange={(e) => setForm({ ...form, doomscrollHours: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                  <span className="text-[10px] text-stone-400">~65g per hour cellular</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">GenAI Prompts (Daily)</label>
                  <input
                    type="number"
                    value={form.aiPromptsDaily}
                    onChange={(e) => setForm({ ...form, aiPromptsDaily: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                  <span className="text-[10px] text-stone-400">~45g per 10 prompts</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Cloud Gaming (Hours / Day)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={form.cloudGamingHours}
                    onChange={(e) => setForm({ ...form, cloudGamingHours: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                  <span className="text-[10px] text-stone-400">~125g/hr (GPU server)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Dormant Cloud (10 GB Blocks)</label>
                  <input
                    type="number"
                    value={form.cloudStorageBlocks}
                    onChange={(e) => setForm({ ...form, cloudStorageBlocks: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                  <span className="text-[10px] text-stone-400">~20g/block per month</span>
                </div>
              </div>
            </div>

            {/* PILLAR 6: WASTE MANAGEMENT & CIRCULARITY */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-xs">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">♻️</span>
                  <div>
                    <h3 className="text-sm font-black text-stone-900 uppercase tracking-wide">
                      6. Waste Management & Circularity
                    </h3>
                    <p className="text-[11px] text-stone-500 font-medium">
                      Non-biodegradable plastic packaging, wet/dry waste segregation, and single-use vapes
                    </p>
                  </div>
                </div>
                <div className="text-right font-mono text-xs font-black text-slate-600">
                  {results.wasteMonthly} kg/mo
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Dry/Plastic Waste / Wk (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={form.plasticWasteKg}
                    onChange={(e) => setForm({ ...form, plasticWasteKg: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                  <span className="text-[10px] text-stone-400">~2.5 kg CO₂e per kg plastic</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Compost or Segregate Waste?</label>
                  <select
                    value={form.segregateWaste}
                    onChange={(e) => setForm({ ...form, segregateWaste: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                  >
                    <option value="No">No (Standard Landfill)</option>
                    <option value="Yes">Yes (Segregated -35% Methane)</option>
                  </select>
                  <span className="text-[10px] text-stone-400">Prevents anaerobic methane</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Disposable Vapes / Mo</label>
                  <input
                    type="number"
                    value={form.disposableVapes}
                    onChange={(e) => setForm({ ...form, disposableVapes: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                  <span className="text-[10px] text-stone-400">~2.8 kg each (lithium battery e-waste)</span>
                </div>
              </div>
            </div>
          </div>

          {/* VISUAL BREAKDOWN CHARTS */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-black text-stone-900 tracking-tight">
                  Unified 6-Pillar Contribution Breakdown
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Monthly emission distribution across transport, energy, food, shopping, digital, and waste.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Total {results.totalMonthly} kg/month
              </span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={results.breakdownData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                  <XAxis type="number" unit="kg" stroke="#94a3b8" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={110} />
                  <Tooltip
                    formatter={(val: any) => [`${val} kg CO₂e / month`, 'Emissions']}
                    contentStyle={{ backgroundColor: '#0A2518', borderRadius: 12, border: '1px solid #10b981', color: '#fff', fontSize: 12 }}
                  />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                    {results.breakdownData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STANDARDIZED SCOPE & CRITERIA GUIDE */}
      {/* ========================================================================= */}
      {activeTab === 'criteria' && (
        <div className="space-y-6 animate-fade-in">
          {/* Methodology Banner */}
          <div className="bg-[#111613] text-white p-6 rounded-3xl border border-emerald-500/40 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#00E575]/20 text-[#00E575] flex items-center justify-center flex-shrink-0">
                <BookOpen size={24} />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-700/50">
                  Scientific Methodology
                </span>
                <h2 className="text-xl font-black text-white mt-1">
                  Unified Scope & Criteria: What to Include vs. Delete / Exclude
                </h2>
                <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                  Adopted from international standards (<strong>IPCC</strong>, <strong>GHG Protocol Scope 1-3</strong>, <strong>UK DEFRA</strong>, <strong>US EPA</strong>) and consumer platforms (<strong>Commons</strong>, <strong>Wren</strong>, <strong>Pawprint</strong>).
                </p>
              </div>
            </div>
          </div>

          {/* 3 Core Selection Principles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center mb-2">1</div>
              <h3 className="font-black text-sm text-stone-900">Direct Individual Agency</h3>
              <p className="text-xs text-stone-600 mt-1">
                Only track activities that a consumer directly chooses and controls (e.g., opting for metro vs. cab, plant bowls vs. beef, 1080p vs. 4K).
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 font-black text-xs flex items-center justify-center mb-2">2</div>
              <h3 className="font-black text-sm text-stone-900">Materiality (&gt;90% Impact)</h3>
              <p className="text-xs text-stone-600 mt-1">
                Prioritize high-emission drivers (aviation, meat, electricity, vehicle fuel) over negligible fractions that cause survey fatigue.
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 font-black text-xs flex items-center justify-center mb-2">3</div>
              <h3 className="font-black text-sm text-stone-900">Actionable Reduction</h3>
              <p className="text-xs text-stone-600 mt-1">
                Every logged activity must have an immediate lower-carbon substitute (e.g. thrifting, solar net-metering, AC set to 25°C).
              </p>
            </div>
          </div>

          {/* Side by side: What to Include vs What to Delete */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* INCLUDED CARD */}
            <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-800 mb-4 pb-3 border-b border-emerald-100">
                <CheckCircle2 size={20} className="text-emerald-600" />
                <h3 className="font-black text-base">What Modern Trackers INCLUDE</h3>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-black text-stone-900 flex items-center gap-1.5">
                    <Car size={14} className="text-emerald-700" /> 1. Transportation & Micro-Mobility
                  </h4>
                  <p className="text-stone-600 mt-0.5">
                    • Fuel combustion from personal petrol/diesel vehicles (Scope 1)<br />
                    • Commercial flights with high-altitude radiative forcing (~1.9x multiplier)<br />
                    • Solo ride-hails accounting for "deadheading" (driver driving empty)<br />
                    • Shared dockless e-scooter fleet rebalancing van emissions
                  </p>
                </div>

                <div>
                  <h4 className="font-black text-stone-900 flex items-center gap-1.5">
                    <Home size={14} className="text-emerald-700" /> 2. Home Energy & Cooling
                  </h4>
                  <p className="text-stone-600 mt-0.5">
                    • Purchased grid electricity for lighting & electronics (Scope 2)<br />
                    • Summer AC compressor run hours (~1.2 kWh/hr)<br />
                    • Cooking LPG cylinders (42.5 kg CO₂e) or PNG<br />
                    • Solar net-metering credits (up to 80% grid reduction)
                  </p>
                </div>

                <div>
                  <h4 className="font-black text-stone-900 flex items-center gap-1.5">
                    <Utensils size={14} className="text-emerald-700" /> 3. Food Systems & Diets
                  </h4>
                  <p className="text-stone-600 mt-0.5">
                    • Methane enteric fermentation from ruminants (mutton, beef, dairy)<br />
                    • App delivery courier transit + multi-layer plastic packaging<br />
                    • Dairy milk vs. oat/soy/almond plant milk swaps<br />
                    • Landfill decomposition of uneaten takeout
                  </p>
                </div>

                <div>
                  <h4 className="font-black text-stone-900 flex items-center gap-1.5">
                    <Smartphone size={14} className="text-emerald-700" /> 4. Digital Infrastructure & Fast Fashion
                  </h4>
                  <p className="text-stone-600 mt-0.5">
                    • 4K UHD video streaming and short-video transmission networks<br />
                    • GenAI cloud prompts & LLM server electricity<br />
                    • Fast-fashion synthetic garments (~7.5 kg CO₂e cradle-to-gate)<br />
                    • Circular economy bonus: 0kg manufacturing for thrifted clothes
                  </p>
                </div>
              </div>
            </div>

            {/* EXCLUDED / DELETED CARD */}
            <div className="bg-white rounded-3xl p-6 border border-rose-200 shadow-xs">
              <div className="flex items-center gap-2 text-rose-800 mb-4 pb-3 border-b border-rose-100">
                <XCircle size={20} className="text-rose-600" />
                <h3 className="font-black text-base">What Trackers DELETE / EXCLUDE & Why</h3>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-100">
                  <h4 className="font-black text-rose-950">1. National Infrastructure & Concrete Highways</h4>
                  <p className="text-rose-900/80 mt-1">
                    <strong>Why excluded:</strong> Cement in bridges, dams, and public highways belongs to government/public accounting. Allocating public works to individual citizens causes double counting and disempowers users because an individual cannot choose whether a highway is paved.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-100">
                  <h4 className="font-black text-rose-950">2. Military & Sovereign Defense Fleets</h4>
                  <p className="text-rose-900/80 mt-1">
                    <strong>Why excluded:</strong> Fighter jet maneuvers and military bases are sovereign government emissions entirely outside consumer agency.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-100">
                  <h4 className="font-black text-rose-950">3. Upstream Heavy B2B Smelting & Extraction</h4>
                  <p className="text-rose-900/80 mt-1">
                    <strong>Why excluded:</strong> Bauxite smelting, coal mining equipment, and blast furnaces belong to industrial corporate Scope 1. Consumer apps track finished consumer goods rather than raw ore extraction overhead.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-100">
                  <h4 className="font-black text-rose-950">4. Ephemeral Micro-Friction Actions (Single Searches)</h4>
                  <p className="text-rose-900/80 mt-1">
                    <strong>Why excluded:</strong> Logging single Google queries (~0.2g) or button clicks causes extreme user fatigue without moving the needle. Trackers bundle these into screen time and AI prompt batches.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-100">
                  <h4 className="font-black text-rose-950">5. Opaque Tier 3-4 Sub-Supplier Audits</h4>
                  <p className="text-rose-900/80 mt-1">
                    <strong>Why excluded:</strong> Without certified Environmental Product Declarations (EPDs), consumers cannot verify deep tier supply chains. Trackers use peer-reviewed lifecycle averages instead.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
