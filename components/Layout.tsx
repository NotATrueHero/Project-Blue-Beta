
import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Pause, LayoutGrid, List, Wifi, Zap, Signal } from 'lucide-react';
import { Theme, ViewMode } from '../types';

// Custom Router Implementation
export const useLocation = () => {
  const [path, setPath] = useState(window.location.hash.slice(1) || '/');
  useEffect(() => {
    const handler = () => setPath(window.location.hash.slice(1) || '/');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  return { pathname: path };
};

export const useNavigate = () => {
  return (path: string) => {
    window.location.hash = path;
  };
};

export const Link: React.FC<{to: string; children: React.ReactNode; className?: string}> = ({ to, children, className }) => {
    const navigate = useNavigate();
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        navigate(to);
    };
    return <a href={`#${to}`} onClick={handleClick} className={className}>{children}</a>;
};

interface LayoutProps {
  children: React.ReactNode;
  theme: Theme;
  callsign?: string;
  crtEnabled?: boolean;
  isPlaying: boolean;
  onTogglePlay: () => void;
  showViewToggle?: boolean;
  viewMode?: ViewMode;
  onToggleView?: () => void;
  greetingEnabled?: boolean;
}

// Telemetry Hook
const useTelemetry = () => {
    const [battery, setBattery] = useState<{level: number, charging: boolean} | null>(null);
    const [network, setNetwork] = useState<string>('ONLINE');

    useEffect(() => {
        // Battery
        if ('getBattery' in navigator) {
            // @ts-ignore
            navigator.getBattery().then(bat => {
                const updateBat = () => setBattery({ level: Math.round(bat.level * 100), charging: bat.charging });
                updateBat();
                bat.addEventListener('levelchange', updateBat);
                bat.addEventListener('chargingchange', updateBat);
            });
        }

        // Network
        const updateNet = () => {
            // @ts-ignore
            const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (conn) {
                setNetwork(conn.effectiveType ? conn.effectiveType.toUpperCase() : 'WIFI');
            } else {
                setNetwork(navigator.onLine ? 'ONLINE' : 'OFFLINE');
            }
        };
        updateNet();
        window.addEventListener('online', updateNet);
        window.addEventListener('offline', updateNet);
        
        return () => {
            window.removeEventListener('online', updateNet);
            window.removeEventListener('offline', updateNet);
        }
    }, []);

    return { battery, network };
};

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  theme, 
  callsign,
  crtEnabled,
  isPlaying, 
  onTogglePlay,
  showViewToggle,
  viewMode,
  onToggleView,
  greetingEnabled
}) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isHome = pathname === '/';
  const { battery, network } = useTelemetry();

  // Theme colors
  const bgClass = theme === 'stealth' ? 'bg-[#020617]' : 'bg-[#0047FF]';
  const accentClass = theme === 'stealth' ? 'bg-white/5' : 'bg-blue-base/20';

  return (
    <div className={`w-full h-screen ${bgClass} text-white overflow-hidden relative font-sans transition-colors duration-700`}>
      {/* CRT Scanline Overlay */}
      {crtEnabled && (
        <div 
            className="absolute inset-0 pointer-events-none z-[100] opacity-20"
            style={{
                background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
                backgroundSize: '100% 2px, 3px 100%'
            }}
        />
      )}

      {/* Global Header / Nav */}
      <div className="fixed top-0 left-0 w-full z-40 p-4 md:p-8 flex justify-between items-start pointer-events-none">
        
        {/* Left Side: Back Button & System Status */}
        <div className="pointer-events-auto flex items-center">
            <AnimatePresence>
                {!isHome && (
                    <motion.button 
                        initial={{ opacity: 0, x: -10, width: 0, marginRight: 0 }}
                        animate={{ opacity: 1, x: 0, width: 'auto', marginRight: 12 }}
                        exit={{ opacity: 0, x: -10, width: 0, marginRight: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        onClick={() => navigate('/')}
                        className={`group flex items-center gap-2 font-bold uppercase tracking-widest text-xs md:text-sm hover:opacity-75 transition-opacity px-3 py-2 border border-white/20 rounded-full md:bg-transparent md:border-none md:p-0 md:rounded-none whitespace-nowrap overflow-hidden backdrop-blur-sm ${accentClass} md:bg-transparent`}
                    >
                        <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="hidden md:inline">Back</span>
                    </motion.button>
                )}
            </AnimatePresence>
          
            {/* System Status / Telemetry */}
            <motion.div layout className="text-left flex flex-col justify-center">
                {greetingEnabled && (
                    <div className="text-[9px] md:text-[10px] font-bold tracking-widest uppercase opacity-70 mb-0.5">
                        Project Blue Beta
                    </div>
                )}
                
                <div className="text-[9px] md:text-xs font-bold opacity-50 tracking-widest uppercase mb-0.5 md:mb-1 leading-none">
                    {callsign ? callsign : 'System Status'}
                </div>
                
                <div className={`flex items-center gap-3 backdrop-blur-sm py-1 px-2 md:px-3 rounded-full md:bg-transparent md:p-0 ${accentClass} md:bg-transparent`}>
                    {/* Connection */}
                    <div className="flex items-center gap-1.5" title="Network Status">
                        {network === 'OFFLINE' ? <Wifi size={10} className="text-red-400" /> : <Signal size={10} className="text-green-400" />}
                        <span className="font-mono text-[10px] font-bold">{network}</span>
                    </div>

                    <div className="w-px h-3 bg-white/30"></div>

                    {/* Battery */}
                    {battery ? (
                        <div className="flex items-center gap-1.5" title={`Battery: ${battery.level}%${battery.charging ? ' (Charging)' : ''}`}>
                            <Zap size={10} className={battery.charging ? 'text-yellow-400' : battery.level < 20 ? 'text-red-400' : 'text-green-400'} />
                            <span className="font-mono text-[10px] font-bold">{battery.level}%</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5">
                            <Zap size={10} className="text-white/50" />
                            <span className="font-mono text-[10px] font-bold text-white/50">PWR</span>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>

        {/* Right Side: Music & View Toggle */}
        <div className="pointer-events-auto flex items-center gap-2 md:gap-4">
             {/* View Toggle (Grid/List) - Appears first to push music left */}
            <AnimatePresence>
                {showViewToggle && onToggleView && viewMode && (
                    <motion.button
                        initial={{ opacity: 0, width: 0, scale: 0.8 }}
                        animate={{ opacity: 1, width: 'auto', scale: 1 }}
                        exit={{ opacity: 0, width: 0, scale: 0.8 }}
                        onClick={onToggleView}
                        className={`flex items-center gap-2 backdrop-blur-sm border border-white/20 hover:bg-white hover:text-black hover:border-white px-2 py-2 md:px-3 rounded-lg font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors whitespace-nowrap overflow-hidden ${accentClass}`}
                    >
                        {viewMode === ViewMode.LIST ? <LayoutGrid size={14} className="md:w-4 md:h-4" /> : <List size={14} className="md:w-4 md:h-4" />}
                        <span className="hidden md:inline">Mode: {viewMode === ViewMode.LIST ? 'Grid' : 'List'}</span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Music Visualizer / Toggle */}
            <motion.button 
                layout
                onClick={onTogglePlay}
                className={`group flex items-center gap-2 md:gap-3 backdrop-blur-sm py-2 px-2 md:px-3 rounded-lg border border-white/10 hover:bg-white/10 transition-colors ${accentClass}`}
            >
                <div className="flex items-center gap-0.5 md:gap-1 h-3 md:h-4 w-6 md:w-8 justify-center">
                    {isPlaying ? (
                        <>
                            {[1, 2, 3, 4].map((i) => (
                                <motion.div 
                                    key={i}
                                    animate={{ height: ['20%', '100%', '20%'] }}
                                    transition={{ 
                                        duration: 0.5 + Math.random() * 0.5, 
                                        repeat: Infinity, 
                                        ease: "easeInOut",
                                        delay: i * 0.1 
                                    }}
                                    className="w-0.5 md:w-1 bg-white"
                                />
                            ))}
                        </>
                    ) : (
                         <div className="w-full h-[1px] md:h-[2px] bg-white/30" />
                    )}
                </div>
                {isPlaying ? <Pause size={14} className="md:w-4 md:h-4" /> : <Play size={14} className="md:w-4 md:h-4" />}
            </motion.button>
        </div>

      </div>

      <div className="w-full h-full relative z-0">
        {children}
      </div>
    </div>
  );
};
