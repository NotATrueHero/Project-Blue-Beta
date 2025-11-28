
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Delete, RotateCcw, Equal, ChevronRight, History } from 'lucide-react';

interface CalcBtnProps {
    label: React.ReactNode;
    val?: string;
    onClick?: () => void;
    type?: 'num' | 'op' | 'action' | 'sci';
    wide?: boolean;
    className?: string;
}

const CalcBtn: React.FC<CalcBtnProps> = ({ label, val, onClick, type = 'num', wide, className }) => {
    // Helper to determine base styles
    const getBaseStyles = () => {
        switch (type) {
            case 'op': return 'bg-blue-600/20 border border-blue-500/50 hover:bg-blue-600/40 text-blue-100 text-xl';
            case 'sci': return 'bg-white/5 border border-white/10 hover:bg-white/10 text-xs md:text-sm font-mono';
            case 'action': return 'bg-red-500/20 border border-red-500/50 hover:bg-red-500/40 text-red-100';
            default: return 'bg-transparent border border-white/20 hover:bg-white/10 text-white text-xl';
        }
    };

    return (
        <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`
                relative overflow-hidden font-bold uppercase tracking-wider transition-all
                flex items-center justify-center
                ${wide ? 'col-span-2' : ''}
                ${getBaseStyles()}
                h-14 md:h-16
                ${className || ''}
            `}
        >
            {label}
        </motion.button>
    );
};

export const Calculator: React.FC = () => {
    const [input, setInput] = useState('');
    const [result, setResult] = useState('');
    const [history, setHistory] = useState<{ expression: string, result: string }[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    
    const [isRad, setIsRad] = useState(true);

    useEffect(() => {
        // Keyboard support
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key;
            if (/[0-9]/.test(key)) append(key);
            if (['+', '-', '*', '/', '(', ')', '.', '^'].includes(key)) append(key);
            if (key === 'Enter') calculate();
            if (key === 'Backspace') backspace();
            if (key === 'Escape') clear();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [input, result]); // Added dependencies to ensure closure captures latest state if needed

    const append = (val: string) => {
        if (result && !['+', '-', '*', '/', '^'].includes(val)) {
            setInput(val);
            setResult('');
        } else if (result && ['+', '-', '*', '/', '^'].includes(val)) {
            setInput(result + val);
            setResult('');
        } else {
            setInput(prev => prev + val);
        }
    };

    const clear = () => {
        setInput('');
        setResult('');
    };

    const backspace = () => {
        setInput(prev => prev.slice(0, -1));
    };

    const calculate = () => {
        if (!input) return;
        try {
            // Sanitized evaluation
            let expression = input
                .replace(/π/g, 'Math.PI')
                .replace(/e/g, 'Math.E')
                .replace(/\^/g, '**')
                .replace(/sqrt\(/g, 'Math.sqrt(')
                .replace(/log\(/g, 'Math.log10(')
                .replace(/ln\(/g, 'Math.log(')
                .replace(/sin\(/g, 'Math.sin(')
                .replace(/cos\(/g, 'Math.cos(')
                .replace(/tan\(/g, 'Math.tan(')
                .replace(/abs\(/g, 'Math.abs(');
            
            // eslint-disable-next-line no-new-func
            const evalResult = new Function('return ' + expression)();
            
            if (!isFinite(evalResult) || isNaN(evalResult)) {
                 setResult('ERROR');
                 return;
            }

            const formattedResult = Number(evalResult.toFixed(8)).toString();
            
            setResult(formattedResult);
            setHistory(prev => [{ expression: input, result: formattedResult }, ...prev].slice(0, 50));
        } catch (e) {
            setResult('ERROR');
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="w-full h-full pt-24 px-4 md:px-12 pb-12 max-w-5xl mx-auto flex flex-col md:flex-row gap-8"
        >
            {/* CALCULATOR INTERFACE */}
            <div className="flex-1 flex flex-col gap-6 w-full max-w-2xl mx-auto">
                <div className="flex justify-between items-end border-b-2 border-white pb-6">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-bold uppercase tracking-tighter mb-2">Calculator</h1>
                        <p className="text-sm uppercase tracking-widest opacity-70">Computational Matrix</p>
                    </div>
                    <div className="text-[10px] font-mono opacity-50 uppercase border px-2 py-1">
                        Mode: {isRad ? 'RAD' : 'RAD'}
                    </div>
                </div>

                {/* DISPLAY */}
                <div className="border-4 border-white bg-black/40 p-6 flex flex-col items-end justify-center h-32 md:h-40 relative overflow-hidden">
                    <div className="absolute top-2 left-2 flex gap-2">
                         <button onClick={() => setShowHistory(!showHistory)} className="opacity-50 hover:opacity-100 transition-opacity">
                             <History size={16} />
                         </button>
                    </div>
                    
                    <div className="text-sm md:text-lg font-mono opacity-60 break-all text-right w-full mb-2">
                        {input || '0'}
                    </div>
                    <div className={`text-3xl md:text-5xl font-mono font-bold tracking-wider break-all text-right w-full ${result === 'ERROR' ? 'text-red-400' : 'text-blue-300'}`}>
                        {result || (input ? '' : '0')}
                    </div>
                </div>

                {/* KEYPAD GRID */}
                <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
                    
                    {/* SCIENTIFIC COLUMN (Desktop) */}
                    <div className="hidden md:contents">
                        <CalcBtn label="sin" val="sin(" type="sci" onClick={() => append("sin(")} />
                        <CalcBtn label="cos" val="cos(" type="sci" onClick={() => append("cos(")} />
                        <CalcBtn label="tan" val="tan(" type="sci" onClick={() => append("tan(")} />
                        <CalcBtn label="log" val="log(" type="sci" onClick={() => append("log(")} />
                        <CalcBtn label="ln" val="ln(" type="sci" onClick={() => append("ln(")} />
                    </div>

                    {/* ROW 1 */}
                    <CalcBtn label="AC" onClick={clear} type="action" />
                    <CalcBtn label="DEL" onClick={backspace} type="action" />
                    <CalcBtn label="(" val="(" type="sci" onClick={() => append("(")} />
                    <CalcBtn label=")" val=")" type="sci" onClick={() => append(")")} />
                    <CalcBtn label="^" val="^" type="op" onClick={() => append("^")} />

                    {/* ROW 2 */}
                    <CalcBtn label="7" val="7" onClick={() => append("7")} />
                    <CalcBtn label="8" val="8" onClick={() => append("8")} />
                    <CalcBtn label="9" val="9" onClick={() => append("9")} />
                    <CalcBtn label="/" val="/" type="op" onClick={() => append("/")} />
                    <CalcBtn label="√" val="sqrt(" type="sci" className="md:hidden" onClick={() => append("sqrt(")} />

                    {/* ROW 3 */}
                    <CalcBtn label="4" val="4" onClick={() => append("4")} />
                    <CalcBtn label="5" val="5" onClick={() => append("5")} />
                    <CalcBtn label="6" val="6" onClick={() => append("6")} />
                    <CalcBtn label="*" val="*" type="op" onClick={() => append("*")} />
                    <CalcBtn label="π" val="π" type="sci" className="md:hidden" onClick={() => append("π")} />

                    {/* ROW 4 */}
                    <CalcBtn label="1" val="1" onClick={() => append("1")} />
                    <CalcBtn label="2" val="2" onClick={() => append("2")} />
                    <CalcBtn label="3" val="3" onClick={() => append("3")} />
                    <CalcBtn label="-" val="-" type="op" onClick={() => append("-")} />
                    <CalcBtn label="e" val="e" type="sci" className="md:hidden" onClick={() => append("e")} />

                    {/* ROW 5 */}
                    <CalcBtn label="0" val="0" wide onClick={() => append("0")} />
                    <CalcBtn label="." val="." onClick={() => append(".")} />
                    <CalcBtn label="+" val="+" type="op" onClick={() => append("+")} />
                    <CalcBtn label={<Equal size={24} />} onClick={calculate} type="op" className="bg-blue-500 text-white" />
                </div>
                
                {/* EXTRA SCIENTIFIC ROW FOR MOBILE */}
                <div className="grid grid-cols-5 gap-3 md:hidden">
                    <CalcBtn label="sin" val="sin(" type="sci" onClick={() => append("sin(")} />
                    <CalcBtn label="cos" val="cos(" type="sci" onClick={() => append("cos(")} />
                    <CalcBtn label="tan" val="tan(" type="sci" onClick={() => append("tan(")} />
                    <CalcBtn label="√" val="sqrt(" type="sci" onClick={() => append("sqrt(")} />
                    <CalcBtn label="^" val="^" type="sci" onClick={() => append("^")} />
                </div>
            </div>

            {/* HISTORY TAPE */}
            <AnimatePresence>
                {showHistory && (
                    <motion.div 
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 300, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="hidden md:flex flex-col border-4 border-white bg-black/20 h-full overflow-hidden"
                    >
                        <div className="p-4 border-b border-white/20 font-bold uppercase tracking-widest text-xs flex justify-between items-center">
                            Tape Log
                            <button onClick={() => setHistory([])} className="hover:text-red-400"><Delete size={14} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm hide-scrollbar">
                            {history.length === 0 && <div className="text-center opacity-40 italic">Empty</div>}
                            {history.map((item, idx) => (
                                <div key={idx} className="border-b border-white/10 pb-2 last:border-0 cursor-pointer hover:bg-white/5 p-1" onClick={() => setInput(item.expression)}>
                                    <div className="opacity-60 text-xs mb-1 break-all">{item.expression}</div>
                                    <div className="text-blue-300 font-bold text-lg text-right">{item.result}</div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            
             {/* MOBILE HISTORY MODAL */}
             <AnimatePresence>
                {showHistory && (
                    <motion.div 
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md md:hidden p-6 flex flex-col"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold uppercase">History Log</h2>
                            <button onClick={() => setShowHistory(false)} className="border border-white px-4 py-2 uppercase text-xs font-bold">Close</button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-4 font-mono">
                             {history.map((item, idx) => (
                                <div key={idx} className="border-b border-white/20 pb-2" onClick={() => { setInput(item.expression); setShowHistory(false); }}>
                                    <div className="opacity-60 text-xs mb-1 break-all">{item.expression}</div>
                                    <div className="text-blue-300 font-bold text-xl text-right">{item.result}</div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
