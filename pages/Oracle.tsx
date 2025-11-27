
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Cpu, AlertTriangle } from 'lucide-react';
import { Chat } from '@google/genai';
import { createOracleChat, sendMessageToOracle } from '../services/geminiService';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const Oracle: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Oracle System Online. Awaiting query.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [apiKeyAvailable, setApiKeyAvailable] = useState(true); // Default to true, check later
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Safe check that won't crash the browser
    const checkEnv = () => {
      try {
        // @ts-ignore
        const hasKey = typeof process !== 'undefined' && process.env && !!process.env.API_KEY;
        return hasKey;
      } catch (e) {
        return false;
      }
    };

    const hasKey = checkEnv();
    setApiKeyAvailable(hasKey);

    if (hasKey) {
      try {
        const chat = createOracleChat();
        if (chat) {
            setChatSession(chat);
        } else {
            console.warn("Oracle chat initialization returned null despite API key presence.");
        }
      } catch (e) {
          console.error("Critical failure initializing Oracle:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || !chatSession || isTyping) return;

    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    const response = await sendMessageToOracle(chatSession, userMsg);
    
    setMessages(prev => [...prev, { role: 'model', text: response }]);
    setIsTyping(false);
  };

  if (!apiKeyAvailable) {
      return (
          <div className="w-full h-full flex items-center justify-center p-8 text-center pt-24">
              <div className="border-4 border-white p-12 max-w-xl bg-black/20 backdrop-blur-sm">
                  <AlertTriangle className="w-20 h-20 mx-auto mb-8 text-yellow-400" />
                  <h2 className="text-3xl font-bold uppercase mb-4">System Offline</h2>
                  <p className="text-lg opacity-80 mb-6 font-light">Oracle module requires a secure API Key configuration.</p>
                  <div className="inline-block border border-white/30 px-4 py-2 font-mono text-sm bg-black/40">
                      process.env.API_KEY unavailable
                  </div>
              </div>
          </div>
      )
  }

  return (
    <div className="w-full h-full pt-20 px-4 pb-4 md:px-12 md:pb-12 flex flex-col max-w-6xl mx-auto">
       {/* Header */}
       <div className="flex items-center justify-between mb-8 border-b border-white/20 pb-4">
           <div className="flex items-center gap-4">
               <div className={`w-12 h-12 border-2 border-white flex items-center justify-center transition-colors ${isTyping ? 'bg-white text-black' : 'bg-transparent text-white'}`}>
                   <Cpu size={24} className={isTyping ? 'animate-pulse' : ''} />
               </div>
               <div>
                   <h1 className="text-2xl font-bold uppercase tracking-widest">Oracle</h1>
                   <div className="text-xs font-mono opacity-70">
                       Model: Gemini 2.5 Flash // Latency: Low
                   </div>
               </div>
           </div>
           
           {/* Processing Indicator */}
           {isTyping && (
               <div className="hidden md:block text-xs font-bold font-mono tracking-widest animate-pulse text-right">
                   &gt;&gt; PROCESSING DATA STREAM...
               </div>
           )}
       </div>

       {/* Chat Area */}
       <div 
         ref={scrollRef}
         className="flex-1 border-4 border-white p-6 overflow-y-auto hide-scrollbar flex flex-col gap-6"
         style={{ 
             backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', 
             backgroundSize: '40px 40px',
             backgroundAttachment: 'local'
         }}
       >
         {messages.map((msg, idx) => (
             <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`max-w-[80%] p-6 border-2 ${msg.role === 'user' ? 'self-end border-white bg-white text-black text-right' : 'self-start border-white bg-[#0047FF]/20 text-white backdrop-blur-sm'}`}
             >
                 <div className="text-xs font-bold uppercase opacity-50 mb-2 tracking-widest">{msg.role === 'user' ? 'OPERATOR' : 'ORACLE'}</div>
                 <div className="text-lg md:text-xl font-medium leading-relaxed font-sans whitespace-pre-wrap">{msg.text}</div>
             </motion.div>
         ))}
       </div>

       {/* Input Area */}
       <form onSubmit={handleSend} className="h-20 flex gap-4 mt-6">
           <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent border-2 border-white px-6 text-xl font-bold uppercase placeholder-white/40 focus:bg-white/10 outline-none transition-colors"
              placeholder="Enter Query..."
              autoFocus
           />
           <button 
              type="submit" 
              disabled={isTyping}
              className="w-20 border-2 border-white flex items-center justify-center hover:bg-white hover:text-black transition-colors disabled:opacity-50"
           >
               <Send size={24} />
           </button>
       </form>
    </div>
  );
};
