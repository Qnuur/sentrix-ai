import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send } from 'lucide-react';

interface FloatingChatProps {
  onSendMessage: (text: string) => void;
  chatHistory: { role: string; content: string }[];
  systemActive: boolean;
}

export default function FloatingChat({ onSendMessage, chatHistory, systemActive }: FloatingChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !systemActive) return;
    onSendMessage(inputValue);
    setInputValue("");
  };

  if (!systemActive) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4 w-80 h-96 bg-[#12141C]/95 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl"
          >
            <div className="bg-[#090A0F] p-4 border-b border-white/10 flex justify-between items-center">
              <span className="text-xs font-bold tracking-widest text-cyan-400">SENTRİX TERMİNALİ</span>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition"><X size={16} /></button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 custom-scrollbar">
              {chatHistory.length === 0 ? (
                <div className="text-xs text-gray-500 text-center mt-10">Bana bir şeyler sor veya "Hey Sentrix" de.</div>
              ) : (
                chatHistory.map((msg, i) => (
                  <div key={i} className={`p-3 rounded-lg text-sm max-w-[85%] ${msg.role === 'user' ? 'bg-cyan-500/20 text-cyan-100 self-end rounded-tr-none' : 'bg-white/5 text-gray-200 self-start rounded-tl-none'}`}>
                    <span className="text-[10px] opacity-50 block mb-1">{msg.role === 'user' ? 'SEN' : 'SENTRİX'}</span>
                    {msg.content}
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSubmit} className="p-3 border-t border-white/10 bg-[#090A0F] flex gap-2">
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Mesaj yazın..." 
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
              <button type="submit" className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500 hover:text-white transition"><Send size={18} /></button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 bg-[#12141C] border border-white/10 rounded-full text-white shadow-[0_0_20px_rgba(34,211,238,0.15)] hover:border-cyan-500 transition-colors"
      >
        <MessageSquare size={28} color={isOpen ? "#22d3ee" : "white"} />
      </motion.button>
    </div>
  );
}