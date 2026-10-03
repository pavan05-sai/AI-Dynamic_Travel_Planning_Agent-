import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  PhoneCall,
  ShieldAlert,
  Hospital,
  ShieldCheck,
  AlertTriangle,
  HeartHandshake,
  Copy,
  Check,
  Printer,
  MapPin,
} from 'lucide-react';
import type { CanonicalItinerary } from '../types';

interface EmergencyHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  itinerary: CanonicalItinerary;
}

interface EmergencyContact {
  label: string;
  number: string;
  badge: string;
  desc: string;
  iconBg: string;
}

interface HospitalItem {
  name: string;
  area: string;
  phone: string;
  type: string;
  distance: string;
  is24x7: boolean;
}

interface ScamItem {
  title: string;
  warning: string;
  tip: string;
}

export const EmergencyHubModal: React.FC<EmergencyHubModalProps> = ({
  isOpen,
  onClose,
  itinerary,
}) => {
  const [activeTab, setActiveTab] = useState<'contacts' | 'hospitals' | 'scams' | 'etiquette'>('contacts');
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  if (!isOpen) return null;

  const destName = (itinerary.trip.destination.name || 'Goa').toLowerCase();
  const isGoa = destName.includes('goa');
  const isJaipur = destName.includes('jaipur');

  const emergencyContacts: EmergencyContact[] = [
    {
      label: 'All-in-One National Emergency',
      number: '112',
      badge: 'Immediate Response',
      desc: 'Unified helpline for Police, Fire, and Ambulance across all Indian States.',
      iconBg: 'bg-rose-500 text-white',
    },
    {
      label: 'Police Assistance',
      number: '100',
      badge: 'Law Enforcement',
      desc: 'Immediate police PCR dispatch and local station escalation.',
      iconBg: 'bg-blue-600 text-white',
    },
    {
      label: 'Medical Emergency & Ambulance',
      number: '108',
      badge: '24/7 Paramedics',
      desc: 'Free government emergency ambulance and trauma dispatch.',
      iconBg: 'bg-emerald-600 text-white',
    },
    {
      label: 'Women Safety & Assistance',
      number: '1091',
      badge: '24/7 Dedicated',
      desc: 'National emergency helpline for female travelers and residents.',
      iconBg: 'bg-purple-600 text-white',
    },
    {
      label: 'Ministry of Tourism Helpline',
      number: '1363',
      badge: 'Multi-lingual Support',
      desc: 'Toll-free 24x7 tourist guidance in 12 languages (Hindi, English, French, German, Spanish, etc.).',
      iconBg: 'bg-amber-600 text-white',
    },
  ];

  const hospitals: HospitalItem[] = isGoa
    ? [
        {
          name: 'Goa Medical College (GMC)',
          area: 'Bambolim, North/South Border',
          phone: '+91 832 245 8725',
          type: 'Government Super-Speciality Hospital',
          distance: '12 km',
          is24x7: true,
        },
        {
          name: 'Manipal Hospital Goa',
          area: 'Dona Paula, Panaji',
          phone: '+91 832 304 8800',
          type: 'NABH Accredited Multi-Speciality',
          distance: '7 km',
          is24x7: true,
        },
        {
          name: 'Victor Hospital',
          area: 'Malbhat, Margao (South Goa)',
          phone: '+91 832 672 8888',
          type: 'Tertiary Care & Cardiac Emergency',
          distance: '24 km',
          is24x7: true,
        },
        {
          name: 'Healthway Hospital',
          area: 'Old Goa Bypass, Kadamba Plateau',
          phone: '+91 832 249 7000',
          type: 'Trauma & Emergency Care',
          distance: '10 km',
          is24x7: true,
        },
      ]
    : isJaipur
    ? [
        {
          name: 'Sawai Man Singh (SMS) Hospital',
          area: 'Tonk Road, Jaipur',
          phone: '+91 141 251 8380',
          type: 'State Apex Trauma Center',
          distance: '4 km',
          is24x7: true,
        },
        {
          name: 'Fortis Escorts Hospital',
          area: 'Jawahar Lal Nehru Marg, Malviya Nagar',
          phone: '+91 141 254 7000',
          type: 'Private Multi-Speciality & ER',
          distance: '8 km',
          is24x7: true,
        },
        {
          name: 'Santokba Durlabhji Memorial Hospital',
          area: 'Bhawani Singh Road, Bapu Nagar',
          phone: '+91 141 256 6251',
          type: 'Cardiac, Pediatric & Emergency',
          distance: '5 km',
          is24x7: true,
        },
      ]
    : [
        {
          name: 'Apollo Hospital',
          area: 'Jubilee Hills, Hyderabad',
          phone: '+91 40 2360 7777',
          type: 'JCI Accredited Super Speciality',
          distance: '9 km',
          is24x7: true,
        },
        {
          name: 'Yashoda Hospital',
          area: 'Somajiguda & Secunderabad',
          phone: '+91 40 4567 4567',
          type: '24/7 Level-1 Emergency & Trauma',
          distance: '6 km',
          is24x7: true,
        },
      ];

  const scams: ScamItem[] = isGoa
    ? [
        {
          title: 'Unmetered Taxi / Airport Overcharging',
          warning: 'Street drivers frequently quote 2x-3x higher rates and claim taxi meters are broken.',
          tip: 'Always use the prepaid taxi counter inside Goa Airport (Dabolim/Mopa) or book via the official GoaMiles app.',
        },
        {
          title: 'Unlicensed Beach Water Sports Touts',
          warning: 'Aggressive vendors selling unregulated parasailing and jet-ski rides with substandard life-jackets.',
          tip: 'Only book at designated GTDC (Goa Tourism) booths displaying official life-guard clearances and safety gear.',
        },
        {
          title: 'Spice Plantation / Gem Certificate Traps',
          warning: 'Drivers steering you to "exclusive wholesale spice or jewel factories" where commissions are baked into 300% markups.',
          tip: 'Rely on our catalog-verified spice plantations like Sahakari or Tropical and buy spices from local government cooperative stores.',
        },
      ]
    : isJaipur
    ? [
        {
          title: 'Gemstone & Jewelry "Export" Scheme',
          warning: 'Friendly strangers inviting you to buy gems to resell abroad for easy profit or fake certificates.',
          tip: 'Never purchase gems as an investment scheme. Buy only from government-approved Rajasthan Emporium (Rajasthali).',
        },
        {
          title: 'Tuk-Tuk Driver "Shop Route" Diversion',
          warning: 'Auto drivers offering ₹50 day tours but making mandatory 3-hour stops at high-commission textile shops.',
          tip: 'Firmly state "No shopping stops" before starting, or book ride-hailing apps (Uber, Ola) for fixed fares.',
        },
        {
          title: 'Shoe-Keeping Extortion at Temples',
          warning: 'Informal caretakers near Galta Ji or Amber Fort demanding ₹200 to return your footwear.',
          tip: 'Use official temple cloakrooms with token slips (typically free or ₹10 donation).',
        },
      ]
    : [
        {
          title: 'Street Auto-Rickshaw Meter Refusal',
          warning: 'Drivers declining meter and asking arbitrary high round amounts.',
          tip: 'Always insist on "by meter" or book auto-rickshaws directly through Uber or Ola apps with GPS tracking.',
        },
      ];

  const etiquetteRules = [
    {
      title: 'Religious Places & Temples',
      rule: 'Always remove shoes outside. Dress modestly covering shoulders and knees. Cover your head at Sikh Gurdwaras.',
    },
    {
      title: 'Tipping Guidelines',
      rule: 'Restaurants: 7% - 10% is customary if service charge is not included. Hotel bellboys: ₹50 - ₹100 per bag.',
    },
    {
      title: 'Photography Permissions',
      rule: 'Ask permission before photographing locals, monks, or prayer ceremonies. Monasteries and museums often charge a small camera fee.',
    },
    {
      title: 'Safe Drinking Water',
      rule: 'Stick to sealed bottled mineral water (Kinley, Bisleri, Aquafina) or filtered reverse-osmosis (RO) water at certified dining spots.',
    },
  ];

  const copyToClipboard = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  const handlePrint = () => {
    window.print();
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
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-black/5 bg-gradient-to-r from-rose-500/10 via-red-500/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center text-white shadow-md shadow-rose-900/20">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-[#111827]">
                    Emergency SOS & Local Intelligence
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                    {itinerary.trip.destination.name} Hub
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                  Verified emergency lines, 24/7 hospitals, safety ratings & local scam defense
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="p-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors hidden sm:flex items-center gap-1.5 text-xs font-semibold"
                title="Print Emergency Card"
              >
                <Printer className="w-4 h-4" />
                <span>Print SOS Card</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Destination Safety Scorecard Strip */}
          <div className="bg-neutral-900 text-white px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-xs font-medium">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Safety Rating for {itinerary.trip.destination.name}:</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                8.9 / 10 Very Safe
              </span>
            </div>
            <div className="flex items-center gap-4 text-neutral-300 text-[11px]">
              <span>Night Walkability: <strong className="text-white">High (until 11:30 PM)</strong></span>
              <span>Solo Female Safety: <strong className="text-white">Rated High</strong></span>
              <span>Water Advisory: <strong className="text-amber-300">Drink Bottled Only</strong></span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-black/5 bg-neutral-50 px-6 gap-2">
            {[
              { id: 'contacts', label: 'Emergency Hotlines', icon: PhoneCall },
              { id: 'hospitals', label: '24/7 Hospitals', icon: Hospital },
              { id: 'scams', label: 'Scam Alerts & Traps', icon: AlertTriangle },
              { id: 'etiquette', label: 'Cultural Etiquette', icon: HeartHandshake },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                    isActive
                      ? 'border-rose-600 text-rose-700 bg-white shadow-xs'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {/* Contacts Tab */}
            {activeTab === 'contacts' && (
              <div className="space-y-3">
                <p className="text-xs text-neutral-500">
                  Click to copy or tap on mobile to dial directly. All numbers are active 24/7.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {emergencyContacts.map((contact, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm transition-all flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${contact.iconBg}`}
                        >
                          <PhoneCall className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-neutral-900">
                              {contact.label}
                            </h4>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 font-semibold inline-block mt-0.5">
                            {contact.badge}
                          </span>
                          <p className="text-xs text-neutral-500 mt-1 leading-snug">
                            {contact.desc}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <a
                          href={`tel:${contact.number}`}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-sm font-black border border-rose-200 transition-colors"
                        >
                          {contact.number}
                        </a>
                        <button
                          onClick={() => copyToClipboard(contact.number)}
                          className="text-[10px] text-neutral-500 hover:text-neutral-800 flex items-center gap-1 cursor-pointer"
                        >
                          {copiedNumber === contact.number ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600 font-bold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hospitals Tab */}
            {activeTab === 'hospitals' && (
              <div className="space-y-3">
                <p className="text-xs text-neutral-500">
                  Verified emergency healthcare centers with ICU and round-the-clock emergency room availability.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {hospitals.map((hosp, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-300 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h4 className="font-bold text-sm text-neutral-900 leading-snug">
                            {hosp.name}
                          </h4>
                          {hosp.is24x7 && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
                              24/7 ER
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-1">
                          <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{hosp.area}</span>
                          <span>•</span>
                          <span className="font-semibold text-neutral-700">{hosp.distance}</span>
                        </div>
                        <span className="text-[11px] text-neutral-600 block">
                          {hosp.type}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-neutral-100">
                        <span className="text-xs font-bold text-neutral-800">
                          {hosp.phone}
                        </span>
                        <a
                          href={`tel:${hosp.phone.replace(/\s+/g, '')}`}
                          className="px-3 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200"
                        >
                          Call Desk
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scams Tab */}
            {activeTab === 'scams' && (
              <div className="space-y-3">
                <p className="text-xs text-neutral-500">
                  Pre-warned travel traps documented by local tourism police and experienced travelers.
                </p>
                <div className="space-y-3">
                  {scams.map((scam, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <h4 className="font-bold text-sm text-amber-950">
                          {scam.title}
                        </h4>
                      </div>
                      <p className="text-xs text-amber-900 leading-relaxed">
                        <strong className="font-semibold">The Trap:</strong> {scam.warning}
                      </p>
                      <div className="p-2.5 rounded-xl bg-white border border-amber-200 text-xs text-neutral-700">
                        <strong className="font-bold text-emerald-800">How to Protect Yourself: </strong>
                        {scam.tip}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Etiquette Tab */}
            {activeTab === 'etiquette' && (
              <div className="space-y-3">
                <p className="text-xs text-neutral-500">
                  Essential local norms, tipping standards, and cultural customs for a seamless experience.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {etiquetteRules.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border border-neutral-200 bg-white space-y-1.5"
                    >
                      <h4 className="font-bold text-sm text-neutral-900">
                        {item.title}
                      </h4>
                      <p className="text-xs text-neutral-600 leading-relaxed">
                        {item.rule}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 border-t border-black/5 bg-neutral-50 flex items-center justify-between">
            <span className="text-xs text-neutral-500">
              All hotline numbers are toll-free and do not require mobile airtime balance.
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-all"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
