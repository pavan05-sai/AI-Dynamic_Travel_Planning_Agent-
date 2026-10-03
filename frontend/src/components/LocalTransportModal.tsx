import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Navigation,
  Car,
  Bike,
  Footprints,
  Bus,
  Plane,
  Clock,
  MapPin,
  Info,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import type { CanonicalItinerary } from '../types';

interface LocalTransportModalProps {
  isOpen: boolean;
  onClose: () => void;
  itinerary: CanonicalItinerary;
  selectedDayId?: string;
}

export const LocalTransportModal: React.FC<LocalTransportModalProps> = ({
  isOpen,
  onClose,
  itinerary,
  selectedDayId,
}) => {
  const [activeDayId, setActiveDayId] = useState<string>(
    selectedDayId || itinerary.days[0]?.id || 'day_1'
  );

  const currentDay = itinerary.days.find(d => d.id === activeDayId) || itinerary.days[0];
  const totalTravelMins = currentDay?.totals.travel_minutes || 0;
  const totalDistanceKm = currentDay?.routes.reduce((acc, r) => acc + (r.distance_km || 0), 0) || 0;

  // Regional transport guidance based on destination
  const destId = (itinerary.trip.destination.catalog_id || itinerary.trip.destination.name).toLowerCase();
  const isGoa = destId.includes('goa');
  const isJaipur = destId.includes('jaipur');

  const transportModes = [
    {
      id: 'cab',
      name: 'Taxi / App Cab',
      icon: Car,
      rate: isGoa ? '₹22 - ₹28 / km' : '₹18 - ₹24 / km',
      speed: '25-40 km/h',
      bestFor: 'Groups, luggage, and cross-district transfers',
      note: isGoa
        ? 'Goa Miles app or prepaid taxi counters at airport & stations'
        : 'Uber, Ola, and pre-paid city taxi counters available',
      color: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-900',
    },
    {
      id: 'auto',
      name: 'Auto / Tuk-Tuk',
      icon: Navigation,
      rate: '₹14 - ₹18 / km',
      speed: '20-30 km/h',
      bestFor: 'Short hops, bustling market lanes, and inner-city sights',
      note: isJaipur
        ? 'Iconic Jaipur e-rickshaws and auto-rickshaws inside the Walled Pink City'
        : 'Great for short hops between beaches or urban hubs',
      color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-900',
    },
    {
      id: 'rental',
      name: isGoa ? 'Scooter / Self-Drive Rental' : 'Private Driver / Rental',
      icon: Bike,
      rate: isGoa ? '₹400 - ₹700 / day' : '₹1,800 - ₹2,500 / day',
      speed: 'Flexible',
      bestFor: 'Maximum freedom to stop at scenic viewpoints and coastal cafes',
      note: 'Valid driver license required. Always wear helmets and respect local rules.',
      color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-900',
    },
    {
      id: 'public',
      name: 'Public Bus & Transit',
      icon: Bus,
      rate: '₹15 - ₹50 flat fare',
      speed: 'Scheduled',
      bestFor: 'Budget travelers and connecting major bus terminals',
      note: isJaipur ? 'Jaipur Metro connects Mansarovar to Chandpole' : 'Kadamba Transport buses connect North and South Goa',
      color: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-900',
    },
    {
      id: 'walk',
      name: 'Heritage Walking',
      icon: Footprints,
      rate: 'Zero Cost',
      speed: '4-5 km/h',
      bestFor: 'Exploring historic quarters, old alleyways, and vibrant bazaars',
      note: 'Best in morning hours or late afternoon to avoid peak sun.',
      color: 'from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-900',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-3xl max-h-[90vh] liquid-glass rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/80 overflow-y-auto text-[#1a1a1a]"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-black/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0a0a0a] text-white flex items-center justify-center shadow-md">
                  <Navigation className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h2 className="font-bold text-lg sm:text-xl text-[#0a0a0a]">
                    Getting Around — Local Transport Guide
                  </h2>
                  <p className="text-xs text-neutral-600">
                    {itinerary.trip.destination.name} • Grounded routing and estimated transit options
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-black/5 text-neutral-500 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Disclaimer pill */}
            <div className="mt-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Estimated local transport</span>: Rates and transit durations are calculated using OSRM geographic routing and verified local fare structures. Wandor does not claim live cab booking availability.
              </div>
            </div>

            {/* Day Selector */}
            <div className="mt-5 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {itinerary.days.map(d => (
                <button
                  key={d.id}
                  onClick={() => setActiveDayId(d.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                    activeDayId === d.id
                      ? 'bg-[#0a0a0a] text-white shadow-md'
                      : 'bg-white/60 hover:bg-white text-neutral-700 border border-white/80'
                  }`}
                >
                  <span>Day {d.day_number}</span>
                  <span className="text-[10px] opacity-75 font-normal">
                    ({d.routes.length} legs)
                  </span>
                </button>
              ))}
            </div>

            {/* Day Transit Stats Banner */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-white/60 border border-white/80">
                <div className="text-[10px] uppercase font-bold text-neutral-500">Day Travel Time</div>
                <div className="text-base font-extrabold text-[#0a0a0a] mt-0.5 flex items-center gap-1">
                  <Clock className="w-4 h-4 text-[#905831]" />
                  <span>{totalTravelMins} mins</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/60 border border-white/80">
                <div className="text-[10px] uppercase font-bold text-neutral-500">Total Distance</div>
                <div className="text-base font-extrabold text-[#0a0a0a] mt-0.5 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>{totalDistanceKm.toFixed(1)} km</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/60 border border-white/80">
                <div className="text-[10px] uppercase font-bold text-neutral-500">Est. Transport Cost</div>
                <div className="text-base font-extrabold text-[#0a0a0a] mt-0.5">
                  ₹{currentDay?.totals.transport_cost || Math.round(totalDistanceKm * 20)}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/60 border border-white/80">
                <div className="text-[10px] uppercase font-bold text-neutral-500">Routing Status</div>
                <div className="text-base font-extrabold text-emerald-700 mt-0.5 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>OSRM Optimized</span>
                </div>
              </div>
            </div>

            {/* Step-by-Step Route Legs on this Day */}
            <div className="mt-6">
              <h3 className="font-bold text-sm text-[#0a0a0a] mb-3">
                Scheduled Transit Legs for Day {currentDay?.day_number}:
              </h3>

              {currentDay && currentDay.routes.length > 0 ? (
                <div className="space-y-2.5">
                  {currentDay.routes.map((route, i) => {
                    const fromItem = currentDay.items.find(it => it.id === route.from_item);
                    const toItem = currentDay.items.find(it => it.id === route.to_item);

                    return (
                      <div
                        key={route.id || i}
                        className="p-3.5 rounded-2xl bg-white/80 border border-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-xl bg-black/5 text-[#905831] flex items-center justify-center font-bold text-xs">
                            {i + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
                              <span>{fromItem?.name || 'Hotel / Departure'}</span>
                              <ArrowRight className="w-3 h-3 text-neutral-400" />
                              <span>{toItem?.name || 'Destination'}</span>
                            </div>
                            <div className="text-[11px] text-neutral-500 capitalize">
                              Mode: {route.mode} • Source: {route.source}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <div className="font-bold text-neutral-900">{route.duration_min} mins</div>
                            <div className="text-[10px] text-neutral-500">{route.distance_km} km</div>
                          </div>
                          <div className="px-2.5 py-1 rounded-full bg-emerald-100/70 text-emerald-800 font-bold text-[11px]">
                            ~₹{route.cost || Math.round(route.distance_km * 20)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-white/40 text-center text-xs text-neutral-500">
                  No inter-activity transit required on this day (all activities within walking distance).
                </div>
              )}
            </div>

            {/* Recommended Modes of Transport */}
            <div className="mt-8">
              <h3 className="font-bold text-sm text-[#0a0a0a] mb-3">
                Recommended Local Transport Options in {itinerary.trip.destination.name}:
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {transportModes.map(m => {
                  const Icon = m.icon;
                  return (
                    <div
                      key={m.id}
                      className={`p-4 rounded-2xl bg-gradient-to-br ${m.color} border shadow-sm`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-black" />
                          <h4 className="font-bold text-xs text-black">{m.name}</h4>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-black">{m.rate}</span>
                      </div>
                      <p className="text-[11px] text-neutral-800 leading-relaxed mb-1.5">
                        {m.note}
                      </p>
                      <div className="text-[10px] text-neutral-600 font-medium">
                        <span className="font-bold">Best for:</span> {m.bestFor}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Airport / Inter-city Hub Information */}
            <div className="mt-6 p-4 rounded-2xl bg-white/60 border border-white/80 flex items-start gap-3">
              <Plane className="w-5 h-5 text-[#905831] shrink-0 mt-0.5" />
              <div className="text-xs text-neutral-700">
                <span className="font-bold text-black">Arrival & Departure Transfers:</span>{' '}
                {isGoa
                  ? 'Transfers from Goa Dabolim (GOI) or Mopa Manohar (GOX) airports are typically ₹1,200 - ₹2,000 depending on North/South beach location.'
                  : isJaipur
                  ? 'Transfers from Jaipur Airport (JAI) or Jaipur Junction train station to city center average ₹300 - ₹600 via app cab or pre-paid counter.'
                  : 'Transfers from Rajiv Gandhi International Airport (HYD) to Banjara Hills/Old City average ₹800 - ₹1,200 via Pushpak Airport Liner or pre-paid cab.'}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
