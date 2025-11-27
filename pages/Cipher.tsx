
import * as React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, RefreshCw, Copy, Check } from 'lucide-react';

type CipherMode = 'base64' | 'binary' | 'hex' | 'rot13';

export const Cipher: React.FC = () => {
    const [mode, setMode] = useState<CipherMode>('base64');
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [direction, setDirection] = useState<'encode' | 'decode'>('encode');
    const [copied, setCopied] = useState(false);

    const process = () => {
        if (!input) {
            setOutput('');
            return;
        }

        try {
            let res = '';
            if (mode === 'base64') {
                if (direction === 'encode') res = btoa(input);
                else res = atob(input);
            } else if (mode === 'binary') {
                if (direction === 'encode') {
                    res = input.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
                } else {
                    res = input.split(' ').map(b => String.fromCharCode(parseInt(b, 2))).join('');
                }
            } else if (mode === 'hex') {
                if (direction === 'encode') {
                    res = input.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
                } else {
                    res = input.split(' ').map(h => String.fromCharCode(parseInt(h, 16))).join('');
                }
            } else if (mode === 'rot13') {
                res = input.replace(/[a-zA-Z]/g, (c) => {
                    const base = c <= 'Z' ? 65 : 97;
                    return String.fromCharCode(base + (c.charCodeAt(0) - base + 13) % 26);
                });
            }
            setOutput(res);
        } catch (e) {
            setOutput('ERROR: INVALID INPUT SEQUENCE');
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="w-full h-full pt-24 px-6 md:px-12 pb-12 max-w-7xl mx-auto flex flex-col"
        >
            <div className="flex justify-between items-end mb-8 border-b-2 border-white pb-6 gap-6">
                <div>
                    <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter mb-2">Cipher</h1>
                    <p className="text-sm md:text-base uppercase tracking-widest opacity-70">Cryptographic Translation Engine</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 h-full">
                
                {/* CONTROLS */}
                <div className="w-full md:w-1/3 border-4 border-white p-6 flex flex-col gap-8">
                    <div>
                        <div className="text-xs font-bold uppercase tracking-widest opacity-60 mb-3">Translation Mode</div>
                        <div className="grid grid-cols-2 gap-3">
                            {(['base64', 'binary', 'hex', 'rot13'] as CipherMode[]).map(m => (
                                <button 
                                    key={m}
                                    onClick={() => { setMode(m); setOutput(''); }}
                                    className={`border border-white py-2 px-4 text-xs font-bold uppercase hover:bg-white hover:text-blue-base transition-colors ${mode === m ? 'bg-white text-blue-base' : ''}`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="text-xs font-bold uppercase tracking-widest opacity-60 mb-3">Operation</div>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => { setDirection('encode'); setOutput(''); }}
                                className={`flex-1 border border-white py-3 flex items-center justify-center gap-2 font-bold uppercase text-xs hover:bg-white hover:text-blue-base transition-colors ${direction === 'encode' ? 'bg-white text-blue-base' : ''}`}
                            >
                                <Lock size={14} /> Encode
                            </button>
                            <button 
                                onClick={() => { setDirection('decode'); setOutput(''); }}
                                className={`flex-1 border border-white py-3 flex items-center justify-center gap-2 font-bold uppercase text-xs hover:bg-white hover:text-blue-base transition-colors ${direction === 'decode' ? 'bg-white text-blue-base' : ''}`}
                            >
                                <Unlock size={14} /> Decode
                            </button>
                        </div>
                    </div>

                    <div className="mt-auto">
                        <button 
                            onClick={process}
                            className="w-full bg-white text-blue-base py-4 font-bold uppercase tracking-widest hover:bg-opacity-90 flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={18} /> Run Process
                        </button>
                    </div>
                </div>

                {/* INPUT / OUTPUT */}
                <div className="flex-1 flex flex-col gap-6">
                    <div className="flex-1 flex flex-col">
                        <div className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">Input Sequence</div>
                        <textarea 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="ENTER DATA..."
                            className="flex-1 bg-black/20 border-2 border-white p-4 font-mono text-sm md:text-base outline-none resize-none focus:bg-white/5 transition-colors placeholder-white/30"
                        />
                    </div>

                    <div className="flex-1 flex flex-col">
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-xs font-bold uppercase tracking-widest opacity-60">Output Sequence</div>
                            {output && (
                                <button onClick={handleCopy} className="flex items-center gap-1 text-xs font-bold uppercase hover:text-green-300 transition-colors">
                                    {copied ? <Check size={12} /> : <Copy size={12} />}
                                    {copied ? 'Copied' : 'Copy Data'}
                                </button>
                            )}
                        </div>
                        <div className="flex-1 bg-white/5 border-2 border-white/50 p-4 font-mono text-sm md:text-base break-all overflow-y-auto">
                            {output || <span className="opacity-30">AWAITING PROCESS...</span>}
                        </div>
                    </div>
                </div>

            </div>
        </motion.div>
    );
};
