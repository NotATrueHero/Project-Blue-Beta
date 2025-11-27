
import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Theme } from '../types';

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
}

export const Layout: React.FC<LayoutProps> = ({ children, theme }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isHome = pathname === '/';

  // Theme colors
  const bgClass = theme === 'stealth' ? 'bg-[#020617]' : 'bg-[#0047FF]';
  const accentClass = theme === 'stealth' ? 'bg-white/5' : 'bg-blue-base/20';

  return (
    <div className={`w-full h-screen ${bgClass} text-white overflow-hidden relative font-sans transition-colors duration-700`}>
      {/* Global Header / Nav */}
      <div className="fixed top-0 left-0 w-full z-40 p-6 md:p-8 flex justify-between items-start pointer-events-none">
        
        {/* Left Side: Container for Back Button & System Status */}
        <div className="pointer-events-auto flex items-center">
            
            <AnimatePresence>
                {!isHome && (
                    <motion.button 
                        initial={{ opacity: 0, x: -20, width: 0, marginRight: 0 }}
                        animate={{ opacity: 1, x: 0, width: 'auto', marginRight: 24 }}
                        exit={{ opacity: 0, x: -20, width: 0, marginRight: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        onClick={() => navigate('/')}
                        className={`group flex items-center gap-2 font-bold uppercase tracking-widest text-sm hover:opacity-75 transition-opacity px-4 py-2 border border-white/20 rounded-full md:bg-transparent md:border-none md:p-0 md:rounded-none whitespace-nowrap overflow-hidden backdrop-blur-sm ${accentClass} md:bg-transparent`}
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back</span>
                    </motion.button>
                )}
            </AnimatePresence>
          
            {/* System Status */}
            <motion.div layout className="text-left flex flex-col justify-center">
                <div className="text-[10px] md:text-xs font-bold opacity-50 tracking-widest uppercase mb-1 leading-none">System Status</div>
                <div className={`flex items-center gap-2 backdrop-blur-sm py-1 px-3 rounded-full md:bg-transparent md:p-0 ${accentClass} md:bg-transparent`}>
                    <div className="relative flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse relative z-10"></div>
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-ping absolute opacity-75"></div>
                    </div>
                    <span className="font-bold text-sm tracking-wider text-green-300 drop-shadow-[0_0_8px_rgba(134,239,172,0.5)] leading-none">ONLINE</span>
                </div>
            </motion.div>
        </div>
      </div>

      <div className="w-full h-full relative z-0">
        {children}
      </div>
    </div>
  );
};
