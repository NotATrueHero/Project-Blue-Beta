
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Cpu, AlertTriangle, Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react';
import { createOracleChat, sendMessageToOracle, ChatSession, Attachment, getApiKey } from '../services/geminiService';

interface Message {
  role: 'user' | 'model';
  text: string;
  attachment?: {
      mimeType: string;
      previewUrl: string;
      name: string;
  };
}

interface PendingAttachment {
    file: File;
    previewUrl: string;
    base64Data: string; // Data without prefix for API
}

export const Oracle: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Oracle System Online. Awaiting query.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [attachment, setAttachment] = useState<PendingAttachment | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Check for API key in local storage (Project Blue config)
  const apiKeyAvailable = !!getApiKey();

  useEffect(() => {
    if (apiKeyAvailable) {
      setChatSession(createOracleChat());
    }
  }, [apiKeyAvailable]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, attachment]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
          alert("File too large. Maximum size is 5MB.");
          return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
          const result = ev.target?.result as string;
          // Split data URI to get raw base64 for API
          const base64Data = result.split(',')[1];
          
          setAttachment({
              file: file,
              previewUrl: result,
              base64Data: base64Data
          });
      };
      reader.readAsDataURL(file);
      
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearAttachment = () => {
      setAttachment(null);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && !attachment) || !chatSession || isTyping) return;

    const userMsgText = input;
    const currentAttachment = attachment;
    
    // Construct local display message
    const newMessage: Message = { 
        role: 'user', 
        text: userMsgText
    };

    let apiAttachment: Attachment | undefined;

    if (currentAttachment) {
        newMessage.attachment = {
            mimeType: currentAttachment.file.type,
            previewUrl: currentAttachment.previewUrl,
            name: currentAttachment.file.name
        };
        apiAttachment = {
            mimeType: currentAttachment.file.type,
            data: currentAttachment.base64Data
        };
    }

    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setAttachment(null);
    setIsTyping(true);

    const response = await sendMessageToOracle(chatSession, userMsgText, apiAttachment);
    
    setMessages(prev => [...prev, { role: 'model', text: response }]);
    setIsTyping(false);
  };

  if (!apiKeyAvailable) {
      return (
          <div className="w-full h-full flex items-center justify-center p-8 text-center pt-24">
              <div className="border-4 border-white p-12 max-w-xl bg-black/40 backdrop-blur-md">
                  <AlertTriangle className="w-20 h-20 mx-auto mb-8 text-yellow-400" />
                  <h2 className="text-3xl font-bold uppercase mb-4">System Offline</h2>
                  <p className="text-lg opacity-80 mb-6 font-light">Oracle module requires a secure API Key configuration.</p>
                  <div className="inline-block border border-white/50 px-4 py-2 font-mono text-sm uppercase tracking-widest">Access Config Panel</div>
              </div>
          </div>
      )
  }

  return (
    <div className="w-full h-full pt-20 px-4 pb-4 md:px-12 md:pb-12 flex flex-col max-w-6xl mx-auto">
       {/* Header */}
       <div className="flex items-center justify-between mb-8 border-b border-white/20 pb-4">
           <div className="flex items-center gap-4">
               <div className={`w-12 h-12 border-2 border-white flex items-center justify-center transition-colors ${isTyping ? 'bg-white text-blue-base' : 'bg-transparent text-white'}`}>
                   <Cpu size={24} className={isTyping ? 'animate-pulse' : ''} />
               </div>
               <div>
                   <h1 className="text-2xl font-bold uppercase tracking-widest">Oracle</h1>
                   <div className="text-xs font-mono opacity-70">
                       Model: Gemini 1.5 Flash // Latency: Low
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
                className={`max-w-[80%] p-6 border-2 shadow-[0_0_15px_rgba(0,0,0,0.3)] ${msg.role === 'user' ? 'self-end border-white bg-white text-blue-base text-right' : 'self-start border-white bg-[#0047FF]/20 text-white backdrop-blur-sm'}`}
             >
                 <div className="text-[10px] font-bold uppercase opacity-50 mb-2 tracking-widest">{msg.role === 'user' ? 'OPERATOR' : 'ORACLE'}</div>
                 
                 {/* Attachment Display */}
                 {msg.attachment && (
                     <div className={`mb-3 flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                         {msg.attachment.mimeType.startsWith('image/') ? (
                             <img 
                                src={msg.attachment.previewUrl} 
                                alt="attachment" 
                                className="max-w-full max-h-[300px] border border-current opacity-90"
                             />
                         ) : (
                             <div className="flex items-center gap-2 border border-current px-3 py-2 text-xs font-bold uppercase">
                                 <FileText size={16} />
                                 {msg.attachment.name}
                             </div>
                         )}
                     </div>
                 )}

                 <div className="text-lg md:text-xl font-medium leading-relaxed font-sans whitespace-pre-wrap">{msg.text}</div>
             </motion.div>
         ))}
       </div>

       {/* Input Area */}
       <div className="mt-6 flex flex-col gap-2">
           {/* Preview Area */}
           <AnimatePresence>
               {attachment && (
                   <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 bg-white/10 border border-white p-2 w-max max-w-full"
                   >
                        {attachment.file.type.startsWith('image/') ? (
                            <img src={attachment.previewUrl} alt="preview" className="h-12 w-12 object-cover border border-white/50" />
                        ) : (
                            <div className="h-12 w-12 flex items-center justify-center border border-white/50 bg-white/5">
                                <FileText size={24} />
                            </div>
                        )}
                        <div className="flex flex-col min-w-0 mr-4">
                            <span className="text-xs font-bold uppercase truncate max-w-[200px]">{attachment.file.name}</span>
                            <span className="text-[10px] font-mono opacity-60">{(attachment.file.size / 1024).toFixed(1)} KB</span>
                        </div>
                        <button onClick={clearAttachment} className="p-1 hover:bg-white hover:text-blue-base transition-colors">
                            <X size={16} />
                        </button>
                   </motion.div>
               )}
           </AnimatePresence>

           <form onSubmit={handleSend} className="h-20 flex gap-4">
               {/* Hidden File Input */}
               <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,application/pdf"
               />

               <div className="flex-1 flex gap-2 relative">
                   <input 
                      type="text" 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="w-full h-full bg-transparent border-2 border-white pl-6 pr-14 text-xl font-bold uppercase placeholder-white/40 focus:bg-white/10 outline-none transition-colors"
                      placeholder={attachment ? "Add context..." : "Enter Query..."}
                      autoFocus
                   />
                   
                   {/* Attachment Button */}
                   <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute right-4 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 hover:text-blue-300 transition-all"
                      title="Attach File"
                   >
                       <Paperclip size={20} />
                   </button>
               </div>

               <button 
                  type="submit" 
                  disabled={isTyping || (!input.trim() && !attachment)}
                  className="w-20 border-2 border-white flex items-center justify-center hover:bg-white hover:text-blue-base transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-white"
               >
                   <Send size={24} />
               </button>
           </form>
       </div>
    </div>
  );
};
