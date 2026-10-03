import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Users,
  IndianRupee,
  MapPin,
  Clock,
  Sparkles,
  Lock,
  Unlock,
  CloudRain,
  Sun,
  Share2,
  Bot,
  PlusCircle,
  RotateCcw,
  Navigation,
  Receipt,
  Layers,
  BarChart3,
  Compass,
  Search,
  Check,
  Luggage,
  Car,
  Hotel,
  Utensils,
  ExternalLink,
  ShieldCheck,
  Wallet,
  Headphones,
  ShieldAlert,
  FileCode,
} from 'lucide-react';
import { LocalTransportModal } from './LocalTransportModal';
import { PackingAssistantModal } from './PackingAssistantModal';
import { ScenarioSimulatorModal } from './ScenarioSimulatorModal';
import { EmergencyHubModal } from './EmergencyHubModal';
import { AudioTourGuideModal } from './AudioTourGuideModal';
import { ImportCompilerModal } from './ImportCompilerModal';
import { GroupPlanningModal } from './GroupPlanningModal';
import { OfflineCompanion } from './OfflineCompanion';
import type {
  CanonicalItinerary,
  TripSummary,
  VersionSummary,
  Expense,
  TripAnalytics
} from '../types';
import { TripMap } from './TripMap';
import { getPlaceImage, formatCurrency } from '../utils/images';

interface TripDashboardProps {
  trip: TripSummary;
  itinerary: CanonicalItinerary;
  versions: VersionSummary[];
  expenses: Expense[];
  analytics: TripAnalytics | null;
  onRefreshTrip: () => void;
  onOpenConcierge: () => void;
  onOpenShare: () => void;
  onOpenLogExpense: () => void;
  onSimulateWeather: () => Promise<void>;
  onCheckConditions: () => Promise<void>;
  onRevertVersion: (v: number) => Promise<void>;
  onToggleLock: (itemId: string, currentLock: boolean) => Promise<void>;
  onApplyAlternative: (altId: string) => Promise<void>;
  onItineraryUpdated?: (newItinerary: CanonicalItinerary) => void;
}

export const TripDashboard: React.FC<TripDashboardProps> = ({
  trip,
  itinerary,
  versions,
  expenses,
  analytics,
  onRefreshTrip,
  onOpenConcierge,
  onOpenShare,
  onOpenLogExpense,
  onSimulateWeather,
  onCheckConditions,
  onRevertVersion,
  onToggleLock,
  onApplyAlternative,
  onItineraryUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<
    'itinerary' | 'map' | 'budget' | 'explore' | 'versions' | 'analytics'
  >('itinerary');
  const [selectedDayId, setSelectedDayId] = useState<string>(itinerary.days[0]?.id || 'day_1');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [checkingConds, setCheckingConds] = useState(false);
  const [searchCatalogQuery, setSearchCatalogQuery] = useState('');
  const [isTransportModalOpen, setIsTransportModalOpen] = useState(false);
  const [isPackingModalOpen, setIsPackingModalOpen] = useState(false);
  const [isSimulatorModalOpen, setIsSimulatorModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isAudioGuideModalOpen, setIsAudioGuideModalOpen] = useState(false);
  const [isCompilerModalOpen, setIsCompilerModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<'all' | 'stay' | 'food' | 'activity'>('all');

  const activeDay = itinerary.days.find(d => d.id === selectedDayId) || itinerary.days[0];
  const budget = itinerary.budget;

  const handleSimulateWeather = async () => {
    setSimulating(true);
    try {
      await onSimulateWeather();
    } finally {
      setSimulating(false);
    }
  };

  const handleCheckConditions = async () => {
    setCheckingConds(true);
    try {
      await onCheckConditions();
    } finally {
      setCheckingConds(false);
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      }
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getCategoryIcon = (category: string) => {
    const c = (category || '').toLowerCase();
    if (c.includes('stay') || c.includes('hotel')) return Hotel;
    if (c.includes('food') || c.includes('restaurant') || c.includes('dining') || c.includes('cafe')) return Utensils;
    if (c.includes('heritage') || c.includes('temple') || c.includes('church') || c.includes('monument')) return Compass;
    if (c.includes('beach')) return Sun;
    return MapPin;
  };

  const budgetUsagePercent = budget.total_limit > 0 
    ? Math.min(100, Math.round((budget.estimated_total / budget.total_limit) * 100))
    : 0;

  return (
    <div className="relative min-h-screen w-full bg-travel-canvas text-[#1a1a1a] pt-32 sm:pt-36 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      
      {/* ========================================================= */}
      {/* CINEMATIC WANDERLUST BACKGROUND (Matching 2nd Image)      */}
      {/* ========================================================= */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover filter brightness-[0.96] opacity-60 scale-105"
        >
          <source
            src="https://pollen-batch-41236914.figma.site/_components/v2/f0ee2dae7671c170c34f12e31c4cb41418976c98/769c564298c132f7919405cd9f17c1b1231f341d.769c5642.mp4"
            type="video/mp4"
          />
        </video>
        {/* Warm Vintage Paper Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#fbf8f3]/90 via-[#f7f3ec]/80 to-[#f0e9df]/92" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#f6f2ea]/40 to-[#e8dfd3]/60" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        
        {/* ========================================================= */}
        {/* 1. TOP HERO HEADER (Frosted Liquid Glassmorphism)         */}
        {/* ========================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="liquid-glass rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl border border-white/80"
        >
          {/* Ambient Glows (Smooth, No Hard Seams) */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            {/* Top Bar: System Badges (Left) & Diagnostics Controls (Right) */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-black text-white text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-sm">
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  v{itinerary.version} Snapshot
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 text-[10px] font-bold flex items-center gap-1.5 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Weather: {itinerary.provenance.weather.toUpperCase()}
                </span>
                <span className="px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-800 text-[10px] font-bold flex items-center gap-1.5 shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  Catalog Verified
                </span>
                <span className="px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-800 text-[10px] font-bold shadow-xs">
                  Mode: {itinerary.mode.toUpperCase()}
                </span>
              </div>

              {/* Simulation Diagnostics Toolbar */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsSimulatorModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 text-[#905831] border border-orange-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs hover:scale-[1.02] cursor-pointer"
                  title="Simulate real-world disruptions (Monsoon, flight delays, venue closures, budget cuts)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                  <span>Scenario Simulator</span>
                </button>

                <button
                  onClick={handleSimulateWeather}
                  disabled={simulating}
                  className="px-3 py-1.5 rounded-2xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs hover:scale-[1.02] disabled:opacity-50 cursor-pointer"
                  title="Inject simulated 85% rain on Day 3"
                >
                  <CloudRain className="w-3.5 h-3.5 text-sky-600" />
                  <span>{simulating ? 'Replanning...' : 'Rain Test'}</span>
                </button>

                <button
                  onClick={handleCheckConditions}
                  disabled={checkingConds}
                  className="px-3 py-1.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs hover:scale-[1.02] disabled:opacity-50 cursor-pointer"
                  title="Pull live Open-Meteo weather conditions"
                >
                  <Sun className="w-3.5 h-3.5 text-amber-600" />
                  <span>{checkingConds ? 'Checking...' : 'Check Weather'}</span>
                </button>

                {/* Refresh Trip State */}
                <button
                  onClick={onRefreshTrip}
                  className="p-2 rounded-2xl bg-white/80 hover:bg-white text-neutral-700 border border-black/10 text-xs font-semibold flex items-center justify-center transition-all shadow-xs hover:scale-[1.02] cursor-pointer group"
                  title="Refresh trip state"
                >
                  <RotateCcw className="w-3.5 h-3.5 group-hover:-rotate-90 transition-transform duration-300" />
                </button>
              </div>
            </div>

            {/* Main Destination Details & Clean Action Toolbar */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
              {/* Left Column: Trip Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#905831] uppercase tracking-wider">
                  <MapPin className="w-4 h-4 text-[#905831]" />
                  <span>{itinerary.trip.destination.name}, {itinerary.trip.destination.country}</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#111827] tracking-tight">
                  {trip.title}
                </h1>

                {/* Meta Highlights Strip */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs text-neutral-600 font-medium">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 border border-white/90 shadow-xs">
                    <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{formatDisplayDate(itinerary.trip.start_date)} – {formatDisplayDate(itinerary.trip.end_date)} ({itinerary.trip.num_days} Days)</span>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 border border-white/90 shadow-xs">
                    <Users className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{itinerary.trip.travelers.adults} Adults {itinerary.trip.travelers.children > 0 ? `, ${itinerary.trip.travelers.children} Children` : ''}</span>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 border border-white/90 shadow-xs">
                    <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-bold text-neutral-900">Est. {formatCurrency(budget.estimated_total)}</span>
                    <span className="text-neutral-500">/ Limit {formatCurrency(budget.total_limit)}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold ml-0.5">
                      {budgetUsagePercent}% allocated
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Unified Cohesive Action Hub */}
              <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                <button
                  onClick={onOpenLogExpense}
                  className="px-3 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs hover:scale-[1.02] cursor-pointer"
                >
                  <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Log Expense</span>
                </button>

                <button
                  onClick={() => setIsTransportModalOpen(true)}
                  className="px-3 py-2 rounded-2xl bg-white/80 hover:bg-white text-neutral-900 border border-black/10 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs hover:scale-[1.02] cursor-pointer"
                  title="View local transport options, fare rates, and routing advice"
                >
                  <Navigation className="w-3.5 h-3.5 text-[#905831]" />
                  <span>Transit</span>
                </button>

                <button
                  onClick={() => setIsPackingModalOpen(true)}
                  className="px-3 py-2 rounded-2xl bg-white/80 hover:bg-white text-neutral-900 border border-black/10 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs hover:scale-[1.02] cursor-pointer"
                  title="Climate and activity-tailored packing checklist"
                >
                  <Luggage className="w-3.5 h-3.5 text-amber-600" />
                  <span>Packing</span>
                </button>

                <button
                  onClick={() => setIsAudioGuideModalOpen(true)}
                  className="px-3 py-2 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs hover:scale-[1.02] cursor-pointer"
                  title="Listen to AI Voice Audio Tour of landmarks"
                >
                  <Headphones className="w-3.5 h-3.5 text-purple-600" />
                  <span>Audio Guide</span>
                </button>

                <button
                  onClick={() => setIsEmergencyModalOpen(true)}
                  className="px-3 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs hover:scale-[1.02] cursor-pointer"
                  title="Emergency contacts, 24/7 hospitals, safety ratings & scam alerts"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  <span>Emergency SOS</span>
                </button>

                <button
                  onClick={() => setIsCompilerModalOpen(true)}
                  className="px-3 py-2 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs hover:scale-[1.02] cursor-pointer"
                  title="Import bookings, tickets, or WhatsApp notes into itinerary"
                >
                  <FileCode className="w-3.5 h-3.5 text-teal-600" />
                  <span>Import Notes</span>
                </button>

                <button
                  onClick={() => setIsGroupModalOpen(true)}
                  className="px-3 py-2 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs hover:scale-[1.02] cursor-pointer"
                  title="Collaborative planning, group voting & budget alignment"
                >
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>Group Hub</span>
                </button>

                <button
                  onClick={onOpenShare}
                  className="px-3 py-2 rounded-2xl bg-white/80 hover:bg-white text-neutral-900 border border-black/10 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs hover:scale-[1.02] cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#905831]" />
                  <span>Share</span>
                </button>

                {/* Primary AI Concierge CTA */}
                <button
                  onClick={onOpenConcierge}
                  className="px-4 py-2 rounded-2xl bg-gradient-to-r from-[#905831] via-[#c26127] to-[#df6b26] hover:from-[#7e4b28] hover:to-[#ce5f1e] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xl shadow-orange-900/20 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <Bot className="w-4 h-4 text-amber-200" />
                  <span>AI Concierge</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/25 text-amber-100 font-medium ml-0.5">
                    Copilot
                  </span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ========================================================= */}
        {/* 2. SEGMENTED TAB NAVIGATION BAR                            */}
        {/* ========================================================= */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl liquid-glass overflow-x-auto no-scrollbar shadow-md border border-white/80">
          {[
            { id: 'itinerary', label: 'Itinerary Plan', icon: Calendar },
            { id: 'map', label: 'Route Map', icon: Navigation },
            { id: 'budget', label: 'Budget & Actuals', icon: IndianRupee },
            { id: 'explore', label: 'Catalog Places', icon: Compass },
            { id: 'versions', label: `Versions (${versions.length})`, icon: Layers },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'text-white bg-[#0a0a0a] shadow-md'
                    : 'text-neutral-700 hover:text-black hover:bg-white/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-neutral-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ========================================================= */}
        {/* 3. TAB CONTENT DISPLAY                                     */}
        {/* ========================================================= */}
        <AnimatePresence mode="wait">
          {/* TAB 1: ITINERARY PLAN */}
          {activeTab === 'itinerary' && (
            <motion.div
              key="itinerary"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Day Selector Strip */}
              <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
                {itinerary.days.map(day => {
                  const isSelected = selectedDayId === day.id;
                  const isRain = day.weather?.summary?.toLowerCase().includes('rain') || (day.weather?.rain_prob_pct || 0) > 40;
                  return (
                    <button
                      key={day.id}
                      onClick={() => {
                        setSelectedDayId(day.id);
                        setSelectedItemId(null);
                      }}
                      className={`px-4 py-3 rounded-2xl text-left transition-all flex items-center gap-3 whitespace-nowrap cursor-pointer border ${
                        isSelected
                          ? 'bg-[#905831] text-white border-[#905831] shadow-lg shadow-orange-950/20'
                          : 'liquid-glass text-neutral-800 hover:bg-white/90 border-white/80'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected ? 'bg-black/20 text-white' : 'bg-black/5 text-[#905831]'
                      }`}>
                        D{day.day_number}
                      </div>
                      <div>
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          <span>Day {day.day_number}</span>
                          <span className="text-[11px] opacity-85">
                            {isRain ? '🌧️' : '☀️'}
                          </span>
                        </div>
                        <div className={`text-[10px] font-medium ${isSelected ? 'text-white/80' : 'text-neutral-500'}`}>
                          {formatDisplayDate(day.date)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active Day Content Card */}
              {activeDay && (
                <div className="liquid-glass rounded-3xl p-6 sm:p-8 shadow-xl border border-white/80 space-y-7">
                  {/* Day Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-black/10">
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-[#905831] tracking-wider uppercase flex items-center gap-2">
                        <span>Day {activeDay.day_number}</span>
                        <span>•</span>
                        <span>{formatDisplayDate(activeDay.date)}</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a0a0a] tracking-tight">
                        {activeDay.theme}
                      </h2>

                      {/* Smart Optimization Pills */}
                      <div className="flex flex-wrap items-center gap-2.5 pt-1">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-800 shadow-xs">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>AI Route Optimized: {activeDay.items.length} stops sequenced for minimal transit ({activeDay.totals.travel_minutes}m total transit)</span>
                        </div>
                        <button
                          onClick={() => setIsTransportModalOpen(true)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/80 hover:bg-white border border-white/90 text-[11px] font-semibold text-neutral-800 shadow-xs cursor-pointer"
                        >
                          <Navigation className="w-3 h-3 text-[#905831]" />
                          <span>Transit Details</span>
                        </button>
                        <button
                          onClick={() => setIsPackingModalOpen(true)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/80 hover:bg-white border border-white/90 text-[11px] font-semibold text-neutral-800 shadow-xs cursor-pointer"
                        >
                          <Luggage className="w-3.5 h-3.5 text-amber-600" />
                          <span>Packing</span>
                        </button>
                      </div>
                    </div>

                    {/* Day Weather Widget */}
                    {activeDay.weather && (
                      <div className="flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-white/70 border border-white/80 shrink-0 shadow-inner">
                        <div className="text-3xl">
                          {activeDay.weather.rain_prob_pct > 40 || activeDay.weather.summary.includes('Rain') ? '🌧️' : '☀️'}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-neutral-900 flex items-center gap-1.5">
                            <span>{activeDay.weather.temp_max_c}°C</span>
                            <span className="text-xs text-neutral-500 font-normal">• {activeDay.weather.summary}</span>
                          </div>
                          <div className="text-[10px] text-neutral-500 mt-0.5">
                            Rain: <span className="text-sky-700 font-semibold">{activeDay.weather.rain_prob_pct}%</span> • Source: {activeDay.weather.source}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Day Activities Stream with Real Time Dataset Images */}
                  <div className="space-y-5">
                    {activeDay.items.map((item, idx) => {
                      const isSelected = selectedItemId === item.id;
                      const nextItem = activeDay.items[idx + 1];
                      const routeBetween = nextItem
                        ? activeDay.routes.find(
                            r => r.from_item === item.id || r.to_item === nextItem.id
                          )
                        : null;
                      const CatIcon = getCategoryIcon(item.category);
                      const placeImageUrl = getPlaceImage(item.place_id, item.category);

                      return (
                        <React.Fragment key={item.id}>
                          {/* Activity Item Card */}
                          <div
                            className={`glass-card-item rounded-3xl p-5 sm:p-6 transition-all border relative overflow-hidden group ${
                              isSelected
                                ? 'bg-white border-[#905831] shadow-xl ring-2 ring-[#905831]/20'
                                : 'hover:bg-white'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                              {/* Left Media & Details */}
                              <div className="flex items-start gap-4 sm:gap-5 flex-1">
                                {/* Numbered Milestone + Real Dataset Photo */}
                                <div className="relative shrink-0">
                                  <img
                                    src={placeImageUrl}
                                    alt={item.name}
                                    className="w-24 h-24 sm:w-32 sm:h-28 rounded-2xl object-cover shadow-md border border-white/80 group-hover:scale-[1.03] transition-transform duration-300"
                                  />
                                  <div className="absolute -top-2 -left-2 w-6 h-6 rounded-lg bg-black text-white text-[10px] font-bold flex items-center justify-center shadow-md">
                                    0{idx + 1}
                                  </div>
                                </div>

                                <div className="space-y-1.5 flex-1">
                                  {/* Badges Row */}
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-black/5 text-[#905831] uppercase tracking-wide flex items-center gap-1">
                                      <CatIcon className="w-3 h-3" />
                                      {item.category}
                                    </span>
                                    <span className="text-xs text-neutral-500 font-mono flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/5">
                                      <Clock className="w-3 h-3 text-neutral-400" />
                                      {item.start_time} – {item.end_time} ({item.duration_min} min)
                                    </span>
                                    {item.indoor && (
                                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                        Indoor
                                      </span>
                                    )}
                                    {item.locked && (
                                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                                        <Lock className="w-2.5 h-2.5" />
                                        Locked
                                      </span>
                                    )}
                                  </div>

                                  {/* Title & Description */}
                                  <h3 className="font-bold text-lg sm:text-xl text-[#0a0a0a] group-hover:text-[#905831] transition-colors">
                                    {item.name}
                                  </h3>

                                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-2xl">
                                    {item.reason}
                                  </p>

                                  {/* Why AI Chose This Match Tags */}
                                  {item.reason_factors && item.reason_factors.length > 0 && (
                                    <div className="pt-2 flex flex-wrap items-center gap-1.5">
                                      <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                                        <Sparkles className="w-2.5 h-2.5 text-[#905831]" />
                                        Why this matches you:
                                      </span>
                                      {item.reason_factors.map((factor, i) => (
                                        <span
                                          key={i}
                                          className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-neutral-700 font-medium shadow-2xs"
                                        >
                                          {factor}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Right Pricing & Quick Actions */}
                              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 shrink-0 border-t sm:border-t-0 border-black/5 pt-3 sm:pt-0">
                                <div className="text-base font-extrabold text-[#0a0a0a]">
                                  {item.cost.amount === 0 ? (
                                    <span className="text-emerald-700">Free</span>
                                  ) : (
                                    formatCurrency(item.cost.amount)
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5">
                                  {/* Lock Toggle */}
                                  <button
                                    onClick={() => onToggleLock(item.id, item.locked)}
                                    className={`p-2 rounded-xl text-xs transition-colors cursor-pointer ${
                                      item.locked
                                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                        : 'bg-black/5 text-neutral-600 hover:bg-black/10'
                                    }`}
                                    title={item.locked ? 'Unlock item' : 'Lock item (prevents AI replanning swaps)'}
                                  >
                                    {item.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                  </button>

                                  {/* View on Map */}
                                  <button
                                    onClick={() => {
                                      setSelectedItemId(item.id);
                                      setActiveTab('map');
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-black/5 hover:bg-black/10 text-xs font-semibold text-neutral-800 flex items-center gap-1.5 transition-all cursor-pointer"
                                  >
                                    <Navigation className="w-3 h-3 text-[#905831]" />
                                    <span>Map</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Inter-Activity Transit Connector */}
                          {nextItem && (
                            <div className="flex items-center gap-3 pl-8 sm:pl-10 text-xs text-neutral-600 my-1">
                              <div className="w-0.5 h-6 bg-black/20" />
                              <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-white/70 border border-white/90 text-neutral-800 shadow-xs">
                                <Car className="w-3.5 h-3.5 text-[#905831] shrink-0" />
                                <span className="font-semibold text-neutral-900 capitalize">
                                  {routeBetween?.mode || 'Local Taxi / Auto'}
                                </span>
                                <span>•</span>
                                <span>
                                  {routeBetween ? `${routeBetween.duration_min} mins (${routeBetween.distance_km} km)` : 'Approx. 15-20 mins'}
                                </span>
                                <span>•</span>
                                <span className="text-emerald-700 font-bold">
                                  ~₹{routeBetween?.cost || (routeBetween?.distance_km ? Math.round(routeBetween.distance_km * 20) : 150)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setIsTransportModalOpen(true)}
                                  className="ml-1 text-[11px] text-[#905831] hover:underline font-semibold cursor-pointer"
                                >
                                  Options & Fares
                                </button>
                              </div>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Day Summary Cost & Travel Strip */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-white/60 border border-white/80 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-neutral-800 shadow-inner">
                    <div className="flex flex-wrap items-center gap-6">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        Activities: <span className="text-black font-bold">{formatCurrency(activeDay.totals.activity_cost)}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        Dining: <span className="text-black font-bold">{formatCurrency(activeDay.totals.food_cost)}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Transit: <span className="text-black font-bold">{formatCurrency(activeDay.totals.transport_cost)}</span>
                      </span>
                    </div>
                    <div className="text-neutral-500">
                      Active: <span className="text-black font-bold">{Math.round(activeDay.totals.active_minutes / 60)} hrs</span> • Travel Time: <span className="text-black font-bold">{activeDay.totals.travel_minutes} mins</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Alternative Themes & Variants Panel */}
              {itinerary.alternatives && itinerary.alternatives.length > 0 && (
                <div className="liquid-glass rounded-3xl p-6 sm:p-8 shadow-lg border border-white/80 space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#905831]" />
                    <h3 className="font-bold text-sm text-[#0a0a0a] uppercase tracking-wider">
                      Alternative Trip Variants
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {itinerary.alternatives.map(alt => (
                      <div
                        key={alt.id}
                        className="p-5 rounded-2xl bg-white/80 border border-white/90 flex flex-col justify-between shadow-xs"
                      >
                        <div>
                          <div className="font-bold text-sm text-neutral-900">{alt.label}</div>
                          <p className="text-xs text-neutral-600 mt-1">{alt.summary}</p>
                          {alt.delta && (
                            <div className="mt-2.5 text-[11px] text-emerald-800 font-semibold flex items-center gap-3">
                              {alt.delta.cost !== undefined && (
                                <span>Cost delta: {formatCurrency(alt.delta.cost)}</span>
                              )}
                              {alt.delta.travel_min !== undefined && (
                                <span>Travel: {alt.delta.travel_min} mins</span>
                              )}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => onApplyAlternative(alt.id)}
                          className="mt-4 px-4 py-2 rounded-xl bg-[#905831] hover:bg-[#a6683c] text-white text-xs font-bold transition-all shadow-sm self-start flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Apply Alternative</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 2: INTERACTIVE ROUTE MAP */}
          {activeTab === 'map' && (
            <motion.div
              key="map"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-[650px] rounded-3xl overflow-hidden shadow-2xl border border-white/80"
            >
              <TripMap
                itinerary={itinerary}
                selectedDayId={selectedDayId}
                selectedItemId={selectedItemId}
                onSelectItem={id => setSelectedItemId(id)}
              />
            </motion.div>
          )}

          {/* TAB 3: BUDGET & EXPENSES */}
          {activeTab === 'budget' && (
            <motion.div
              key="budget"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* 4 Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="liquid-glass rounded-3xl p-5 shadow-lg border border-white/80 space-y-1">
                  <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                    Total Budget Limit
                  </div>
                  <div className="text-2xl font-black text-neutral-900">
                    {formatCurrency(budget.total_limit)}
                  </div>
                  <div className="text-[10px] text-neutral-500">
                    Reserved safety buffer: {budget.reserve_pct}%
                  </div>
                </div>

                <div className="liquid-glass rounded-3xl p-5 shadow-lg border border-white/80 space-y-1">
                  <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                    Estimated Total Cost
                  </div>
                  <div className="text-2xl font-black text-[#905831]">
                    {formatCurrency(budget.estimated_total)}
                  </div>
                  <div className="text-[10px] text-neutral-500">
                    Per traveler: {formatCurrency(budget.per_person)}
                  </div>
                </div>

                <div className="liquid-glass rounded-3xl p-5 shadow-lg border border-white/80 space-y-1">
                  <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                    Spendable Balance
                  </div>
                  <div className="text-2xl font-black text-emerald-800">
                    {formatCurrency(budget.remaining)}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold">
                    Status: {budget.status.toUpperCase()}
                  </div>
                </div>

                <div className="liquid-glass rounded-3xl p-5 shadow-lg border border-white/80 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                      Logged Ground Actuals
                    </div>
                    <div className="text-2xl font-black text-neutral-900 mt-1">
                      {formatCurrency(expenses.reduce((acc, curr) => acc + curr.amount, 0))}
                    </div>
                  </div>
                  <button
                    onClick={onOpenLogExpense}
                    className="mt-2 py-1.5 px-3 rounded-xl bg-black text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Log New Expense</span>
                  </button>
                </div>
              </div>

              {/* Category Allocation Grid */}
              <div className="liquid-glass rounded-3xl p-6 sm:p-8 shadow-lg border border-white/80 space-y-4">
                <h3 className="font-bold text-base text-neutral-900">
                  Estimated Category Allocation
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                  {[
                    { label: 'Stays', amt: budget.breakdown.accommodation, color: 'bg-indigo-500' },
                    { label: 'Food', amt: budget.breakdown.food, color: 'bg-amber-500' },
                    { label: 'Transit', amt: budget.breakdown.transport, color: 'bg-emerald-500' },
                    { label: 'Activities', amt: budget.breakdown.activities, color: 'bg-purple-500' },
                    { label: 'Reserve', amt: budget.breakdown.reserve, color: 'bg-neutral-500' },
                  ].map(cat => (
                    <div key={cat.label} className="p-3.5 rounded-2xl bg-white/70 border border-white/80">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${cat.color}`} />
                        <span className="text-[10px] font-bold text-neutral-500 uppercase">{cat.label}</span>
                      </div>
                      <div className="text-base font-extrabold text-neutral-900 mt-1">
                        {formatCurrency(cat.amt)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Logged Expenses Ledger */}
              <div className="liquid-glass rounded-3xl p-6 sm:p-8 shadow-lg border border-white/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-neutral-900">
                    Logged Ground Expenses
                  </h3>
                  <button
                    onClick={onOpenLogExpense}
                    className="text-xs font-bold text-[#905831] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add Expense</span>
                  </button>
                </div>

                {expenses.length === 0 ? (
                  <p className="text-xs text-neutral-500 py-6 text-center">
                    No actual on-ground expenses recorded yet. Click "Log Expense" above to track receipts.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {expenses.map(exp => (
                      <div
                        key={exp.id}
                        className="p-3.5 rounded-2xl bg-white/80 border border-white/90 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-neutral-900 capitalize">
                            {exp.category} {exp.note && `— ${exp.note}`}
                          </div>
                          <div className="text-[10px] text-neutral-500">
                            {exp.day_id?.toUpperCase()} • {new Date(exp.spent_at).toLocaleDateString()}
                          </div>
                        </div>
                        <span className="text-sm font-extrabold text-neutral-900">
                          {formatCurrency(exp.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 4: CATALOG PLACES (Real Dataset Images) */}
          {activeTab === 'explore' && (
            <motion.div
              key="explore"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="liquid-glass rounded-3xl p-6 sm:p-8 shadow-lg border border-white/80 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-lg text-neutral-900">
                      Places, Stays & Food in {itinerary.trip.destination.name}
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Grounded recommendations with real OpenStreetMap coordinates, verified images, and transparent pricing
                    </p>
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchCatalogQuery}
                      onChange={e => setSearchCatalogQuery(e.target.value)}
                      placeholder="Search places or categories..."
                      className="w-full rounded-2xl bg-white/90 border border-neutral-300 pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#905831]"
                    />
                  </div>
                </div>

                {/* Filter Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-black/5">
                  {[
                    { id: 'all', label: 'All Recommendations', icon: Compass },
                    { id: 'stay', label: 'Stays & Hotels', icon: Hotel },
                    { id: 'food', label: 'Food & Dining', icon: Utensils },
                    { id: 'activity', label: 'Sights & Activities', icon: MapPin },
                  ].map(filter => {
                    const Icon = filter.icon;
                    const isSelected = catalogCategoryFilter === filter.id;
                    return (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => setCatalogCategoryFilter(filter.id as any)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#905831] text-white shadow-xs'
                            : 'bg-white/60 text-neutral-700 hover:bg-white border border-black/5'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{filter.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Places Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                  {itinerary.days
                    .flatMap(d => d.items)
                    .filter(it => {
                      const matchesSearch =
                        it.name.toLowerCase().includes(searchCatalogQuery.toLowerCase()) ||
                        it.category.toLowerCase().includes(searchCatalogQuery.toLowerCase());
                      if (!matchesSearch) return false;

                      if (catalogCategoryFilter === 'all') return true;
                      if (catalogCategoryFilter === 'stay') return it.category.toLowerCase().includes('stay') || it.category.toLowerCase().includes('hotel');
                      if (catalogCategoryFilter === 'food') return it.category.toLowerCase().includes('food') || it.category.toLowerCase().includes('dining') || it.category.toLowerCase().includes('restaurant') || it.category.toLowerCase().includes('cafe');
                      if (catalogCategoryFilter === 'activity') return !it.category.toLowerCase().includes('stay') && !it.category.toLowerCase().includes('hotel') && !it.category.toLowerCase().includes('food');
                      return true;
                    })
                    .map(it => {
                      const isStay = it.category.toLowerCase().includes('stay') || it.category.toLowerCase().includes('hotel');
                      const isFood = it.category.toLowerCase().includes('food') || it.category.toLowerCase().includes('dining') || it.category.toLowerCase().includes('restaurant');
                      const osmLink = `https://www.openstreetmap.org/?mlat=${it.lat}&mlon=${it.lng}#map=16/${it.lat}/${it.lng}`;
                      const CatIcon = getCategoryIcon(it.category);
                      const placeImageUrl = getPlaceImage(it.place_id, it.category);

                      return (
                        <div
                          key={it.id}
                          className="rounded-3xl bg-white/80 border border-white/95 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                        >
                          <div>
                            <div className="relative">
                              <img
                                src={placeImageUrl}
                                alt={it.name}
                                className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-black/75 backdrop-blur-xs text-white text-[10px] font-bold">
                                {it.cost.amount === 0 ? 'Free Entry' : formatCurrency(it.cost.amount)}
                              </span>
                            </div>
                            <div className="p-4 space-y-2">
                              <div className="flex items-center justify-between text-[10px] font-bold text-[#905831] uppercase">
                                <span className="flex items-center gap-1">
                                  <CatIcon className="w-3 h-3" />
                                  {it.category}
                                </span>
                                <span className="text-neutral-500 font-normal lowercase">{it.start_time} – {it.end_time}</span>
                              </div>
                              <div className="font-bold text-base text-neutral-900 leading-snug">{it.name}</div>
                              <p className="text-xs text-neutral-600 line-clamp-2">{it.reason}</p>
                            </div>
                          </div>

                          <div className="px-4 pb-4 pt-1 flex items-center justify-between border-t border-black/5 text-[11px]">
                            <span className="text-[10px] text-neutral-500 italic">
                              {isStay ? 'Estimated stay' : isFood ? 'Local culinary price' : 'Verified GPS'}
                            </span>
                            <a
                              href={osmLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[#905831] hover:underline font-semibold"
                            >
                              <span>View Map</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 5: VERSION HISTORY */}
          {activeTab === 'versions' && (
            <motion.div
              key="versions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="liquid-glass rounded-3xl p-6 sm:p-8 shadow-lg border border-white/80">
                <div className="mb-6">
                  <h3 className="font-bold text-lg text-neutral-900">
                    Itinerary Version Timeline
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Every modification creates an immutable snapshot. You can roll back anytime with zero loss.
                  </p>
                </div>

                <div className="space-y-3">
                  {versions.map(v => {
                    const isCurrent = v.version === itinerary.version;
                    return (
                      <div
                        key={v.version}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                          isCurrent
                            ? 'bg-white border-[#905831] shadow-md ring-2 ring-[#905831]/20'
                            : 'bg-white/60 border-white/80 hover:bg-white/90'
                        }`}
                      >
                        <div className="flex items-start gap-3.5">
                          <div
                            className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-bold shrink-0 ${
                              isCurrent ? 'bg-[#905831] text-white shadow-md' : 'bg-black/10 text-neutral-700'
                            }`}
                          >
                            v{v.version}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                              <span>{v.change_summary || `Version ${v.version}`}</span>
                              {isCurrent && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                                  Current Active
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-neutral-500 mt-0.5">
                              Created by: <span className="font-medium text-neutral-700">{v.created_by}</span> •{' '}
                              {new Date(v.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {!isCurrent && (
                          <button
                            onClick={() => onRevertVersion(v.version)}
                            className="px-3.5 py-1.5 rounded-xl bg-black/5 hover:bg-black/10 text-neutral-800 text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-[#905831]" />
                            <span>Revert to this</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 6: TRIP ANALYTICS */}
          {activeTab === 'analytics' && analytics && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Spend vs Planned */}
                <div className="liquid-glass rounded-3xl p-6 sm:p-8 shadow-lg border border-white/80 space-y-4">
                  <h3 className="font-bold text-base text-neutral-900">
                    Planned vs Actual Spending
                  </h3>
                  <div className="space-y-3.5 pt-2">
                    {analytics.by_category.map(cat => {
                      const maxVal = Math.max(cat.planned, cat.actual, 100);
                      const plannedPct = Math.min(100, (cat.planned / maxVal) * 100);
                      const actualPct = Math.min(100, (cat.actual / maxVal) * 100);

                      return (
                        <div key={cat.category} className="space-y-1.5 text-xs">
                          <div className="flex justify-between font-semibold capitalize">
                            <span className="text-neutral-900">{cat.category}</span>
                            <span className="text-neutral-500 font-mono">
                              Planned {formatCurrency(cat.planned)} • Actual {formatCurrency(cat.actual)}
                            </span>
                          </div>
                          <div className="h-2 w-full bg-black/10 rounded-full overflow-hidden flex gap-0.5">
                            <div className="bg-[#905831] h-full rounded-full" style={{ width: `${plannedPct}%` }} />
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${actualPct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Day-wise Activity Load */}
                <div className="liquid-glass rounded-3xl p-6 sm:p-8 shadow-lg border border-white/80 space-y-4">
                  <h3 className="font-bold text-base text-neutral-900">
                    Day-wise Activity & Transit Load
                  </h3>
                  <div className="space-y-3 pt-2">
                    {analytics.pace_distribution.map(d => (
                      <div key={d.day_number} className="p-3.5 rounded-2xl bg-white/70 border border-white/80 text-xs">
                        <div className="flex justify-between font-bold text-neutral-900 mb-1">
                          <span>Day {d.day_number}</span>
                          <span className="text-[#905831]">{d.items_count} Scheduled Stops</span>
                        </div>
                        <div className="text-[11px] text-neutral-600 flex gap-4">
                          <span>Active: <span className="text-neutral-900 font-semibold">{Math.round(d.active_minutes / 60)} hrs</span></span>
                          <span>Travel: <span className="text-neutral-900 font-semibold">{d.travel_minutes} mins</span></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Local Transport / Getting Around Modal */}
      <LocalTransportModal
        isOpen={isTransportModalOpen}
        onClose={() => setIsTransportModalOpen(false)}
        itinerary={itinerary}
        selectedDayId={selectedDayId}
      />

      {/* Smart Packing Assistant Modal */}
      <PackingAssistantModal
        isOpen={isPackingModalOpen}
        onClose={() => setIsPackingModalOpen(false)}
        itinerary={itinerary}
      />

      {/* AI Scenario Simulator Modal */}
      <ScenarioSimulatorModal
        isOpen={isSimulatorModalOpen}
        onClose={() => setIsSimulatorModalOpen(false)}
        itinerary={itinerary}
        tripId={trip.id}
        onItineraryUpdated={(newIt) => {
          if (onItineraryUpdated) onItineraryUpdated(newIt);
          onRefreshTrip();
        }}
      />

      {/* Emergency SOS & Local Intelligence Hub */}
      <EmergencyHubModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        itinerary={itinerary}
      />

      {/* Voice AI Audio Tour Guide Modal */}
      <AudioTourGuideModal
        isOpen={isAudioGuideModalOpen}
        onClose={() => setIsAudioGuideModalOpen(false)}
        itinerary={itinerary}
      />

      {/* Import-to-Itinerary Compiler Modal */}
      <ImportCompilerModal
        isOpen={isCompilerModalOpen}
        onClose={() => setIsCompilerModalOpen(false)}
        itinerary={itinerary}
        tripId={trip.id}
        onItineraryUpdated={(newIt) => {
          if (onItineraryUpdated) onItineraryUpdated(newIt);
          onRefreshTrip();
        }}
      />

      {/* Collaborative Group Planning & Decision Modal */}
      <GroupPlanningModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        itinerary={itinerary}
        onItineraryUpdated={(newIt) => {
          if (onItineraryUpdated) onItineraryUpdated(newIt);
          onRefreshTrip();
        }}
      />

      {/* Offline Travel Companion & Local Sync */}
      <OfflineCompanion
        itinerary={itinerary}
        tripId={trip.id}
        onExpenseLogged={onRefreshTrip}
      />
    </div>
  );
};
