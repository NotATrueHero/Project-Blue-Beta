
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Save, Folder, Trash2, Cpu, FileCode, Eraser } from 'lucide-react';

// Languages supported (Client-side only for interactivity)
const LANGUAGES = [
    { 
        id: 'python', 
        name: 'Python', 
        ext: 'py', 
        defaultCode: 'print("System Online.")\n\n# Interactive Python Mode\n# Use await input() to pause for user data\n\nwhile True:\n    name = await input("Enter Command: ")\n    if name == "exit":\n        print("Terminating...")\n        break\n    print(f"Executing: {name}")' 
    },
    { 
        id: 'javascript', 
        name: 'JavaScript', 
        ext: 'js', 
        defaultCode: 'console.log("JS Runtime Active");\n\n// Use await input() to pause execution\nasync function main() {\n    while(true) {\n        const cmd = await input("Awaiting Directive: ");\n        if(cmd === "exit") break;\n        console.log("Processing: " + cmd);\n    }\n}\n\nmain();' 
    }
];

interface ScriptFile {
    id: string;
    name: string;
    language: string;
    code: string;
    date: string;
}

interface ConsoleEntry {
    type: 'stdin' | 'stdout' | 'stderr' | 'system';
    content: string;
    timestamp: string;
}

export const IDE: React.FC = () => {
    const [activeLang, setActiveLang] = useState(LANGUAGES[0]);
    const [code, setCode] = useState(LANGUAGES[0].defaultCode);
    
    // Terminal State
    const [consoleHistory, setConsoleHistory] = useState<ConsoleEntry[]>([
        { type: 'system', content: 'TERMINAL ONLINE...', timestamp: new Date().toLocaleTimeString() }
    ]);
    const [isRunning, setIsRunning] = useState(false);
    
    // Interactive Input State
    const [isWaitingForInput, setIsWaitingForInput] = useState(false);
    const [userInput, setUserInput] = useState('');
    const [inputPrompt, setInputPrompt] = useState('');
    const inputResolver = useRef<((value: string) => void) | null>(null);
    
    const pyodideRef = useRef<any>(null);

    // File Management
    const [savedScripts, setSavedScripts] = useState<ScriptFile[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [scriptName, setScriptName] = useState('');

    const consoleEndRef = useRef<HTMLDivElement>(null);
    const terminalInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const saved = localStorage.getItem('blue_ide_scripts');
        if (saved) setSavedScripts(JSON.parse(saved));

        // Load Pyodide
        const loadPyodide = async () => {
            if ((window as any).loadPyodide && !pyodideRef.current) {
                try {
                    pyodideRef.current = await (window as any).loadPyodide();
                    addToConsole('system', 'PYTHON RUNTIME LOADED.');
                } catch (e) {
                    console.error("Pyodide Load Failed", e);
                }
            }
        };
        loadPyodide();
    }, []);

    // Auto-focus input when waiting
    useEffect(() => {
        if (isWaitingForInput && terminalInputRef.current) {
            terminalInputRef.current.focus();
        }
    }, [isWaitingForInput]);

    // Auto-scroll terminal
    useEffect(() => {
        consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [consoleHistory, isRunning, isWaitingForInput]);

    const saveScripts = (scripts: ScriptFile[]) => {
        setSavedScripts(scripts);
        localStorage.setItem('blue_ide_scripts', JSON.stringify(scripts));
    };

    const addToConsole = (type: ConsoleEntry['type'], content: string) => {
        setConsoleHistory(prev => [...prev, {
            type,
            content,
            timestamp: new Date().toLocaleTimeString()
        }]);
    };

    // --- INTERACTIVE INPUT HANDLER ---
    const handleUserSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isWaitingForInput || !inputResolver.current) return;

        const val = userInput;
        addToConsole('stdin', `${inputPrompt}${val}`);
        
        // Resolve the promise
        inputResolver.current(val);
        
        // Reset
        setUserInput('');
        setInputPrompt('');
        setIsWaitingForInput(false);
        inputResolver.current = null;
    };

    // --- RUNNERS ---

    const runInteractivePython = async () => {
        if (!pyodideRef.current) {
            addToConsole('stderr', 'Python Runtime Loading... Please Wait.');
            setIsRunning(false);
            return;
        }

        try {
            // Define the input shim in Python to call JS
            await pyodideRef.current.runPythonAsync(`
import asyncio
from js import _ask_user_input

async def input(prompt=""):
    return await _ask_user_input(prompt)
            `);

            // Run user code
            await pyodideRef.current.runPythonAsync(code);
            addToConsole('system', 'Execution Finished.');
        } catch (err: any) {
            addToConsole('stderr', err.toString());
        } finally {
            setIsRunning(false);
        }
    };

    const runInteractiveJS = async () => {
        try {
            const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
            
            const input = (promptText = "") => {
                return new Promise<string>((resolve) => {
                    setInputPrompt(promptText);
                    setIsWaitingForInput(true);
                    inputResolver.current = resolve;
                });
            };

            const customConsole = {
                log: (...args: any[]) => addToConsole('stdout', args.join(' ')),
                error: (...args: any[]) => addToConsole('stderr', args.join(' '))
            };

            const runUserCode = new AsyncFunction('input', 'console', code);
            await runUserCode(input, customConsole);
            
            addToConsole('system', 'Execution Finished.');
        } catch (err: any) {
            addToConsole('stderr', err.toString());
        } finally {
            setIsRunning(false);
        }
    };

    const handleRun = () => {
        if (isRunning) return;
        setIsRunning(true);
        addToConsole('system', `--- LAUNCHING ${activeLang.name.toUpperCase()} ---`);
        
        // Expose the input resolver globally for Python
        (window as any)._ask_user_input = (prompt: string) => {
            return new Promise((resolve) => {
                setInputPrompt(prompt);
                setIsWaitingForInput(true);
                inputResolver.current = resolve;
            });
        };

        if (activeLang.id === 'python') runInteractivePython();
        else runInteractiveJS();
    };

    // --- OTHER HANDLERS ---
    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!scriptName.trim()) return;
        const newScript: ScriptFile = {
            id: Date.now().toString(),
            name: scriptName.toUpperCase(),
            language: activeLang.id,
            code: code,
            date: new Date().toLocaleDateString()
        };
        saveScripts([newScript, ...savedScripts]);
        setScriptName('');
    };

    const loadScript = (script: ScriptFile) => {
        const lang = LANGUAGES.find(l => l.id === script.language) || LANGUAGES[0];
        setActiveLang(lang);
        setCode(script.code);
        addToConsole('system', `LOADED: ${script.name}`);
        setIsSidebarOpen(false);
    };

    const deleteScript = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        saveScripts(savedScripts.filter(s => s.id !== id));
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="w-full h-full pt-20 px-4 pb-4 md:px-12 md:pb-12 flex flex-col max-w-7xl mx-auto"
        >
            {/* Header */}
            <div className="flex justify-between items-end mb-4 border-b-2 border-white pb-4">
                <div>
                    <h1 className="text-3xl md:text-5xl font-bold uppercase tracking-tighter mb-2">Script Terminal</h1>
                    <div className="flex items-center gap-4 text-xs font-mono uppercase opacity-70">
                         <span>Status: {isRunning ? 'EXECUTING' : 'IDLE'}</span>
                         <span>//</span>
                         <span>CLIENT-SIDE INTERACTIVE RUNTIME</span>
                    </div>
                </div>
                <div className="flex gap-2">
                     <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`border border-white p-2 hover:bg-white hover:text-blue-base transition-colors ${isSidebarOpen ? 'bg-white text-blue-base' : ''}`}
                        title="Saved Programs"
                     >
                         <Folder size={20} />
                     </button>
                </div>
            </div>

            <div className="flex-1 flex gap-6 min-h-0 relative">
                
                {/* SAVED SCRIPTS DRAWER */}
                <AnimatePresence>
                    {isSidebarOpen && (
                        <motion.div 
                            initial={{ x: -20, opacity: 0, width: 0 }}
                            animate={{ x: 0, opacity: 1, width: 250 }}
                            exit={{ x: -20, opacity: 0, width: 0 }}
                            className="hidden md:flex flex-col border-4 border-white p-4 bg-[#020617] absolute left-0 top-0 bottom-0 z-30"
                        >
                             <div className="font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                                 <FileCode size={14} /> Library
                             </div>
                             
                             <form onSubmit={handleSave} className="mb-4">
                                 <input 
                                     value={scriptName}
                                     onChange={e => setScriptName(e.target.value)}
                                     placeholder="FILENAME..."
                                     className="w-full bg-transparent border-b border-white text-xs font-bold uppercase outline-none py-1 mb-2"
                                 />
                                 <button type="submit" className="w-full border border-white py-1 text-xs font-bold uppercase hover:bg-white hover:text-blue-base flex items-center justify-center gap-2">
                                     <Save size={12} /> Save
                                 </button>
                             </form>

                             <div className="flex-1 overflow-y-auto hide-scrollbar space-y-2">
                                 {savedScripts.map(script => (
                                     <div 
                                        key={script.id}
                                        onClick={() => loadScript(script)}
                                        className="group p-2 border border-white/30 hover:border-white hover:bg-white/5 cursor-pointer flex justify-between items-center"
                                     >
                                         <div className="min-w-0">
                                             <div className="font-bold text-xs uppercase truncate">{script.name}</div>
                                             <div className="text-[10px] opacity-60 font-mono">{LANGUAGES.find(l => l.id === script.language)?.name}</div>
                                         </div>
                                         <button onClick={(e) => deleteScript(e, script.id)} className="opacity-0 group-hover:opacity-100 hover:text-red-500">
                                             <Trash2 size={12} />
                                         </button>
                                     </div>
                                 ))}
                             </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* MAIN CONTENT */}
                <div className="flex-1 flex flex-col gap-4 min-w-0 h-full">
                    
                    {/* LANGUAGE BAR */}
                    <div className="flex flex-wrap gap-2 items-center bg-black/20 p-2 border-2 border-white/20">
                        {LANGUAGES.map(lang => (
                            <button
                                key={lang.id}
                                onClick={() => { setActiveLang(lang); setCode(lang.defaultCode); }}
                                className={`px-3 py-1 text-xs font-bold uppercase transition-colors border ${activeLang.id === lang.id ? 'bg-white text-blue-base border-white' : 'border-transparent hover:border-white/50'}`}
                            >
                                {lang.id}
                            </button>
                        ))}
                        <div className="flex-1" />

                        <button 
                            onClick={handleRun}
                            disabled={isRunning}
                            className={`flex items-center gap-2 px-6 py-1 border-2 border-white font-bold uppercase hover:bg-white hover:text-blue-base transition-colors ${isRunning ? 'opacity-50 cursor-wait' : ''}`}
                        >
                            {isRunning ? <Cpu className="animate-spin" size={14} /> : <Play size={14} />}
                            {isRunning ? 'Running' : 'Execute'}
                        </button>
                    </div>

                    {/* EDITOR & TERMINAL STACK */}
                    <div className="flex-1 flex flex-col border-4 border-white min-h-0 bg-[#0a0a1a] relative">
                        
                        {/* EDITOR */}
                        <div className="flex-1 relative border-b-4 border-white">
                            <div className="absolute top-0 right-0 px-2 py-1 bg-white text-blue-base text-[10px] font-bold uppercase z-10 opacity-70 pointer-events-none">
                                SOURCE: {activeLang.ext.toUpperCase()}
                            </div>
                            <textarea 
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="w-full h-full bg-transparent text-white font-mono text-sm p-4 outline-none resize-none leading-relaxed selection:bg-white selection:text-blue-base"
                                spellCheck={false}
                                autoCapitalize="off"
                            />
                        </div>

                        {/* TERMINAL */}
                        <div className="h-[40%] bg-black/80 flex flex-col relative">
                             <div className="absolute top-0 right-0 px-2 py-1 bg-white/10 text-white text-[10px] font-bold uppercase z-10 flex gap-2">
                                <button onClick={() => setConsoleHistory([])} className="hover:text-red-400 flex items-center gap-1"><Eraser size={10} /> CLEAR</button>
                             </div>

                             <div className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1" onClick={() => terminalInputRef.current?.focus()}>
                                 {consoleHistory.map((entry, idx) => (
                                     <div key={idx} className={`break-all whitespace-pre-wrap border-l-2 pl-2 ${
                                         entry.type === 'stdout' ? 'border-transparent text-green-400' :
                                         entry.type === 'stdin' ? 'border-transparent text-yellow-300 font-bold' :
                                         entry.type === 'stderr' ? 'border-red-500 text-red-400' :
                                         'border-blue-500 text-blue-300 opacity-70 text-xs my-2'
                                     }`}>
                                         {entry.content}
                                     </div>
                                 ))}
                                 
                                 {/* Interactive Input Line */}
                                 {isWaitingForInput && (
                                     <form onSubmit={handleUserSubmit} className="flex items-center gap-2 text-yellow-300 mt-2">
                                         <span className="opacity-50">{inputPrompt || '>'}</span>
                                         <input 
                                            ref={terminalInputRef}
                                            value={userInput}
                                            onChange={(e) => setUserInput(e.target.value)}
                                            className="flex-1 bg-transparent border-none outline-none font-mono text-yellow-300"
                                            autoFocus
                                            autoComplete="off"
                                         />
                                     </form>
                                 )}
                                 
                                 <div ref={consoleEndRef} />
                             </div>
                        </div>

                    </div>
                </div>
            </div>
        </motion.div>
    );
};
