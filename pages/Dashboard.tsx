
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useTelemetry } from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, ExternalLink, X, Terminal, ArrowRight, Zap, Wifi, Globe, LayoutGrid, Server, Cpu, Disc, MousePointer2, ArrowLeft, Target, Navigation as NavIcon, Home } from 'lucide-react';
import { ViewMode, ToolItem, WidgetPosition, QuickLink, LinkOpenMode, Theme, FluidAccent } from '../types';

// SPECIFIC ORDER REQUESTED
const tools: ToolItem[] = [
  // ROW 1
  { id: 'uplink', number: '01 / NET', category: 'NET', title: 'Uplink', description: 'Stored coordinates for external network navigation and quick access.', path: '/uplink', imageText: 'NET BRIDGE', keywords: ['internet', 'browser', 'web', 'bookmark', 'link', 'google'] },
  { id: 'notes', number: '02 / SYS', category: 'SYS', title: 'Notes', description: 'Access classified logs, personal entries, and daily observations.', path: '/notes', imageText: 'NOTES UI', keywords: ['text', 'write', 'journal', 'log', 'diary', 'editor'] },
  { id: 'tasks', number: '03 / SYS', category: 'SYS', title: 'Tasks', description: 'Manage mission objectives and daily operations with real-time tracking.', path: '/tasks', imageText: 'TASK LOG', keywords: ['todo', 'list', 'check', 'job', 'work'] },
  
  // ROW 2
  { id: 'oracle', number: '04 / AI', category: 'AI', title: 'Oracle', description: 'Secure channel to the Project Blue artificial intelligence core.', path: '/oracle', imageText: 'AI CORE', keywords: ['gemini', 'gpt', 'chat', 'bot', 'ask', 'question', 'help'] },
  { id: 'calculator', number: '05 / MATH', category: 'MATH', title: 'Calculator', description: 'Advanced computational matrix with trigonometric and exponential functions.', path: '/calculator', imageText: 'CALC', keywords: ['math', 'add', 'subtract', 'multiply', 'number', 'count'] },
  { id: 'news', number: '06 / NET', category: 'NET', title: 'Live Intel', description: 'Real-time global information streams and technology updates.', path: '/news', imageText: 'NEWS FEED', keywords: ['rss', 'world', 'info', 'current', 'tech'] },
  
  // ROW 3
  { id: 'weather', number: '07 / ENV', category: 'ENV', title: 'Atmospherics', description: 'Local meteorological data and environmental forecasting.', path: '/weather', imageText: 'WEATHER', keywords: ['atmospherics', 'atmospheric', 'weather', 'rain', 'sun', 'temp', 'forecast', 'climate', 'temperature', 'meteo'] },
  { id: 'files', number: '08 / SYS', category: 'SYS', title: 'Intel Vault', description: 'Secure vault for encoding and storing classified schematics.', path: '/files', imageText: 'VAULT', keywords: ['file', 'save', 'folder', 'document', 'upload', 'drive', 'data'] },
  { id: 'music', number: '09 / MEDIA', category: 'MEDIA', title: 'Music', description: 'System audio player and frequency management.', path: '/music', imageText: 'AUDIO', keywords: ['song', 'mp3', 'sound', 'listen', 'play', 'media'] },
  
  // ROW 4
  { id: 'whiteboard', number: '10 / TOOL', category: 'TOOL', title: 'Whiteboard', description: 'Tactical diagramming surface. Capture schematics directly to the vault.', path: '/whiteboard', imageText: 'DIAGRAM', keywords: ['draw', 'paint', 'sketch', 'image', 'art'] },
  { id: 'ide', number: '11 / DEV', category: 'DEV', title: 'Script Terminal', description: 'Client-side code execution environment. Supports interactive Python and JavaScript.', path: '/ide', imageText: 'SCRIPT EXEC', keywords: ['code', 'python', 'js', 'javascript', 'program', 'develop', 'terminal'] },
  { id: 'cipher', number: '12 / SEC', category: 'SEC', title: 'Cipher', description: 'Cryptographic translation engine for secure message encoding.', path: '/cipher', imageText: 'ENCRYPT', keywords: ['secret', 'hide', 'encode', 'decode', 'hash', 'security'] },

  // ROW 5
  { id: 'chronos', number: '13 / TOOL', category: 'TOOL', title: 'Chronos', description: 'Tactical countdown timer for operational focus intervals.', path: '/chronos', imageText: 'TIMER', keywords: ['clock', 'watch', 'stopwatch', 'alarm', 'focus'] },
  { id: 'games', number: '14 / ENT', category: 'ENT', title: 'Games', description: 'Cognitive training simulations and probability engines.', path: '/games', imageText: 'SIMULATE', keywords: ['play', 'fun', 'chess', 'arcade'] },
  { id: 'config', number: '15 / SYS', category: 'SYS', title: 'Config', description: 'Adjust system parameters, diagnostics, and security protocols.', path: '/config', imageText: 'SETUP', keywords: ['settings', 'option', 'preferences', 'theme', 'admin'] },
];

// FLUID SECTOR MAPPING
const getFluidSector = (category: string): string => {
    switch(category) {
        case 'NET':
        case 'ENV': return 'NETWORK';
        case 'SYS': 
            return 'SYSTEM';
        case 'AI':
        case 'DEV':
        case 'MATH':
        case 'SEC': return 'COMPUTE';
        case 'MEDIA':
        case 'ENT':
        case 'TOOL': return 'STUDIO';
        default: return 'SYSTEM';
    }
};

const SECTORS = ['HOME', 'NAV', 'NETWORK', 'SYSTEM', 'COMPUTE', 'STUDIO'];

const SECTOR_INFO: Record<string, { icon: React.ReactNode, desc: string }> = {
    'HOME': { icon: <LayoutGrid size={32} />, desc: 'Main Terminal' },
    'NAV': { icon: <Target size={32} />, desc: 'Sector Jump Gate' },
    'NETWORK': { icon: <Globe size={32} />, desc: 'Global Connectivity & Environment' },
    'SYSTEM': { icon: <Server size={32} />, desc: 'Core Operations & Data Storage' },
    'COMPUTE': { icon: <Cpu size={32} />, desc: 'Processing & Cryptography' },
    'STUDIO': { icon: <Disc size={32} />, desc: 'Creative Tools & Simulations' }
};

interface DashboardProps {
    viewMode: ViewMode;
    onHeroIntersect: (visible: boolean) => void;
    widgetPosition: WidgetPosition;
    greetingEnabled?: boolean;
    greetingText?: string;
    linkOpenMode: LinkOpenMode;
    theme?: Theme;
    fluidAccent?: FluidAccent;
    sidebarOpen?: boolean;
}

interface SystemWidgetProps {
    mode: 'hero' | 'card';
    linkOpenMode: LinkOpenMode;
    toolSearchQuery: string;
    onToolSearch: (query: string) => void;
}

// Reusable System Widget Component (Grid/Hero Mode)
const SystemWidget: React.FC<SystemWidgetProps> = ({ mode, linkOpenMode, toolSearchQuery, onToolSearch }) => {
    // ... (Existing SystemWidget code logic is unchanged)
    const [time, setTime] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [quickLinks, setQuickLinks] = useState<QuickLink[]>([]);
    const [isAddingLink, setIsAddingLink] = useState(false);
    const [newLinkTitle, setNewLinkTitle] = useState('');
    const [newLinkUrl, setNewLinkUrl] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const navigate = useNavigate();

    const netSearchRef = useRef<HTMLInputElement>(null);
    const toolSearchRef = useRef<HTMLInputElement>(null);

    const ensureVisible = (ref: React.RefObject<HTMLInputElement>) => {
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            const inViewport = 
                rect.top >= 80 && 
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);
            
            if (!inViewport) {
                ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    };

    const suggestions = React.useMemo(() => {
        if (!toolSearchQuery) return [];
        const q = toolSearchQuery.toLowerCase();
        return tools.filter(tool => 
            tool.id.toLowerCase().includes(q) ||
            tool.title.toLowerCase().includes(q) ||
            tool.description.toLowerCase().includes(q) ||
            tool.category.toLowerCase().includes(q) ||
            tool.keywords?.some(k => k.toLowerCase().includes(q))
        ).slice(0, 5);
    }, [toolSearchQuery]);

    useEffect(() => {
        setSelectedIndex(-1);
    }, [toolSearchQuery]);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        const saved = localStorage.getItem('blue_quick_links');
        if (saved) {
            setQuickLinks(JSON.parse(saved));
        } else {
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

    return (
        <div className="w-full h-full flex flex-col justify-center gap-4">
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


export const Dashboard: React.FC<DashboardProps> = ({ viewMode, onHeroIntersect, widgetPosition, greetingEnabled, greetingText, linkOpenMode, theme, fluidAccent = 'teal', sidebarOpen }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [toolSearchQuery, setToolSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Vanta Mode Specific
  const [currentSectorIndex, setCurrentSectorIndex] = useState(0);
  const lastScrollTime = useRef(0);
  const [vantaInput, setVantaInput] = useState('');

  // Fluid Mode Specific State
  const [time, setTime] = useState(new Date());
  const [webSearchQuery, setWebSearchQuery] = useState('');
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([]);
  const { battery, network } = useTelemetry();

  useEffect(() => {
    // Clock for Fluid/Vanta Mode
    const timer = setInterval(() => setTime(new Date()), 1000);
    // Load Quick Links
    const saved = localStorage.getItem('blue_quick_links');
    if (saved) setQuickLinks(JSON.parse(saved));

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
        ([entry]) => {
            onHeroIntersect(entry.isIntersecting);
        },
        { root: containerRef.current, threshold: 0.1 }
    );
    if (heroRef.current) observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, [onHeroIntersect]);

  // Vanta Mouse Wheel Navigation
  useEffect(() => {
      if (theme !== 'vanta') return;

      const handleWheel = (e: WheelEvent) => {
          // Disable wheel nav if user is searching to avoid confusion
          if (toolSearchQuery) return;

          const now = Date.now();
          // Throttle to prevent rapid switching
          if (now - lastScrollTime.current > 500) {
              if (Math.abs(e.deltaY) > 20) {
                  if (e.deltaY > 0) {
                      setCurrentSectorIndex(prev => (prev + 1) % SECTORS.length);
                  } else {
                      setCurrentSectorIndex(prev => (prev - 1 + SECTORS.length) % SECTORS.length);
                  }
                  lastScrollTime.current = now;
              }
          }
      };

      window.addEventListener('wheel', handleWheel);
      return () => window.removeEventListener('wheel', handleWheel);
  }, [theme, toolSearchQuery]);

  // Filter tools based on search query and theme-specific category logic
  const filteredTools = tools.filter(tool => {
      const q = toolSearchQuery.toLowerCase();
      const matchesSearch = (
          tool.id.toLowerCase().includes(q) ||
          tool.title.toLowerCase().includes(q) ||
          tool.description.toLowerCase().includes(q) ||
          tool.category.toLowerCase().includes(q) ||
          tool.keywords?.some(k => k.toLowerCase().includes(q))
      );
      
      if (theme === 'fluid') {
          if (selectedCategory === 'All') return matchesSearch;
          const sector = getFluidSector(tool.category);
          return matchesSearch && sector === selectedCategory;
      } else if (theme === 'vanta') {
          // If filtering via search box, ignore sector constraints
          if (toolSearchQuery) return matchesSearch;

          // Otherwise, filter by current carousel slide
          const currentSector = SECTORS[currentSectorIndex];
          const toolSector = getFluidSector(tool.category);
          return matchesSearch && toolSector === currentSector;
      } else {
          return matchesSearch; 
      }
  });

  const handleWebSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!webSearchQuery.trim()) return;
    window.open(`https://www.google.com/search?q=${encodeURIComponent(webSearchQuery)}`, linkOpenMode === 'new_tab' ? '_blank' : '_self');
    setWebSearchQuery('');
  };

  const handleVantaToolSearch = (e: React.FormEvent | React.KeyboardEvent) => {
      // Allow form submit or specific Enter key handling
      if ('key' in e && e.key !== 'Enter') return;
      
      e.preventDefault();
      if (!vantaInput.trim()) return;
      setToolSearchQuery(vantaInput);
  };

  const clearVantaSearch = () => {
      setToolSearchQuery('');
      setVantaInput('');
  };

  const nextSector = () => {
      setCurrentSectorIndex(prev => (prev + 1) % SECTORS.length);
  };

  const prevSector = () => {
      setCurrentSectorIndex(prev => (prev - 1 + SECTORS.length) % SECTORS.length);
  };

  // --- DYNAMIC FLUID STYLES ---
  const getFluidStyles = () => {
      const map: Record<FluidAccent, {
          titleGradient: string;
          accentText: string;
          accentTextHover: string;
          accentBg: string;
          borderFocus: string;
          blobColor: string;
          blobColor2: string;
          navActiveBg: string;
          navActiveText: string;
          navActiveBorder: string;
          iconColor: string;
          iconColorHover: string;
          iconColorActive: string;
      }> = {
          teal: {
              titleGradient: 'from-teal-200 to-white',
              accentText: 'text-teal-200',
              accentTextHover: 'group-hover:text-teal-200',
              accentBg: 'group-hover:bg-teal-500',
              borderFocus: 'focus:border-teal-500/50',
              blobColor: 'bg-teal-500/10',
              blobColor2: 'bg-blue-600/10',
              navActiveBg: 'bg-teal-500/20',
              navActiveText: 'text-teal-200',
              navActiveBorder: 'border-teal-500/30',
              iconColor: 'text-teal-400',
              iconColorHover: 'group-focus-within:text-teal-400',
              iconColorActive: 'text-teal-200'
          },
          violet: {
              titleGradient: 'from-violet-300 to-white',
              accentText: 'text-violet-300',
              accentTextHover: 'group-hover:text-violet-300',
              accentBg: 'group-hover:bg-violet-600',
              borderFocus: 'focus:border-violet-500/50',
              blobColor: 'bg-violet-500/10',
              blobColor2: 'bg-fuchsia-600/10',
              navActiveBg: 'bg-violet-500/20',
              navActiveText: 'text-violet-300',
              navActiveBorder: 'border-violet-500/30',
              iconColor: 'text-violet-400',
              iconColorHover: 'group-focus-within:text-violet-400',
              iconColorActive: 'text-violet-200'
          },
          rose: {
              titleGradient: 'from-rose-300 to-white',
              accentText: 'text-rose-300',
              accentTextHover: 'group-hover:text-rose-300',
              accentBg: 'group-hover:bg-rose-600',
              borderFocus: 'focus:border-rose-500/50',
              blobColor: 'bg-rose-500/10',
              blobColor2: 'bg-orange-600/10',
              navActiveBg: 'bg-rose-500/20',
              navActiveText: 'text-rose-300',
              navActiveBorder: 'border-rose-500/30',
              iconColor: 'text-rose-400',
              iconColorHover: 'group-focus-within:text-rose-400',
              iconColorActive: 'text-rose-200'
          },
          amber: {
              titleGradient: 'from-amber-200 to-white',
              accentText: 'text-amber-200',
              accentTextHover: 'group-hover:text-amber-200',
              accentBg: 'group-hover:bg-amber-600',
              borderFocus: 'focus:border-amber-500/50',
              blobColor: 'bg-amber-500/10',
              blobColor2: 'bg-yellow-600/10',
              navActiveBg: 'bg-amber-500/20',
              navActiveText: 'text-amber-200',
              navActiveBorder: 'border-amber-500/30',
              iconColor: 'text-amber-400',
              iconColorHover: 'group-focus-within:text-amber-400',
              iconColorActive: 'text-amber-200'
          },
          blue: {
              titleGradient: 'from-blue-300 to-white',
              accentText: 'text-blue-300',
              accentTextHover: 'group-hover:text-blue-300',
              accentBg: 'group-hover:bg-blue-600',
              borderFocus: 'focus:border-blue-500/50',
              blobColor: 'bg-blue-500/10',
              blobColor2: 'bg-indigo-600/10',
              navActiveBg: 'bg-blue-500/20',
              navActiveText: 'text-blue-300',
              navActiveBorder: 'border-blue-500/30',
              iconColor: 'text-blue-400',
              iconColorHover: 'group-focus-within:text-blue-400',
              iconColorActive: 'text-blue-200'
          }
      };
      return map[fluidAccent];
  };

  const s = getFluidStyles();
  const navigate = useNavigate();

  // --- VANTA THEME LAYOUT ---
  if (theme === 'vanta') {
      const isHomeSlide = SECTORS[currentSectorIndex] === 'HOME' && !toolSearchQuery;
      const isNavSlide = SECTORS[currentSectorIndex] === 'NAV' && !toolSearchQuery;
      const sectorInfo = SECTOR_INFO[SECTORS[currentSectorIndex]];

      // Adjusted Padding to avoid collision with Music Player (top right)
      return (
        <div className="w-full h-full bg-[#0047FF] text-white p-6 md:p-12 pt-24 relative flex flex-col font-sans selection:bg-white selection:text-[#0047FF] overflow-hidden">
           
           {/* HEADER */}
           <div className="flex justify-between items-center z-20 relative mb-8 md:mb-0">
               <div>
                   <h1 className="text-xl font-bold uppercase tracking-widest leading-none">Project Blue Beta</h1>
                   <div className="text-xs font-bold opacity-50 uppercase tracking-widest mt-1">System Version 2.7</div>
               </div>
               <div className="text-right pr-12 md:pr-20"> {/* Added Right Padding for Music Player safety */}
                   <div className="text-xl font-mono font-bold leading-none">{time.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}</div>
                   <div className="text-xs font-bold opacity-50 uppercase tracking-widest mt-1">{time.toLocaleDateString()}</div>
               </div>
           </div>

           {/* SLIDESHOW CONTENT */}
           <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full max-w-[1600px] mx-auto">
               
               <AnimatePresence mode="wait">
                   {isHomeSlide ? (
                       <motion.div 
                           key="home"
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           exit={{ opacity: 0 }}
                           transition={{ duration: 0.5 }}
                           className="flex flex-col items-center justify-center w-full gap-16"
                       >
                           <div className="text-center">
                               <div className="text-[12vw] font-bold uppercase leading-[0.8] tracking-tighter mix-blend-overlay opacity-30">PROJECT</div>
                               <div className="text-[12vw] font-bold uppercase leading-[0.8] tracking-tighter">BLUE</div>
                           </div>
                           
                           {/* Giant Side-by-Side Search */}
                           <div className="w-full max-w-6xl flex flex-col md:flex-row gap-8">
                               <form onSubmit={handleWebSearch} className="flex-1 group">
                                   <div className="relative border-b-4 border-white pb-2 flex items-center">
                                       <Search size={48} className="mr-6 opacity-60" />
                                       <input 
                                           value={webSearchQuery}
                                           onChange={e => setWebSearchQuery(e.target.value)}
                                           placeholder="WEB SEARCH"
                                           className="w-full bg-transparent outline-none text-4xl md:text-6xl font-bold uppercase placeholder-white/30"
                                           onKeyDown={(e) => e.stopPropagation()} 
                                       />
                                   </div>
                               </form>

                               <div className="flex-1 group">
                                   <div className="relative border-b-4 border-white pb-2 flex items-center">
                                       <Terminal size={48} className="mr-6 opacity-60" />
                                       <input 
                                           value={vantaInput}
                                           onChange={e => setVantaInput(e.target.value)}
                                           onKeyDown={(e) => e.key === 'Enter' && handleVantaToolSearch(e)}
                                           placeholder="TOOL SEARCH"
                                           className="w-full bg-transparent outline-none text-4xl md:text-6xl font-bold uppercase placeholder-white/30"
                                       />
                                   </div>
                                   <div className="text-xs uppercase tracking-widest opacity-50 mt-2 text-right">Press Enter to Search</div>
                               </div>
                           </div>

                           <div className="flex items-center gap-4 animate-bounce mt-8 opacity-50">
                               <MousePointer2 size={24} />
                               <span className="text-xs font-bold uppercase tracking-[0.2em]">Scroll to Navigate</span>
                           </div>
                       </motion.div>
                   ) : isNavSlide ? (
                        <motion.div 
                           key="nav"
                           initial={{ opacity: 0, scale: 0.9 }}
                           animate={{ opacity: 1, scale: 1 }}
                           exit={{ opacity: 0, scale: 1.1 }}
                           transition={{ duration: 0.4 }}
                           className="w-full h-[75vh] flex flex-col items-center justify-center"
                       >
                           <div className="mb-12 text-center relative">
                               <button 
                                    onClick={() => setCurrentSectorIndex(0)}
                                    className="absolute left-1/2 -translate-x-1/2 -top-16 opacity-50 hover:opacity-100 hover:text-blue-300 transition-all flex flex-col items-center gap-1"
                               >
                                   <Home size={24} />
                                   <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
                               </button>
                               <h2 className="text-[6vw] font-bold uppercase tracking-tighter leading-none">NAVIGATION</h2>
                               <p className="text-xl opacity-60 uppercase tracking-[0.5em] mt-2">Select Sector Jump Target</p>
                           </div>
                           
                           <div className="grid grid-cols-2 gap-8 w-full max-w-5xl">
                                {['NETWORK', 'SYSTEM', 'COMPUTE', 'STUDIO'].map((sector) => (
                                    <button 
                                        key={sector}
                                        onClick={() => setCurrentSectorIndex(SECTORS.indexOf(sector))}
                                        className="group relative bg-white/5 border-2 border-white/20 hover:border-white p-8 md:p-12 flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:bg-white hover:text-blue-base"
                                    >
                                        <div className="p-4 border-2 border-current rounded-full mb-2">
                                            {SECTOR_INFO[sector]?.icon}
                                        </div>
                                        <div className="text-3xl font-bold uppercase tracking-widest">{sector}</div>
                                        <div className="opacity-60 text-xs font-mono group-hover:opacity-100">{SECTOR_INFO[sector]?.desc}</div>
                                    </button>
                                ))}
                           </div>
                       </motion.div>
                   ) : (
                       <motion.div
                           key={toolSearchQuery ? 'search' : currentSectorIndex}
                           initial={{ opacity: 0, x: 100 }}
                           animate={{ opacity: 1, x: 0 }}
                           exit={{ opacity: 0, x: -100 }}
                           transition={{ duration: 0.4, ease: "easeOut" }}
                           className="w-full flex flex-col md:flex-row gap-8 lg:gap-12 h-[85vh]"
                       >
                           {/* Left: Sector Title & Info (30% on desktop) */}
                           <div className="md:w-[30%] flex flex-col justify-center items-start md:border-l-8 md:border-white md:pl-8 lg:pl-12 flex-shrink-0">
                               <div className="mb-4 text-sm font-bold uppercase tracking-[0.2em] opacity-60 flex items-center gap-4">
                                   {toolSearchQuery ? (
                                       <button onClick={clearVantaSearch} className="flex items-center gap-2 hover:text-white/80 transition-colors">
                                           <ArrowLeft size={16} /> BACK TO SECTORS
                                       </button>
                                   ) : (
                                       <>
                                           <button 
                                                onClick={() => setCurrentSectorIndex(0)}
                                                className="hover:text-blue-300 transition-colors"
                                                title="Return Home"
                                           >
                                                <Home size={18} />
                                           </button>
                                           <div className="h-4 w-px bg-white/30" />
                                           <span>Sector {String(currentSectorIndex).padStart(2, '0')}</span>
                                           <span className="w-12 h-0.5 bg-white/50"></span>
                                           <span>{String(SECTORS.length - 1).padStart(2, '0')}</span>
                                       </>
                                   )}
                               </div>
                               
                               <h2 className="text-[10vw] md:text-[6vw] font-bold uppercase leading-[0.8] tracking-tighter mb-8 break-words w-full">
                                   {toolSearchQuery ? 'SEARCH RESULTS' : SECTORS[currentSectorIndex]}
                               </h2>

                               {!toolSearchQuery && (
                                   <div className="flex items-center gap-6 opacity-80 mt-auto">
                                       <div className="p-4 border-2 border-white rounded-full">
                                           {sectorInfo?.icon}
                                       </div>
                                       <div className="text-xl lg:text-2xl font-light uppercase tracking-wider max-w-md leading-tight">
                                           {sectorInfo?.desc}
                                       </div>
                                   </div>
                               )}
                           </div>

                           {/* Right: Tool Grid */}
                           <div className="flex-1 overflow-y-auto hide-scrollbar border-t-2 border-white/20 md:border-t-0 pt-8 md:pt-0 h-full">
                               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full min-h-full" style={{ gridAutoRows: 'minmax(200px, 1fr)' }}>
                                   {filteredTools.map((tool) => (
                                       <div 
                                            key={tool.id} 
                                            className="relative h-full bg-white p-[2px] cursor-pointer group transition-transform duration-300 hover:-translate-y-1"
                                            style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 30px), calc(100% - 30px) 100%, 0 100%)' }}
                                            onClick={() => navigate(tool.path)}
                                       >
                                           <div 
                                                className="h-full w-full bg-[#0047FF] hover:bg-white hover:text-[#0047FF] transition-colors p-6 flex flex-col justify-between"
                                                style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 30px), calc(100% - 30px) 100%, 0 100%)' }}
                                           >
                                               <div className="flex justify-between items-start mb-2">
                                                   <span className="text-[10px] font-bold uppercase opacity-50 group-hover:opacity-100 border border-current px-2 py-0.5 rounded-full">{tool.number.split('/')[0]}</span>
                                                   <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity -rotate-45 group-hover:rotate-0" />
                                               </div>
                                               
                                               <div>
                                                   <h3 className="text-3xl font-black uppercase tracking-tighter leading-none mb-4 truncate">{tool.title}</h3>
                                                   <p className="text-xs font-mono opacity-60 leading-relaxed group-hover:opacity-100 line-clamp-3">
                                                       {tool.description}
                                                   </p>
                                               </div>
                                           </div>
                                       </div>
                                   ))}
                                   
                                   {filteredTools.length === 0 && (
                                       <div className="col-span-full w-full py-20 text-center border-2 border-dashed border-white/20 opacity-50 uppercase font-bold tracking-widest rounded-lg flex flex-col items-center justify-center">
                                           <div className="text-4xl mb-4">ø</div>
                                           No modules found
                                       </div>
                                   )}
                               </div>
                           </div>
                       </motion.div>
                   )}
               </AnimatePresence>

           </div>
           
           {/* Background Watermark */}
           <div className="fixed bottom-[-5vw] left-[-2vw] text-[25vw] font-bold leading-none text-white opacity-[0.03] pointer-events-none select-none z-0 tracking-tighter">
               {isHomeSlide ? 'BETA' : SECTORS[currentSectorIndex]}
           </div>
        </div>
      );
  }

  // --- FLUID THEME LAYOUT ---
  if (theme === 'fluid') {
      return (
          <div className="w-full h-full flex bg-[url('https://www.transparenttextures.com/patterns/noise.png')] relative overflow-hidden">
             
             {/* LEFT SIDEBAR ("COMMAND DECK") */}
             <aside className={`
                fixed inset-y-0 left-0 z-50 w-80 bg-slate-900/90 backdrop-blur-xl border-r border-white/10 p-8 flex flex-col gap-6 transition-transform duration-300 ease-out
                md:relative md:translate-x-0
                ${sidebarOpen ? 'translate-x-0 shadow-[0_0_50px_rgba(0,0,0,0.5)]' : '-translate-x-full'}
             `}>
                 {/* Header */}
                 <div className="pt-8">
                     <h1 className={`text-3xl font-bold tracking-tighter leading-none mb-1 text-transparent bg-clip-text bg-gradient-to-r ${s.titleGradient}`}>
                         {greetingEnabled ? greetingText : 'PROJECT BLUE'}
                     </h1>
                     <div className={`h-1 w-12 rounded-full mt-2 ${s.iconColor.replace('text-', 'bg-')}`} />
                 </div>

                 {/* System Status Block */}
                 <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3">
                     <div className={`text-[10px] font-bold uppercase tracking-widest opacity-50 ${s.accentText}`}>System Telemetry</div>
                     <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                             <Wifi size={16} className={network === 'OFFLINE' ? 'text-red-400' : s.iconColor} />
                             <span className="font-mono text-xs font-bold">{network}</span>
                         </div>
                         <div className="flex items-center gap-2">
                             <Zap size={16} className={battery && battery.charging ? 'text-yellow-400' : s.iconColor} />
                             <span className="font-mono text-xs font-bold">{battery ? `${battery.level}%` : '---'}</span>
                         </div>
                     </div>
                 </div>
                 
                 {/* CATEGORY NAVIGATION */}
                 <div className="flex-1 flex flex-col min-h-0 py-4">
                     <div className={`text-[10px] font-bold uppercase tracking-widest opacity-50 mb-4 px-2 ${s.accentText}`}>Sectors</div>
                     <nav className="space-y-2 flex-1 overflow-y-auto hide-scrollbar">
                         <button 
                             onClick={() => setSelectedCategory('All')}
                             className={`w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center gap-3 group ${selectedCategory === 'All' ? `${s.navActiveBg} ${s.navActiveText} ${s.navActiveBorder}` : 'border-transparent text-white/60 hover:bg-white/5 hover:text-white'}`}
                         >
                             <LayoutGrid size={16} />
                             <span className="text-xs font-bold uppercase tracking-wider">All Modules</span>
                         </button>

                         <button 
                             onClick={() => setSelectedCategory('NETWORK')}
                             className={`w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center gap-3 group ${selectedCategory === 'NETWORK' ? `${s.navActiveBg} ${s.navActiveText} ${s.navActiveBorder}` : 'border-transparent text-white/60 hover:bg-white/5 hover:text-white'}`}
                         >
                             <Globe size={16} />
                             <span className="text-xs font-bold uppercase tracking-wider">Network</span>
                         </button>

                         <button 
                             onClick={() => setSelectedCategory('SYSTEM')}
                             className={`w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center gap-3 group ${selectedCategory === 'SYSTEM' ? `${s.navActiveBg} ${s.navActiveText} ${s.navActiveBorder}` : 'border-transparent text-white/60 hover:bg-white/5 hover:text-white'}`}
                         >
                             <Server size={16} />
                             <span className="text-xs font-bold uppercase tracking-wider">System</span>
                         </button>

                         <button 
                             onClick={() => setSelectedCategory('COMPUTE')}
                             className={`w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center gap-3 group ${selectedCategory === 'COMPUTE' ? `${s.navActiveBg} ${s.navActiveText} ${s.navActiveBorder}` : 'border-transparent text-white/60 hover:bg-white/5 hover:text-white'}`}
                         >
                             <Cpu size={16} />
                             <span className="text-xs font-bold uppercase tracking-wider">Compute</span>
                         </button>

                         <button 
                             onClick={() => setSelectedCategory('STUDIO')}
                             className={`w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center gap-3 group ${selectedCategory === 'STUDIO' ? `${s.navActiveBg} ${s.navActiveText} ${s.navActiveBorder}` : 'border-transparent text-white/60 hover:bg-white/5 hover:text-white'}`}
                         >
                             <Disc size={16} />
                             <span className="text-xs font-bold uppercase tracking-wider">Studio</span>
                         </button>
                     </nav>
                 </div>

                 {/* Quick Actions Footer */}
                 <div>
                    <div className={`text-[10px] font-bold uppercase tracking-widest opacity-50 mb-3 px-2 ${s.accentText}`}>Quick Actions</div>
                    <div className="grid grid-cols-2 gap-2">
                        <button 
                             onClick={() => navigate('/tasks')}
                             className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded border border-white/5 text-[10px] font-bold uppercase text-white/70 hover:text-white transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus size={12} /> Task
                        </button>
                        <button 
                             onClick={() => navigate('/notes')}
                             className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded border border-white/5 text-[10px] font-bold uppercase text-white/70 hover:text-white transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus size={12} /> Note
                        </button>
                    </div>
                 </div>
             </aside>

             {/* MAIN CONTENT AREA */}
             <main className="flex-1 overflow-y-auto relative h-full">
                 {/* Decorative Background Blobs */}
                 <div className={`absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none ${s.blobColor}`} />
                 <div className={`absolute bottom-[-10%] left-[10%] w-[500px] h-[500px] rounded-full blur-[100px] pointer-events-none ${s.blobColor2}`} />

                 <div className="relative z-10 p-6 md:p-12 max-w-7xl mx-auto flex flex-col gap-12 pt-20 md:pt-12">
                     
                     {/* FLUID HEADER: CLOCK & SEARCH */}
                     <div className="flex flex-col gap-8">
                         <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/10 pb-8">
                             {/* Massive Clock */}
                             <div>
                                 <div className="text-[clamp(60px,10vw,120px)] font-bold tracking-tighter leading-none text-white/90 font-sans">
                                     {time.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                                 </div>
                                 <div className={`text-xl md:text-2xl font-light uppercase tracking-widest mt-2 opacity-60 ${s.accentText}`}>
                                     {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                                 </div>
                             </div>

                             {/* Main Search Inputs */}
                             <div className="w-full md:w-[450px] flex flex-col gap-4">
                                 {/* Web Search */}
                                 <form onSubmit={handleWebSearch} className="relative group">
                                     <Search className={`absolute left-4 top-1/2 -translate-y-1/2 opacity-50 transition-colors ${s.iconColorHover}`} size={20} />
                                     <input 
                                         value={webSearchQuery}
                                         onChange={e => setWebSearchQuery(e.target.value)}
                                         placeholder="SEARCH THE WEB..."
                                         className={`w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-white/20 outline-none focus:bg-white/10 transition-all font-medium ${s.borderFocus}`}
                                     />
                                 </form>
                                 {/* Tool Filter */}
                                 <div className="relative group">
                                     <Terminal className={`absolute left-4 top-1/2 -translate-y-1/2 opacity-50 transition-colors ${s.iconColorHover}`} size={20} />
                                     <input 
                                         value={toolSearchQuery}
                                         onChange={e => setToolSearchQuery(e.target.value)}
                                         placeholder="FILTER SYSTEM MODULES..."
                                         className={`w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-white/20 outline-none focus:bg-white/10 transition-all font-medium ${s.borderFocus}`}
                                     />
                                 </div>
                             </div>
                         </div>
                     </div>

                     {/* TOOL GRID */}
                     <div>
                         <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <h2 className="text-xl font-light tracking-wide text-white/80">
                                    {selectedCategory} <span className="opacity-30 mx-2">//</span> <span className={`font-bold uppercase ${s.accentText}`}>Modules</span>
                                </h2>
                            </div>
                            <div className="text-xs font-mono opacity-40 bg-white/5 px-2 py-1 rounded">{filteredTools.length} ACTIVE</div>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                             {filteredTools.map(tool => (
                                 <Link 
                                    key={tool.id} 
                                    to={tool.path}
                                    className={`group relative overflow-hidden rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col`}
                                 >
                                     <div className="p-6 h-full flex flex-col relative z-10">
                                         <div className="flex justify-between items-start mb-4">
                                             <div className={`p-3 bg-white/5 rounded-xl shadow-inner transition-colors group-hover:text-white ${s.accentText} ${s.accentBg}`}>
                                                 <ArrowRight size={20} className="-rotate-45 group-hover:rotate-0 transition-transform" />
                                             </div>
                                             <span className="text-[10px] font-bold uppercase tracking-widest opacity-30 bg-black/20 px-2 py-1 rounded">{tool.category}</span>
                                         </div>
                                         
                                         <h3 className={`text-xl font-bold mb-2 transition-colors ${s.accentTextHover}`}>{tool.title}</h3>
                                         <p className="text-sm text-white/50 leading-relaxed mb-8 line-clamp-2 group-hover:text-white/70 transition-colors">
                                             {tool.description}
                                         </p>
                                         
                                         <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center text-xs font-mono opacity-50">
                                             <span>ID: {tool.id.toUpperCase()}</span>
                                             <span className={`group-hover:translate-x-1 transition-transform ${s.accentText}`}>LAUNCH &rarr;</span>
                                         </div>
                                     </div>
                                     {/* Hover Gradient - subtle white */}
                                     <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                 </Link>
                             ))}
                             {filteredTools.length === 0 && (
                                 <div className="col-span-full py-20 text-center opacity-30 uppercase tracking-widest border-2 border-dashed border-white/10 rounded-2xl">
                                     No modules found in {selectedCategory}.
                                 </div>
                             )}
                         </div>
                     </div>
                 </div>
             </main>
          </div>
      );
  }

  // --- STANDARD LAYOUT ---
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
                            <div className="font-bold uppercase tracking-widest opacity-60 mb-2 md:mb-4 text-xs md:text-base">00 / SYS</div>
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
