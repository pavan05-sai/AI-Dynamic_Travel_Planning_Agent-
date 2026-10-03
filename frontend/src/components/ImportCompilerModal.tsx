import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FileCode,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  IndianRupee,
  ShieldCheck,
  RefreshCw,
  Layers,
} from 'lucide-react';
import type { CanonicalItinerary } from '../types';
import { api } from '../services/api';

interface ImportCompilerModalProps {
  isOpen: boolean;
  onClose: () => void;
  itinerary: CanonicalItinerary;
  tripId: number | string;
  onItineraryUpdated: (newItinerary: CanonicalItinerary) => void;
}

const SAMPLE_TEXTS = {
  flight_hotel: `Flight Indigo 6E-204 from Delhi to Goa
PNR: 6E98AB
Arrival at 10:30 am
Check-in at Taj Fort Aguada Resort at 12:30 pm
Booking Ref: TAJ88492
Dinner at Fisherman's Wharf at 7:30 pm - ₹2,500`,

  whatsapp_plan: `Hey! For Day 2 plan:
- Breakfast at Infantaria Bakery at 9:00 am (approx ₹450)
- Visit Chapora Fort at 11:30 am
- Sunset drinks at Curlies Beach Shack Anjuna at 5:30 pm
- Tito's Lane nightlife at 9:00 pm`,

  historical_tour: `Day 1 Sightseeing Notes:
10:00 am - Basilica of Bom Jesus (Old Goa UNESCO site)
12:30 pm - Se Cathedral
2:00 pm - Authentic Goan fish thali at Kokni Kanteen (₹600)
4:00 pm - Fontainhas Latin Quarter heritage walk`,
};

export const ImportCompilerModal: React.FC<ImportCompilerModalProps> = ({
  isOpen,
  onClose,
  itinerary,
  tripId,
  onItineraryUpdated,
}) => {
  const [inputText, setInputText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [parsedData, setParsedData] = useState<{
    items: any[];
    conflicts: string[];
    extracted_count: number;
    catalog_matched_count: number;
  } | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const handleParse = async () => {
    if (!inputText.trim()) {
      alert('Please enter or paste text to compile.');
      return;
    }
    setParsing(true);
    setParsedData(null);
    try {
      const res = await api.compilerParse(tripId, inputText);
      setParsedData(res);
      const initialSelected: Record<string, boolean> = {};
      res.items.forEach((it: any) => {
        initialSelected[it.id] = true;
      });
      setSelectedItemIds(initialSelected);
    } catch (err: any) {
      alert(`Parsing failed: ${err.message || 'Could not parse text'}`);
    } finally {
      setParsing(false);
    }
  };

  const handleApply = async () => {
    if (!parsedData || parsedData.items.length === 0) return;

    const itemsToApply = parsedData.items.filter((it) => selectedItemIds[it.id]);
    if (itemsToApply.length === 0) {
      alert('Please select at least one item to add to your itinerary.');
      return;
    }

    setApplying(true);
    try {
      const res = await api.compilerApply(tripId, itemsToApply);
      onItineraryUpdated(res.itinerary);
      alert(`Successfully added ${res.added_count} items to your trip! Created Version ${res.version}.`);
      onClose();
    } catch (err: any) {
      alert(`Failed to apply items: ${err.message || 'Could not update itinerary'}`);
    } finally {
      setApplying(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedItemIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl border border-black/10 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-black/5 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-900/20">
                <FileCode className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-[#111827]">
                    Import-to-Itinerary Compiler
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Natural Text & Bookings
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                  Paste tickets, WhatsApp notes, or booking emails to compile directly into your {itinerary.trip.destination.name} plan
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {/* Input Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
                  Paste Travel Notes / Booking Confirmations:
                </label>
                {/* Sample Presets */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-neutral-400 hidden sm:inline">Try sample:</span>
                  <button
                    onClick={() => setInputText(SAMPLE_TEXTS.flight_hotel)}
                    className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold text-[11px] transition-colors cursor-pointer"
                  >
                    Flight + Hotel
                  </button>
                  <button
                    onClick={() => setInputText(SAMPLE_TEXTS.whatsapp_plan)}
                    className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold text-[11px] transition-colors cursor-pointer"
                  >
                    WhatsApp Plan
                  </button>
                  <button
                    onClick={() => setInputText(SAMPLE_TEXTS.historical_tour)}
                    className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold text-[11px] transition-colors cursor-pointer"
                  >
                    Day Notes
                  </button>
                </div>
              </div>

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="e.g. Flight Indigo 6E-204 arriving at 10:30 am... Day 2 visit Fort Aguada at 11am, lunch at Fisherman's Wharf ₹1,800..."
                rows={5}
                className="w-full p-4 rounded-2xl border border-neutral-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs sm:text-sm text-neutral-800 font-mono transition-all resize-none shadow-inner"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-neutral-500">
                  Extracts places, timings, costs, booking codes with provenance tracking.
                </span>
                <button
                  onClick={handleParse}
                  disabled={parsing || !inputText.trim()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-900/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {parsing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Compiling...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Parse & Extract</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Extracted Candidates Preview */}
            {parsedData && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 pt-3 border-t border-neutral-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-sm text-neutral-900">
                      Extracted {parsedData.extracted_count} Itinerary Items
                    </h3>
                  </div>
                  <span className="text-xs text-neutral-500 font-medium">
                    {parsedData.catalog_matched_count} matched to verified catalog places
                  </span>
                </div>

                {parsedData.conflicts.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>Notices & Conflicts:</span>
                    </div>
                    {parsedData.conflicts.map((c, i) => (
                      <p key={i} className="pl-5">• {c}</p>
                    ))}
                  </div>
                )}

                {/* Items Checklist Table */}
                <div className="space-y-2.5">
                  {parsedData.items.map((it: any) => {
                    const isChecked = !!selectedItemIds[it.id];
                    return (
                      <div
                        key={it.id}
                        onClick={() => toggleSelect(it.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isChecked
                            ? 'border-emerald-500 bg-emerald-50/40 shadow-xs'
                            : 'border-neutral-200 bg-neutral-50 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-xs sm:text-sm text-neutral-900">
                                {it.name}
                              </h4>
                              {it.provenance?.catalog_matched ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                  Catalog Verified
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 text-[10px] font-medium">
                                  Custom Location
                                </span>
                              )}
                              {it.booking_ref && (
                                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-mono font-bold">
                                  Ref: {it.booking_ref}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-neutral-500">
                              <span className="font-semibold text-neutral-700 uppercase tracking-wider text-[10px]">
                                Day {it.day_number}
                              </span>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-neutral-400" />
                                <span>{it.start_time}</span>
                              </div>
                              <span>•</span>
                              <div className="flex items-center gap-1 font-semibold text-neutral-800">
                                <IndianRupee className="w-3 h-3 text-neutral-500" />
                                <span>₹{it.cost}</span>
                              </div>
                              <span>•</span>
                              <span className="italic text-neutral-400 text-[11px] truncate max-w-xs">
                                "{it.provenance?.original_snippet}"
                              </span>
                            </div>
                          </div>
                        </div>

                        <span className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-neutral-200 text-neutral-700 font-semibold capitalize shrink-0">
                          {it.category}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 border-t border-black/5 bg-neutral-50 flex items-center justify-between">
            <span className="text-xs text-neutral-500">
              {parsedData ? `Selected: ${Object.values(selectedItemIds).filter(Boolean).length} items` : 'Compile any unstructured travel information into structured data.'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-neutral-600 hover:text-neutral-900 text-xs font-semibold"
              >
                Cancel
              </button>
              {parsedData && (
                <button
                  onClick={handleApply}
                  disabled={applying || Object.values(selectedItemIds).filter(Boolean).length === 0}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-900/20 disabled:opacity-50 cursor-pointer"
                >
                  {applying ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Itinerary...</span>
                    </>
                  ) : (
                    <>
                      <Layers className="w-3.5 h-3.5" />
                      <span>Compile & Save as New Version</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
