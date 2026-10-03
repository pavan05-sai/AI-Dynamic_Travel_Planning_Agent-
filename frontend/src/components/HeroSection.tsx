import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Calendar, Users, IndianRupee, ArrowRight, Zap, Check, Compass, SlidersHorizontal, Upload, X, MapPin, Loader2 } from 'lucide-react';
import type { Destination } from '../types';
import { api } from '../services/api';

interface HeroSectionProps {
  destinations: Destination[];
  onStartPlanning: (data: {
    destination_id: string;
    start_date: string;
    end_date: string;
    travelers: { adults: number; children: number };
    budget: number;
    title: string;
    prompt?: string;
    pace: string;
    interests: string[];
  }) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  destinations,
  onStartPlanning,
}) => {
  const [videoError, setVideoError] = useState(false);
  const [selectedDestId, setSelectedDestId] = useState<string>('dest_goa');
  const [destinationQuery, setDestinationQuery] = useState<string>('Goa, India');
  const [suggestions, setSuggestions] = useState<Destination[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const searchTimeoutRef = useRef<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [naturalPrompt, setNaturalPrompt] = useState<string>(
    "I'm planning a 4-day trip to Goa with coastal seafood, serene beaches, and historic Portuguese architecture on a ₹30,000 budget."
  );
  const [startDate, setStartDate] = useState<string>('2026-11-20');
  const [numDays, setNumDays] = useState<number>(4);
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);
  const [budget, setBudget] = useState<number>(30000);
  const [pace, setPace] = useState<string>('relaxed');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [inspirationFile, setInspirationFile] = useState<{ name: string; url: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quick preset pills for popular travel choices
  const presetChips = [
    {
      id: 'dest_goa',
      name: 'Goa, India',
      title: 'Goa Coastal Escape',
      days: 4,
      budget: 30000,
      pace: 'relaxed',
      prompt: '4 days in Goa with coastal seafood, sunny beaches, and historic Portuguese architecture.',
    },
    {
      id: 'dest_jaipur',
      name: 'Jaipur, India',
      title: 'Royal Jaipur Heritage',
      days: 3,
      budget: 25000,
      pace: 'balanced',
      prompt: '3 days exploring the Pink City forts, royal palaces, Rajasthani culinary thalis, and astronomical sights.',
    },
    {
      id: 'dest_hyderabad',
      name: 'Hyderabad, India',
      title: 'Historic Hyderabad & Pearls',
      days: 3,
      budget: 22000,
      pace: 'balanced',
      prompt: '3 days in Hyderabad visiting Golconda fortress, Charminar, Salar Jung art, and legendary dum biryani.',
    },
    {
      id: 'Tokyo',
      name: 'Tokyo, Japan',
      title: 'Tokyo Neon & Temples',
      days: 5,
      budget: 95000,
      pace: 'balanced',
      prompt: '5 days in Tokyo exploring vibrant Shibuya, serene Asakusa temples, Tsukiji outer market sushi, and cutting-edge culture.',
    },
    {
      id: 'Paris',
      name: 'Paris, France',
      title: 'Parisian Art & Sights',
      days: 4,
      budget: 85000,
      pace: 'relaxed',
      prompt: '4 days in Paris strolling the Seine, visiting the Louvre and Eiffel Tower, and enjoying authentic French bistro culture.',
    }
  ];

  const handleDestinationInputChange = (val: string) => {
    setDestinationQuery(val);
    setSelectedDestId('');
    setShowDropdown(true);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!val.trim() || val.length < 2) {
      setSuggestions(destinations);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await api.searchDestinations(val);
        setSuggestions(results);
      } catch (err) {
        console.warn('Destination search failed, falling back to local matches:', err);
        const filtered = destinations.filter(d =>
          d.name.toLowerCase().includes(val.toLowerCase()) ||
          (d.country && d.country.toLowerCase().includes(val.toLowerCase()))
        );
        setSuggestions(filtered);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleSelectDestination = (dest: Destination) => {
    setSelectedDestId(dest.id);
    setDestinationQuery(`${dest.name}, ${dest.country}`);
    setShowDropdown(false);
    setNaturalPrompt(`Trip to ${dest.name} exploring famous landmarks, scenic sights, and vibrant local cuisine.`);
  };

  const handleSelectPreset = (chip: typeof presetChips[0]) => {
    setSelectedDestId(chip.id);
    setDestinationQuery(chip.name);
    setShowDropdown(false);
    setNumDays(chip.days);
    setBudget(chip.budget);
    setPace(chip.pace);
    setNaturalPrompt(chip.prompt);
  };

  const calculateEndDate = (start: string, days: number): string => {
    try {
      const d = new Date(start);
      d.setDate(d.getDate() + (days - 1));
      return d.toISOString().split('T')[0];
    } catch {
      return start;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dest = destinations.find(d => d.id === selectedDestId);
    const rawCityName = destinationQuery.split(',')[0].trim() || 'Custom Destination';
    const destName = dest?.name || rawCityName;
    const effectiveDestId = selectedDestId || rawCityName;
    const endDate = calculateEndDate(startDate, numDays);

    // Derive interests from prompt or destination
    const interests = ['heritage', 'food', 'scenic'];
    if (naturalPrompt.toLowerCase().includes('beach')) interests.push('beaches');
    if (naturalPrompt.toLowerCase().includes('fort')) interests.push('heritage');
    if (naturalPrompt.toLowerCase().includes('sushi') || naturalPrompt.toLowerCase().includes('bistro') || naturalPrompt.toLowerCase().includes('food')) {
      interests.push('food');
    }

    const promptWithInspiration = inspirationFile
      ? `${naturalPrompt} [Visual Inspiration Attached: ${inspirationFile.name}]`
      : naturalPrompt;

    onStartPlanning({
      destination_id: effectiveDestId,
      start_date: startDate,
      end_date: endDate,
      travelers: { adults, children },
      budget,
      title: `${destName} Discovery`,
      prompt: promptWithInspiration,
      pace,
      interests,
    });
  };

  return (
    <section className="relative min-h-[100svh] w-full flex flex-col justify-center items-center px-4 md:px-8 pt-24 pb-16 overflow-hidden">
      {/* Cinematic Background Video with Graceful Fallback */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
        {!videoError ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            onError={() => setVideoError(true)}
            className="w-full h-full object-cover scale-105 filter brightness-[0.92]"
          >
            <source
              src="https://pollen-batch-41236914.figma.site/_components/v2/f0ee2dae7671c170c34f12e31c4cb41418976c98/769c564298c132f7919405cd9f17c1b1231f341d.769c5642.mp4"
              type="video/mp4"
            />
          </video>
        ) : (
          <img
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&auto=format&fit=crop"
            alt="Scenic coastline backdrop"
            className="w-full h-full object-cover scale-105"
          />
        )}

        {/* MotionSite White-to-Transparent Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/40 to-black/30" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/10 to-black/40" />
      </div>

      {/* Main Hero Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center text-center">
        {/* Subtle pill tag */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass text-xs font-semibold tracking-wide text-[#905831] uppercase mb-6 shadow-sm"
        >
          <Zap className="w-3.5 h-3.5 fill-[#905831]" />
          <span>Grounded Dynamic AI Travel Architect</span>
        </motion.div>

        {/* Hero Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#0a0a0a] mb-4 leading-[1.08]"
        >
          Where will you go next?
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-base sm:text-lg md:text-xl text-neutral-800 max-w-2xl font-normal mb-8 leading-relaxed drop-shadow-sm"
        >
          Tell our AI where you’re going and what you love. We’ll create a personalized itinerary for you.
        </motion.p>

        {/* Frosted / Liquid-Glass Interactive Travel Prompt Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full liquid-glass rounded-3xl p-5 sm:p-7 md:p-8 shadow-2xl border border-white/60 text-left relative overflow-hidden backdrop-blur-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Natural Language Prompt Area */}
            <div className="relative">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#905831] mb-2">
                Your Travel Vision
              </label>
              <textarea
                value={naturalPrompt}
                onChange={e => setNaturalPrompt(e.target.value)}
                placeholder="I'm planning a 4-day trip to Goa in November. I love beaches, hidden cafes, historic forts, and want to keep it relaxed..."
                rows={3}
                className="w-full rounded-2xl bg-white/60 border border-white/80 p-4 text-sm md:text-base text-[#1a1a1a] placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#905831]/40 focus:bg-white/80 transition-all shadow-inner resize-none leading-relaxed"
              />
            </div>

            {/* Quick Inspiration Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-medium text-neutral-600 mr-1 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-[#905831]" />
                Featured:
              </span>
              {presetChips.map(chip => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => handleSelectPreset(chip)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                    selectedDestId === chip.id
                      ? 'bg-[#905831] text-white font-medium shadow-md'
                      : 'bg-white/50 text-neutral-700 hover:bg-white/80 border border-white/40'
                  }`}
                >
                  {selectedDestId === chip.id && <Check className="w-3 h-3" />}
                  <span>{chip.title}</span>
                </button>
              ))}
            </div>

            {/* Core Parameter Controls Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {/* Destination Search / Autocomplete */}
              <div ref={dropdownRef} className="col-span-2 sm:col-span-1 rounded-2xl bg-white/40 border border-white/50 p-2.5 relative">
                <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider flex items-center justify-between">
                  <span>Destination</span>
                  {isSearching && <Loader2 className="w-2.5 h-2.5 animate-spin text-[#905831]" />}
                </label>
                <div className="relative mt-1 flex items-center">
                  <MapPin className="w-3.5 h-3.5 text-[#905831] shrink-0 mr-1.5" />
                  <input
                    type="text"
                    value={destinationQuery}
                    onChange={e => handleDestinationInputChange(e.target.value)}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Search any world city..."
                    className="w-full bg-transparent text-xs font-semibold text-neutral-900 focus:outline-none placeholder:text-neutral-400"
                  />
                </div>

                {/* Suggestions Dropdown */}
                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-white/80 rounded-2xl shadow-xl overflow-hidden z-50 max-h-56 overflow-y-auto"
                    >
                      <div className="p-1.5 space-y-0.5">
                        <div className="px-2 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                          Supported Worldwide via Free OSM
                        </div>
                        {suggestions.length > 0 ? (
                          suggestions.map(d => (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => handleSelectDestination(d)}
                              className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-neutral-100 flex items-center justify-between transition-colors group cursor-pointer"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <MapPin className="w-3 h-3 text-[#905831] shrink-0 group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-medium text-neutral-900 truncate">
                                  {d.name}
                                </span>
                              </div>
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 shrink-0">
                                {d.country || 'Global'}
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="px-2.5 py-2 text-xs text-neutral-500">
                            Press Enter or Plan to explore &quot;{destinationQuery.trim()}&quot;
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Start Date */}
              <div className="rounded-2xl bg-white/40 border border-white/50 p-2.5">
                <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#905831]" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full mt-1 bg-transparent text-xs font-semibold text-neutral-900 focus:outline-none cursor-pointer"
                />
              </div>

              {/* Duration (Days) */}
              <div className="rounded-2xl bg-white/40 border border-white/50 p-2.5">
                <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider">
                  Duration
                </label>
                <select
                  value={numDays}
                  onChange={e => setNumDays(Number(e.target.value))}
                  className="w-full mt-1 bg-transparent text-xs font-semibold text-neutral-900 focus:outline-none cursor-pointer"
                >
                  <option value={2}>2 Days (Weekend)</option>
                  <option value={3}>3 Days (Short)</option>
                  <option value={4}>4 Days (Ideal)</option>
                  <option value={5}>5 Days (Extended)</option>
                </select>
              </div>

              {/* Budget INR */}
              <div className="rounded-2xl bg-white/40 border border-white/50 p-2.5">
                <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider flex items-center gap-1">
                  <IndianRupee className="w-3 h-3 text-emerald-700" />
                  Budget (INR)
                </label>
                <input
                  type="number"
                  step={500}
                  min={500}
                  max={500000}
                  value={budget}
                  onChange={e => setBudget(Number(e.target.value))}
                  className="w-full mt-1 bg-transparent text-xs font-semibold text-neutral-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Advanced Travel Customizer Toggle */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs font-medium text-neutral-700 hover:text-black flex items-center gap-1 transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#905831]" />
                <span>{showAdvanced ? 'Hide preferences' : 'Pace & Travelers'}</span>
              </button>

              <span className="text-[11px] text-neutral-500 hidden sm:inline">
                Est. ~₹{Math.round(budget / (adults + children || 1)).toLocaleString('en-IN')}/person
              </span>
            </div>

            {/* Collapsible Advanced Settings */}
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden pt-2 border-t border-black/10"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Pace */}
                    <div className="rounded-2xl bg-white/40 border border-white/50 p-2.5">
                      <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider">
                        Travel Pace
                      </label>
                      <div className="grid grid-cols-3 gap-1 mt-1">
                        {['relaxed', 'balanced', 'packed'].map(p => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setPace(p)}
                            className={`py-1 rounded-lg text-[10px] font-medium capitalize transition-all ${
                              pace === p
                                ? 'bg-black text-white'
                                : 'bg-white/60 text-neutral-700 hover:bg-white'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Adults */}
                    <div className="rounded-2xl bg-white/40 border border-white/50 p-2.5">
                      <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider flex items-center gap-1">
                        <Users className="w-3 h-3 text-[#905831]" />
                        Adults
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        {[1, 2, 3, 4].map(n => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setAdults(n)}
                            className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-all ${
                              adults === n
                                ? 'bg-black text-white'
                                : 'bg-white/60 text-neutral-700 hover:bg-white'
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Children */}
                    <div className="rounded-2xl bg-white/40 border border-white/50 p-2.5">
                      <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider">
                        Children
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        {[0, 1, 2].map(n => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setChildren(n)}
                            className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-all ${
                              children === n
                                ? 'bg-black text-white'
                                : 'bg-white/60 text-neutral-700 hover:bg-white'
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Action Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Upload inspiration button & Status indicator */}
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = URL.createObjectURL(file);
                      setInspirationFile({ name: file.name, url });
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-full bg-white/70 hover:bg-white text-xs font-semibold text-[#1a1a1a] border border-white/80 flex items-center gap-2 transition-all hover:scale-[1.02] shadow-sm cursor-pointer"
                  title="Upload moodboard, photo, or itinerary inspiration"
                >
                  <Upload className="w-3.5 h-3.5 text-[#905831]" />
                  <span>Upload inspiration</span>
                </button>

                {inspirationFile && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/90 border border-amber-300 text-[11px] font-medium text-amber-900 shadow-sm">
                    <img
                      src={inspirationFile.url}
                      alt="Inspiration Preview"
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    <span className="max-w-[120px] truncate">{inspirationFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setInspirationFile(null)}
                      className="p-0.5 hover:bg-black/10 rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <div className="text-xs text-neutral-600 hidden md:block">
                  <span className="font-semibold text-black">100% Grounded</span> • Zero Hallucinations • Real Routes
                </div>
              </div>

              {/* Plan My Trip CTA */}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#0a0a0a] text-white font-medium text-sm flex items-center justify-center gap-2.5 shadow-xl hover:bg-black/90 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>Plan My Trip</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </section>
  );
};
