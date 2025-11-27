
import * as React from 'react';
import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { motion } from 'framer-motion';
import { PenTool, Eraser, Trash2, Save, Undo, GripHorizontal, Square } from 'lucide-react';
import { FileItem } from '../types';

const COLORS = [
    { id: 'white', hex: '#FFFFFF' },
    { id: 'red', hex: '#EF4444' },    // Hostile
    { id: 'green', hex: '#10B981' },  // Friendly
    { id: 'yellow', hex: '#F59E0B' }, // Objective
];

const STROKE_WIDTHS = [2, 4, 6, 8, 12, 16, 24, 32];

export const Whiteboard: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Use refs for mutable drawing state to avoid re-renders during 60fps draw cycles
    const isDrawing = useRef(false);
    const lastPos = useRef<{ x: number, y: number } | null>(null);

    const [color, setColor] = useState(COLORS[0].hex);
    const [lineWidth, setLineWidth] = useState(4);
    const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
    const [message, setMessage] = useState<string | null>(null);

    // --- INITIALIZATION & SIZING ---
    const updateSize = () => {
        if (!containerRef.current || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();

        // High DPI support
        const dpr = window.devicePixelRatio || 1;
        
        // Only update if dimensions changed to avoid clearing canvas unnecessarily
        if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
            // Save current content
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            if (tempCtx) tempCtx.drawImage(canvas, 0, 0);

            // Resize
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;

            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.scale(dpr, dpr);
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                // Restore content (stretched if needed, or centred)
                ctx.drawImage(tempCanvas, 0, 0, rect.width, rect.height);
            }
        }
    };

    useLayoutEffect(() => {
        updateSize();
        // Observer for robust resizing (handles flexbox animations)
        const observer = new ResizeObserver(() => {
            updateSize();
        });
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }
        return () => observer.disconnect();
    }, []);

    // --- DRAWING LOGIC ---
    const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const rect = canvasRef.current.getBoundingClientRect();
        
        let clientX, clientY;
        // @ts-ignore
        if (e.touches && e.touches.length > 0) {
            // @ts-ignore
            clientX = e.touches[0].clientX;
            // @ts-ignore
            clientY = e.touches[0].clientY;
        } else if ((e as React.TouchEvent).changedTouches && (e as React.TouchEvent).changedTouches.length > 0) {
             // @ts-ignore
             clientX = (e as React.TouchEvent).changedTouches[0].clientX;
             // @ts-ignore
             clientY = (e as React.TouchEvent).changedTouches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        isDrawing.current = true;
        const coords = getCoordinates(e);
        lastPos.current = coords;
        
        // Draw a single dot
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.beginPath();
            ctx.fillStyle = tool === 'eraser' ? '#0047FF' : color;
            // For eraser on a simple canvas, we paint background color
            // If using transparency, we'd use globalCompositeOperation
            ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
            
            ctx.arc(coords.x, coords.y, lineWidth / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing.current || !lastPos.current || !canvasRef.current) return;
        
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        const currentPos = getCoordinates(e);

        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(currentPos.x, currentPos.y);
        
        ctx.strokeStyle = tool === 'eraser' ? '#0047FF' : color;
        ctx.lineWidth = lineWidth;
        ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
        
        ctx.stroke();

        lastPos.current = currentPos;
    };

    const stopDrawing = () => {
        isDrawing.current = false;
        lastPos.current = null;
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height); // clear for transparency
        }
    };

    const saveToVault = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        try {
            // Composite with Blue Background for JPG capture
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tCtx = tempCanvas.getContext('2d');
            if (!tCtx) return;

            // Fill Background
            tCtx.fillStyle = '#0047FF';
            tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            // Draw Content
            tCtx.drawImage(canvas, 0, 0);

            const base64 = tempCanvas.toDataURL('image/jpeg', 0.8);
            
            const savedFiles = localStorage.getItem('blue_files');
            const files: FileItem[] = savedFiles ? JSON.parse(savedFiles) : [];
            
            const newFile: FileItem = {
                id: Date.now().toString(),
                name: `TAC_MAP_${new Date().toLocaleTimeString().replace(/:/g,'')}.jpg`,
                type: 'image/jpeg',
                data: base64,
                size: base64.length,
                date: new Date().toLocaleDateString()
            };

            const newTotal = JSON.stringify([...files, newFile]).length;
            if (newTotal > 4.5 * 1024 * 1024) {
                setMessage("VAULT FULL. DELETE FILES.");
            } else {
                localStorage.setItem('blue_files', JSON.stringify([...files, newFile]));
                setMessage("DIAGRAM SECURED IN INTEL VAULT.");
            }
        } catch (e) {
            setMessage("ERROR SAVING SCHEMATIC.");
        }

        setTimeout(() => setMessage(null), 3000);
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="w-full h-full pt-24 px-4 md:px-12 pb-12 max-w-7xl mx-auto flex flex-col"
        >
            {/* Header */}
            <div className="flex justify-between items-end mb-4 border-b-2 border-white pb-6 gap-6">
                <div>
                    <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter mb-2">Whiteboard</h1>
                    <p className="text-sm md:text-base uppercase tracking-widest opacity-70">Tactical Diagramming Surface</p>
                </div>
                
                <button 
                    onClick={saveToVault}
                    className="flex items-center gap-2 border-2 border-white px-4 py-2 font-bold uppercase hover:bg-white hover:text-blue-base transition-colors text-xs tracking-widest"
                >
                    <Save size={16} /> Capture
                </button>
            </div>

            {/* Toolbar & Canvas */}
            <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
                
                {/* Tools Sidebar */}
                <div className="w-full md:w-20 flex flex-row md:flex-col gap-4 items-center justify-between md:justify-start border-2 border-white p-2 md:py-4 bg-black/20 shrink-0 overflow-x-auto md:overflow-y-auto hide-scrollbar">
                    
                    {/* Brush/Eraser */}
                    <div className="flex flex-row md:flex-col gap-2 shrink-0">
                        <button 
                            onClick={() => setTool('pen')}
                            className={`p-3 border transition-colors ${tool === 'pen' ? 'bg-white text-blue-base border-white' : 'border-transparent text-white hover:bg-white/10'}`}
                        >
                            <PenTool size={20} />
                        </button>
                        <button 
                            onClick={() => setTool('eraser')}
                            className={`p-3 border transition-colors ${tool === 'eraser' ? 'bg-white text-blue-base border-white' : 'border-transparent text-white hover:bg-white/10'}`}
                        >
                            <Eraser size={20} />
                        </button>
                    </div>
                    
                    <div className="w-px h-8 md:w-8 md:h-px bg-white/20 shrink-0" />

                    {/* Colors */}
                    <div className="flex flex-row md:flex-col gap-3 shrink-0">
                        {COLORS.map(c => (
                            <button 
                                key={c.id}
                                onClick={() => { setColor(c.hex); setTool('pen'); }}
                                className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${color === c.hex && tool === 'pen' ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'border-transparent'}`}
                                style={{ backgroundColor: c.hex }}
                            />
                        ))}
                    </div>

                    <div className="w-px h-8 md:w-8 md:h-px bg-white/20 shrink-0" />

                    {/* Size */}
                    <div className="flex flex-row md:flex-col gap-2 items-center justify-center shrink-0">
                        {STROKE_WIDTHS.map(s => (
                            <button
                                key={s}
                                onClick={() => setLineWidth(s)}
                                className={`rounded-full bg-white transition-all ${lineWidth === s ? 'opacity-100 ring-2 ring-blue-400' : 'opacity-30 hover:opacity-70'}`}
                                style={{ width: Math.max(8, Math.min(s, 36)), height: Math.max(8, Math.min(s, 36)) }}
                                title={`${s}px`}
                            />
                        ))}
                    </div>

                    <div className="w-px h-8 md:w-8 md:h-px bg-white/20 md:mt-auto shrink-0" />
                    
                    <button 
                        onClick={clearCanvas}
                        className="p-3 text-red-300 hover:text-red-500 transition-colors shrink-0"
                        title="Clear Board"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>

                {/* Canvas Container */}
                <div 
                    ref={containerRef}
                    className="flex-1 border-4 border-white relative cursor-crosshair touch-none bg-[#0047FF] overflow-hidden"
                >
                    <div className="absolute inset-0 opacity-10 pointer-events-none" 
                        style={{ 
                            backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', 
                            backgroundSize: '50px 50px' 
                        }} 
                    />
                    <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="block touch-none"
                    />
                </div>
            </div>

            {/* Notification */}
            {message && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white text-blue-base px-6 py-3 font-bold uppercase tracking-widest shadow-lg z-50"
                >
                    {message}
                </motion.div>
            )}
        </motion.div>
    );
};
