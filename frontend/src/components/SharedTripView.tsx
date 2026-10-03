import React, { useEffect, useState } from 'react';
import type { CanonicalItinerary } from '../types';
import { api } from '../services/api';
import { TripMap } from './TripMap';
import { getPlaceImage, formatCurrency } from '../utils/images';
import { Calendar, MapPin, Clock, ArrowLeft } from 'lucide-react';

interface SharedTripViewProps {
  token: string;
  onGoHome: () => void;
}

export const SharedTripView: React.FC<SharedTripViewProps> = ({ token, onGoHome }) => {
  const [itinerary, setItinerary] = useState<CanonicalItinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDayId, setSelectedDayId] = useState<string>('day_1');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  useEffect(() => {
    async function loadShared() {
      try {
        setLoading(true);
        const data = await api.getSharedTrip(token);
        setItinerary(data);
        if (data.days.length > 0) {
          setSelectedDayId(data.days[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Shared itinerary not found or link has expired.');
      } finally {
        setLoading(false);
      }
    }
    loadShared();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 rounded-full border-2 border-[#905831] border-t-transparent animate-spin mb-4" />
        <p className="text-xs text-neutral-400">Loading shared travel itinerary...</p>
      </div>
    );
  }

  if (error || !itinerary) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold mb-2">Itinerary Unavailable</h2>
        <p className="text-xs text-neutral-400 mb-6">{error || 'This link may have expired or was revoked.'}</p>
        <button
          onClick={onGoHome}
          className="px-5 py-2.5 rounded-full bg-white text-black font-semibold text-xs flex items-center gap-2 hover:bg-neutral-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Wandor Home</span>
        </button>
      </div>
    );
  }

  const activeDay = itinerary.days.find(d => d.id === selectedDayId) || itinerary.days[0];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#1a1a1a] pt-12 pb-20 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={onGoHome}
            className="flex items-center gap-2 text-white hover:text-amber-400 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Plan your own trip on Wandor</span>
          </button>
          <div className="font-brand text-xl text-white font-bold tracking-wider">
            wandor
          </div>
        </div>

        {/* Hero Card */}
        <div className="liquid-glass rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-2.5 py-0.5 rounded-full bg-black text-white text-[10px] font-bold uppercase">
              Shared Itinerary
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 text-[10px] font-bold">
              v{itinerary.version} Snapshot
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0a0a0a]">
            {itinerary.trip.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-neutral-600 font-medium">
            <span className="flex items-center gap-1 font-bold text-black">
              <MapPin className="w-3.5 h-3.5 text-[#905831]" />
              {itinerary.trip.destination.name}, {itinerary.trip.destination.country}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-neutral-500" />
              {itinerary.trip.start_date} to {itinerary.trip.end_date} ({itinerary.trip.num_days} Days)
            </span>
          </div>
        </div>

        {/* Day Selectors */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {itinerary.days.map(d => (
            <button
              key={d.id}
              onClick={() => setSelectedDayId(d.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                selectedDayId === d.id
                  ? 'bg-[#905831] text-white shadow-md'
                  : 'liquid-glass text-neutral-800 hover:bg-white/90'
              }`}
            >
              Day {d.day_number} ({d.date})
            </button>
          ))}
        </div>

        {/* Content Grid: Itinerary & Map */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Day Items List */}
          <div className="liquid-glass rounded-3xl p-6 shadow-xl space-y-4">
            <div className="border-b border-black/10 pb-3">
              <div className="text-xs font-bold text-[#905831] uppercase">Day {activeDay?.day_number}</div>
              <h3 className="font-bold text-lg text-neutral-900">{activeDay?.theme}</h3>
            </div>

            <div className="space-y-3">
              {activeDay?.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    selectedItemId === item.id
                      ? 'bg-white border-[#905831] shadow-md ring-2 ring-[#905831]/20'
                      : 'bg-white/70 hover:bg-white border-white/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={getPlaceImage(item.place_id, item.category)}
                      alt={item.name}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                    <div>
                      <div className="text-[10px] font-bold text-[#905831] uppercase">{item.category}</div>
                      <div className="text-xs font-bold text-neutral-900">{item.name}</div>
                      <div className="text-[10px] text-neutral-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {item.start_time} - {item.end_time}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-neutral-800">
                    {item.cost.amount === 0 ? 'Free' : formatCurrency(item.cost.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Map */}
          <div className="h-[460px] rounded-3xl overflow-hidden shadow-2xl">
            <TripMap
              itinerary={itinerary}
              selectedDayId={selectedDayId}
              selectedItemId={selectedItemId}
              onSelectItem={id => setSelectedItemId(id)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
