
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Trash2, Maximize2, Type, FileText, Upload, AlertTriangle, Eye, EyeOff, Minus, ArrowLeft, X, ChevronLeft, ChevronRight, Settings, Columns, Smartphone } from 'lucide-react';
import { ReaderDocument } from '../types';

const MAX_STORAGE_LIMIT = 4.5 * 1024 * 1024; // ~4.5MB limit for local storage text

export const Reader: React.FC = () => {
    const [docs, setDocs] = useState<ReaderDocument[]>([]);
    const [activeDoc, setActiveDoc] = useState<ReaderDocument | null>(null);
    const [isReading, setIsReading] = useState(false);
    
    // Processing State
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reader Settings
    const [fontSize, setFontSize] = useState(18);
    const [lineHeight, setLineHeight] = useState(1.6);
    const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'mono'>('sans');
    const [currentPage, setCurrentPage] = useState(0);
    const [pages, setPages] = useState<string[]>([]);
    const [showSettings, setShowSettings] = useState(false);
    const [readingMode, setReadingMode] = useState<'single' | 'double'>('single');

    useEffect(() => {
        const saved = localStorage.getItem('blue_reader_docs');
        if (saved) setDocs(JSON.parse(saved));
        
        const settings = localStorage.getItem('blue_reader_settings');
        if (settings) {
            const parsed = JSON.parse(settings);
            setFontSize(parsed.fontSize || 18);
            setLineHeight(parsed.lineHeight || 1.6);
            setFontFamily(parsed.fontFamily || 'sans');
            setReadingMode(parsed.readingMode || 'single');
        }
    }, []);

    const saveDocs = (updated: ReaderDocument[]) => {
        try {
            const json = JSON.stringify(updated);
            if (json.length > MAX_STORAGE_LIMIT) throw new Error("Storage Limit Exceeded");
            localStorage.setItem('blue_reader_docs', json);
            setDocs(updated);
            setError(null);
        } catch (e) {
            setError("STORAGE FULL. DELETE OLD BOOKS.");
        }
    };

    const saveSettings = () => {
        localStorage.setItem('blue_reader_settings', JSON.stringify({ fontSize, lineHeight, fontFamily, readingMode }));
    };

    useEffect(() => {
        saveSettings();
    }, [fontSize, lineHeight, fontFamily, readingMode]);

    // --- TEXT EXTRACTION ENGINE ---
    const extractTextFromPdf = async (arrayBuffer: ArrayBuffer): Promise<string> => {
        // @ts-ignore
        if (!window.pdfjsLib) throw new Error("PDF Engine Offline");
        
        // @ts-ignore
        const pdf = await window.pdfjsLib.getDocument(arrayBuffer).promise;
        let fullText = "";
        
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const strings = content.items.map((item: any) => item.str);
            // Clean extraction without massive headers
            fullText += `\n` + strings.join(' ');
        }
        return fullText;
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        setError(null);

        const reader = new FileReader();
        
        reader.onload = async (ev) => {
            try {
                let content = "";
                
                if (file.type === 'application/pdf') {
                    content = await extractTextFromPdf(ev.target?.result as ArrayBuffer);
                } else {
                    content = ev.target?.result as string;
                }

                if (!content || content.trim().length < 10) {
                    throw new Error("No readable text found. Document may be an image scan.");
                }

                const newDoc: ReaderDocument = {
                    id: Date.now().toString(),
                    title: file.name.replace(/\.[^/.]+$/, "").toUpperCase(),
                    type: 'txt', // We convert everything to text now
                    content: content,
                    addedAt: new Date().toLocaleDateString(),
                    progress: 0,
                    size: content.length
                };
                
                saveDocs([...docs, newDoc]);
                setIsProcessing(false);
            } catch (err: any) {
                console.error(err);
                setError(err.message || "EXTRACTION FAILED");
                setIsProcessing(false);
            }
        };

        if (file.type === 'application/pdf') {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsText(file);
        }
    };

    const deleteDoc = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const updated = docs.filter(d => d.id !== id);
        saveDocs(updated);
        if (activeDoc?.id === id) closeReader();
    };

    // --- PAGINATION LOGIC ---
    const paginateContent = (text: string) => {
        // Character limit per page approx
        const CHARS_PER_PAGE = 1800; 
        const paragraphs = text.split('\n');
        const pagesArr: string[] = [];
        let currentPageText = "";
        
        paragraphs.forEach(para => {
            // Clean up extra whitespace
            const cleanPara = para.trim();
            if (!cleanPara) return;

            if ((currentPageText.length + cleanPara.length) > CHARS_PER_PAGE) {
                pagesArr.push(currentPageText);
                currentPageText = cleanPara + "\n\n";
            } else {
                currentPageText += cleanPara + "\n\n";
            }
        });
        if (currentPageText) pagesArr.push(currentPageText);
        
        return pagesArr.length > 0 ? pagesArr : ["(Empty Document)"];
    };

    const openReader = (doc: ReaderDocument) => {
        const paginated = paginateContent(doc.content);
        setPages(paginated);
        setCurrentPage(0); 
        setActiveDoc(doc);
        setIsReading(true);
    };

    const closeReader = () => {
        setIsReading(false);
        setActiveDoc(null);
    };

    const nextPage = () => {
        const step = readingMode === 'double' ? 2 : 1;
        setCurrentPage(p => Math.min(pages.length - 1, p + step));
    };

    const prevPage = () => {
        const step = readingMode === 'double' ? 2 : 1;
        setCurrentPage(p => Math.max(0, p - step));
    };

    return (
        <div className="w-full h-full pt-24 px-4 md:px-12 pb-12 max-w-7xl mx-auto flex flex-col">
            {/* Header */}
            {!isReading && (
                <div className="flex justify-between items-end mb-8 border-b-2 border-white pb-6">
                    <div>
                        <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter mb-2">Reader</h1>
                        <p className="text-sm md:text-base uppercase tracking-widest opacity-70">Document Extraction & Analysis</p>
                    </div>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                        className={`flex items-center gap-2 border-2 border-white px-4 py-2 font-bold uppercase hover:bg-white hover:text-blue-base transition-all text-xs tracking-widest ${isProcessing ? 'opacity-50 cursor-wait' : ''}`}
                    >
                        {isProcessing ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"/> : <Plus size={16} />}
                        {isProcessing ? 'EXTRACTING...' : 'IMPORT DOC'}
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.md,.txt,.json" onChange={handleFileUpload} />
                </div>
            )}

            {error && (
                <div className="mb-6 bg-red-500/20 border border-red-500 p-4 flex items-center gap-3 text-red-200 uppercase font-bold tracking-wider">
                    <AlertTriangle size={20} /> {error}
                    <button onClick={() => setError(null)} className="ml-auto hover:text-white"><X size={16} /></button>
                </div>
            )}

            {/* Library Grid */}
            {!isReading ? (
                <div className="flex-1 overflow-y-auto hide-scrollbar">
                    {docs.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center opacity-30 border-2 border-dashed border-white/20 rounded-lg">
                            <BookOpen size={48} strokeWidth={1} className="mb-4" />
                            <div className="uppercase tracking-widest font-bold">Library Empty</div>
                            <div className="text-xs mt-2">Import PDF or Text Files</div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {docs.map(doc => (
                                <motion.div 
                                    key={doc.id}
                                    layout
                                    onClick={() => openReader(doc)}
                                    className="group relative aspect-[3/4] border-2 border-white bg-black/20 cursor-pointer hover:border-blue-400 hover:-translate-y-1 transition-all flex flex-col"
                                >
                                    {/* Cover Mockup */}
                                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-white/5 group-hover:bg-white/10 transition-colors relative overflow-hidden">
                                        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(45deg, #ffffff 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                                        <FileText size={48} strokeWidth={1} />
                                        <div className="mt-4 font-bold uppercase tracking-widest text-sm line-clamp-3 leading-tight">{doc.title}</div>
                                        <div className="text-[10px] font-mono opacity-50 mt-2">TEXT DATA</div>
                                    </div>
                                    
                                    {/* Footer */}
                                    <div className="p-3 border-t-2 border-white/20 bg-black/40 flex justify-between items-center">
                                        <div className="text-[10px] font-mono opacity-50">{doc.addedAt}</div>
                                        <button onClick={(e) => deleteDoc(e, doc.id)} className="hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* Reader Interface */
                <div className="flex-1 flex flex-col h-full overflow-hidden border-4 border-white relative transition-colors duration-500" 
                     style={{ 
                         backgroundColor: '#0047FF',
                         backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                         backgroundSize: '40px 40px'
                     }}
                >
                    
                    {/* Reader Toolbar */}
                    <div className="h-14 border-b-2 border-white bg-black/20 backdrop-blur-md flex items-center justify-between px-4 shrink-0 z-20">
                        <div className="flex items-center gap-4 min-w-0">
                            <button onClick={closeReader} className="hover:text-white/80 transition-colors"><ArrowLeft size={20} /></button>
                            <div className="font-bold uppercase tracking-wider truncate text-sm">{activeDoc?.title}</div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex bg-white/10 rounded-lg p-1 gap-1">
                                <button 
                                    onClick={() => setReadingMode('single')}
                                    className={`p-1 rounded ${readingMode === 'single' ? 'bg-white text-blue-base' : 'hover:bg-white/20'}`}
                                    title="Single Page"
                                >
                                    <Smartphone size={14} />
                                </button>
                                <button 
                                    onClick={() => setReadingMode('double')}
                                    className={`p-1 rounded ${readingMode === 'double' ? 'bg-white text-blue-base' : 'hover:bg-white/20'}`}
                                    title="Spread View"
                                >
                                    <Columns size={14} />
                                </button>
                            </div>

                            <div className="text-xs font-mono opacity-80 hidden md:block border px-2 py-1 bg-black/40">
                                PAGE {currentPage + 1}{readingMode === 'double' && pages[currentPage+1] ? `-${currentPage + 2}` : ''} / {pages.length}
                            </div>
                            <button 
                                onClick={() => setShowSettings(!showSettings)} 
                                className={`p-2 transition-colors ${showSettings ? 'bg-white text-blue-base' : 'hover:bg-white/20'}`}
                            >
                                <Settings size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Settings Panel */}
                    <AnimatePresence>
                        {showSettings && (
                            <motion.div 
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="absolute top-14 right-0 z-30 bg-black/90 border-l-2 border-b-2 border-white p-6 w-64 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
                            >
                                <div className="space-y-6">
                                    <div>
                                        <div className="text-[10px] font-bold uppercase opacity-50 mb-2">Typography</div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setFontFamily('sans')} className={`flex-1 border p-1 text-xs uppercase ${fontFamily === 'sans' ? 'bg-white text-black' : 'border-white/30'}`}>Sans</button>
                                            <button onClick={() => setFontFamily('serif')} className={`flex-1 border p-1 text-xs uppercase font-serif ${fontFamily === 'serif' ? 'bg-white text-black' : 'border-white/30'}`}>Serif</button>
                                            <button onClick={() => setFontFamily('mono')} className={`flex-1 border p-1 text-xs uppercase font-mono ${fontFamily === 'mono' ? 'bg-white text-black' : 'border-white/30'}`}>Mono</button>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold uppercase opacity-50 mb-2">Size: {fontSize}px</div>
                                        <input 
                                            type="range" min="14" max="32" step="2" 
                                            value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))}
                                            className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold uppercase opacity-50 mb-2">Spacing</div>
                                        <input 
                                            type="range" min="1.4" max="2.4" step="0.1" 
                                            value={lineHeight} onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                                            className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Content View (Book Mode) */}
                    <div className="flex-1 overflow-hidden relative flex flex-col">
                        <div 
                            className="flex-1 overflow-y-auto custom-scrollbar relative"
                            onClick={(e) => {
                                const w = e.currentTarget.offsetWidth;
                                if (e.nativeEvent.offsetX < w * 0.2) prevPage();
                                else if (e.nativeEvent.offsetX > w * 0.8) nextPage();
                            }}
                        >
                            {/* Updated Max Width Logic here */}
                            <div className={`mx-auto py-8 md:py-12 min-h-full flex items-stretch gap-8 px-4 md:px-12 ${readingMode === 'double' ? 'max-w-7xl' : 'max-w-5xl'}`}>
                                {/* Left Page */}
                                <motion.div
                                    key={`p-${currentPage}`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className={`flex-1 bg-black/20 backdrop-blur-sm border-2 border-white/10 p-8 md:p-12 shadow-2xl whitespace-pre-wrap ${
                                        fontFamily === 'mono' ? 'font-mono' : fontFamily === 'serif' ? 'font-serif' : 'font-sans'
                                    }`}
                                    style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight, textAlign: 'justify' }}
                                >
                                    {pages[currentPage]}
                                </motion.div>

                                {/* Right Page (Double Mode) */}
                                {readingMode === 'double' && pages[currentPage + 1] && (
                                    <motion.div
                                        key={`p-${currentPage+1}`}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className={`hidden lg:block flex-1 bg-black/20 backdrop-blur-sm border-2 border-white/10 p-8 md:p-12 shadow-2xl whitespace-pre-wrap ${
                                            fontFamily === 'mono' ? 'font-mono' : fontFamily === 'serif' ? 'font-serif' : 'font-sans'
                                        }`}
                                        style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight, textAlign: 'justify' }}
                                    >
                                        {pages[currentPage + 1]}
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        {/* Navigation Footer */}
                        <div className="h-16 border-t-2 border-white/20 flex items-center justify-between px-8 bg-black/40 backdrop-blur shrink-0">
                            <button 
                                onClick={prevPage} 
                                disabled={currentPage === 0}
                                className="flex items-center gap-2 text-xs font-bold uppercase hover:text-blue-300 disabled:opacity-30 disabled:hover:text-white transition-colors"
                            >
                                <ChevronLeft size={16} /> Prev
                            </button>
                            
                            <div className="w-full max-w-md mx-8 h-1 bg-white/10 rounded-full overflow-hidden hidden md:block">
                                <motion.div 
                                    className="h-full bg-white" 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${((currentPage + (readingMode === 'double' ? 2 : 1)) / pages.length) * 100}%` }}
                                />
                            </div>

                            <button 
                                onClick={nextPage} 
                                disabled={currentPage >= pages.length - (readingMode === 'double' ? 2 : 1)}
                                className="flex items-center gap-2 text-xs font-bold uppercase hover:text-blue-300 disabled:opacity-30 disabled:hover:text-white transition-colors"
                            >
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
