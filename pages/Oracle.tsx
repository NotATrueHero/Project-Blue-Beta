
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Cpu, AlertTriangle, Paperclip, X, Settings, Globe, Brain, Image as ImageIcon, FileText } from 'lucide-react';
import { getApiKey, streamChat, ChatMessage } from '../services/geminiService';

// --- Types ---
interface ExtendedMessage extends ChatMessage {
    id: string;
    isStreaming?: boolean;
    groundingMetadata?: any;
    timestamp: number;
}

interface AttachedFile {
    id: string;
    file: File;
    preview: string;
    base64: string; // Raw base64 without prefix
    mimeType: string;
}

const MODELS = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Fast, Efficient' },
    { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro', desc: 'Complex Reasoning' },
    { id: 'gemini-2.5-flash-thinking', name: 'Gemini 2.5 Thinking', desc: 'Enhanced Logic' },
];

export const Oracle: React.FC = () => {
    // --- State ---
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ExtendedMessage[]>([]);
    const [files, setFiles] = useState<AttachedFile[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    
    // Config State
    const [showConfig, setShowConfig] = useState(false);
    const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
    const [systemInstruction, setSystemInstruction] = useState('You are "Oracle", a high-level system AI for Project Blue. You are helpful, concise, and speak with a slightly robotic, secure-terminal tone.');
    const [useSearch, setUseSearch] = useState(false);
    const [thinkingBudget, setThinkingBudget] = useState(0);

    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Init ---
    useEffect(() => {
        const key = getApiKey();
        if (key) setApiKey(key);
        
        // Initial Greeting
        setMessages([{
            id: 'init',
            role: 'model',
            parts: [{ text: 'Oracle System v3.0 Online. Awaiting multi-modal input.' }],
            timestamp: Date.now()
        }]);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping, files]);

    // --- File Handling ---
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFiles(Array.from(e.target.files));
        }
    };

    const processFiles = async (fileList: File[]) => {
        const newAttachments: AttachedFile[] = [];
        for (const file of fileList) {
            // Basic size check (4MB)
            if (file.size > 4 * 1024 * 1024) continue;

            const base64Full = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.readAsDataURL(file);
            });
            
            // Extract raw base64
            const base64 = base64Full.split(',')[1];
            
            newAttachments.push({
                id: Math.random().toString(36).substring(7),
                file,
                preview: base64Full,
                base64,
                mimeType: file.type
            });
        }
        setFiles(prev => [...prev, ...newAttachments]);
    };

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    // --- Chat Logic ---
    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if ((!input.trim() && files.length === 0) || isTyping || !apiKey) return;

        const currentInput = input;
        const currentFiles = [...files];
        
        // Clear input state immediately
        setInput('');
        setFiles([]);
        setIsTyping(true);

        // Construct User Message
        const userMsg: ExtendedMessage = {
            id: Date.now().toString(),
            role: 'user',
            parts: [
                ...currentFiles.map(f => ({ inlineData: { mimeType: f.mimeType, data: f.base64 } })),
                ...(currentInput ? [{ text: currentInput }] : [])
            ],
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);

        try {
            // Prepare history for API (exclude current message as we send it explicitly)
            const history = messages.map(m => ({
                role: m.role,
                parts: m.parts
            }));

            const { stream } = await streamChat({
                apiKey,
                model: selectedModel,
                history,
                message: currentInput,
                files: currentFiles.map(f => ({ mimeType: f.mimeType, data: f.base64 })),
                systemInstruction,
                useSearch,
                thinkingBudget
            });

            // Init Model Response
            const modelMsgId = (Date.now() + 1).toString();
            setMessages(prev => [...prev, {
                id: modelMsgId,
                role: 'model',
                parts: [{ text: '' }],
                isStreaming: true,
                timestamp: Date.now()
            }]);

            let fullText = '';
            let groundingMetadata = null;

            for await (const chunk of stream) {
                if (chunk.text) {
                    fullText += chunk.text;
                }
                if (chunk.candidates?.[0]?.groundingMetadata) {
                    groundingMetadata = chunk.candidates[0].groundingMetadata;
                }

                // Update UI
                setMessages(prev => prev.map(m => 
                    m.id === modelMsgId 
                        ? { 
                            ...m, 
                            parts: [{ text: fullText }], 
                            groundingMetadata: groundingMetadata || m.groundingMetadata
                          } 
                        : m
                ));
            }

            // Finalize
            setMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, isStreaming: false } : m));

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'model',
                parts: [{ text: `ERR: DATA STREAM INTERRUPTED. ${error}` }],
                timestamp: Date.now()
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    // --- Rendering Helpers ---
    const renderMarkdown = (text: string) => {
        // Very basic parser for bold, code blocks, lists
        // In a real app, use react-markdown
        return text.split('\n').map((line, i) => {
            // Code block
            if (line.startsWith('```')) return <div key={i} className="my-2 p-2 bg-black/40 font-mono text-xs border border-white/20 whitespace-pre-wrap">{line}</div>;
            // Bullet
            if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) return <div key={i} className="ml-4 flex gap-2"><span className="opacity-50">•</span><span>{line.substring(2)}</span></div>;
            return <div key={i} className="min-h-[1.2em]">{line}</div>;
        });
    };

    const renderGrounding = (metadata: any) => {
        if (!metadata?.groundingChunks) return null;
        
        const sources = metadata.groundingChunks
            .map((chunk: any) => chunk.web?.uri ? { title: chunk.web.title, uri: chunk.web.uri } : null)
            .filter(Boolean);

        if (sources.length === 0) return null;

        return (
            <div className="mt-4 pt-4 border-t border-white/10">
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-2 flex items-center gap-2">
                    <Globe size={12} /> Sources Verified
                </div>
                <div className="flex flex-wrap gap-2">
                    {sources.map((s: any, idx: number) => (
                        <a 
                            key={idx} 
                            href={s.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs bg-white/5 border border-white/20 px-2 py-1 hover:bg-white hover:text-blue-base truncate max-w-[200px] transition-colors flex items-center gap-1"
                        >
                            {s.title || 'External Source'}
                        </a>
                    ))}
                </div>
            </div>
        );
    };


    if (!apiKey) {
        return (
            <div className="w-full h-full flex items-center justify-center p-8 text-center pt-24">
                <div className="border-4 border-white p-12 max-w-xl bg-black/20 backdrop-blur-sm">
                    <AlertTriangle className="w-20 h-20 mx-auto mb-8 text-yellow-400" />
                    <h2 className="text-3xl font-bold uppercase mb-4">System Offline</h2>
                    <p className="text-lg opacity-80 mb-6 font-light">Oracle module requires a secure API Key.</p>
                    <div className="inline-block border border-white/30 px-4 py-2 font-mono text-sm bg-black/40 mb-4">
                        API KEY MISSING
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full pt-20 px-4 pb-4 md:px-12 md:pb-12 flex flex-col max-w-7xl mx-auto relative">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6 border-b border-white/20 pb-4 shrink-0">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 border-2 border-white flex items-center justify-center transition-colors ${isTyping ? 'bg-white text-blue-base' : 'bg-transparent text-white'}`}>
                        <Cpu size={24} className={isTyping ? 'animate-pulse' : ''} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold uppercase tracking-widest">Oracle</h1>
                        <div className="text-xs font-mono opacity-70 flex items-center gap-2">
                            <span>{MODELS.find(m => m.id === selectedModel)?.name}</span>
                            {useSearch && <span className="text-blue-300"> // SEARCH ON</span>}
                            {thinkingBudget > 0 && <span className="text-yellow-300"> // THINKING ON</span>}
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                     {isTyping && (
                        <div className="hidden md:block text-xs font-bold font-mono tracking-widest animate-pulse">
                            &gt;&gt; PROCESSING STREAM...
                        </div>
                    )}
                    <button 
                        onClick={() => setShowConfig(!showConfig)}
                        className={`p-2 border border-white hover:bg-white hover:text-blue-base transition-colors ${showConfig ? 'bg-white text-blue-base' : ''}`}
                    >
                        <Settings size={20} />
                    </button>
                </div>
            </div>

            {/* Config Panel */}
            <AnimatePresence>
                {showConfig && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-blue-900/30 border-b border-white/20 mb-6 overflow-hidden shrink-0"
                    >
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-2 opacity-70">Core Model</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {MODELS.map(m => (
                                            <button 
                                                key={m.id}
                                                onClick={() => setSelectedModel(m.id)}
                                                className={`border border-white/50 p-2 text-left hover:bg-white/10 transition-colors ${selectedModel === m.id ? 'bg-white/20 border-white' : ''}`}
                                            >
                                                <div className="font-bold text-xs uppercase">{m.name}</div>
                                                <div className="text-[10px] opacity-60">{m.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-2 opacity-70">Capabilities</label>
                                    
                                    <button 
                                        onClick={() => setUseSearch(!useSearch)}
                                        className={`w-full border border-white/50 p-2 flex items-center gap-3 transition-colors ${useSearch ? 'bg-white text-blue-base' : 'hover:bg-white/10'}`}
                                    >
                                        <div className={`w-4 h-4 border border-current flex items-center justify-center`}>
                                            {useSearch && <div className="w-2 h-2 bg-current" />}
                                        </div>
                                        <div className="text-xs font-bold uppercase">Google Search Grounding</div>
                                    </button>

                                    {/* Thinking Budget only for 2.5 models that aren't Flash-Lite ideally, but we allow user to try */}
                                    {selectedModel.includes('2.5') && (
                                        <div className="border border-white/50 p-3">
                                            <div className="flex justify-between text-xs font-bold uppercase mb-2">
                                                <div className="flex items-center gap-2"><Brain size={12} /> Thinking Budget</div>
                                                <div>{thinkingBudget} Tokens</div>
                                            </div>
                                            <input 
                                                type="range" 
                                                min="0" max="8192" step="1024" 
                                                value={thinkingBudget}
                                                onChange={(e) => setThinkingBudget(parseInt(e.target.value))}
                                                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white"
                                            />
                                            <div className="text-[10px] opacity-50 mt-1">Set to 0 to disable extended reasoning.</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest mb-2 opacity-70">System Directive</label>
                                <textarea 
                                    value={systemInstruction}
                                    onChange={(e) => setSystemInstruction(e.target.value)}
                                    className="w-full h-32 bg-black/40 border border-white/50 p-3 text-xs font-mono outline-none focus:border-white resize-none"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Area */}
            <div 
                ref={scrollRef}
                className="flex-1 border-4 border-white p-6 overflow-y-auto hide-scrollbar flex flex-col gap-8 mb-6 relative"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }}
            >
                {messages.map((msg) => (
                    <motion.div 
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-col gap-2 max-w-[90%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
                    >
                        <div className="flex items-center gap-2">
                            <div className="text-[10px] font-bold uppercase opacity-50 tracking-widest">
                                {msg.role === 'user' ? 'OPERATOR' : 'ORACLE'}
                            </div>
                            <div className="text-[10px] font-mono opacity-30">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                            </div>
                        </div>

                        <div className={`p-4 backdrop-blur-md ${msg.role === 'user' ? 'bg-white text-blue-base text-right rounded-bl-xl' : 'bg-[#0047FF]/20 rounded-br-xl border-2 border-white/20'}`}>
                            {/* Attachments */}
                            {msg.parts.some(p => p.inlineData) && (
                                <div className="flex flex-wrap gap-2 mb-3 justify-end">
                                    {msg.parts.filter(p => p.inlineData).map((p, idx) => (
                                        <div key={idx} className="relative group">
                                            {p.inlineData?.mimeType.startsWith('image/') ? (
                                                <img 
                                                    src={`data:${p.inlineData.mimeType};base64,${p.inlineData.data}`} 
                                                    alt="attachment" 
                                                    className="h-32 w-auto object-cover border border-white/50"
                                                />
                                            ) : (
                                                <div className="h-20 w-20 flex items-center justify-center border border-white/50 bg-black/50">
                                                    <FileText size={24} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Text */}
                            {msg.parts.some(p => p.text) && (
                                <div className={`text-base md:text-lg leading-relaxed font-light whitespace-pre-wrap ${msg.role === 'user' ? '' : 'font-mono'}`}>
                                    {renderMarkdown(msg.parts.find(p => p.text)?.text || '')}
                                </div>
                            )}

                            {/* Grounding Sources */}
                            {msg.role === 'model' && renderGrounding(msg.groundingMetadata)}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Input Area */}
            <div className="shrink-0 relative">
                {/* File Preview */}
                {files.length > 0 && (
                    <div className="absolute bottom-full left-0 mb-4 flex gap-2 overflow-x-auto max-w-full pb-2">
                        {files.map(f => (
                            <div key={f.id} className="relative group shrink-0 border border-white bg-black h-20 w-20">
                                {f.mimeType.startsWith('image/') ? (
                                    <img src={f.preview} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center"><FileText /></div>
                                )}
                                <button 
                                    onClick={() => removeFile(f.id)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <form onSubmit={handleSend} className="flex gap-0 relative">
                    {/* Attachment Button */}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        multiple 
                        className="hidden" 
                        onChange={handleFileSelect}
                        // Accept broadly, but image is best supported
                        accept="image/*,application/pdf,text/*"
                    />
                    <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-14 h-16 border-y-2 border-l-2 border-white flex items-center justify-center hover:bg-white hover:text-blue-base transition-colors"
                    >
                        <Paperclip size={20} />
                    </button>

                    <textarea 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        className="flex-1 h-16 bg-transparent border-2 border-white px-4 py-4 text-lg font-bold uppercase placeholder-white/30 focus:bg-white/5 outline-none transition-colors resize-none hide-scrollbar"
                        placeholder="TRANSMIT QUERY..."
                    />

                    <button 
                        type="submit" 
                        disabled={isTyping || (!input.trim() && files.length === 0)}
                        className="w-20 h-16 border-y-2 border-r-2 border-white flex items-center justify-center hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-white"
                    >
                        <Send size={24} />
                    </button>
                </form>
            </div>
        </div>
    );
};
