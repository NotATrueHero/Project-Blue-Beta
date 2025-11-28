
import * as React from 'react';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Clock, Plus, Minus } from 'lucide-react';

type TimerMode = 'focus' | 'short' | 'long';

export const Chronos: React.FC = () => {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [duration, setDuration] = useState(25 * 60); // seconds
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Use a delta-time approach to be accurate even if tab is backgrounded
  const endTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Audio Context for Beep
  const playAlarm = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(440, ctx.currentTime + 0.2);
        
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
        console.error("Audio Alarm Failed", e);
    }
  };

  const setPreset = (m: TimerMode, minutes: number) => {
    setIsActive(false);
    setCompleted(false);
    setMode(m);
    setDuration(minutes * 60);
    setTimeLeft(minutes * 60);
    endTimeRef.current = null;
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  };

  const toggleTimer = () => {
    if (isActive) {
        // Pause
        setIsActive(false);
        endTimeRef.current = null;
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    } else {
        // Start
        if (completed) {
            // Reset if starting after completion
            setTimeLeft(duration);
            setCompleted(false);
        }
        setIsActive(true);
        endTimeRef.current = Date.now() + timeLeft * 1000;
        tick();
    }
  };

  const resetTimer = () => {
      setIsActive(false);
      setCompleted(false);
      setTimeLeft(duration);
      endTimeRef.current = null;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  };

  const adjustTime = (seconds: number) => {
      if (isActive) return;
      const newTime = Math.max(60, timeLeft + seconds);
      setTimeLeft(newTime);
      setDuration(newTime); // Update duration to match manual adjustment
  };

  const tick = () => {
      if (!endTimeRef.current) return;
      
      const now = Date.now();
      const remaining = Math.ceil((endTimeRef.current - now) / 1000);
      
      if (remaining <= 0) {
          setTimeLeft(0);
          setIsActive(false);
          setCompleted(true);
          playAlarm();
          endTimeRef.current = null;
      } else {
          setTimeLeft(remaining);
          animationFrameRef.current = requestAnimationFrame(tick);
      }
  };

  // Format MM:SS
  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (timeLeft / duration) : 0;
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress * circumference);

  return (
    <div className="w-full h-full pt-24 px-6 md:px-12 pb-12 max-w-7xl mx-auto flex flex-col items-center">
        
        {/* Header */}
        <div className="w-full border-b-2 border-white pb-6 mb-12 flex justify-between items-end">
             <div>
                <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter mb-2">Chronos</h1>
                <p className="text-sm md:text-base uppercase tracking-widest opacity-70">Tactical Focus Protocol</p>
             </div>
             <div className="hidden md:block text-xs font-mono opacity-60">
                 SYNC: {isActive ? 'ACTIVE' : 'STANDBY'} // {mode.toUpperCase()} MODE
             </div>
        </div>

        {/* Main Interface */}
        <div className="flex flex-col md:flex-row items-center gap-12 w-full max-w-4xl">
            
            {/* Visualizer */}
            <div className="relative flex items-center justify-center">
                {/* SVG Ring */}
                <div className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px]">
                    <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 300 300">
                        {/* Track */}
                        <circle
                            cx="150"
                            cy="150"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            className="text-white/10"
                        />
                        {/* Progress */}
                        <circle
                            cx="150"
                            cy="150"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="butt"
                            className={`transition-all duration-1000 ${completed ? 'text-green-400' : 'text-white'}`}
                        />
                    </svg>
                    
                    {/* Inner Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className={`text-6xl md:text-8xl font-bold font-mono tracking-tighter tabular-nums ${completed ? 'animate-pulse text-green-400' : ''}`}>
                            {formatTime(timeLeft)}
                        </div>
                        <div className="text-xs uppercase tracking-[0.3em] opacity-60 mt-4">
                            {completed ? 'SEQUENCE COMPLETE' : isActive ? 'COUNTDOWN ACTIVE' : 'SYSTEM STANDBY'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-8 w-full md:w-auto flex-1">
                
                {/* Presets */}
                <div className="grid grid-cols-3 gap-4">
                    <button 
                        onClick={() => setPreset('focus', 25)}
                        className={`border-2 border-white py-3 font-bold uppercase text-xs tracking-widest hover:bg-white hover:text-blue-base transition-colors ${mode === 'focus' ? 'bg-white text-blue-base' : ''}`}
                    >
                        Focus
                    </button>
                    <button 
                        onClick={() => setPreset('short', 5)}
                        className={`border-2 border-white py-3 font-bold uppercase text-xs tracking-widest hover:bg-white hover:text-blue-base transition-colors ${mode === 'short' ? 'bg-white text-blue-base' : ''}`}
                    >
                        Short
                    </button>
                    <button 
                        onClick={() => setPreset('long', 15)}
                        className={`border-2 border-white py-3 font-bold uppercase text-xs tracking-widest hover:bg-white hover:text-blue-base transition-colors ${mode === 'long' ? 'bg-white text-blue-base' : ''}`}
                    >
                        Long
                    </button>
                </div>

                {/* Adjustments */}
                <div className="flex justify-between items-center border-y border-white/20 py-4">
                    <button onClick={() => adjustTime(-60)} disabled={isActive} className="p-2 hover:text-blue-300 disabled:opacity-30"><Minus size={24} /></button>
                    <div className="font-mono text-xs opacity-50 uppercase tracking-widest">Adjust Duration</div>
                    <button onClick={() => adjustTime(60)} disabled={isActive} className="p-2 hover:text-blue-300 disabled:opacity-30"><Plus size={24} /></button>
                </div>

                {/* Playback */}
                <div className="flex gap-4">
                    <button 
                        onClick={toggleTimer}
                        className="flex-1 border-2 border-white py-4 flex items-center justify-center gap-2 font-bold uppercase tracking-widest hover:bg-white hover:text-blue-base transition-colors"
                    >
                        {isActive ? <Pause size={18} /> : <Play size={18} />}
                        {isActive ? 'Halt' : 'Execute'}
                    </button>
                    <button 
                        onClick={resetTimer}
                        className="w-16 border-2 border-white flex items-center justify-center hover:text-red-300 hover:border-red-300 transition-colors"
                    >
                        <RotateCcw size={18} />
                    </button>
                </div>

                {/* Info Box */}
                <div className="bg-white/5 p-4 border border-white/10 text-[10px] opacity-70 leading-relaxed font-mono">
                    <div className="flex items-center gap-2 mb-2 font-bold uppercase text-white/90">
                        <Clock size={12} /> Protocol Info
                    </div>
                    Use FOCUS cycles for high-intensity operations. Utilize SHORT rests to maintain cognitive efficiency. Ensure audio is enabled for cycle termination alerts.
                </div>

            </div>
        </div>
    </div>
  );
};