
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Cpu, AlertTriangle, RefreshCw } from 'lucide-react';
import { createOracleChat, sendMessageToOracle, ChatSession } from '../services/geminiService';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const MODELS = [
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash' }
];

export const Oracle: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Oracle System Online. Awaiting query.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [modelIndex, setModelIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const currentModel = MODELS[modelIndex];

  // Check both env and local storage
  const apiKeyAvailable = !!(process.env.API_KEY || localStorage.getItem('blue_api_key'));

  useEffect(() => {
    if (apiKeyAvailable) {
      setChatSession(createOracleChat());
    }
  }, [apiKeyAvailable]);

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

    const response = await sendMessageToOracle(chatSession, userMsg, currentModel.id);
    
    setMessages(prev => [...prev, { role: 'model', text: response }]);
    setIsTyping(false);
  };

  const cycleModel = () => {
      setModelIndex((prev) => (prev + 1) % MODELS.length);
  };

  if (!apiKeyAvailable) {
      return (
          <div className="w-full h-full flex items-center justify-center p-8 text-center">
              <div className="border-4 border-white p-12 max-w-xl">
                  <AlertTriangle className="w-20 h-20 mx-auto mb-8" />
                  <h2 className="text-3xl font-bold uppercase mb-4">System Offline</h2>
                  <p className="text-lg opacity-80 mb-6">Oracle module requires a valid API Key configuration in the Config menu or environment variables.</p>
                  <div className="inline-block border px-4 py-2 font-mono text-sm">API Key Missing</div>
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
                   <button 
                       onClick={cycleModel}
                       className="flex items-center gap-2 text-xs font-mono opacity-70 hover:opacity-100 hover:text-blue-300 transition-colors text-left"
                       title="Click to switch model"
                   >
                       Model: {currentModel.name} <RefreshCw size={10} />
                   </button>
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
