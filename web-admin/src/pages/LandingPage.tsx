import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  MapPin,
  Navigation,
  Radio,
  WifiOff,
  Volume2,
  Users,
  PhoneCall,
  QrCode,
  Download,
  ExternalLink,
  ChevronDown,
  School,
  Activity,
  Clock,
  ArrowRight,
  Lock,
  HelpCircle,
  Info,
  CheckCircle2,
  AlertTriangle,
  Menu,
  X,
  Smartphone,
  Copy,
  Check,
} from 'lucide-react';

interface LandingPageProps {
  onNavigateToLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToLogin }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-PH', {
          timeZone: 'Asia/Manila',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyHotline = (number: string) => {
    navigator.clipboard.writeText(number);
    setCopiedNumber(number);
    setTimeout(() => setCopiedNumber(null), 2200);
  };

  const hotlines = [
    {
      agency: 'MDRRMO Tupi',
      role: 'Municipal Disaster Risk Reduction & Rescue',
      phone: '(083) 226-2525',
      mobile: '0930-123-4567',
      badge: '24/7 Rescue',
      color: 'cyan',
    },
    {
      agency: 'BFP Tupi Fire Station',
      role: 'Bureau of Fire Protection Emergency Unit',
      phone: '(083) 226-2345',
      mobile: '0927-987-6543',
      badge: 'Fire & Hazmat',
      color: 'rose',
    },
    {
      agency: 'PNP Tupi Municipal Police',
      role: 'Police Emergency & Campus Perimeter Security',
      phone: '(083) 226-2111',
      mobile: '0998-567-8901',
      badge: 'Law Enforcement',
      color: 'blue',
    },
    {
      agency: 'PNHS Campus Clinic & DRRM',
      role: 'School Health Triage & Safety Marshals',
      phone: 'Intercom Ext. 104',
      mobile: '0919-456-7890',
      badge: 'On-Campus',
      color: 'emerald',
    },
  ];

  const features = [
    {
      icon: Navigation,
      title: 'A* Dynamic Evacuation Routing',
      desc: 'Real-time topological pathfinding recalculates optimal evacuation vectors, safely detouring students around active hazard perimeters to the Central Oval.',
      tag: 'PostGIS GIS Engine',
      glow: 'cyan',
    },
    {
      icon: Volume2,
      title: 'Synchronized Siren Broadcasts',
      desc: 'Synchronized 10.0-second audio siren alerts and high-priority push notifications triggered across classroom boards and mobile companion devices.',
      tag: 'WebSocket Realtime',
      glow: 'rose',
    },
    {
      icon: WifiOff,
      title: 'Offline-Resilient Safety Check-In',
      desc: 'Students and personnel check in with zero cellular coverage. Status is stored in local encrypted queue and automatically syncs when signal returns.',
      tag: 'Offline-First',
      glow: 'emerald',
    },
    {
      icon: AlertTriangle,
      title: 'Geotagged Hazard Reporting',
      desc: 'Staff and safety marshals report active fires, chemical leaks, or structural obstructions with precise coordinates and danger radius buffers.',
      tag: 'Spatial Geofence',
      glow: 'amber',
    },
    {
      icon: Users,
      title: 'Live Headcount & Safety Roster',
      desc: 'Automated live dashboard groups personnel into Safe, Evacuating, or Distressed cohorts, ensuring zero unaccounted students during drills or crises.',
      tag: 'Real-Time Roster',
      glow: 'cyan',
    },
    {
      icon: ShieldCheck,
      title: 'DepEd SDRRM Compliance',
      desc: 'Standardized in alignment with the DepEd School Disaster Risk Reduction and Management guidelines and NDRRMC multi-hazard evacuation protocols.',
      tag: 'DepEd Accredited',
      glow: 'emerald',
    },
  ];

  const campusLandmarks = [
    {
      name: 'School Ground (Evacuation Oval)',
      type: 'Primary Safe Assembly Zone',
      capacity: '3,000 Persons',
      highlight: 'Central open field free of overhead high-voltage lines and tall masonry.',
      isSafe: true,
    },
    {
      name: 'School Gymnasium',
      type: 'Secondary Storm & Earthquake Shelter',
      capacity: '1,200 Persons',
      highlight: 'Reinforced covered structure for weather protection during extended emergencies.',
      isSafe: true,
    },
    {
      name: 'Administration & Principal Office',
      type: 'Emergency Command Post',
      capacity: 'Incident Command Team',
      highlight: 'Equipped with campus master PA controls, first-aid triage, and two-way comms.',
      isSafe: false,
    },
    {
      name: 'Science & BCD Tech Laboratory',
      type: 'Hazard-Monitored Zone',
      capacity: 'Academic Building',
      highlight: 'Chemical cabinet containment protocols and specialized foam extinguishers.',
      isSafe: false,
    },
  ];

  const faqs = [
    {
      q: 'Paano gumagana ang SafeRoute kapag nawalan ng internet o cell signal?',
      a: 'Ang SafeRoute Mobile App ay dinisenyo bilang offline-first. Mayroon itong lokal na naka-cache na GIS campus map at offline check-in queue. Kapag pinindot ng estudyante o guro ang "I Am Safe", nai-save ito sa device storage at kusa itong mag-i-sync sa command center sa oras na magkaroon muli ng koneksyon.',
    },
    {
      q: 'Sino ang maaaring mag-access sa Web Admin Portal?',
      a: 'Ang Web Admin Portal ay eksklusibo lamang para sa mga lisensyadong Administrators, School Disaster Risk Reduction Coordinators (SDRRM), School Principal, at awtorisadong Safety Marshals ng Polonuling National High School.',
    },
    {
      q: 'Paano malalaman ng system kung saan ang pinakaligtas na daanan?',
      a: 'Gumagamit ang system ng A* shortest-path algorithm na naka-integrate sa PostGIS database. Kapag may nai-report na hazard (halimbawa: sunog o debris) sa isang pathway, awtomatikong binabara ng system ang naturang daanan at kinalkula ang panibagong pinakaligtas na escape corridor papuntang Evacuation Oval.',
    },
    {
      q: 'Bakit binuo ang SafeRoute partikular para sa Polonuling National High School?',
      a: 'Upang masiguro ang kaligtasan ng mahigit 2,500 estudyante at guro sa Barangay Polonuling, Tupi, South Cotabato. Pinalalakas nito ang disaster preparedness laban sa lindol, sunog, at mga kalamidad alinsunod sa mga panuntunan ng DepEd at NDRRMC.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-white relative overflow-x-hidden">
      {/* ── AMBIENT ATMOSPHERIC LIGHTING MESH ── */}
      <div className="fixed top-0 left-1/4 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-10 w-[700px] h-[700px] bg-emerald-500/8 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="fixed top-1/2 right-1/4 w-[500px] h-[500px] bg-blue-600/8 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* ── TOP LIVE CAMPUS TICKER BAR ── */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-2 text-xs text-slate-300">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">
              Campus Safety Status: NORMAL
            </span>
            <span className="text-slate-600 hidden md:inline">•</span>
            <span className="text-slate-400 hidden md:inline">
              Polonuling NHS, Tupi, South Cotabato (DepEd ID: 304561)
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono ml-auto">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{currentTime ? `${currentTime} PHT` : '6.3615° N, 124.9502° E'}</span>
            </div>
            <button
              type="button"
              onClick={() => setSosModalOpen(true)}
              className="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Emergency SOS Guide</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── STICKY GLASS HEADER NAVBAR ── */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo & School Seal Identity */}
          <a href="#overview" className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-white tracking-tight">SafeRoute</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  GIS v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <School className="w-3 h-3 text-cyan-400" />
                Polonuling National High School
              </p>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-semibold text-slate-300">
            <a href="#overview" className="hover:text-cyan-400 transition-colors">Overview</a>
            <a href="#hotlines" className="hover:text-cyan-400 transition-colors">Emergency Hotlines</a>
            <a href="#features" className="hover:text-cyan-400 transition-colors">Safety Features</a>
            <a href="#campus-map" className="hover:text-cyan-400 transition-colors">Evacuation Zones</a>
            <a href="#mobile-app" className="hover:text-cyan-400 transition-colors">Mobile App</a>
            <a href="#protocols" className="hover:text-cyan-400 transition-colors">SDRRM Protocol</a>
            <a href="#faq" className="hover:text-cyan-400 transition-colors">FAQ</a>
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSosModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl border border-rose-500/40 text-rose-300 hover:text-white hover:bg-rose-500/20 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm shadow-rose-950/40"
            >
              <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
              <span>Hotlines</span>
            </button>
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all duration-200 flex items-center gap-2 group cursor-pointer active:scale-95"
            >
              <Lock className="w-3.5 h-3.5 text-cyan-200" />
              <span>Coordinator Portal</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Mobile Menu Hamburger */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs sm:hidden"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 border border-slate-800"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-950/95 border-b border-slate-800 px-4 py-5 space-y-3 backdrop-blur-2xl">
            <nav className="flex flex-col space-y-2.5 text-sm font-semibold text-slate-300">
              <a
                href="#overview"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 px-3 rounded-lg hover:bg-slate-900 hover:text-cyan-400"
              >
                Overview
              </a>
              <a
                href="#hotlines"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 px-3 rounded-lg hover:bg-slate-900 hover:text-cyan-400"
              >
                Emergency Hotlines
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 px-3 rounded-lg hover:bg-slate-900 hover:text-cyan-400"
              >
                Safety Features
              </a>
              <a
                href="#campus-map"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 px-3 rounded-lg hover:bg-slate-900 hover:text-cyan-400"
              >
                Evacuation Zones
              </a>
              <a
                href="#mobile-app"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 px-3 rounded-lg hover:bg-slate-900 hover:text-cyan-400"
              >
                Mobile App
              </a>
              <a
                href="#protocols"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 px-3 rounded-lg hover:bg-slate-900 hover:text-cyan-400"
              >
                SDRRM Protocol
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 px-3 rounded-lg hover:bg-slate-900 hover:text-cyan-400"
              >
                FAQ
              </a>
            </nav>
            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateToLogin();
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Coordinator Portal Access</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── MAIN CONTENT ── */}
      <main id="overview">
        {/* ── 1. HERO SECTION ── */}
        <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-32 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Column: Headlines & Call to Actions */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                {/* Institutional Pill */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold shadow-inner">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>DepEd SDRRM & NDRRMC Campus Disaster Management</span>
                </div>

                {/* Primary Hero Title */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
                  Intelligent Campus Evacuation &{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-emerald-400">
                    Real-Time Safety
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                  Built specifically for <strong>Polonuling National High School</strong> in Tupi, South Cotabato.
                  SafeRoute empowers coordinators, teachers, and students with instant synchronized audio siren broadcasts,
                  dynamic GIS evacuation escape vectors, and offline-resilient safety roll-calls.
                </p>

                {/* Hero CTAs */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
                  <button
                    type="button"
                    onClick={onNavigateToLogin}
                    className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-cyan-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-slate-950" />
                    <span>Access Coordinator Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <a
                    href="#campus-map"
                    className="px-5 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-xs border border-slate-700/80 transition-all flex items-center gap-2 shadow-lg hover:border-cyan-500/40"
                  >
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    <span>View Campus Evacuation GIS</span>
                  </a>

                  <a
                    href="#mobile-app"
                    className="px-5 py-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-300 font-bold text-xs border border-emerald-500/30 transition-all flex items-center gap-2"
                  >
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span>Student Mobile App</span>
                  </a>
                </div>

                {/* Micro Guarantee Chips */}
                <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Zero SMS Cost via WebSockets</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    <span>PostGIS Campus Geometry</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    <span>Offline Sync Ready</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Hero Dashboard Visual */}
              <div className="lg:col-span-5 relative">
                {/* Glow Backdrop */}
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 rounded-3xl blur-2xl transform -rotate-1" />

                {/* Glass Mockup Card */}
                <div className="relative glass-panel rounded-3xl border border-slate-700/80 p-6 shadow-2xl space-y-5">
                  {/* Mock Header */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                          PNHS Campus GIS Monitor
                        </h2>
                        <p className="text-[10px] text-slate-400">PostGIS Engine • Active Polonuling Grid</p>
                      </div>
                    </div>
                    <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      LIVE ONLINE
                    </span>
                  </div>

                  {/* Evacuation Route Mock Preview */}
                  <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Recommended Escape Vector:</span>
                      <span className="text-emerald-400 font-bold">142 meters • 1m 52s</span>
                    </div>

                    {/* Step Vector Visualization */}
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-3 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                        <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                          A
                        </div>
                        <div className="flex-1 truncate">
                          <p className="text-white font-semibold truncate">Origin: JHS North Academic Building</p>
                          <p className="text-[10px] text-slate-400">Exit via South Exterior Corridor</p>
                        </div>
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      </div>

                      <div className="flex items-center gap-3 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                          B
                        </div>
                        <div className="flex-1 truncate">
                          <p className="text-white font-semibold truncate">Safe Zone: Central Evacuation Oval</p>
                          <p className="text-[10px] text-emerald-400 font-medium">Clear of Hazards • Designated Safe</p>
                        </div>
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      </div>
                    </div>
                  </div>

                  {/* Live Quick Metrics */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Registered Campusers</span>
                      <span className="text-lg font-black text-cyan-400">2,548</span>
                      <span className="text-[10px] text-slate-500 block">Students, Faculty & Staff</span>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Designated Zones</span>
                      <span className="text-lg font-black text-emerald-400">3 Safe Areas</span>
                      <span className="text-[10px] text-slate-500 block">Oval, Gym & Assembly Plaza</span>
                    </div>
                  </div>

                  {/* Quick Action in Mockup */}
                  <button
                    type="button"
                    onClick={onNavigateToLogin}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-cyan-300 text-xs font-bold border border-cyan-500/30 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <span>Launch Coordinator Command Console →</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. METRICS KPI COUNTER STRIP ── */}
        <section className="border-y border-slate-800/80 bg-slate-900/50 py-10 px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 font-mono">
                10.0s
              </p>
              <p className="text-xs font-bold text-white uppercase tracking-wider">Audio Siren Latency</p>
              <p className="text-[11px] text-slate-400">Synchronized WebSocket engine</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 font-mono">
                11,530 m²
              </p>
              <p className="text-xs font-bold text-white uppercase tracking-wider">GIS Campus Coverage</p>
              <p className="text-[11px] text-slate-400">14 buildings & 3 main gates</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400 font-mono">
                100%
              </p>
              <p className="text-xs font-bold text-white uppercase tracking-wider">Offline Persistence</p>
              <p className="text-[11px] text-slate-400">Encrypted check-in queue</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300 font-mono">
                304561
              </p>
              <p className="text-xs font-bold text-white uppercase tracking-wider">Official DepEd School ID</p>
              <p className="text-[11px] text-slate-400">Barangay Polonuling, Tupi</p>
            </div>
          </div>
        </section>

        {/* ── 3. EMERGENCY HOTLINES DIRECTORY ── */}
        <section id="hotlines" className="py-20 px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider">
                <PhoneCall className="w-3.5 h-3.5" />
                <span>24/7 First Responder Directory</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Emergency Hotlines for Polonuling NHS
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Direct contacts for municipal disaster response, medical triage, fire emergency, and police units in Tupi, South Cotabato.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {hotlines.map((h) => (
                <div
                  key={h.agency}
                  className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 hover:shadow-xl group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                        {h.badge}
                      </span>
                      <PhoneCall className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <h3 className="text-base font-bold text-white">{h.agency}</h3>
                    <p className="text-[11px] text-slate-400 leading-snug">{h.role}</p>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-mono">{h.phone}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyHotline(h.phone)}
                        className="text-cyan-400 hover:text-cyan-300 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                        title="Copy Hotline"
                      >
                        {copiedNumber === h.phone ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedNumber === h.phone ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-mono font-bold">{h.mobile}</span>
                      <a
                        href={`tel:${h.mobile.replace(/[^0-9]/g, '')}`}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-bold text-[10px] flex items-center gap-1 transition-colors"
                      >
                        Call
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. CORE PLATFORM CAPABILITIES ── */}
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/40 border-y border-slate-800/80 relative">
          <div className="max-w-7xl mx-auto space-y-14">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Engineered for Rapid Response</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Architected for Life-Saving Campus Evacuation
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                SafeRoute addresses the major shortcomings of manual bell alarms and chaotic mass evacuation with high-tech automated coordination.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className="glass-card rounded-2xl p-6 border border-slate-800 hover:border-cyan-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-950/30 group space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-cyan-400 group-hover:scale-105 group-hover:border-cyan-500/60 transition-all shadow-md">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800/90 border border-slate-700 text-slate-400">
                        {f.tag}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {f.title}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed font-normal">{f.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── 5. CAMPUS EVACUATION MAP & DESIGNATED SAFE ZONES ── */}
        <section id="campus-map" className="py-20 px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5" />
                <span>Geographic Information System (GIS)</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Polonuling NHS Campus Safe Zones
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Authoritative spatial zones mapped with high-resolution satellite alignment for rapid campus marshalling.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Map Interactive Visual Representation */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold text-white">GIS Campus Layout Blueprint</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">11,530 sqm Property</span>
                </div>

                {/* Spatial Map Graphic Card */}
                <div className="w-full h-80 rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800 relative flex items-center justify-center p-4">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:28px_28px] opacity-40" />

                  {/* Central Oval Zone */}
                  <div className="relative z-10 w-48 h-32 rounded-[60px] border-2 border-emerald-400 bg-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.3)] flex flex-col items-center justify-center text-center p-2">
                    <span className="text-2xl">🛡️</span>
                    <span className="text-xs font-black text-emerald-300 uppercase tracking-wider mt-1">
                      Central Oval
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">Primary Safe Zone</span>
                  </div>

                  {/* Surrounding Building Badges */}
                  <div className="absolute top-4 left-6 z-10 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-sky-500/40 text-[10px] font-bold text-sky-300 shadow-md">
                    🏫 Science / BCD Building
                  </div>
                  <div className="absolute top-4 right-6 z-10 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-sky-500/40 text-[10px] font-bold text-sky-300 shadow-md">
                    🏛️ School Gymnasium
                  </div>
                  <div className="absolute bottom-4 left-6 z-10 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-amber-500/40 text-[10px] font-bold text-amber-300 shadow-md">
                    🚪 West Campus Gate
                  </div>
                  <div className="absolute bottom-4 right-6 z-10 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-cyan-500/40 text-[10px] font-bold text-cyan-300 shadow-md">
                    🏢 Administration Building
                  </div>

                  {/* Green Evacuation Arrow Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 400 250">
                      <path
                        d="M 60 40 Q 150 70 170 110"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.5"
                        strokeDasharray="4 4"
                      />
                      <path
                        d="M 340 40 Q 250 70 230 110"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.5"
                        strokeDasharray="4 4"
                      />
                    </svg>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Authoritative PostGIS Campus Network</span>
                  <button
                    type="button"
                    onClick={onNavigateToLogin}
                    className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open Interactive GIS Viewer</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Safe Zones List */}
              <div className="lg:col-span-5 space-y-3.5">
                {campusLandmarks.map((l) => (
                  <div
                    key={l.name}
                    className={`p-4 rounded-2xl border transition-all ${
                      l.isSafe
                        ? 'bg-emerald-950/30 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                        : 'bg-slate-900/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="text-sm font-bold text-white">{l.name}</h3>
                      <span
                        className={`text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          l.isSafe
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {l.capacity}
                      </span>
                    </div>
                    <p
                      className={`text-[11px] font-semibold mb-1 ${
                        l.isSafe ? 'text-emerald-400' : 'text-cyan-400'
                      }`}
                    >
                      {l.type}
                    </p>
                    <p className="text-xs text-slate-400 leading-normal">{l.highlight}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 6. MOBILE APP COMPANION SHOWCASE ── */}
        <section id="mobile-app" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50 border-y border-slate-800/80 relative">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Mobile App Description */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Flutter Cross-Platform Mobile Companion</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  SafeRoute Mobile for Students, Teachers & Personnel
                </h2>

                <p className="text-sm text-slate-300 leading-relaxed font-normal">
                  Carry the campus safety net directly in your pocket. The SafeRoute Mobile App ensures that even if you
                  are in a remote wing or the cellular network collapses, you receive audible siren emergency alarms and
                  can signal your safety status in a single tap.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                      <Volume2 className="w-4 h-4" />
                      <span>Audio Siren Trigger</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Bypasses silent mode for authorized severe emergency broadcasts sent by the school disaster team.
                    </p>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>1-Tap "I Am Safe"</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Instant roll-call accountability with zero delay, syncing automatically to the coordinator dashboard.
                    </p>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                      <Navigation className="w-4 h-4" />
                      <span>Turn-by-Turn Safe Escape</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Dynamic route visualization showing exact walking direction straight to the Evacuation Oval.
                    </p>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                      <Radio className="w-4 h-4" />
                      <span>GPS SOS Distress Beacon</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Allows injured or trapped students to transmit high-priority coordinates to first-aid marshals.
                    </p>
                  </div>
                </div>

                {/* Download Actions */}
                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      alert('SafeRoute Mobile APK: Ready for deployment in mobile-app folder (built with Flutter).');
                    }}
                    className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-emerald-500/25 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Download className="w-4 h-4 text-slate-950" />
                    <span>Download Android APK (v1.0)</span>
                  </button>

                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-cyan-400" />
                    <span>Scan with Android 8.0+ or newer</span>
                  </span>
                </div>
              </div>

              {/* Right Column: Mobile Device Frame Mockup */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-72 sm:w-80 rounded-[40px] border-4 border-slate-700 bg-slate-950 p-3 shadow-2xl shadow-cyan-950/50 relative">
                  {/* Speaker Notch */}
                  <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-3" />

                  {/* App Screen Content */}
                  <div className="rounded-[28px] bg-slate-900 border border-slate-800 p-4 space-y-4 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-cyan-500 flex items-center justify-center text-slate-950 font-bold">
                          SR
                        </div>
                        <div>
                          <p className="font-bold text-white text-[11px]">SafeRoute Mobile</p>
                          <p className="text-[9px] text-slate-400">Polonuling NHS</p>
                        </div>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    </div>

                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2 text-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <p className="text-white font-bold text-xs">Emergency Alert Status</p>
                      <p className="text-[10px] text-emerald-400 font-semibold uppercase">
                        All Clear • Drills Scheduled
                      </p>
                    </div>

                    {/* Quick Button inside App */}
                    <button
                      type="button"
                      className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-black text-xs rounded-xl shadow-lg uppercase tracking-wider"
                    >
                      ✓ I AM SAFE (CHECK-IN)
                    </button>

                    <button
                      type="button"
                      className="w-full py-2.5 bg-rose-600/20 text-rose-300 border border-rose-500/40 font-bold text-[11px] rounded-xl flex items-center justify-center gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      <span>SOS Emergency Beacon</span>
                    </button>

                    <div className="text-[10px] text-slate-400 text-center pt-1 font-mono">
                      GPS: 6.2879° N, 124.9676° E
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 7. SDRRM PROTOCOL STEPS ── */}
        <section id="protocols" className="py-20 px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                <Info className="w-3.5 h-3.5" />
                <span>Standard Operating Procedure</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                4-Step Campus Emergency Protocol
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                What students, faculty, and school staff should do when an emergency siren activates.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-3 relative">
                <span className="text-3xl font-black text-cyan-500/30 font-mono">01</span>
                <h3 className="text-base font-bold text-white">Alert Recognition</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Listen immediately for the campus siren broadcast and check your mobile notification for alert details (Earthquake / Fire / Severe Weather).
                </p>
              </div>

              <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-3 relative">
                <span className="text-3xl font-black text-cyan-500/30 font-mono">02</span>
                <h3 className="text-base font-bold text-white">Duck, Cover & Hold</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  During an earthquake, take immediate cover under heavy desks until the primary shaking subsides before attempting building egress.
                </p>
              </div>

              <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-3 relative">
                <span className="text-3xl font-black text-cyan-500/30 font-mono">03</span>
                <h3 className="text-base font-bold text-white">Follow Safe Corridors</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Evacuate in single file following the green SafeRoute markers straight to the Central Evacuation Oval. Do not run or panic.
                </p>
              </div>

              <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-3 relative">
                <span className="text-3xl font-black text-cyan-500/30 font-mono">04</span>
                <h3 className="text-base font-bold text-white">Safety Check-In</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Upon arrival at the assembly zone, tap "I Am Safe" on your mobile app or report directly to your room's designated Safety Marshal.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 8. FREQUENTLY ASKED QUESTIONS (FAQ ACCORDION) ── */}
        <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/30 border-t border-slate-800/80 relative">
          <div className="max-w-4xl mx-auto space-y-10">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Information & Guidelines</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Answers to common inquiries regarding the SafeRoute implementation at Polonuling National High School.
              </p>
            </div>

            <div className="space-y-3.5">
              {faqs.map((faq, idx) => (
                <div
                  key={faq.q}
                  className="glass-card rounded-2xl border border-slate-800 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-white hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-cyan-400 shrink-0 transition-transform duration-200 ${
                        openFaq === idx ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openFaq === idx && (
                    <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 9. FINAL CALL TO ACTION BANNER ── */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="max-w-5xl mx-auto relative glass-panel rounded-3xl border border-cyan-500/40 p-8 sm:p-12 text-center space-y-6 shadow-2xl shadow-cyan-950/40">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center mx-auto shadow-xl shadow-cyan-500/30">
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Ready to Access the Campus Safety Command Center?
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              Authorized coordinators and administrators can log in directly to initiate drills, broadcast alerts, manage live hazards, and audit real-time rosters.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-cyan-500/30 transition-all cursor-pointer active:scale-95 flex items-center gap-2"
              >
                <Lock className="w-4 h-4 text-slate-950" />
                <span>Enter Coordinator Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setSosModalOpen(true)}
                className="px-6 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-rose-300 border border-rose-500/40 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <PhoneCall className="w-4 h-4 text-rose-400" />
                <span>Quick Emergency SOS</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500 flex items-center justify-center text-slate-950 font-black text-xs">
                SR
              </div>
              <span className="font-bold text-white text-base">SafeRoute</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              Real-time emergency evacuation and safety management system engineered for Polonuling National High School (DepEd School ID: 304561), Barangay Polonuling, Municipality of Tupi, South Cotabato, Philippines.
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              Coordinates: 6.3615° N, 124.9502° E • PostGIS Spatial Schema
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-bold text-white text-xs uppercase tracking-wider">Quick Navigation</p>
            <ul className="space-y-1.5 text-xs">
              <li><a href="#overview" className="hover:text-cyan-400 transition-colors">Overview</a></li>
              <li><a href="#hotlines" className="hover:text-cyan-400 transition-colors">Emergency Hotlines</a></li>
              <li><a href="#campus-map" className="hover:text-cyan-400 transition-colors">Campus Evacuation Zones</a></li>
              <li><a href="#mobile-app" className="hover:text-cyan-400 transition-colors">Mobile Companion App</a></li>
              <li><a href="#protocols" className="hover:text-cyan-400 transition-colors">4-Step SDRRM Protocol</a></li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="font-bold text-white text-xs uppercase tracking-wider">Administration</p>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="hover:text-cyan-400 transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-3 h-3 text-cyan-400" />
                  <span>Coordinator Login</span>
                </button>
              </li>
              <li><span className="text-slate-500">DepEd Region XII (SOCCSKSARGEN)</span></li>
              <li><span className="text-slate-500">Division of South Cotabato</span></li>
              <li><span className="text-slate-500">MDRRMO Tupi Inter-Agency Unit</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} SafeRoute — Polonuling National High School. All rights reserved.</p>
          <p>Protected by Republic Act No. 10173 (Data Privacy Act of 2012).</p>
        </div>
      </footer>

      {/* ── QUICK SOS MODAL ── */}
      {sosModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel w-full max-w-lg rounded-3xl border border-rose-500/50 p-6 sm:p-8 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/40">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Emergency SOS Action Guide</h3>
                  <p className="text-[11px] text-rose-300">Polonuling NHS Safety Quick Response</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSosModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-rose-950/30 border border-rose-500/30 p-3.5 rounded-2xl text-rose-200 space-y-1">
                <p className="font-bold">Are you currently on campus facing an immediate life-safety hazard?</p>
                <p className="text-[11px] text-rose-300 leading-normal">
                  Move away from windows, masonry walls, and overhead electric posts immediately. Head towards the <strong>Central Evacuation Oval</strong>.
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                  Direct Rescue Numbers:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href="tel:09301234567"
                    className="p-3 bg-slate-900 border border-slate-700 rounded-xl text-center hover:border-cyan-400 transition-colors"
                  >
                    <span className="block text-[10px] text-slate-400 font-semibold">MDRRMO Tupi</span>
                    <span className="text-xs font-bold text-cyan-400 font-mono">0930-123-4567</span>
                  </a>
                  <a
                    href="tel:09279876543"
                    className="p-3 bg-slate-900 border border-slate-700 rounded-xl text-center hover:border-rose-400 transition-colors"
                  >
                    <span className="block text-[10px] text-slate-400 font-semibold">BFP Fire Station</span>
                    <span className="text-xs font-bold text-rose-400 font-mono">0927-987-6543</span>
                  </a>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSosModalOpen(false)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Close Emergency Guide
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
