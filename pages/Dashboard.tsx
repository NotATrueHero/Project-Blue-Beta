
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, ExternalLink, X, Terminal, ArrowRight } from 'lucide-react';
import { ViewMode, ToolItem, WidgetPosition, QuickLink, LinkOpenMode } from '../types';

const tools: ToolItem[] = [
  { id: 'uplink', number: '01 / Network', category: 'Web', title: 'Uplink', description: 'Stored coordinates for external network navigation and quick access.', path: '/uplink', imageText: 'NET BRIDGE', keywords: ['internet', 'browser', 'web', 'bookmark', 'link', 'google'] },
  { id: 'notes', number: '02 / System', category: 'Notes', title: 'Notes', description: 'Access classified logs, personal entries, and daily observations.', path: '/notes', imageText: 'NOTES UI', keywords: ['text', 'write', 'journal', 'log', 'diary', 'editor'] },
  { id: 'tasks', number: '03 / System', category: 'Tasks', title: 'Tasks', description: 'Manage mission objectives and daily operations with real-time tracking.', path: '/tasks', imageText: 'TASK LOG', keywords: ['todo', 'list', 'check', 'job', 'work'] },
  { id: 'ide', number: '04 / Dev', category: 'Code', title: 'Script Terminal', description: 'Client-side code execution environment. Supports interactive Python and JavaScript.', path: '/ide', imageText: 'SCRIPT EXEC', keywords: ['code', 'python', 'js', 'javascript', 'program', 'develop', 'terminal'] },
  { id: 'calculator', number: '05 / Math', category: 'Calc', title: 'Calculator', description: 'Advanced computational matrix with trigonometric and exponential functions.', path: '/calculator', imageText: 'CALC', keywords: ['math', 'add', 'subtract', 'multiply', 'number', 'count'] },
  { id: 'news', number: '06 / Network', category: 'Intel', title: 'Live Intel', description: 'Real-time global information streams and technology updates.', path: '/news', imageText: 'NEWS FEED', keywords: ['rss', 'world', 'info', 'current', 'tech'] },
  { id: 'weather', number: '07 / Sensor', category: 'Env', title: 'Atmospherics', description: 'Local meteorological data and environmental forecasting.', path: '/weather', imageText: 'WEATHER', keywords: ['atmospherics', 'atmospheric', 'weather', 'rain', 'sun', 'temp', 'forecast', 'climate', 'temperature', 'meteo'] },
  { id: 'chronos', number: '08 / Protocol', category: 'Time', title: 'Chronos', description: 'Tactical countdown timer for operational focus intervals.', path: '/chronos', imageText: 'TIMER', keywords: ['clock', 'watch', 'stopwatch', 'alarm', 'focus'] },
  { id: 'oracle', number: '09 / AI', category: 'Oracle', title: 'Oracle', description: 'Secure channel to the Project Blue artificial intelligence core.', path: '/oracle', imageText: 'AI CORE', keywords: ['gemini', 'gpt', 'chat', 'bot', 'ask', 'question', 'help'] },
  { id: 'music', number: '10 / Media', category: 'Audio', title: 'Music', description: 'System audio player and frequency management.', path: '/music', imageText: 'AUDIO', keywords: ['song', 'mp3', 'sound', 'listen', 'play', 'media'] },
  { id: 'whiteboard', number: '11 / Tac-Ops', category: 'Canvas', title: 'Whiteboard', description: 'Tactical diagramming surface. Capture schematics directly to the vault.', path: '/whiteboard', imageText: 'DIAGRAM', keywords: ['draw', 'paint', 'sketch', 'image', 'art'] },
  { id: 'files', number: '12 / Storage', category: 'Files', title: 'Intel', description: 'Secure vault for encoding and storing classified schematics.', path: '/files', imageText: 'VAULT', keywords: ['file', 'save', 'folder', 'document', 'upload', 'drive', 'data'] },
  { id: 'cipher', number: '13 / Security', category: 'Crypto', title: 'Cipher', description: 'Cryptographic translation engine for secure message encoding.', path: '/cipher', imageText: 'ENCRYPT', keywords: ['secret', 'hide', 'encode', 'decode', 'hash', 'security'] },
  { id: 'games', number: '14 / Sim', category: 'Games', title: 'Games', description: 'Cognitive training simulations and probability engines.', path: '/games', imageText: 'SIMULATE', keywords: ['play', 'fun', 'chess', 'arcade'] },
  { id: 'config', number: '15 / System', category: 'Config', title: 'Config', description: 'Adjust system parameters, diagnostics, and security protocols.', path: '/config', imageText: 'SETUP', keywords: ['settings', 'option', 'preferences', 'theme', 'admin'] },
];

interface DashboardProps {
    viewMode: ViewMode;
    onHeroIntersect: (visible: boolean) => void;
    widgetPosition: WidgetPosition;
    greetingEnabled?: boolean;
    greetingText?: string;
    linkOpenMode: LinkOpenMode;
}

interface SystemWidgetProps {
    mode: 'hero' | 'card';
    linkOpenMode: LinkOpenMode;
    toolSearchQuery: string;
    onToolSearch: (query: string) => void;
}

// Reusable System Widget Component
const SystemWidget: React.FC<SystemWidgetProps> = ({ mode, linkOpenMode, toolSearchQuery, onToolSearch }) => {
    const [time, setTime] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [quickLinks, setQuickLinks] = useState<QuickLink[]>([]);
    const [isAddingLink, setIsAddingLink] = useState(false);
    const [newLinkTitle, setNewLinkTitle] = useState('');
    const [newLinkUrl, setNewLinkUrl] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const navigate = useNavigate();

    // Refs for auto-scroll visibility
    const netSearchRef = useRef<HTMLInputElement>(null);
    const toolSearchRef = useRef<HTMLInputElement>(null);

    // Helper to scroll input into view if typing while off-screen
    const ensureVisible = (ref: React.RefObject<HTMLInputElement>) => {
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            // Check visibility with buffer for fixed header (approx 80px)
            const inViewport = 
                rect.top >= 80 && 
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);
            
            if (!inViewport) {
                ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    };

    // Suggestion Logic
    const suggestions = React.useMemo(() => {
        if (!toolSearchQuery) return [];
        const q = toolSearchQuery.toLowerCase();
        return tools.filter(tool => 
            tool.id.toLowerCase().includes(q) ||
            tool.title.toLowerCase().includes(q) ||
            tool.description.toLowerCase().includes(q) ||
            tool.category.toLowerCase().includes(q) ||
            tool.keywords?.some(k => k.toLowerCase().includes(q))
        ).slice(0, 5); // Limit to 5 suggestions
    }, [toolSearchQuery]);

    useEffect(() => {
        setSelectedIndex(-1);
    }, [toolSearchQuery]);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        // Load Quick Links
        const saved = localStorage.getItem('blue_quick_links');
        if (saved) {
            setQuickLinks(JSON.parse(saved));
        } else {
            // Defaults
            const defaults: QuickLink[] = [
                { id: '1', title: 'GOOGLE', url: 'https://google.com' },
                { id: '2', title: 'MAIL', url: 'https://gmail.com' },
                { id: '3', title: 'CALENDAR', url: 'https://calendar.google.com' },
                { id: '4', title: 'YOUTUBE', url: 'https://youtube.com' }
            ];
            setQuickLinks(defaults);
            localStorage.setItem('blue_quick_links', JSON.stringify(defaults));
        }
        return () => clearInterval(timer);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        window.open(
            `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, 
            linkOpenMode === 'new_tab' ? '_blank' : '_self'
        );
        setSearchQuery('');
    };

    const handleToolSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const target = selectedIndex >= 0 ? suggestions[selectedIndex] : suggestions[0];
        if (target) {
            navigate(target.path);
            onToolSearch('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!suggestions.length) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const target = selectedIndex >= 0 ? suggestions[selectedIndex] : suggestions[0];
            if (target) {
                navigate(target.path);
                onToolSearch('');
            }
        } else if (e.key === 'Escape') {
            onToolSearch('');
        }
    };

    const saveQuickLinks = (updated: QuickLink[]) => {
        setQuickLinks(updated);
        localStorage.setItem('blue_quick_links', JSON.stringify(updated));
    };

    const addQuickLink = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLinkTitle || !newLinkUrl) return;
        const link: QuickLink = {
            id: Date.now().toString(),
            title: newLinkTitle.toUpperCase(),
            url: newLinkUrl.startsWith('http') ? newLinkUrl : `https://${newLinkUrl}`
        };
        saveQuickLinks([...quickLinks, link]);
        setNewLinkTitle('');
        setNewLinkUrl('');
        setIsAddingLink(false);
    };

    const removeQuickLink = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        e.preventDefault();
        saveQuickLinks(quickLinks.filter(l => l.id !== id));
    };

    if (mode === 'hero') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="flex flex-col md:flex-row items-stretch gap-4 md:gap-6 mt-12 z-20 w-full max-w-4xl px-6"
            >
                {/* CLOCK */}
                <div className="h-14 flex items-center justify-center border-2 border-white px-6 font-mono text-xl md:text-2xl font-bold tracking-widest bg-white/5 backdrop-blur-sm whitespace-nowrap min-w-[140px]">
                    {time.toLocaleTimeString([], { hour12: false })}
                </div>

                {/* SEARCH GROUP */}
                <div className="flex-1 flex flex-col md:flex-row gap-4 w-full">
                    {/* NET SEARCH */}
                    <form onSubmit={handleSearch} className="flex-1 h-14 flex relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" size={18} />
                        <input 
                            ref={netSearchRef}
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                ensureVisible(netSearchRef);
                            }}
                            placeholder="NET SEARCH..."
                            className="w-full h-full bg-white/5 backdrop-blur-sm border-2 border-white pl-12 pr-4 font-bold uppercase placeholder-white/40 outline-none focus:bg-white focus:text-blue-base transition-colors"
                        />
                    </form>

                    {/* TOOL SEARCH */}
                    <div className="flex-1 h-14 flex relative group z-50">
                        <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" size={18} />
                        <form onSubmit={handleToolSubmit} className="w-full h-full">
                            <input 
                                ref={toolSearchRef}
                                type="text" 
                                value={toolSearchQuery}
                                onChange={(e) => {
                                    onToolSearch(e.target.value);
                                    ensureVisible(toolSearchRef);
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder="FIND TOOL..."
                                className="w-full h-full bg-white/5 backdrop-blur-sm border-2 border-white pl-12 pr-4 font-bold uppercase placeholder-white/40 outline-none focus:bg-white focus:text-blue-base transition-colors"
                            />
                        </form>
                        
                        {/* SUGGESTIONS DROPDOWN */}
                        <AnimatePresence>
                            {suggestions.length > 0 && toolSearchQuery && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-full left-0 right-0 mt-2 border-2 border-white bg-blue-base shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden"
                                >
                                    {suggestions.map((tool, i) => (
                                        <div 
                                            key={tool.id}
                                            onClick={() => { navigate(tool.path); onToolSearch(''); }}
                                            className={`flex items-center justify-between p-3 border-b border-white/20 last:border-0 cursor-pointer transition-colors group ${i === selectedIndex ? 'bg-white text-blue-base' : 'hover:bg-white hover:text-blue-base'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 w-8">{tool.number.split('/')[0]}</div>
                                                <div className="font-bold uppercase tracking-wider text-sm">{tool.title}</div>
                                            </div>
                                            <ArrowRight size={14} className={`transition-opacity ${i === selectedIndex ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        );
    }

    // Card Mode (Tool Grid) - With Quick Launch
    return (
        <div className="w-full h-full flex flex-col justify-center gap-4">
             {/* Clock & Searches - Stacked Vertically in Grid for better width */}
             <div className="flex flex-col gap-4 w-full">
                <div className="w-full h-16 flex items-center justify-center border-2 border-white font-mono text-2xl font-bold tracking-widest bg-white/5 px-6">
                    {time.toLocaleTimeString([], { hour12: false })}
                </div>
                
                <form onSubmit={handleSearch} className="w-full h-16 flex relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" size={24} />
                    <input 
                        ref={netSearchRef}
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            ensureVisible(netSearchRef);
                        }}
                        placeholder="NET SEARCH..."
                        className="w-full h-full bg-white/5 border-2 border-white pl-14 pr-4 font-bold uppercase placeholder-white/40 outline-none focus:bg-white focus:text-blue-base transition-colors text-lg"
                    />
                </form>

                <div className="w-full h-16 flex relative z-50">
                    <Terminal className="absolute left-6 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" size={24} />
                    <form onSubmit={handleToolSubmit} className="w-full h-full">
                        <input 
                            ref={toolSearchRef}
                            type="text" 
                            value={toolSearchQuery}
                            onChange={(e) => {
                                onToolSearch(e.target.value);
                                ensureVisible(toolSearchRef);
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="FIND TOOL..."
                            className="w-full h-full bg-white/5 border-2 border-white pl-14 pr-4 font-bold uppercase placeholder-white/40 outline-none focus:bg-white focus:text-blue-base transition-colors text-lg"
                        />
                    </form>
                    
                    {/* SUGGESTIONS DROPDOWN (Card Mode) */}
                    <AnimatePresence>
                        {suggestions.length > 0 && toolSearchQuery && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute top-full left-0 right-0 mt-2 border-2 border-white bg-blue-base shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden z-50"
                            >
                                {suggestions.map((tool, i) => (
                                    <div 
                                        key={tool.id}
                                        onClick={() => { navigate(tool.path); onToolSearch(''); }}
                                        className={`flex items-center justify-between p-3 border-b border-white/20 last:border-0 cursor-pointer transition-colors group ${i === selectedIndex ? 'bg-white text-blue-base' : 'hover:bg-white hover:text-blue-base'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 w-8">{tool.number.split('/')[0]}</div>
                                            <div className="font-bold uppercase tracking-wider text-sm">{tool.title}</div>
                                        </div>
                                        <ArrowRight size={14} className={`transition-opacity ${i === selectedIndex ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
             </div>

             {/* Quick Launch Speed Dial */}
             <div className="mt-4 border-t-2 border-white/20 pt-4">
                 <div className="text-xs font-bold uppercase tracking-widest opacity-60 mb-3 flex justify-between items-center">
                     <span>Quick Launch</span>
                     <span className="text-[10px]">{quickLinks.length}/4 SLOTS</span>
                 </div>
                 
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {quickLinks.slice(0, 4).map(link => (
                         <a 
                            key={link.id} 
                            href={link.url} 
                            target={linkOpenMode === 'new_tab' ? "_blank" : "_self"} 
                            rel="noopener noreferrer"
                            className="group/link relative h-16 border border-white/30 flex flex-col items-center justify-center hover:bg-white hover:text-blue-base transition-colors cursor-pointer bg-white/5"
                         >
                             <div className="font-bold uppercase text-xs tracking-wider truncate w-full text-center px-1">{link.title}</div>
                             <ExternalLink size={10} className="absolute top-2 right-2 opacity-50" />
                             <button 
                                onClick={(e) => removeQuickLink(e, link.id)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 opacity-0 group-hover/link:opacity-100 transition-opacity hover:bg-red-600 rounded-full"
                             >
                                 <X size={10} />
                             </button>
                         </a>
                     ))}
                     
                     {quickLinks.length < 4 && (
                         !isAddingLink ? (
                             <button 
                                onClick={() => setIsAddingLink(true)}
                                className="h-16 border border-dashed border-white/30 flex items-center justify-center text-white/50 hover:text-white hover:border-white transition-colors"
                             >
                                 <Plus size={20} />
                             </button>
                         ) : (
                             <form onSubmit={addQuickLink} className="col-span-1 md:col-span-1 h-full flex flex-col gap-1">
                                 <input 
                                    autoFocus
                                    value={newLinkTitle}
                                    onChange={e => setNewLinkTitle(e.target.value)}
                                    placeholder="TITLE" 
                                    className="bg-white/10 text-[10px] px-2 py-1 outline-none text-white uppercase border border-white/20"
                                    maxLength={8}
                                 />
                                 <input 
                                    value={newLinkUrl}
                                    onChange={e => setNewLinkUrl(e.target.value)}
                                    placeholder="URL" 
                                    className="bg-white/10 text-[10px] px-2 py-1 outline-none text-white border border-white/20"
                                 />
                                 <button type="submit" className="hidden">Add</button>
                             </form>
                         )
                     )}
                 </div>
             </div>
        </div>
    );
};


export const Dashboard: React.FC<DashboardProps> = ({ viewMode, onHeroIntersect, widgetPosition, greetingEnabled, greetingText, linkOpenMode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [toolSearchQuery, setToolSearchQuery] = useState('');

  useEffect(() => {
    // Use IntersectionObserver for robust visibility detection
    const observer = new IntersectionObserver(
        ([entry]) => {
            onHeroIntersect(entry.isIntersecting);
        },
        {
            root: containerRef.current,
            threshold: 0.1 
        }
    );

    if (heroRef.current) {
        observer.observe(heroRef.current);
    }

    return () => observer.disconnect();
  }, [onHeroIntersect]);

  // Filter tools based on search query
  const filteredTools = tools.filter(tool => {
      const q = toolSearchQuery.toLowerCase();
      return (
          tool.id.toLowerCase().includes(q) ||
          tool.title.toLowerCase().includes(q) ||
          tool.description.toLowerCase().includes(q) ||
          tool.category.toLowerCase().includes(q) ||
          tool.keywords?.some(k => k.toLowerCase().includes(q))
      );
  });

  return (
    <>
      <div 
        ref={containerRef}
        className={`w-full h-full overflow-x-hidden hide-scrollbar ${viewMode === ViewMode.LIST ? 'overflow-y-scroll snap-y snap-mandatory scroll-smooth' : 'overflow-y-auto'}`}
      >
        {/* HERO */}
        <section 
          ref={heroRef}
          className={`w-full relative flex flex-col items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] py-12 ${viewMode === ViewMode.LIST ? 'h-screen snap-start shrink-0' : 'min-h-[60vh] shrink-0 mb-12'}`}
        >
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-24 w-[90%] max-w-6xl mt-8"
            >
                {greetingEnabled ? (
                    <div className="flex flex-col text-center z-10">
                        <span className="font-bold uppercase leading-[0.9] text-[clamp(40px,12vw,140px)] tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-4">
                            {greetingText || 'WELCOME'}
                        </span>
                        <div className="h-1 w-32 bg-white/50 mx-auto" />
                    </div>
                ) : (
                    <>
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
                    </>
                )}
            </motion.div>

            {/* UTILITY BAR (Hero Mode) */}
            {widgetPosition === 'hero' && (
                <SystemWidget 
                    mode="hero" 
                    linkOpenMode={linkOpenMode} 
                    toolSearchQuery={toolSearchQuery}
                    onToolSearch={setToolSearchQuery}
                />
            )}
            
            <AnimatePresence>
                {viewMode === ViewMode.LIST && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] animate-pulse pointer-events-none whitespace-nowrap"
                    >
                        Scroll to Unlock Tools
                    </motion.div>
                )}
            </AnimatePresence>
        </section>

        {/* TOOLS */}
        <div className={`transition-all duration-700 ease-in-out w-full ${viewMode === ViewMode.GRID ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 md:gap-8 md:px-6 pb-24 max-w-7xl mx-auto' : ''}`}>
            
            {/* UTILITY CARD (Tool Mode) */}
            {widgetPosition === 'tool' && (
                <section 
                    className={`transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col justify-center relative
                    ${viewMode === ViewMode.LIST 
                        ? 'w-full h-screen snap-start border-b border-white/10 items-center py-20 px-4' 
                        : 'w-full h-auto min-h-[300px] md:min-h-[400px] border-4 border-white p-6 md:p-8 hover:-translate-y-2 hover:bg-white hover:text-black group cursor-default'
                    }`}
                >
                     <div className={`flex items-center justify-between gap-8 md:gap-12 max-w-6xl w-[90%] transition-all duration-700 ${viewMode === ViewMode.GRID ? 'flex-col w-full gap-6' : 'flex-col md:flex-row'}`}>
                        <div className={`flex-1 flex flex-col ${viewMode === ViewMode.GRID ? 'items-center text-center w-full' : 'items-center md:items-start md:text-left text-center'}`}>
                            <div className="font-bold uppercase tracking-widest opacity-60 mb-2 md:mb-4 text-xs md:text-base">00 / Utility</div>
                            <h2 className={`font-bold uppercase leading-none mb-4 md:mb-6 ${viewMode === ViewMode.GRID ? 'text-[24px] md:text-[32px]' : 'text-[clamp(32px,5vw,80px)]'}`}>
                                SYSTEM
                            </h2>
                             <div className="w-full max-w-md">
                                <SystemWidget 
                                    mode="card" 
                                    linkOpenMode={linkOpenMode}
                                    toolSearchQuery={toolSearchQuery}
                                    onToolSearch={setToolSearchQuery}
                                />
                             </div>
                        </div>
                    </div>
                </section>
            )}

            {filteredTools.length > 0 ? (
                filteredTools.map((tool, index) => (
                    <ToolCard key={tool.id} tool={tool} mode={viewMode} index={index} />
                ))
            ) : (
                <div className={`col-span-full py-20 text-center opacity-50 uppercase tracking-widest ${viewMode === ViewMode.LIST ? 'w-full' : ''}`}>
                    No systems found matching query.
                </div>
            )}
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
