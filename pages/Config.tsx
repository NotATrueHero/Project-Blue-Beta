
import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Save, Lock, RefreshCw, Eye, EyeOff, Key, ExternalLink, Trash2, AlertTriangle, User, Monitor, Clock, ShieldCheck, LayoutTemplate, MessageSquare, Shield, ShieldAlert, Info, Droplets, Palette, Box, Grid } from 'lucide-react';
import { UserData, Theme, MusicPlaylist, LoopMode, WidgetPosition, LinkOpenMode, FluidAccent, FluidBackground } from '../types';

interface ConfigProps {
    currentTheme: Theme;
    onThemeChange: (t: Theme) => void;
    fluidAccent: FluidAccent;
    onFluidAccentChange: (a: FluidAccent) => void;
    fluidBackground?: FluidBackground;
    onFluidBackgroundChange?: (b: FluidBackground) => void;
    linkOpenMode: LinkOpenMode;
    onLinkOpenModeChange: (m: LinkOpenMode) => void;
    callsign: string;
    onCallsignChange: (name: string) => void;
    crtEnabled: boolean;
    onCrtChange: (enabled: boolean) => void;
    autoLockSeconds: number;
    onAutoLockChange: (seconds: number) => void;
    widgetPosition: WidgetPosition;
    onWidgetPositionChange: (pos: WidgetPosition) => void;
    greetingEnabled: boolean;
    onGreetingEnabledChange: (enabled: boolean) => void;
    greetingText: string;
    onGreetingTextChange: (text: string) => void;
    authEnabled: boolean;
    onAuthEnabledChange: (enabled: boolean) => void;
    musicPlaylists: MusicPlaylist[];
    audioState: {
        volume: number;
        loopMode: LoopMode;
        shuffle: boolean;
    };
}

export const Config: React.FC<ConfigProps> = ({ 
    currentTheme, onThemeChange,
    fluidAccent, onFluidAccentChange,
    fluidBackground = 'deep', onFluidBackgroundChange,
    linkOpenMode, onLinkOpenModeChange,
    callsign, onCallsignChange,
    crtEnabled, onCrtChange,
    autoLockSeconds, onAutoLockChange,
    widgetPosition, onWidgetPositionChange,
    greetingEnabled, onGreetingEnabledChange,
    greetingText, onGreetingTextChange,
    authEnabled, onAuthEnabledChange,
    musicPlaylists, audioState 
}) => {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [newCallsign, setNewCallsign] = useState('');
  const [newGreeting, setNewGreeting] = useState('');
  
  const [apiKey, setApiKey] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    setCurrentPin(localStorage.getItem('blue_pin') || '1969');
    const storedKey = localStorage.getItem('blue_api_key') || '';
    setApiKey(storedKey);
    setApiKeyInput(storedKey);
    setNewCallsign(callsign);
    setNewGreeting(greetingText);
  }, [callsign, greetingText]);

  const handleDownload = () => {
    const notes = JSON.parse(localStorage.getItem('blue_notes') || '[]');
    const noteFolders = JSON.parse(localStorage.getItem('blue_note_folders') || '[]');
    const taskLists = JSON.parse(localStorage.getItem('blue_task_lists') || '[]');
    const files = JSON.parse(localStorage.getItem('blue_files') || '[]');
    const fileFolders = JSON.parse(localStorage.getItem('blue_file_folders') || '[]'); 
    const pin = localStorage.getItem('blue_pin') || '1969';
    const theme = (localStorage.getItem('blue_theme') as Theme) || 'standard';
    const accent = (localStorage.getItem('blue_fluid_accent') as FluidAccent) || 'teal';
    const bg = (localStorage.getItem('blue_fluid_bg') as FluidBackground) || 'deep';
    const widgetPos = (localStorage.getItem('blue_widget_pos') as WidgetPosition) || 'tool';
    const storedApiKey = localStorage.getItem('blue_api_key') || undefined;
    const bookmarkCategories = JSON.parse(localStorage.getItem('blue_uplink_categories') || '[]');
    const quickLinks = JSON.parse(localStorage.getItem('blue_quick_links') || '[]');

    const data: UserData = {
        version: '2.7',
        pin,
        authEnabled,
        theme,
        fluidAccent: accent,
        fluidBackground: bg,
        linkOpenMode,
        callsign,
        crtEnabled,
        autoLockSeconds,
        widgetPosition: widgetPos,
        greetingEnabled,
        greetingText,
        apiKey: storedApiKey,
        musicPlaylists,
        volume: audioState.volume,
        loopMode: audioState.loopMode,
        shuffle: audioState.shuffle,
        notes,
        noteFolders,
        taskLists,
        bookmarkCategories,
        quickLinks,
        files,
        fileFolders
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project_blue_backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePinChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
        setMessage({ text: 'PIN must be 4 digits.', type: 'error' });
        return;
    }
    if (newPin !== confirmPin) {
        setMessage({ text: 'PINs do not match.', type: 'error' });
        return;
    }

    localStorage.setItem('blue_pin', newPin);
    setCurrentPin(newPin);
    setNewPin('');
    setConfirmPin('');
    setMessage({ text: 'Security Protocol Updated.', type: 'success' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCallsignSave = (e: React.FormEvent) => {
      e.preventDefault();
      onCallsignChange(newCallsign.toUpperCase());
      setMessage({ text: 'Identity Protocol Updated.', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
  };

  const handleGreetingSave = (e: React.FormEvent) => {
      e.preventDefault();
      onGreetingTextChange(newGreeting.toUpperCase());
      setMessage({ text: 'Greeting Updated.', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
  };

  const handleApiKeySave = (e: React.FormEvent) => {
      e.preventDefault();
      localStorage.setItem('blue_api_key', apiKeyInput.trim());
      setApiKey(apiKeyInput.trim());
      setMessage({ text: 'API Key Configured.', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
  };

  const executeFactoryReset = () => {
      localStorage.clear();
      window.location.reload();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="w-full h-full pt-24 px-6 md:px-12 pb-12 max-w-7xl mx-auto flex flex-col gap-12 overflow-y-auto hide-scrollbar"
    >
      <div className="border-b-2 border-white pb-6">
        <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter mb-2">Config</h1>
        <p className="text-sm md:text-base uppercase tracking-widest opacity-70">System Diagnostics & Data Management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pb-24">
        
        {/* IDENTITY */}
        <section className="border-4 border-white p-8">
            <div className="flex items-center gap-4 mb-6">
                <User size={32} />
                <h2 className="text-2xl font-bold uppercase tracking-widest">Identity</h2>
            </div>
            
            <div className="space-y-6">
                <div>
                    <p className="opacity-80 mb-2 leading-relaxed font-light text-sm">
                        Set operational callsign.
                    </p>
                    <form onSubmit={handleCallsignSave} className="flex gap-4">
                        <input 
                            type="text" 
                            value={newCallsign}
                            onChange={(e) => setNewCallsign(e.target.value)}
                            placeholder="COMMANDER"
                            className="flex-1 bg-transparent border-b-2 border-white/30 focus:border-white outline-none py-2 text-xl font-bold uppercase"
                        />
                        <button 
                            type="submit"
                            className="border-2 border-white px-6 py-2 font-bold uppercase hover:bg-white hover:text-black transition-colors"
                        >
                            Set
                        </button>
                    </form>
                </div>
            </div>
        </section>

        {/* INTERFACE & VISUALS */}
        <section className="border-4 border-white p-8">
            <div className="flex items-center gap-4 mb-6">
                <Monitor size={32} />
                <h2 className="text-2xl font-bold uppercase tracking-widest">Interface</h2>
            </div>
            
            <div className="space-y-6">
                {/* Theme Selector */}
                <div>
                    <div className="font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                            {currentTheme === 'fluid' ? <Droplets size={16} /> : currentTheme === 'vanta' ? <Box size={16} /> : currentTheme === 'standard' ? <Eye size={16} /> : <EyeOff size={16} />}
                            <span>Visual Theme</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <button 
                            onClick={() => onThemeChange('standard')}
                            className={`border border-white py-2 text-xs font-bold uppercase hover:bg-white hover:text-black transition-all ${currentTheme === 'standard' ? 'bg-white text-black' : 'text-white'}`}
                        >
                            Standard
                        </button>
                        <button 
                            onClick={() => onThemeChange('stealth')}
                            className={`border border-white py-2 text-xs font-bold uppercase hover:bg-white hover:text-black transition-all ${currentTheme === 'stealth' ? 'bg-white text-black' : 'text-white'}`}
                        >
                            Stealth
                        </button>
                        <button 
                            onClick={() => onThemeChange('fluid')}
                            className={`border border-white py-2 text-xs font-bold uppercase hover:bg-white hover:text-black transition-all ${currentTheme === 'fluid' ? 'bg-white text-black' : 'text-white'}`}
                        >
                            Fluid
                        </button>
                        <button 
                            onClick={() => onThemeChange('vanta')}
                            className={`border border-white py-2 text-xs font-bold uppercase hover:bg-white hover:text-black transition-all ${currentTheme === 'vanta' ? 'bg-white text-black' : 'text-white'}`}
                        >
                            Minimal V2
                        </button>
                    </div>
                    <div className="text-xs opacity-60 mt-2">
                        {currentTheme === 'standard' && 'High-contrast tactical blue.'}
                        {currentTheme === 'stealth' && 'Low-light tactical slate.'}
                        {currentTheme === 'fluid' && 'Modern studio aesthetic. Customizable.'}
                        {currentTheme === 'vanta' && 'Ultra-minimal deep black. List interface.'}
                    </div>
                </div>

                {/* FLUID SETTINGS - Only visible if Fluid is active */}
                {currentTheme === 'fluid' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-4 border-l-2 border-white/20 pl-4 py-2">
                        {/* Background Toggle */}
                        <div>
                            <div className="font-bold uppercase tracking-wider mb-2 flex items-center gap-2 text-xs">
                                <Grid size={12} /> Background Intensity
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button 
                                    onClick={() => onFluidBackgroundChange && onFluidBackgroundChange('deep')}
                                    className={`border border-white py-1 text-[10px] font-bold uppercase hover:bg-white hover:text-black transition-all ${fluidBackground === 'deep' ? 'bg-white text-black' : 'text-white'}`}
                                >
                                    Deep (Dark)
                                </button>
                                <button 
                                    onClick={() => onFluidBackgroundChange && onFluidBackgroundChange('vivid')}
                                    className={`border border-white py-1 text-[10px] font-bold uppercase hover:bg-white hover:text-black transition-all ${fluidBackground === 'vivid' ? 'bg-white text-black' : 'text-white'}`}
                                >
                                    Vivid (Blue)
                                </button>
                            </div>
                        </div>

                        {/* Accent Picker */}
                        <div>
                            <div className="font-bold uppercase tracking-wider mb-2 flex items-center gap-2 text-xs">
                                <Palette size={12} /> Fluid Accent
                            </div>
                            <div className="flex gap-3">
                                {(['teal', 'violet', 'rose', 'amber', 'blue'] as FluidAccent[]).map(color => (
                                    <button
                                        key={color}
                                        onClick={() => onFluidAccentChange(color)}
                                        className={`w-6 h-6 rounded-full border-2 transition-transform ${fluidAccent === color ? 'border-white scale-110 shadow-[0_0_10px_white]' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                                        style={{ 
                                            backgroundColor: color === 'teal' ? '#14b8a6' : 
                                                            color === 'violet' ? '#8b5cf6' : 
                                                            color === 'rose' ? '#f43f5e' : 
                                                            color === 'amber' ? '#f59e0b' : 
                                                            '#3b82f6' 
                                        }}
                                        title={color.toUpperCase()}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Link Open Mode */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                             <ExternalLink size={16} /> Link Protocol
                        </div>
                        <div className="text-xs opacity-60">Open external links in New Tab or Current Tab</div>
                    </div>
                    <button 
                        onClick={() => onLinkOpenModeChange(linkOpenMode === 'new_tab' ? 'current_tab' : 'new_tab')}
                        className="border border-white px-4 py-1 text-xs font-bold uppercase hover:bg-white hover:text-black transition-all"
                    >
                        {linkOpenMode === 'new_tab' ? 'NEW TAB' : 'CURRENT TAB'}
                    </button>
                </div>

                {/* Greeting Config */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div>
                             <div className="font-bold uppercase tracking-wider flex items-center gap-2">
                                 <MessageSquare size={16} /> Splash Greeting
                             </div>
                             <div className="text-xs opacity-60">Replace logo with custom text</div>
                        </div>
                        <button 
                            onClick={() => onGreetingEnabledChange(!greetingEnabled)}
                            className={`border border-white py-1 px-3 text-xs font-bold uppercase hover:bg-white hover:text-black transition-all ${greetingEnabled ? 'bg-white text-black' : 'text-white'}`}
                        >
                            {greetingEnabled ? 'ENABLED' : 'DISABLED'}
                        </button>
                    </div>
                    {greetingEnabled && (
                        <form onSubmit={handleGreetingSave} className="flex gap-2">
                            <input 
                                value={newGreeting}
                                onChange={(e) => setNewGreeting(e.target.value)}
                                placeholder="WELCOME COMMANDER"
                                className="flex-1 bg-transparent border-b border-white/30 py-1 font-bold uppercase text-sm outline-none"
                            />
                            <button type="submit" className="text-xs font-bold uppercase border border-white px-3 hover:bg-white hover:text-black">Save</button>
                        </form>
                    )}
                </div>

                {/* Widget Position (Hidden in Fluid/Vanta Mode) */}
                <div className={currentTheme === 'fluid' || currentTheme === 'vanta' ? 'opacity-30 pointer-events-none' : ''}>
                     <div className="font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                         <LayoutTemplate size={16} /> System Widget
                     </div>
                     <div className="grid grid-cols-3 gap-2">
                        {(['tool', 'hero', 'hidden'] as WidgetPosition[]).map(pos => (
                            <button
                                key={pos}
                                onClick={() => onWidgetPositionChange(pos)}
                                className={`border border-white py-2 text-xs font-bold uppercase hover:bg-white hover:text-black transition-all ${widgetPosition === pos ? 'bg-white text-black' : 'text-white'}`}
                            >
                                {pos === 'hero' ? 'Splash' : pos === 'tool' ? 'Tool Grid' : 'Hidden'}
                            </button>
                        ))}
                     </div>
                </div>

                {/* CRT Toggle */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="font-bold uppercase tracking-wider mb-1">CRT Overlay</div>
                        <div className="text-xs opacity-60">Retro-style scanline simulation</div>
                    </div>
                    <button onClick={() => onCrtChange(!crtEnabled)} className={`w-12 h-6 border border-white flex items-center p-1 transition-all ${crtEnabled ? 'bg-white justify-end' : 'bg-transparent justify-start'}`}>
                         <div className={`w-4 h-4 ${crtEnabled ? 'bg-blue-base' : 'bg-white'}`} />
                    </button>
                </div>
            </div>
        </section>

        {/* SECURITY */}
        <section className="border-4 border-white p-8">
            <div className="flex items-center gap-4 mb-6">
                <Lock size={32} />
                <h2 className="text-2xl font-bold uppercase tracking-widest">Security</h2>
            </div>
            
            <div className="space-y-8">
                {/* Auth Toggle */}
                <div className="flex items-center justify-between pb-6 border-b border-white/20">
                    <div>
                        <div className="font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                             {authEnabled ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                             <span>Password System</span>
                        </div>
                        <div className="text-xs opacity-60">
                             {authEnabled ? 'System locked on boot & inactivity.' : 'Authentication Disabled. Open Access.'}
                        </div>
                    </div>
                    <button 
                        onClick={() => onAuthEnabledChange(!authEnabled)}
                        className={`border border-white py-1 px-3 text-xs font-bold uppercase hover:bg-white hover:text-black transition-all ${authEnabled ? 'bg-white text-black' : 'text-white'}`}
                    >
                        {authEnabled ? 'ENABLED' : 'DISABLED'}
                    </button>
                </div>

                {/* Auto Lock (Disabled if Auth is off) */}
                <div className={!authEnabled ? 'opacity-30 pointer-events-none' : ''}>
                     <div className="flex items-center gap-2 mb-4 font-bold uppercase tracking-wider">
                         <Clock size={16} /> Auto-Lock Timer
                     </div>
                     <div className="grid grid-cols-4 gap-2">
                         {[0, 60, 300, 600].map(time => (
                             <button 
                                key={time}
                                onClick={() => onAutoLockChange(time)}
                                className={`border border-white py-2 text-xs font-bold uppercase hover:bg-white hover:text-black transition-all ${autoLockSeconds === time ? 'bg-white text-black' : 'text-white'}`}
                             >
                                 {time === 0 ? 'Never' : `${time / 60} Min`}
                             </button>
                         ))}
                     </div>
                </div>

                {/* PIN Change (Disabled if Auth is off) */}
                <div className={!authEnabled ? 'opacity-30 pointer-events-none' : ''}>
                    <div className="flex items-center gap-3 text-sm opacity-70 mb-4">
                        <ShieldCheck size={16} />
                        <span>Current PIN: <span className="font-mono bg-white/20 px-2 py-0.5 rounded ml-2">{currentPin}</span></span>
                    </div>

                    <form onSubmit={handlePinChange} className="space-y-4">
                        <div className="flex gap-4">
                            <input 
                                type="password" 
                                maxLength={4}
                                value={newPin}
                                onChange={(e) => setNewPin(e.target.value)}
                                className="w-full bg-transparent border-b-2 border-white/30 focus:border-white outline-none py-2 text-xl font-bold font-mono tracking-[1em]"
                                placeholder="NEW"
                            />
                            <input 
                                type="password" 
                                maxLength={4}
                                value={confirmPin}
                                onChange={(e) => setConfirmPin(e.target.value)}
                                className="w-full bg-transparent border-b-2 border-white/30 focus:border-white outline-none py-2 text-xl font-bold font-mono tracking-[1em]"
                                placeholder="CNFM"
                            />
                        </div>
                        <button 
                            type="submit"
                            className="w-full border-2 border-white px-6 py-2 font-bold uppercase hover:bg-white hover:text-black transition-colors flex items-center justify-center gap-2 mt-4"
                        >
                            <RefreshCw size={16} />
                            Update PIN
                        </button>
                    </form>
                </div>
            </div>
        </section>

        {/* AI CONFIG */}
        <section className="border-4 border-white p-8">
            <div className="flex items-center gap-4 mb-6">
                <Key size={32} />
                <h2 className="text-2xl font-bold uppercase tracking-widest">AI Core Config</h2>
            </div>
            
            <p className="opacity-80 mb-6 leading-relaxed font-light text-sm">
                Configure connection to Oracle (Gemini).
            </p>

            <form onSubmit={handleApiKeySave} className="space-y-6">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-2 opacity-60">Gemini API Key</label>
                    <div className="flex gap-4">
                        <input 
                            type="text" 
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                            className="flex-1 bg-transparent border-b-2 border-white/30 focus:border-white outline-none py-2 text-lg font-mono placeholder-white/20"
                            placeholder="AIza..."
                        />
                        <button 
                            type="submit"
                            className="shrink-0 border-2 border-white px-6 py-2 font-bold uppercase hover:bg-white hover:text-black transition-colors"
                        >
                            Save
                        </button>
                    </div>
                </div>
                
                <div className="flex justify-between items-center text-xs uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                         Status: 
                         {apiKey ? (
                             <span className="text-green-300 font-bold">Configured</span>
                         ) : (
                             <span className="text-red-300 font-bold">Missing</span>
                         )}
                    </div>
                    <a 
                        href="https://aistudio.google.com/app/apikey" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-blue-300 transition-colors"
                    >
                        Get Key <ExternalLink size={10} />
                    </a>
                </div>
            </form>
        </section>

        {/* SYSTEM MANIFEST (ABOUT) */}
        <section className="border-4 border-white p-8 md:col-span-2 bg-white/5">
            <div className="flex items-center gap-4 mb-6">
                <Info size={32} />
                <h2 className="text-2xl font-bold uppercase tracking-widest">System Manifest</h2>
            </div>

            <div className="space-y-6 text-sm md:text-base font-light leading-relaxed opacity-90">
                <p>
                    <strong className="font-bold">PROJECT BLUE BETA</strong> is a sovereign, high-security digital workspace designed for tactical data management and operational focus. It functions as a self-contained operating environment running locally within the browser architecture.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 border-b border-white/20 pb-1">Core Directives</h3>
                        <ul className="space-y-3 mt-3">
                            <li className="flex gap-3">
                                <span className="font-mono text-blue-300 font-bold">01 //</span>
                                <span>
                                    <strong className="uppercase text-xs font-bold tracking-wider">Local Sovereignty</strong><br/>
                                    All user data—encrypted logs, files, and keys—resides exclusively in local storage. No external cloud telemetry exists.
                                </span>
                            </li>
                            <li className="flex gap-3">
                                <span className="font-mono text-blue-300 font-bold">02 //</span>
                                <span>
                                    <strong className="uppercase text-xs font-bold tracking-wider">Modular Architecture</strong><br/>
                                    Tools operate as independent isolated modules, from the <span className="font-mono text-xs">Oracle</span> AI bridge to the <span className="font-mono text-xs">Cipher</span> cryptographic engine.
                                </span>
                            </li>
                            <li className="flex gap-3">
                                <span className="font-mono text-blue-300 font-bold">03 //</span>
                                <span>
                                    <strong className="uppercase text-xs font-bold tracking-wider">Tactical UI/UX</strong><br/>
                                    High-contrast, distraction-free interface designed for rapid information processing and cognitive clarity.
                                </span>
                            </li>
                        </ul>
                    </div>

                    <div>
                         <h3 className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 border-b border-white/20 pb-1">Technical Specifications</h3>
                         <div className="font-mono text-xs space-y-2 mt-3 opacity-80">
                            <div className="flex justify-between">
                                <span>KERNEL</span>
                                <span>React v18.3 / Vite</span>
                            </div>
                            <div className="flex justify-between">
                                <span>AI BRIDGE</span>
                                <span>Gemini 2.5 Flash</span>
                            </div>
                            <div className="flex justify-between">
                                <span>STORAGE</span>
                                <span>IndexedDB / LocalStorage</span>
                            </div>
                            <div className="flex justify-between">
                                <span>ENCRYPTION</span>
                                <span>AES-256 (Simulated) / Base64</span>
                            </div>
                            <div className="flex justify-between">
                                <span>BUILD</span>
                                <span>Stable 2.7.5 (Cobalt)</span>
                            </div>
                         </div>

                         <div className="mt-6 p-4 border border-white/20 bg-black/20 text-xs italic opacity-60">
                             "The system is designed to disappear, leaving only the operator and the objective."
                         </div>
                    </div>
                </div>
            </div>
        </section>

        {/* EXPORT */}
        <section className="border-4 border-white p-8 relative overflow-hidden group md:col-span-2">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <Download size={32} />
                        <h2 className="text-2xl font-bold uppercase tracking-widest">System Backup</h2>
                    </div>
                    <p className="opacity-80 leading-relaxed font-light max-w-xl">
                        Generate a full JSON dump of current system state.
                    </p>
                </div>
                
                <button 
                    onClick={handleDownload}
                    className="shrink-0 flex items-center gap-3 bg-white text-black px-8 py-4 font-bold uppercase tracking-wider hover:bg-opacity-90 transition-all"
                >
                    <Save size={18} />
                    Export System File
                </button>
            </div>
        </section>

        {/* FACTORY RESET */}
        <section className="border-4 border-red-500 bg-red-900/10 p-8 md:col-span-2 mt-8">
            <div className="flex items-start justify-between flex-col md:flex-row gap-8">
                <div>
                    <div className="flex items-center gap-4 mb-4 text-red-500">
                        <AlertTriangle size={32} />
                        <h2 className="text-2xl font-bold uppercase tracking-widest">Factory Reset</h2>
                    </div>
                    <p className="opacity-80 leading-relaxed font-light max-w-xl text-red-100">
                        DANGER: This will permanently wipe all local data including PIN, notes, tasks, files, playlists, and API keys. 
                        The application will return to its initial boot state. This action cannot be undone.
                    </p>
                </div>

                {!showResetConfirm ? (
                    <button 
                        onClick={() => setShowResetConfirm(true)}
                        className="shrink-0 border-2 border-red-500 text-red-500 px-8 py-4 font-bold uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all flex items-center gap-3"
                    >
                        <Trash2 size={18} />
                        Initiate Purge
                    </button>
                ) : (
                    <div className="flex flex-col items-end gap-3 animate-pulse">
                        <div className="text-red-300 font-bold uppercase tracking-widest text-sm">Are you sure?</div>
                        <div className="flex gap-4">
                            <button 
                                onClick={executeFactoryReset}
                                className="bg-red-500 text-white px-6 py-3 font-bold uppercase tracking-wider hover:bg-red-600 transition-all"
                            >
                                Confirm Wipe
                            </button>
                            <button 
                                onClick={() => setShowResetConfirm(false)}
                                className="border-2 border-white text-white px-6 py-3 font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </section>
        
        {/* Toast Message */}
        {message && (
             <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
                <div className={`px-8 py-4 border-2 font-bold uppercase tracking-widest backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)] ${message.type === 'error' ? 'bg-red-500/20 border-red-500 text-red-100' : 'bg-green-500/20 border-green-500 text-green-100'}`}>
                    {message.text}
                </div>
             </div>
        )}

      </div>
    </motion.div>
  );
};
