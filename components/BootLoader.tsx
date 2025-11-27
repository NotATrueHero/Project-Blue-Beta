
import * as React from 'react';
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Power, AlertTriangle, FileJson } from 'lucide-react';
import { UserData, Theme, TaskList } from '../types';

interface BootLoaderProps {
  onLoadComplete: (pin: string, requiresAuth: boolean, theme?: Theme) => void;
}

export const BootLoader: React.FC<BootLoaderProps> = ({ onLoadComplete }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = JSON.parse(json);

        if (!data.version || !data.notes) {
          throw new Error("Corrupt or invalid system file.");
        }

        // Handle Migration of Tasks to TaskLists if needed
        let taskLists: TaskList[] = [];
        if (data.taskLists) {
            taskLists = data.taskLists;
        } else if (data.tasks) {
            // Legacy support
            taskLists = [{
                id: 'default-legacy',
                title: 'General Operations',
                tasks: data.tasks
            }];
        }

        // Seed LocalStorage
        localStorage.setItem('blue_pin', data.pin);
        localStorage.setItem('blue_notes', JSON.stringify(data.notes));
        localStorage.setItem('blue_task_lists', JSON.stringify(taskLists));
        localStorage.setItem('blue_uplinks', JSON.stringify(data.bookmarks));
        localStorage.setItem('blue_files', JSON.stringify(data.files || []));
        localStorage.setItem('blue_theme', data.theme || 'standard');
        
        // Restore API Key if present
        if (data.apiKey) {
            localStorage.setItem('blue_api_key', data.apiKey);
        } else {
            localStorage.removeItem('blue_api_key');
        }

        // Boot
        setTimeout(() => {
            onLoadComplete(data.pin, true, data.theme);
        }, 800);

      } catch (err) {
        setError("DATA CORRUPTION DETECTED. INVALID FILE.");
        setTimeout(() => setError(null), 3000);
      }
    };
    reader.readAsText(file);
  };

  const handleNewSession = () => {
    // Wipe Storage
    localStorage.removeItem('blue_notes');
    localStorage.removeItem('blue_task_lists');
    localStorage.removeItem('blue_tasks'); // cleanup legacy
    localStorage.removeItem('blue_uplinks');
    localStorage.removeItem('blue_files');
    localStorage.removeItem('blue_theme');
    localStorage.removeItem('blue_api_key');
    
    // Set Default PIN
    const defaultPin = "1969";
    localStorage.setItem('blue_pin', defaultPin);

    // Boot without auth
    onLoadComplete(defaultPin, false, 'standard');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  return (
    <div className="fixed inset-0 bg-[#0047FF] text-white z-[100] flex flex-col items-center justify-center font-mono selection:bg-white selection:text-[#0047FF]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl px-6"
      >
        <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter mb-2">System Boot</h1>
        <div className="h-1 w-full bg-white/20 mb-12 relative overflow-hidden">
            <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="absolute inset-0 bg-white"
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* OPTION 1: LOAD PROFILE */}
            <div 
                className={`border-4 border-white p-8 transition-all duration-300 cursor-pointer relative group ${isHovering ? 'bg-white text-[#0047FF]' : 'bg-transparent'}`}
                onDragOver={(e) => { e.preventDefault(); setIsHovering(true); }}
                onDragLeave={() => setIsHovering(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsHovering(false);
                    const file = e.dataTransfer.files[0];
                    if (file) processFile(file);
                }}
                onClick={() => fileInputRef.current?.click()}
            >
                <div className="flex flex-col items-center text-center gap-4">
                    <Upload size={48} strokeWidth={1.5} />
                    <div>
                        <div className="font-bold text-xl uppercase mb-2">Load User Profile</div>
                        <p className="text-xs opacity-70 leading-relaxed">
                            Upload 'Project Blue' JSON file to restore logs, tasks, files, and settings.
                        </p>
                    </div>
                    <div className="mt-4 text-xs font-bold border px-3 py-1 uppercase tracking-widest">
                        Or Drag File Here
                    </div>
                </div>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".json" 
                    onChange={handleFileUpload}
                />
            </div>

            {/* OPTION 2: NEW SESSION */}
            <button 
                onClick={handleNewSession}
                className="border-4 border-white p-8 transition-all duration-300 hover:bg-white hover:text-[#0047FF] group flex flex-col items-center text-center gap-4"
            >
                 <Power size={48} strokeWidth={1.5} />
                 <div>
                    <div className="font-bold text-xl uppercase mb-2">Initialize System</div>
                    <p className="text-xs opacity-70 leading-relaxed">
                        Start a fresh session. All local data will be reset. Default PIN: 1969
                    </p>
                </div>
            </button>
        </div>

        {error && (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="mt-8 flex items-center justify-center gap-2 text-red-300 font-bold uppercase tracking-widest"
            >
                <AlertTriangle size={20} />
                {error}
            </motion.div>
        )}

        <div className="mt-12 text-center text-xs opacity-40 uppercase tracking-[0.2em]">
            Project Blue Beta // v2.1.0
        </div>

      </motion.div>
    </div>
  );
};
