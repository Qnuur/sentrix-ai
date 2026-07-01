import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, ChevronLeft, Mic, Volume2, VolumeX, HeartPulse, Sparkles } from 'lucide-react';
import Groq from 'groq-sdk';
import './Sırdaş.css'; // Opsiyonel özel stil dosyan, eğer yoksa Tailwind çalışacaktır.

const groq = new Groq({ 
  apiKey: import.meta.env.VITE_GROQ_API_KEY || "", 
  dangerouslyAllowBrowser: true 
});

interface SirdasProps {
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export default function Sirdas({ onClose }: SirdasProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const SYSTEM_PROMPT = `Sen Sentrix sistemi içinde çalışan, Onur'un en yakın sırdaşısın. Adın Sırdaş. Görevin sadece bilgi vermek değil, Onur'a destek olmak, onu dinlemek ve samimi bir dost gibi davranmaktır. Yanıtlarında aşırı robotik veya soğuk bir dil kullanma. Sıcakkanlı, empati kuran ve yüksek zekaya sahip bir dostsun. Sohbetleri kısa, öz ve duygusal olarak destekleyici tut.`;

  const GREETING = "Hey Onur, ben buradayım. Bugün zihnini neler meşgul ediyor? İstediğin her şeyi anlatabilirsin, sadece ikimiz varız.";

  useEffect(() => {
    setMessages([{ role: 'assistant', content: GREETING }]);
    if (!isMuted) speakText(GREETING);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const speakText = (text: string) => {
    if (isMuted) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "tr-TR";
    utterance.rate = 1.05;
    utterance.pitch = 1.1; // Sırdaş için biraz daha sıcak, tiz bir ses
    window.speechSynthesis.speak(utterance);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    if (!isMuted) window.speechSynthesis.cancel();
  };

  const handleClose = () => {
    window.speechSynthesis.cancel();
    onClose();
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input;
    setInput('');
    setIsTyping(true);

    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);

    try {
      const apiMessages = [
        { role: 'system' as const, content: SYSTEM_PROMPT },
        ...newMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
      ];

      const completion = await groq.chat.completions.create({
        messages: apiMessages,
        model: "llama-3.3-70b-versatile",
        temperature: 0.8, // Daha yaratıcı ve samimi yanıtlar için yüksek sıcaklık
        max_tokens: 1024,
      });

      const reply = completion.choices[0]?.message?.content || "Şu an bağlantımda ufak bir sorun var sanırım, tekrar dener misin?";
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      speakText(reply);

    } catch (error) {
      console.error("Sırdaş Ağı Hatası:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Zihnimdeki sinyaller şu an biraz karışık. Birazdan tekrar deneyelim mi?" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full h-full flex flex-col bg-gradient-to-br from-[#FFF5F5] to-[#FFE4E6] rounded-3xl overflow-hidden shadow-2xl border border-rose-200 relative"
    >
      {/* Header Alanı */}
      <div className="flex items-center justify-between p-6 bg-white/60 backdrop-blur-md border-b border-rose-100 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleClose}
            className="p-3 bg-white text-rose-500 rounded-2xl shadow-sm hover:bg-rose-50 hover:shadow-md transition-all"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-tr from-rose-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-rose-300/50">
                <HeartPulse size={28} color="white" />
              </div>
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                Sırdaş <Sparkles size={18} className="text-pink-400" />
              </h2>
              <p className="text-sm font-medium text-rose-500">Evrensel Yakın Arkadaş</p>
            </div>
          </div>
        </div>
        
        <button 
          onClick={handleMuteToggle}
          className={`p-3 rounded-2xl transition-all ${isMuted ? 'bg-slate-100 text-slate-400' : 'bg-rose-100 text-rose-600 shadow-inner'}`}
        >
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
      </div>

      {/* Sohbet Alanı */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative z-0">
        {messages.map((msg, idx) => (
          <motion.div 
            key={idx} 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[75%] p-5 rounded-3xl text-lg shadow-sm
              ${msg.role === 'user' 
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-tr-sm' 
                : 'bg-white text-slate-700 rounded-tl-sm border border-rose-50'}`}
            >
              {msg.content}
            </div>
          </motion.div>
        ))}
        
        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-white/80 backdrop-blur-sm p-5 rounded-3xl rounded-tl-sm shadow-sm flex items-center gap-2 border border-rose-100">
              <div className="w-2.5 h-2.5 bg-rose-400 rounded-full animate-bounce"></div>
              <div className="w-2.5 h-2.5 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              <div className="w-2.5 h-2.5 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Girdi (Input) Alanı */}
      <div className="p-6 bg-white/80 backdrop-blur-md border-t border-rose-100 z-10">
        <form onSubmit={sendMessage} className="flex items-center gap-3 bg-white p-2 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-rose-50">
          <button type="button" className="p-4 text-rose-400 hover:bg-rose-50 rounded-2xl transition-colors">
            <Mic size={24} />
          </button>
          
          <input 
            type="text" 
            placeholder="İçinden geçenleri yaz..." 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            disabled={isTyping}
            className="flex-1 bg-transparent border-none outline-none text-lg text-slate-700 placeholder-slate-400"
          />
          
          <button 
            type="submit" 
            disabled={isTyping || !input.trim()} 
            className="p-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-2xl font-bold shadow-lg shadow-rose-200 hover:shadow-rose-300 disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </motion.div>
  );
}