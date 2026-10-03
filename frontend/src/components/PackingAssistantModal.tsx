import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Luggage,
  Check,
  Umbrella,
  Sun,
  Shirt,
  Smartphone,
  ShieldAlert,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import type { CanonicalItinerary } from '../types';

interface PackingAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  itinerary: CanonicalItinerary;
}

interface PackingItem {
  id: string;
  name: string;
  category: 'clothing' | 'weather' | 'tech' | 'health';
  reason: string;
  checked: boolean;
}

export const PackingAssistantModal: React.FC<PackingAssistantModalProps> = ({
  isOpen,
  onClose,
  itinerary,
}) => {
  const destId = (itinerary.trip.destination.catalog_id || itinerary.trip.destination.name).toLowerCase();
  const isGoa = destId.includes('goa');
  const isJaipur = destId.includes('jaipur');
  const numDays = itinerary.trip.num_days || 3;

  // Detect if any day has high rain probability
  const maxRainProb = Math.max(...itinerary.days.map(d => d.weather?.rain_prob_pct || 0), 10);
  const isRainy = maxRainProb >= 40;

  // Initial tailored packing list
  const initialItems: PackingItem[] = [
    // Clothing
    {
      id: 'c1',
      name: `${numDays + 1}x Breathable Linen / Cotton Tops`,
      category: 'clothing',
      reason: `Ideal for ${itinerary.trip.destination.name}'s warm tropical/semi-arid climate`,
      checked: true,
    },
    {
      id: 'c2',
      name: isGoa ? 'Beachwear & Swimsuits (2 sets)' : 'Modest Attire covering shoulders and knees',
      category: 'clothing',
      reason: isGoa ? 'For coastal visits, beaches & pool loungers' : 'Essential for visiting historical temples and royal palaces',
      checked: false,
    },
    {
      id: 'c3',
      name: 'Comfortable Walking Sneakers / Trainers',
      category: 'clothing',
      reason: 'Needed for fort climbs, cobblestones, and walking tours',
      checked: true,
    },
    {
      id: 'c4',
      name: 'Slip-on Sandals or Flip-flops',
      category: 'clothing',
      reason: 'Easy removal at temples, sacred sites, and beach walks',
      checked: false,
    },
    {
      id: 'c5',
      name: 'Light Evening Jacket or Shawl',
      category: 'clothing',
      reason: isJaipur ? 'Evenings in Rajasthan can cool down noticeably' : 'Helpful for air-conditioned transit & evening breeze',
      checked: false,
    },

    // Weather & Protection
    {
      id: 'w1',
      name: isRainy ? 'Compact Windproof Travel Umbrella' : 'UV Protection Sunglasses (Polarized)',
      category: 'weather',
      reason: isRainy ? `Forecast indicates up to ${maxRainProb}% rain probability` : 'High daytime UV index protection',
      checked: false,
    },
    {
      id: 'w2',
      name: isRainy ? 'Quick-dry Waterproof Jacket / Poncho' : 'Wide-brim Sun Hat / Cap',
      category: 'weather',
      reason: isRainy ? 'Keeps you dry while exploring outdoor sights' : 'Essential for open fort ramparts and sunny courtyards',
      checked: false,
    },
    {
      id: 'w3',
      name: 'Broad Spectrum SPF 50+ Sunscreen',
      category: 'weather',
      reason: 'Crucial for multi-hour outdoor sightseeing and beach exposure',
      checked: false,
    },

    // Tech & Travel Documents
    {
      id: 't1',
      name: 'High-Capacity Power Bank (10,000+ mAh)',
      category: 'tech',
      reason: 'For navigation, photos, and digital payment apps all day',
      checked: true,
    },
    {
      id: 't2',
      name: 'Government Photo ID / Passport Copies',
      category: 'tech',
      reason: 'Mandatory for hotel check-ins and monument ticket counters',
      checked: true,
    },
    {
      id: 't3',
      name: isGoa ? 'Waterproof Phone Pouch / Dry Bag' : 'Lightweight Daypack (15-20L)',
      category: 'tech',
      reason: isGoa ? 'Protects electronics from sand and water' : 'Carries water, camera, and souvenirs comfortably',
      checked: false,
    },

    // Health & Toiletries
    {
      id: 'h1',
      name: 'Electrolyte ORS Sachets',
      category: 'health',
      reason: 'Stay hydrated during warm daytime walking exploration',
      checked: false,
    },
    {
      id: 'h2',
      name: 'Mosquito / Insect Repellent Spray',
      category: 'health',
      reason: 'Useful during coastal evenings and garden/courtyard strolls',
      checked: false,
    },
    {
      id: 'h3',
      name: 'Personal Medical Kit (Band-aids, Antacids, Paracetamol)',
      category: 'health',
      reason: 'Quick relief for blisters or travel fatigue',
      checked: false,
    },
  ];

  const [items, setItems] = useState<PackingItem[]>(initialItems);

  const toggleItem = (id: string) => {
    setItems(prev =>
      prev.map(item => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const resetAll = () => {
    setItems(initialItems.map(item => ({ ...item, checked: false })));
  };

  const checkedCount = items.filter(i => i.checked).length;
  const pct = Math.round((checkedCount / items.length) * 100);

  const categoryLabels = {
    clothing: { label: 'Attire & Footwear', icon: Shirt, color: 'text-blue-700 bg-blue-50' },
    weather: { label: 'Weather Protection', icon: isRainy ? Umbrella : Sun, color: 'text-amber-700 bg-amber-50' },
    tech: { label: 'Tech & Documents', icon: Smartphone, color: 'text-purple-700 bg-purple-50' },
    health: { label: 'Health & Essentials', icon: ShieldAlert, color: 'text-emerald-700 bg-emerald-50' },
  };

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
            className="relative w-full max-w-2xl max-h-[90vh] liquid-glass rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/80 overflow-y-auto text-[#1a1a1a]"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-black/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0a0a0a] text-white flex items-center justify-center shadow-md">
                  <Luggage className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h2 className="font-bold text-lg sm:text-xl text-[#0a0a0a] flex items-center gap-2">
                    <span>Smart Packing Assistant</span>
                    <Sparkles className="w-4 h-4 text-[#905831]" />
                  </h2>
                  <p className="text-xs text-neutral-600">
                    Customized for {numDays} days in {itinerary.trip.destination.name} • Climate-aware checklist
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

            {/* Packing Progress Bar */}
            <div className="mt-5 p-4 rounded-2xl bg-white/70 border border-white/80 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="flex items-center gap-1.5 text-neutral-900">
                  <Luggage className="w-4 h-4 text-[#905831]" />
                  Luggage Readiness
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={resetAll}
                    className="text-[11px] font-semibold text-neutral-500 hover:text-black flex items-center gap-1 transition-colors"
                    title="Reset all checkmarks"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                  <span className="font-mono text-emerald-700 font-extrabold">{pct}% ({checkedCount}/{items.length})</span>
                </div>
              </div>

              <div className="h-2.5 w-full bg-black/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#905831] via-amber-600 to-emerald-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>

            {/* Checklist Categorized */}
            <div className="mt-6 space-y-6">
              {(['clothing', 'weather', 'tech', 'health'] as const).map(catKey => {
                const catInfo = categoryLabels[catKey];
                const CatIcon = catInfo.icon;
                const catItems = items.filter(i => i.category === catKey);

                return (
                  <div key={catKey} className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${catInfo.color}`}>
                        <CatIcon className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-700">
                        {catInfo.label}
                      </h3>
                    </div>

                    <div className="space-y-2">
                      {catItems.map(item => (
                        <div
                          key={item.id}
                          onClick={() => toggleItem(item.id)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                            item.checked
                              ? 'bg-emerald-50/70 border-emerald-300 text-neutral-800'
                              : 'bg-white/70 hover:bg-white border-white/80 text-neutral-900 shadow-sm'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                              item.checked
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-neutral-300 bg-white'
                            }`}
                          >
                            {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className={`font-semibold text-xs leading-snug ${item.checked ? 'line-through opacity-75' : ''}`}>
                              {item.name}
                            </div>
                            <div className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
                              {item.reason}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="mt-8 pt-4 border-t border-black/10 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-full bg-[#0a0a0a] text-white text-xs font-bold hover:bg-black/90 transition-all hover:scale-[1.02] shadow-md"
              >
                Done Packing
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
