
import * as React from 'react';
import { useEffect, useRef } from 'react';
import { Link } from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewMode, ToolItem } from '../types';

const tools: ToolItem[] = [
  { id: '4', number: '01 / Network', category: 'Web', title: 'Uplink', description: 'Stored coordinates for external network navigation and quick access.', path: '/uplink', imageText: 'NET BRIDGE' },
  { id: '1', number: '02 / System', category: 'Notes', title: 'Notes', description: 'Access classified logs, personal entries, and daily observations.', path: '/notes', imageText: 'NOTES UI' },
  { id: '2', number: '03 / System', category: 'Tasks', title: 'Tasks', description: 'Manage mission objectives and daily operations with real-time tracking.', path: '/tasks', imageText: 'TASK LOG' },
  { id: '3', number: '04 / AI', category: 'Oracle', title: 'Oracle', description: 'Secure channel to the Project Blue artificial intelligence core.', path: '/oracle', imageText: 'AI CORE' },
  { id: 'music', number: '05 / Media', category: 'Audio', title: 'Music', description: 'System audio player and frequency management.', path: '/music', imageText: 'AUDIO' },
  { id: '5', number: '06 / Storage', category: 'Files', title: 'Intel', description: 'Secure vault for encoding and storing classified schematics.', path: '/files', imageText: 'VAULT' },
  { id: '6', number: '07 / System', category: 'Config', title: 'Config', description: 'Adjust system parameters, diagnostics, and security protocols.', path: '/config', imageText: 'SETUP' },
];

interface DashboardProps {
    viewMode: ViewMode;
    onHeroIntersect: (visible: boolean) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ viewMode, onHeroIntersect }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Use IntersectionObserver for robust visibility detection
    const observer = new IntersectionObserver(
        ([entry]) => {
            // Report visibility back to App -> Layout
            // If intersecting, hero is visible -> Hide Toggle
            // If NOT intersecting, hero hidden -> Show Toggle
            onHeroIntersect(entry.isIntersecting);
        },
        {
            root: containerRef.current,
            threshold: 0.1 // Trigger when 10% of hero is visible
        }
    );

    if (heroRef.current) {
        observer.observe(heroRef.current);
    }

    return () => observer.disconnect();
  }, [onHeroIntersect]);

  return (
    <>
      <div 
        ref={containerRef}
        className={`w-full h-full overflow-x-hidden hide-scrollbar ${viewMode === ViewMode.LIST ? 'overflow-y-scroll snap-y snap-mandatory scroll-smooth' : 'overflow-y-auto'}`}
      >
        {/* HERO */}
        <section 
          ref={heroRef}
          className={`w-full relative flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${viewMode === ViewMode.LIST ? 'h-screen snap-start shrink-0' : 'h-[60vh] shrink-0 mb-12'}`}
        >
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-24 w-[90%] max-w-6xl mt-16 md:mt-0"
            >
                <div className="flex flex-col text-center md:text-left z-10">
                    <span className="font-bold uppercase leading-[0.9] text-[clamp(32px,10vw,100px)] tracking-tighter mix-blend-overlay">Project</span>
                    <span className="font-bold uppercase leading-[0.9] text-[clamp(32px,10vw,100px)] tracking-tighter">Blue Beta</span>
                </div>

                <div className="flex flex-col items-center group cursor-default">
                    <div className="text-[24px] md:text-[40px] font-bold uppercase mb-2 tracking-[0.2em] group-hover:tracking-[0.5em] transition-all duration-500">EXIT</div>
                    <div className="relative h-[200px] w-[150px] md:h-[350px] md:w-[300px] flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-white/90 z-10" />
                        <img 
                            src="https://upload.wikimedia.org/wikipedia/commons/3/32/Runner_stickman.png" 
                            alt="Runner" 
                            className="relative z-20 w-[90%] brightness-0 invert -translate-x-4 group-hover:translate-x-4 transition-transform duration-700 ease-out" 
                        />
                    </div>
                </div>
            </motion.div>
            
            <AnimatePresence>
                {viewMode === ViewMode.LIST && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] animate-pulse pointer-events-none whitespace-nowrap"
                    >
                        Scroll to Unlock Tools
                    </motion.div>
                )}
            </AnimatePresence>
        </section>

        {/* TOOLS */}
        <div className={`transition-all duration-700 ease-in-out w-full ${viewMode === ViewMode.GRID ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 md:gap-8 md:px-6 pb-24 max-w-7xl mx-auto' : ''}`}>
            {tools.map((tool, index) => (
                <ToolCard key={tool.id} tool={tool} mode={viewMode} index={index} />
            ))}
        </div>
      </div>
    </>
  );
};

const ToolCard: React.FC<{ tool: ToolItem; mode: ViewMode; index: number }> = ({ tool, mode, index }) => {
    return (
        <section 
            className={`transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col justify-center relative
            ${mode === ViewMode.LIST 
                ? 'w-full h-screen snap-start border-b border-white/10 items-center py-20 px-4' 
                : 'w-full h-auto min-h-[300px] md:min-h-[400px] border-4 border-white p-6 md:p-8 hover:-translate-y-2 hover:bg-white hover:text-black group cursor-pointer hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)]'
            }`}
        >
            <div className={`flex items-center justify-between gap-8 md:gap-12 max-w-6xl w-[90%] transition-all duration-700 ${mode === ViewMode.GRID ? 'flex-col-reverse w-full gap-6' : 'flex-col-reverse md:flex-row'}`}>
                <div className={`flex-1 flex flex-col ${mode === ViewMode.GRID ? 'items-center text-center' : 'items-center md:items-start md:text-left text-center'}`}>
                    <div className="font-bold uppercase tracking-widest opacity-60 mb-2 md:mb-4 text-xs md:text-base">{tool.number}</div>
                    <h2 className={`font-bold uppercase leading-none mb-4 md:mb-6 transition-all duration-500 ${mode === ViewMode.GRID ? 'text-[24px] md:text-[32px]' : 'text-[clamp(32px,5vw,80px)]'}`}>
                        {tool.title}
                    </h2>
                    <p className={`font-light opacity-90 leading-relaxed mb-6 md:mb-10 max-w-[400px] ${mode === ViewMode.GRID ? 'text-xs md:text-sm' : 'text-sm md:text-lg'}`}>
                        {tool.description}
                    </p>
                    <Link 
                        to={tool.path}
                        className={`inline-block border-2 border-white px-6 py-2 md:px-8 md:py-3 font-bold uppercase text-xs md:text-sm tracking-widest transition-all duration-300 ${mode === ViewMode.GRID ? 'border-current' : 'border-white hover:bg-white hover:text-blue-base'}`}
                    >
                        Launch System
                    </Link>
                </div>

                <div className={`flex-1 flex justify-center items-center ${mode === ViewMode.GRID ? 'w-full' : ''}`}>
                    <div 
                        className={`border-4 border-white flex items-center justify-center font-bold uppercase tracking-widest transition-all duration-500
                        ${mode === ViewMode.GRID 
                            ? 'w-full aspect-video border-current text-lg md:text-2xl' 
                            : 'w-[90%] max-w-[500px] aspect-[3/2] shadow-[10px_10px_0px_rgba(255,255,255,0.2)] md:shadow-[20px_20px_0px_rgba(255,255,255,0.2)] hover:shadow-[10px_10px_0px_rgba(255,255,255,0.4)] text-lg md:text-2xl'
                        }`}
                    >
                       {tool.imageText}
                    </div>
                </div>
            </div>
        </section>
    );
};
