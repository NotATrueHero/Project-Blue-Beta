
import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Save, Lock, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { UserData, Theme } from '../types';

interface ConfigProps {
    currentTheme: Theme;
    onThemeChange: (t: Theme) => void;
}

export const Config: React.FC<ConfigProps> = ({ currentTheme, onThemeChange }) => {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    setCurrentPin(localStorage.getItem('blue_pin') || '1969');
  }, []);

  const handleDownload = () => {
    const notes = JSON.parse(localStorage.getItem('blue_notes') || '[]');
    const tasks = JSON.parse(localStorage.getItem('blue_tasks') || '[]');
    const bookmarks = JSON.parse(localStorage.getItem('blue_uplinks') || '[]');
    const files = JSON.parse(localStorage.getItem('blue_files') || '[]');
    const pin = localStorage.getItem('blue_pin') || '1969';
    const theme = (localStorage.getItem('blue_theme') as Theme) || 'standard';

    const data: UserData = {
        version: '2.0',
        pin,
        theme,
        notes,
        tasks,
        bookmarks,
        files
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

  const toggleTheme = () => {
      const newTheme = currentTheme === 'standard' ? 'stealth' : 'standard';
      onThemeChange(newTheme);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="w-full h-full pt-24 px-6 md:px-12 pb-12 max-w-7xl mx-auto flex flex-col gap-12"
    >
      <div className="border-b-2 border-white pb-6">
        <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter mb-2">Config</h1>
        <p className="text-sm md:text-base uppercase tracking-widest opacity-70">System Diagnostics & Data Management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* VISUAL INTERFACE */}
        <section className="border-4 border-white p-8 relative overflow-hidden flex flex-col justify-between">
            <div>
                <div className="flex items-center gap-4 mb-6">
                    {currentTheme === 'standard' ? <Eye size={32} /> : <EyeOff size={32} />}
                    <h2 className="text-2xl font-bold uppercase tracking-widest">Interface</h2>
                </div>
                <p className="opacity-80 mb-8 leading-relaxed font-light">
                    Toggle visual output mode. Standard mode uses high-contrast Blue. Stealth mode optimizes for low-light environments.
                </p>
            </div>
            <button 
                onClick={toggleTheme}
                className="w-full flex items-center justify-center gap-3 bg-white text-black px-6 py-3 font-bold uppercase tracking-wider hover:bg-opacity-90 transition-all border-2 border-transparent hover:border-white hover:bg-transparent hover:text-white"
            >
                {currentTheme === 'standard' ? 'Enable Stealth Mode' : 'Enable Standard Mode'}
            </button>
        </section>

        {/* SECURITY */}
        <section className="border-4 border-white p-8">
            <div className="flex items-center gap-4 mb-6">
                <Lock size={32} />
                <h2 className="text-2xl font-bold uppercase tracking-widest">Security</h2>
            </div>
            
            <div className="mb-6 flex items-center gap-3 text-sm opacity-70">
                <AlertCircle size={16} />
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
                {message && (
                    <div className={`text-center text-xs font-bold uppercase tracking-widest ${message.type === 'error' ? 'text-red-300' : 'text-green-300'}`}>
                        {message.text}
                    </div>
                )}
            </form>
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
                        Generate a full JSON dump of current system state, including logs, task directives, Uplink coordinates, and Vault items.
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

      </div>
    </motion.div>
  );
};
