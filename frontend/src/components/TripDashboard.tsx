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
  ExternalLink
} from 'lucide-react';
import { LocalTransportModal } from './LocalTransportModal';
import { PackingAssistantModal } from './PackingAssistantModal';
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

  return (
    <div className="w-full min-h-screen bg-[#0a0a0a] text-[#1a1a1a] pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="liquid-glass rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Background Ambient Cover Image */}
          <div className="absolute top-0 right-0 w-1/3 h-full opacity-15 pointer-events-none overflow-hidden">
            <img
              src={getPlaceImage(undefined, 'beaches')}
              alt="Destination backdrop"
              className="w-full h-full object-cover filter blur-sm scale-110"
            />
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              {/* Provenance Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-full bg-black text-white text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
                  <Compass className="w-3 h-3 text-amber-400" />
                  v{itinerary.version} Snapshot
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-800 border border-emerald-500/30 text-[10px] font-bold">
                  Weather: {itinerary.provenance.weather.toUpperCase()}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-800 border border-blue-500/30 text-[10px] font-bold">
                  Catalog Verified
                </span>
                <span className="px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-800 border border-purple-500/30 text-[10px] font-bold">
                  Mode: {itinerary.mode.toUpperCase()}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0a0a0a] tracking-tight">
                {trip.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mt-2.5 text-xs text-neutral-600 font-medium">
                <span className="flex items-center gap-1 text-black font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-[#905831]" />
                  {itinerary.trip.destination.name}, {itinerary.trip.destination.country}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                  {itinerary.trip.start_date} to {itinerary.trip.end_date} ({itinerary.trip.num_days} Days)
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-neutral-500" />
                  {itinerary.trip.travelers.adults} Adults
                  {itinerary.trip.travelers.children > 0 && `, ${itinerary.trip.travelers.children} Children`}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-bold text-neutral-900">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-700" />
                  Est. {formatCurrency(budget.estimated_total)} / Limit {formatCurrency(budget.total_limit)}
                </span>
              </div>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Simulate Rain Button */}
              <button
                onClick={handleSimulateWeather}
                disabled={simulating}
                className="px-3.5 py-2 rounded-2xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm hover:scale-[1.02] disabled:opacity-50"
                title="Inject simulated 85% monsoon rain to trigger real Replanner Agent"
              >
                <CloudRain className="w-3.5 h-3.5 text-sky-600" />
                <span>{simulating ? 'Replanning...' : 'Simulate Rain (Day 3)'}</span>
              </button>

              {/* Check Conditions Button */}
              <button
                onClick={handleCheckConditions}
                disabled={checkingConds}
                className="px-3.5 py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm hover:scale-[1.02] disabled:opacity-50"
                title="Pull latest conditions & trigger replanning if needed"
              >
                <Sun className="w-3.5 h-3.5 text-amber-600" />
                <span>{checkingConds ? 'Checking...' : 'Check Conditions'}</span>
              </button>

              {/* Log Expense Button */}
              <button
                onClick={onOpenLogExpense}
                className="px-3.5 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm hover:scale-[1.02]"
              >
                <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                <span>Log Expense</span>
              </button>

              {/* Getting Around / Local Transport Button */}
              <button
                onClick={() => setIsTransportModalOpen(true)}
                className="px-3.5 py-2 rounded-2xl bg-white/80 hover:bg-white text-black border border-black/10 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm hover:scale-[1.02]"
                title="View local transport options, fare rates, and routing advice"
              >
                <Navigation className="w-3.5 h-3.5 text-[#905831]" />
                <span>Getting Around</span>
              </button>

              {/* Smart Packing Assistant Button */}
              <button
                onClick={() => setIsPackingModalOpen(true)}
                className="px-3.5 py-2 rounded-2xl bg-white/80 hover:bg-white text-black border border-black/10 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm hover:scale-[1.02]"
                title="Climate and activity-tailored packing checklist"
              >
                <Luggage className="w-3.5 h-3.5 text-amber-600" />
                <span>Packing</span>
              </button>

              {/* Share Button */}
              <button
                onClick={onOpenShare}
                className="px-3.5 py-2 rounded-2xl bg-white/80 hover:bg-white text-black border border-black/10 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm hover:scale-[1.02]"
              >
                <Share2 className="w-3.5 h-3.5 text-[#905831]" />
                <span>Share</span>
              </button>

              {/* Refresh Button */}
              <button
                onClick={onRefreshTrip}
                className="p-2 rounded-2xl bg-white/80 hover:bg-white text-black border border-black/10 text-xs font-semibold flex items-center justify-center transition-all shadow-sm hover:scale-[1.02]"
                title="Refresh trip state"
              >
                <RotateCcw className="w-3.5 h-3.5 text-neutral-600" />
              </button>

              {/* AI Concierge Drawer Trigger */}
              <button
                onClick={onOpenConcierge}
                className="px-4 py-2 rounded-2xl bg-black text-white text-xs font-bold flex items-center gap-2 shadow-lg hover:bg-black/90 transition-all hover:scale-[1.02]"
              >
                <Bot className="w-4 h-4 text-amber-300" />
                <span>AI Concierge</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation Pill Strip */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl liquid-glass overflow-x-auto no-scrollbar shadow-md">
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
                className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'text-white bg-[#0a0a0a] shadow-md'
                    : 'text-neutral-700 hover:text-black hover:bg-white/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-neutral-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Display */}
        <AnimatePresence mode="wait">
          {activeTab === 'itinerary' && (
            <motion.div
              key="itinerary"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Day Selector Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {itinerary.days.map(day => {
                  const isSelected = selectedDayId === day.id;
                  return (
                    <button
                      key={day.id}
                      onClick={() => {
                        setSelectedDayId(day.id);
                        setSelectedItemId(null);
                      }}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shadow-sm ${
                        isSelected
                          ? 'bg-[#905831] text-white shadow-md'
                          : 'liquid-glass text-neutral-800 hover:bg-white/90'
                      }`}
                    >
                      <span>Day {day.day_number}</span>
                      <span className="text-[10px] opacity-75 font-normal">({day.date})</span>
                      {day.weather && (
                        <span className="text-[10px] opacity-90 ml-1">
                          {day.weather.summary.includes('Rain') || day.weather.rain_prob_pct > 50 ? '🌧️' : '☀️'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Active Day Card */}
              {activeDay && (
                <div className="liquid-glass rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                  {/* Day Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-black/10">
                    <div>
                      <div className="text-xs font-bold text-[#905831] uppercase tracking-wider">
                        Day {activeDay.day_number} • {activeDay.date}
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-[#0a0a0a] mt-0.5">
                        {activeDay.theme}
                      </h2>

                      {/* Smart Optimization & Feature Pills */}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-800">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          <span>AI Route Optimized: {activeDay.items.length} stops sequenced for minimal transit ({activeDay.totals.travel_minutes}m total transit)</span>
                        </div>
                        <button
                          onClick={() => setIsTransportModalOpen(true)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/70 hover:bg-white border border-white/80 text-[11px] font-semibold text-neutral-800 shadow-xs cursor-pointer"
                        >
                          <Navigation className="w-3 h-3 text-[#905831]" />
                          <span>Transit Details</span>
                        </button>
                        <button
                          onClick={() => setIsPackingModalOpen(true)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/70 hover:bg-white border border-white/80 text-[11px] font-semibold text-neutral-800 shadow-xs cursor-pointer"
                        >
                          <Luggage className="w-3 h-3 text-amber-600" />
                          <span>Packing</span>
                        </button>
                      </div>
                    </div>

                    {/* Weather badge */}
                    {activeDay.weather && (
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/70 border border-white/80 text-xs shadow-inner">
                        <div className="text-2xl">
                          {activeDay.weather.rain_prob_pct > 50 ? '🌧️' : '☀️'}
                        </div>
                        <div>
                          <div className="font-bold text-neutral-900">
                            {activeDay.weather.summary} • {activeDay.weather.temp_max_c}°C
                          </div>
                          <div className="text-[10px] text-neutral-500">
                            Rain: {activeDay.weather.rain_prob_pct}% • Source: {activeDay.weather.source}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Day Activities & Restaurants Stream with Inter-Activity Transit */}
                  <div className="space-y-4">
                    {activeDay.items.map((item, idx) => {
                      const isSelected = selectedItemId === item.id;
                      const nextItem = activeDay.items[idx + 1];
                      const routeBetween = nextItem
                        ? activeDay.routes.find(
                            r => r.from_item === item.id || r.to_item === nextItem.id
                          )
                        : null;

                      return (
                        <React.Fragment key={item.id}>
                          <div
                            className={`rounded-2xl p-4 sm:p-5 transition-all border ${
                              isSelected
                                ? 'bg-white border-[#905831] shadow-lg ring-2 ring-[#905831]/20'
                                : 'bg-white/70 hover:bg-white/95 border-white/80 shadow-sm'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-start gap-4">
                                {/* Thumbnail */}
                                <img
                                  src={getPlaceImage(item.place_id, item.category)}
                                  alt={item.name}
                                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-sm shrink-0"
                                />

                                <div>
                                  <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/5 text-[#905831] uppercase">
                                      {item.category}
                                    </span>
                                    <span className="text-xs text-neutral-500 font-mono flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {item.start_time} - {item.end_time} ({item.duration_min} min)
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

                                  <h3 className="font-bold text-base text-neutral-900">
                                    {item.name}
                                  </h3>

                                  <p className="text-xs text-neutral-600 mt-1 leading-relaxed max-w-xl">
                                    {item.reason}
                                  </p>
                                </div>
                              </div>

                              {/* Right Action & Cost */}
                              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                                <div className="text-sm font-bold text-neutral-900">
                                  {item.cost.amount === 0 ? 'Free' : formatCurrency(item.cost.amount)}
                                </div>

                                <div className="flex items-center gap-1.5">
                                  {/* Lock Toggle */}
                                  <button
                                    onClick={() => onToggleLock(item.id, item.locked)}
                                    className={`p-2 rounded-xl text-xs transition-colors ${
                                      item.locked
                                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                        : 'bg-black/5 text-neutral-600 hover:bg-black/10'
                                    }`}
                                    title={item.locked ? 'Unlock item' : 'Lock item (prevent AI from swapping)'}
                                  >
                                    {item.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                  </button>

                                  {/* Select for map */}
                                  <button
                                    onClick={() => {
                                      setSelectedItemId(item.id);
                                      setActiveTab('map');
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl bg-black/5 hover:bg-black/10 text-xs font-semibold text-neutral-800 flex items-center gap-1"
                                  >
                                    <Navigation className="w-3 h-3 text-[#905831]" />
                                    <span>Map</span>
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Reason Factors Expandable Details */}
                            {item.reason_factors && item.reason_factors.length > 0 && (
                              <div className="mt-3 pt-2.5 border-t border-black/5 flex flex-wrap items-center gap-1.5">
                                <span className="text-[10px] font-semibold text-neutral-500 uppercase">
                                  Why this matches you:
                                </span>
                                {item.reason_factors.map((factor, i) => (
                                  <span
                                    key={i}
                                    className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-neutral-700"
                                  >
                                    {factor}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Inter-Activity Transit Connector */}
                          {nextItem && (
                            <div className="flex items-center gap-2 pl-6 sm:pl-8 text-xs text-neutral-600 my-1">
                              <div className="w-0.5 h-4 bg-black/20" />
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/60 border border-white/80 shadow-xs">
                                <Car className="w-3.5 h-3.5 text-[#905831]" />
                                <span className="font-semibold text-neutral-800 capitalize">
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
                                  className="ml-1 text-[10px] text-[#905831] underline font-medium hover:text-black cursor-pointer"
                                >
                                  Options
                                </button>
                              </div>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Day Totals Summary */}
                  <div className="p-4 rounded-2xl bg-white/50 border border-white/60 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-neutral-800">
                    <div className="flex items-center gap-6">
                      <span>Activities: {formatCurrency(activeDay.totals.activity_cost)}</span>
                      <span>Dining: {formatCurrency(activeDay.totals.food_cost)}</span>
                      <span>Transit: {formatCurrency(activeDay.totals.transport_cost)}</span>
                    </div>
                    <div className="text-neutral-500">
                      Total Active Time: {Math.round(activeDay.totals.active_minutes / 60)} hrs • Travel Time: {activeDay.totals.travel_minutes} mins
                    </div>
                  </div>
                </div>
              )}

              {/* Alternative Themes Panel */}
              {itinerary.alternatives && itinerary.alternatives.length > 0 && (
                <div className="liquid-glass rounded-3xl p-6 sm:p-7 shadow-lg space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#905831]" />
                    <h3 className="font-bold text-sm text-neutral-900 uppercase tracking-wider">
                      Alternative Trip Variants
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {itinerary.alternatives.map(alt => (
                      <div
                        key={alt.id}
                        className="p-4 rounded-2xl bg-white/80 border border-white/90 flex flex-col justify-between"
                      >
                        <div>
                          <div className="font-bold text-sm text-neutral-900">{alt.label}</div>
                          <p className="text-xs text-neutral-600 mt-1">{alt.summary}</p>
                          {alt.delta && (
                            <div className="mt-2 text-[11px] text-emerald-700 font-semibold flex items-center gap-2">
                              {alt.delta.cost !== undefined && (
                                <span>Cost: {formatCurrency(alt.delta.cost)}</span>
                              )}
                              {alt.delta.travel_min !== undefined && (
                                <span>Travel: {alt.delta.travel_min} mins</span>
                              )}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => onApplyAlternative(alt.id)}
                          className="mt-4 px-4 py-2 rounded-xl bg-[#905831] hover:bg-[#a6683c] text-white text-xs font-bold transition-colors shadow-sm self-start flex items-center gap-1.5"
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

          {/* Map Tab */}
          {activeTab === 'map' && (
            <motion.div
              key="map"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-[620px] rounded-3xl overflow-hidden shadow-2xl"
            >
              <TripMap
                itinerary={itinerary}
                selectedDayId={selectedDayId}
                selectedItemId={selectedItemId}
                onSelectItem={id => setSelectedItemId(id)}
              />
            </motion.div>
          )}

          {/* Budget & Expenses Tab */}
          {activeTab === 'budget' && (
            <motion.div
              key="budget"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Budget Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="liquid-glass rounded-3xl p-5 shadow-lg">
                  <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                    Total Budget Limit
                  </div>
                  <div className="text-2xl font-extrabold text-neutral-900 mt-1">
                    {formatCurrency(budget.total_limit)}
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-1">
                    Reserved buffer: {budget.reserve_pct}%
                  </div>
                </div>

                <div className="liquid-glass rounded-3xl p-5 shadow-lg">
                  <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                    Estimated Total
                  </div>
                  <div className="text-2xl font-extrabold text-[#905831] mt-1">
                    {formatCurrency(budget.estimated_total)}
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-1">
                    Per person: {formatCurrency(budget.per_person)}
                  </div>
                </div>

                <div className="liquid-glass rounded-3xl p-5 shadow-lg">
                  <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                    Spendable Balance
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-800 mt-1">
                    {formatCurrency(budget.remaining)}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold mt-1">
                    Status: {budget.status.toUpperCase()}
                  </div>
                </div>

                <div className="liquid-glass rounded-3xl p-5 shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                      Actual Expenses Logged
                    </div>
                    <div className="text-2xl font-extrabold text-neutral-900 mt-1">
                      {formatCurrency(expenses.reduce((acc, curr) => acc + curr.amount, 0))}
                    </div>
                  </div>
                  <button
                    onClick={onOpenLogExpense}
                    className="mt-2 py-1.5 px-3 rounded-xl bg-black text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-neutral-800 transition-colors"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Log New</span>
                  </button>
                </div>
              </div>

              {/* Category Breakdown Bar */}
              <div className="liquid-glass rounded-3xl p-6 sm:p-8 shadow-lg space-y-4">
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
                    <div key={cat.label} className="p-3 rounded-2xl bg-white/70 border border-white/80">
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

              {/* Logged Expenses List */}
              <div className="liquid-glass rounded-3xl p-6 sm:p-8 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-neutral-900">
                    Logged Ground Expenses
                  </h3>
                  <button
                    onClick={onOpenLogExpense}
                    className="text-xs font-bold text-[#905831] hover:underline flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add Expense</span>
                  </button>
                </div>

                {expenses.length === 0 ? (
                  <p className="text-xs text-neutral-500 py-6 text-center">
                    No actual on-ground expenses recorded yet. Click "Log Expense" above.
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

          {/* Explore Places Tab */}
          {activeTab === 'explore' && (
            <motion.div
              key="explore"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="liquid-glass rounded-3xl p-6 shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-base text-neutral-900">
                      Places, Stays & Food in {itinerary.trip.destination.name}
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Grounded recommendations with real OpenStreetMap coordinates, estimated expenses, and transit connections
                    </p>
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchCatalogQuery}
                      onChange={e => setSearchCatalogQuery(e.target.value)}
                      placeholder="Search places or categories..."
                      className="w-full rounded-2xl bg-white/80 border border-neutral-300 pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#905831]"
                    />
                  </div>
                </div>

                {/* Category Filter Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-black/5">
                  {[
                    { id: 'all', label: 'All Recommendations', icon: Compass },
                    { id: 'stay', label: 'Stays & Stays', icon: Hotel },
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
                            ? 'bg-[#905831] text-white shadow-sm'
                            : 'bg-white/60 text-neutral-700 hover:bg-white border border-black/5'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{filter.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Display All Filtered Places Grid */}
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

                      return (
                        <div
                          key={it.id}
                          className="rounded-2xl bg-white/80 border border-white/90 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                        >
                          <div>
                            <div className="relative">
                              <img
                                src={getPlaceImage(it.place_id, it.category)}
                                alt={it.name}
                                className="w-full h-36 object-cover"
                              />
                              <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-xs text-white text-[10px] font-bold">
                                {it.cost.amount === 0 ? 'Free Entry' : formatCurrency(it.cost.amount)}
                              </span>
                            </div>
                            <div className="p-4 space-y-2">
                              <div className="flex items-center justify-between text-[10px] font-bold text-[#905831] uppercase">
                                <span className="flex items-center gap-1">
                                  {isStay ? <Hotel className="w-3 h-3" /> : isFood ? <Utensils className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                                  {it.category}
                                </span>
                                <span className="text-neutral-500 font-normal lowercase">{it.start_time} - {it.end_time}</span>
                              </div>
                              <div className="font-bold text-sm text-neutral-900 leading-snug">{it.name}</div>
                              <p className="text-xs text-neutral-600 line-clamp-2">{it.reason}</p>
                            </div>
                          </div>

                          <div className="px-4 pb-4 pt-1 flex items-center justify-between border-t border-black/5 text-[11px]">
                            <span className="text-[10px] text-neutral-500 italic">
                              {isStay ? 'Estimated stay cost' : isFood ? 'Local culinary price' : 'Free OSM coordinates'}
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

          {/* Versions Tab */}
          {activeTab === 'versions' && (
            <motion.div
              key="versions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="liquid-glass rounded-3xl p-6 sm:p-8 shadow-lg">
                <div className="mb-6">
                  <h3 className="font-bold text-lg text-neutral-900">
                    Itinerary Version Timeline
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Every modification creates an immutable snapshot. You can revert back anytime.
                  </p>
                </div>

                <div className="space-y-4">
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
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-bold shrink-0 ${
                              isCurrent ? 'bg-[#905831] text-white' : 'bg-black/10 text-neutral-700'
                            }`}
                          >
                            v{v.version}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                              <span>{v.change_summary || `Version ${v.version}`}</span>
                              {isCurrent && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                                  Current
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-neutral-500 mt-0.5">
                              Created by: <span className="font-medium">{v.created_by}</span> •{' '}
                              {new Date(v.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {!isCurrent && (
                          <button
                            onClick={() => onRevertVersion(v.version)}
                            className="px-3.5 py-1.5 rounded-xl bg-black/5 hover:bg-black/10 text-neutral-800 text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
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

          {/* Analytics Tab */}
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
                <div className="liquid-glass rounded-3xl p-6 sm:p-7 shadow-lg space-y-4">
                  <h3 className="font-bold text-base text-neutral-900">
                    Planned vs Actual Spending
                  </h3>
                  <div className="space-y-3 pt-2">
                    {analytics.by_category.map(cat => {
                      const maxVal = Math.max(cat.planned, cat.actual, 100);
                      const plannedPct = Math.min(100, (cat.planned / maxVal) * 100);
                      const actualPct = Math.min(100, (cat.actual / maxVal) * 100);

                      return (
                        <div key={cat.category} className="space-y-1 text-xs">
                          <div className="flex justify-between font-semibold capitalize">
                            <span>{cat.category}</span>
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
                <div className="liquid-glass rounded-3xl p-6 sm:p-7 shadow-lg space-y-4">
                  <h3 className="font-bold text-base text-neutral-900">
                    Day-wise Activity & Travel Load
                  </h3>
                  <div className="space-y-3 pt-2">
                    {analytics.pace_distribution.map(d => (
                      <div key={d.day_number} className="p-3 rounded-2xl bg-white/70 border border-white/80 text-xs">
                        <div className="flex justify-between font-bold text-neutral-900 mb-1">
                          <span>Day {d.day_number}</span>
                          <span>{d.items_count} Scheduled Stops</span>
                        </div>
                        <div className="text-[11px] text-neutral-600 flex gap-4">
                          <span>Active: {Math.round(d.active_minutes / 60)} hrs</span>
                          <span>Travel / Transit: {d.travel_minutes} mins</span>
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
    </div>
  );
};
