import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { 
  ChevronLeft, Send, Database, Network, Code2, 
  TerminalSquare, BrainCircuit, PlayCircle, Volume2, VolumeX,
  Copy, Check, RefreshCw, MousePointer2, Mic, MicOff, Activity
} from "lucide-react";

import "./ProfNoral.css";

// --- %100 Tip Güvenli (Type-Safe) ve İzole Web Speech API Tanımlamaları ---
interface ISpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: {
    transcript: string;
  };
  length: number;
}

interface ISpeechRecognitionResultList {
  [index: number]: ISpeechRecognitionResult;
  length: number;
}

interface ISpeechRecognitionEvent extends Event {
  results: ISpeechRecognitionResultList;
  resultIndex: number;
}

interface ISpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface ISpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: ISpeechRecognition, ev: ISpeechRecognitionEvent) => void) | null;
  onerror: ((this: ISpeechRecognition, ev: ISpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => void) | null;
}

interface IWindowWithSpeech {
  SpeechRecognition?: new () => ISpeechRecognition;
  webkitSpeechRecognition?: new () => ISpeechRecognition;
}
// -----------------------------------------------------------------

interface ProfNoralProps {
  onClose: () => void;
}

interface Message {
  role: string;
  content: string;
  attempt?: number;
  timestamp: string;
}

export default function ProfNoral({ onClose }: ProfNoralProps) {
  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "assistant", 
      content: "Sentrix'e hoş geldin! Ben Prof. Sentrix. Derin Öğrenme veritabanımız yüklendi. Sadece müfredat dahilindeki konular hakkında konuşabilirim.",
      timestamp: getCurrentTime()
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [codeContent, setCodeContent] = useState("# Öğrenci Çalışma Alanı\nimport torch\nimport torch.nn as nn\n\n# Derin öğrenme kodlarınızı buraya yazın...\n");

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const isMutedRef = useRef(false);

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");
  
  const [isListening, setIsListening] = useState<boolean>(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const utterancesRef = useRef<SpeechSynthesisUtterance[]>([]);
  
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- GELİŞTİRİLMİŞ HİBRİT PING SİSTEMİ (SIFIR KONSOL HATASI) ---
  const [lastPing, setLastPing] = useState<number | null>(null);
  const [livePing, setLivePing] = useState<number>(0);
  const [isPingActive, setIsPingActive] = useState<boolean>(false);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Arka Planda Sessizce Bağlantı Hızını Ölçer
  useEffect(() => {
    const checkIdleConnection = async () => {
      if (isPingActive) return; 
      
      const start = performance.now();
      try {
        // ARTIK 405 HATASI VERMEYEN YENİ /ping ROTASINA GİDİYOR
        const res = await fetch("http://localhost:8000/ping");
        if (res.ok) setLastPing(Math.round(performance.now() - start));
      } catch {
        setLastPing(9999);
      }
    };

    checkIdleConnection(); 
    const idleInterval = setInterval(checkIdleConnection, 5000); // 5 saniyede bir kontrol
    return () => clearInterval(idleInterval);
  }, [isPingActive]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    };
  }, []);

  const toggleGlobalMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    isMutedRef.current = newMutedState; 
    
    if (newMutedState) {
       window.speechSynthesis.cancel(); 
       utterancesRef.current = []; 
    }
  };

  const speakText = (text: string, clearQueue: boolean = true, forcePlay: boolean = false) => {
    if (isMutedRef.current && !forcePlay) {
      window.speechSynthesis.cancel(); 
      return; 
    }
    
    if (clearQueue) {
      window.speechSynthesis.cancel(); 
      utterancesRef.current = []; 
    }
    
    const cleanTextToSpeak = text.split("\n\n[Akademik")[0];
    if (!cleanTextToSpeak.trim()) return;

    const utterance = new SpeechSynthesisUtterance(cleanTextToSpeak);
    utterance.lang = "tr-TR";
    utterance.rate = 1.05;
    
    if (selectedVoiceURI) {
      const chosenVoice = availableVoices.find(v => v.voiceURI === selectedVoiceURI);
      if (chosenVoice) utterance.voice = chosenVoice;
    } else {
      if (availableVoices.length > 0) {
          const academicVoice = availableVoices.find(v => v.name.includes('Tolga') || v.name.toLowerCase().includes('male'));
          if (academicVoice) utterance.voice = academicVoice;
          utterance.pitch = 0.9;
      }
    }

    utterancesRef.current.push(utterance);
    
    utterance.onend = () => {
      utterancesRef.current = utterancesRef.current.filter(u => u !== utterance);
    };

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const loadVoices = () => {
      setAvailableVoices(window.speechSynthesis.getVoices().filter(v => v.lang.includes('tr') || v.lang.includes('en')));
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    speakText(messages[0].content, true, false);
  }, []);

  const speakSelectedText = () => {
    const selectedText = window.getSelection()?.toString();
    if (selectedText && selectedText.trim() !== "") {
      speakText(selectedText, true, true); 
    } else {
      alert("Lütfen okunmasını istediğiniz metni farenizle seçin.");
    }
  };

  const toggleListening = () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      return;
    }

    const win = window as unknown as IWindowWithSpeech;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRec) {
      alert("Tarayıcınız ses tanıma özelliğini desteklemiyor. Lütfen Chrome, Edge veya Safari kullanın.");
      return;
    }

    const recognition = new SpeechRec();
    recognitionRef.current = recognition;
    recognition.lang = 'tr-TR';
    recognition.continuous = true; 
    recognition.interimResults = true; 

    recognition.onstart = () => {
      setIsListening(true);
      window.speechSynthesis.cancel(); 
      utterancesRef.current = [];
    };

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      let currentTranscript = "";

      for (let i = 0; i < event.results.length; ++i) {
        currentTranscript += event.results[i][0].transcript;
      }
      
      setInputText(currentTranscript);

      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }

      silenceTimeoutRef.current = setTimeout(() => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        setIsListening(false);
        handleSend(currentTranscript, messagesRef.current, 0);
      }, 2000);
    };

    recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
      console.error("Mikrofon hatası:", event.error);
      if (event.error === 'not-allowed') {
        alert("Mikrofon erişimi reddedildi! Lütfen adres çubuğundaki kilit (🔒) simgesine tıklayarak mikrofona izin verin.");
      } else if (event.error === 'network') {
        alert("Ağ bağlantısı hatası! Tarayıcınız sesi metne çevirmek için sunucuya ulaşamıyor. VPN veya AdBlock varsa kapatıp Edge'de deneyin.");
      }
      if (event.error !== 'no-speech') {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleSend = async (text: string, currentHistory: Message[], attemptCount: number = 0) => {
    if (!text.trim() || isTyping) return;
    
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const newMessages = [...currentHistory, { role: "user", content: text, attempt: attemptCount, timestamp: getCurrentTime() }];
    setMessages(newMessages);
    setInputText(""); 
    setIsTyping(true);
    
    if (attemptCount === 0) speakText(text, true, false); 

    const startTime = performance.now();
    setIsPingActive(true);
    setLivePing(0);
    
    pingIntervalRef.current = setInterval(() => {
      setLivePing(Math.round(performance.now() - startTime));
    }, 50);

    try {
      const res = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text, attempt: attemptCount }),
      });
      
      const endTime = performance.now();
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      
      const finalPing = Math.round(endTime - startTime);
      setLastPing(finalPing);
      setIsPingActive(false);

      const data = await res.json();
      const aiReply = `${data.result}\n\n[Akademik Veri Eşleşmesi: ${data.confidence}]`;
      
      setMessages([...newMessages, { role: "assistant", content: aiReply, timestamp: getCurrentTime() }]);
      speakText(data.result, false, false);

    } catch (error) {
      console.error("Hata:", error);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      setIsPingActive(false);
      setLastPing(9999); 
      const errorMsg = "Lokal laboratuvar sunucusuna bağlanılamadı.";
      setMessages([...newMessages, { role: "assistant", content: errorMsg, timestamp: getCurrentTime() }]);
      speakText(errorMsg, false, false); 
    } finally {
      setIsTyping(false);
    }
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(inputText, messages, 0);
  };

  const copyToClipboard = (text: string, index: number) => {
    const cleanText = text.split("\n\n[Akademik")[0];
    navigator.clipboard.writeText(cleanText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const regenerateMessage = (index: number) => {
    const userMsgIndex = index - 1;
    if (userMsgIndex >= 0 && messages[userMsgIndex].role === 'user') {
      const userText = messages[userMsgIndex].content;
      const history = messages.slice(0, userMsgIndex);
      
      const currentAttempt = messages[userMsgIndex].attempt || 0;
      const nextAttempt = currentAttempt + 1;
      
      handleSend(userText, history, nextAttempt);
    }
  };

  const currentDisplayPing = isPingActive ? livePing : lastPing;

  const getPingColor = () => {
    if (currentDisplayPing === null) return "text-slate-400 border-slate-200 bg-slate-50";
    if (currentDisplayPing > 3000) return "text-red-500 border-red-200 bg-red-50";
    if (currentDisplayPing > 1000) return "text-yellow-600 border-yellow-200 bg-yellow-50";
    return "text-green-600 border-green-200 bg-green-50";
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="neural-fullscreen-wrapper custom-scrollbar"
    >
      <div className="neural-chat-section">
        <div className="neural-header">
          <div className="neural-header-title-container">
             <div className="p-3 bg-blue-50 rounded-xl flex-shrink-0">
               <Database size={28} className="text-[#007AFF]"/>
             </div>
             <div className="neural-title-text">
               <h3>Sentrix Workspace</h3>
               <p>100%  TRANSFORMER NLP</p>
             </div>
          </div>
          
          <div className="neural-header-controls">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${getPingColor()}`} title="Backend Gecikme Süresi (Latency)">
              <Activity size={14} className={isPingActive ? "animate-pulse" : ""} />
              {currentDisplayPing !== null ? `${currentDisplayPing} ms` : "Ölçülüyor..."}
            </div>

            <button 
              onClick={speakSelectedText}
              className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-colors flex items-center gap-2 font-bold text-sm"
              title="Ekranda seçtiğiniz metni sesli okur"
            >
              <MousePointer2 size={16} /> Seçimi Oku
            </button>

            <select 
              className="p-2 bg-[#f1f5f9] border border-[#cbd5e1] rounded-lg text-sm outline-none text-[#0f172a] font-bold" 
              value={selectedVoiceURI} 
              onChange={(e) => setSelectedVoiceURI(e.target.value)}
            >
              <option value="">Akademik Ses</option>
              {availableVoices.map(v => <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>)}
            </select>
            <button 
              onClick={toggleGlobalMute} 
              className={`p-2 rounded-lg transition-colors flex-shrink-0 ${isMuted ? 'bg-red-100 text-red-500' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <button onClick={() => { window.speechSynthesis.cancel(); onClose(); }} className="neural-back-btn flex-shrink-0">
              <ChevronLeft size={20}/> HUB'A DÖN
            </button>
          </div>
        </div>
        
        <div className="neural-messages custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`neural-msg ${msg.role === 'user' ? 'user' : 'ai'}`}>
               <div className="flex justify-between items-center mb-2">
                 <span className="neural-msg-tag mb-0">
                   {msg.role === 'user' ? <TerminalSquare size={14}/> : <BrainCircuit size={14}/>}
                   {msg.role === 'user' ? 'ÖĞRENCİ' : 'PROF. NÖRAL'}
                 </span>
                 <span className="text-[0.65rem] opacity-70 font-mono tracking-wider">
                   {msg.timestamp}
                 </span>
               </div>
               
               <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
               
               <div className={`flex gap-3 mt-3 pt-2 opacity-80 ${msg.role === 'user' ? 'justify-start border-t border-blue-400' : 'justify-end border-t border-slate-200'}`}>
                 <button 
                   onClick={() => speakText(msg.content, true, true)} 
                   className={`${msg.role === 'user' ? 'text-blue-100 hover:text-white' : 'text-slate-500 hover:text-[#007AFF]'} transition-colors`} 
                   title="Bu mesajı sesli oku"
                 >
                   <Volume2 size={16}/>
                 </button>

                 <button 
                   onClick={() => copyToClipboard(msg.content, idx)} 
                   className={`${msg.role === 'user' ? 'text-blue-100 hover:text-white' : 'text-slate-500 hover:text-[#007AFF]'} transition-colors`} 
                   title="Metni Kopyala"
                 >
                   {copiedIndex === idx ? <Check size={16} className={msg.role === 'user' ? 'text-white' : 'text-green-500'}/> : <Copy size={16}/>}
                 </button>
                 
                 {msg.role === 'assistant' && idx > 0 && (
                   <button 
                     onClick={() => regenerateMessage(idx)} 
                     className="text-slate-500 hover:text-[#007AFF] transition-colors" 
                     title="Farklı Bir Cevap Üret"
                   >
                     <RefreshCw size={16}/>
                   </button>
                 )}
               </div>
            </div>
          ))}
          {isTyping && <div className="neural-msg ai animate-pulse">Vektör Veritabanı taranıyor...</div>}
          <div ref={messagesEndRef} />
        </div>

        <div className="neural-input-area">
           <form className="w-full flex gap-4" onSubmit={onFormSubmit}>
              <input 
                type="text" 
                placeholder={isListening ? "🎙️ Sizi dinliyorum..." : "Derin öğrenme kavramlarını sorunuz..."} 
                value={inputText} 
                onChange={(e) => setInputText(e.target.value)} 
                disabled={isTyping} 
                className={`neural-input transition-all duration-300 ${
                  isListening ? 'bg-red-50/50 border-red-300 placeholder-red-400 text-red-900 shadow-inner' : ''
                }`}
              />
              
              <button 
                type="button" 
                onClick={toggleListening}
                disabled={isTyping}
                className={`flex items-center justify-center w-14 h-[3.5rem] rounded-xl flex-shrink-0 transition-all duration-300 ${
                  isListening 
                    ? 'bg-gradient-to-br from-red-400 to-red-500 text-white animate-pulse shadow-lg scale-105' 
                    : 'bg-gradient-to-br from-[#e0f2fe] to-[#bae6fd] text-[#0284c7] hover:shadow-md hover:scale-105'
                }`}
                title={isListening ? "Dinlemeyi Durdur" : "Sesli Soru Sor"}
              >
                {isListening ? <MicOff size={24} /> : <Mic size={24} />}
              </button>

              <button type="submit" disabled={isTyping || isListening} className="neural-send-btn flex-shrink-0 h-[3.5rem]">
                <Send size={24}/>
              </button>
           </form>
        </div>
      </div>

      <div className="neural-side-section">
         <div className="neural-modules">
            <h3 className="text-white font-black text-lg mb-4 flex items-center gap-2">
              <Network size={20} className="text-[#00C6FF]"/> Akademik Müfredat
            </h3>
            <div className="flex flex-col gap-2">
               <button type="button" onClick={() => handleSend("CNN (Evrişimli Sinir Ağları) mimarisi nasıl çalışır?", messages, 0)} className="neural-lesson-btn">
                 1. CNN ve Uzamsal Algı
               </button>
               <button type="button" onClick={() => handleSend("RNN ve LSTM arasındaki farklar nelerdir?", messages, 0)} className="neural-lesson-btn">
                 2. Sıralı Veri ve Bellek
               </button>
               <button type="button" onClick={() => handleSend("Geri Yayılım (Backpropagation) algoritması nedir?", messages, 0)} className="neural-lesson-btn">
                 3. Optimizasyon Temelleri
               </button>
            </div>
         </div>

         <div className="neural-editor">
            <div className="neural-editor-header">
              <span className="flex items-center gap-2"><Code2 size={16}/> model_lab.py</span>
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
              </div>
            </div>
            <textarea 
              className="neural-textarea custom-scrollbar" 
              value={codeContent} 
              onChange={(e) => setCodeContent(e.target.value)} 
              spellCheck="false"
            />
            <button onClick={() => alert("Model Simülasyonu Başlatıldı: \n(Lokal derleme başarılı!)")} className="neural-run-btn">
              <PlayCircle size={20}/> KODU DERLE
            </button>
         </div>
      </div>
    </motion.div>
  );
}