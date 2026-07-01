import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BrainCircuit, LayoutDashboard, TerminalSquare, Activity, 
  Power, Cpu, Database, Network, Server, 
  Volume2, Mic, AlertTriangle, User, Clock,
  Radio, Sparkles, Waves, ChevronRight
} from "lucide-react";
import Groq from "groq-sdk";
import VoiceEngine from "./components/VoiceEngine";
import ChatTerminal from "./components/ChatTerminal";
// HATA BURADAYDI: "story" yerine dosya adının tam hali olan "Story" yazıldı.
import Story from "./story/story"; 

const groq = new Groq({ 
  apiKey: import.meta.env.VITE_GROQ_API_KEY || "", 
  dangerouslyAllowBrowser: true 
});

let synthUtterances: SpeechSynthesisUtterance[] = [];

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
  timestamp?: Date;
}

interface GlassPanelProps {
  title: string;
  children: React.ReactNode;
  isActive: boolean;
  delay?: number;
}

const PALETTE = {
  bg70: "#090A0F", 
  bgPanel: "#12141C", 
  glassBorder: "rgba(255, 255, 255, 0.08)",
  accentBlue: "#3B82F6", 
  accentGreen: "#10B981", 
  accentRed: "#EF4444", 
  accentYellow: "#F59E0B", 
  accentCyan: "#06B6D4",
  textWhite: "#F8FAFC",
  textMuted: "#94A3B8"
};

const GlassPanel: React.FC<GlassPanelProps> = ({ title, children, isActive, delay = 0 }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: isActive ? 1 : 0.3, y: 0 }}
    transition={{ duration: 0.6, delay }}
    className={`relative flex flex-col overflow-hidden rounded-xl border bg-[#12141C]/80 backdrop-blur-xl transition-all duration-700 ${isActive ? 'grayscale-0' : 'grayscale'}`}
    style={{ borderColor: PALETTE.glassBorder }}
  >
    <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: PALETTE.glassBorder, backgroundColor: "rgba(0,0,0,0.2)" }}>
      <span className="text-[10px] font-bold tracking-[0.3em] text-white/70">{title}</span>
      <div className="flex gap-1">
        <div className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500/50' : 'bg-red-500/30'}`} />
        <div className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500/50' : 'bg-red-500/30'}`} />
      </div>
    </div>
    <div className="p-5 flex-1">{children}</div>
  </motion.div>
);

const HolographicGlobe3D: React.FC<{ isActive: boolean; status: string }> = ({ isActive, status }) => {
  const getStatusColor = () => {
    if (!isActive) return PALETTE.accentRed;
    if (status === "İŞLENİYOR") return PALETTE.accentYellow;
    if (status === "DİNLİYOR") return PALETTE.accentBlue;
    if (status === "KONUŞUYOR") return PALETTE.accentGreen;
    return PALETTE.textWhite; 
  };

  const currentColor = getStatusColor();

  return (
    <div className="relative flex items-center justify-center" style={{ width: 500, height: 500, perspective: "1200px" }}>
      <motion.div 
        className="absolute inset-0 rounded-full opacity-20 blur-[100px] transition-colors duration-1000"
        style={{ backgroundColor: currentColor }}
        animate={isActive ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 4, repeat: Infinity }}
      />

      <motion.div 
        className="absolute inset-0 flex items-center justify-center"
        style={{ transformStyle: "preserve-3d", opacity: isActive ? 1 : 0.05 }}
        animate={isActive ? { rotateY: 360, rotateX: 20 } : { rotateY: 0, rotateX: 0 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {[0, 30, 60, 90, 120, 150].map((deg) => (
          <div 
            key={`meridian-${deg}`}
            className="absolute rounded-full border transition-colors duration-500"
            style={{ 
              width: 420, height: 420, 
              transform: `rotateY(${deg}deg)`, 
              borderColor: isActive ? `rgba(255,255,255,0.12)` : "rgba(239, 68, 68, 0.15)" 
            }}
          />
        ))}

        {[-60, -30, 0, 30, 60].map((deg) => (
          <div 
            key={`equator-${deg}`}
            className="absolute rounded-full border transition-colors duration-500"
            style={{ 
              width: 420 * Math.cos(deg * (Math.PI / 180)), 
              height: 420 * Math.cos(deg * (Math.PI / 180)), 
              transform: `rotateX(90deg) translateZ(${420/2 * Math.sin(deg * (Math.PI / 180))}px)`, 
              borderColor: isActive ? "rgba(255,255,255,0.12)" : "rgba(239, 68, 68, 0.15)" 
            }}
          />
        ))}
      </motion.div>

      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        style={{ transformStyle: "preserve-3d" }}
        animate={isActive ? { rotateY: -360, rotateZ: 10 } : {}}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        {[15, 45, 75, 105, 135].map((deg) => (
          <div 
            key={`inner-${deg}`}
            className="absolute rounded-full border border-dashed"
            style={{ 
              width: 300, height: 300, 
              transform: `rotateY(${deg}deg)`, 
              borderColor: isActive ? `rgba(6,182,212,0.15)` : "rgba(239, 68, 68, 0.1)" 
            }}
          />
        ))}
      </motion.div>

      <motion.div
        className="relative z-10 flex flex-col items-center justify-center rounded-full bg-[#090A0F] border-2 shadow-2xl transition-all duration-700 overflow-hidden"
        style={{ 
          width: 160, height: 160, 
          borderColor: currentColor,
          boxShadow: isActive ? `0 0 60px ${currentColor}40, inset 0 0 30px ${currentColor}20` : 'none'
        }}
        animate={isActive && (status === "DİNLİYOR" || status === "KONUŞUYOR") ? { scale: [1, 1.08, 1] } : { scale: 1 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        {isActive && (
          <motion.div 
            className="absolute inset-0 opacity-30"
            style={{ background: `linear-gradient(to bottom, transparent, ${currentColor}, transparent)` }}
            animate={{ y: ["-100%", "100%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        )}

        <BrainCircuit size={48} color={currentColor} className={`transition-all duration-500 z-10 ${status === "İŞLENİYOR" ? "animate-pulse" : ""}`} />
        <span className="text-[10px] font-bold tracking-[0.4em] mt-4 z-10 transition-colors duration-500" style={{ color: currentColor }}>
          {status}
        </span>
      </motion.div>

      <motion.div 
        className="absolute rounded-full border-t-2 border-l-2 border-r-2 border-dashed transition-all duration-1000"
        style={{ 
          width: 460, height: 460, 
          borderColor: isActive ? PALETTE.textMuted : PALETTE.accentRed,
          opacity: isActive ? 0.3 : 0.05
        }}
        animate={isActive ? { rotateZ: -360 } : { rotateZ: 0 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
};

const VoiceDialogPanel: React.FC<{
  transcript: string;
  aiResponse: string;
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  systemActive: boolean;
}> = ({ transcript, aiResponse, isListening, isSpeaking, isProcessing, systemActive }) => {
  return (
    <div className="w-full max-w-2xl">
      <AnimatePresence mode="wait">
        {systemActive && (transcript || aiResponse || isProcessing) && (
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 30, scale: 0.95 }} 
            transition={{ duration: 0.4 }}
            className="w-full flex flex-col gap-4"
          >
            <AnimatePresence>
              {transcript && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="w-full bg-[#12141C]/90 border border-white/10 border-l-4 rounded-xl p-5 backdrop-blur-xl shadow-2xl"
                  style={{ borderLeftColor: isListening ? PALETTE.accentYellow : PALETTE.accentBlue }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isListening ? 'bg-yellow-500/20' : 'bg-blue-500/20'}`}>
                      {isListening ? <Waves size={12} color={PALETTE.accentYellow} /> : <Mic size={12} color={PALETTE.accentBlue} />}
                    </div>
                    <span className="text-white/60 text-[10px] font-bold tracking-[0.3em]">
                      {isListening ? 'DİNLENİYOR...' : 'KOMUTUNUZ'}
                    </span>
                    <span className="text-[9px] text-white/30 font-mono ml-auto">{new Date().toLocaleTimeString('tr-TR')}</span>
                  </div>
                  <span className={`text-lg font-medium leading-relaxed ${isListening ? 'text-yellow-200/80' : 'text-white'}`}>
                    {transcript}
                    {isListening && (
                      <motion.span
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="inline-block w-0.5 h-5 bg-yellow-400 ml-1 align-middle"
                      />
                    )}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isProcessing && !aiResponse && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full bg-[#12141C]/80 border border-yellow-500/20 rounded-xl p-4 backdrop-blur-xl"
                >
                  <div className="flex items-center gap-3">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                      <Sparkles size={18} color={PALETTE.accentYellow} />
                    </motion.div>
                    <span className="text-sm text-yellow-400/80 font-medium">Sentrix düşünüyor...</span>
                    <div className="flex gap-1 ml-auto">
                      {[0, 1, 2].map(i => (
                        <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-yellow-400" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {aiResponse && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="w-full bg-[#12141C]/95 border border-white/10 border-l-4 rounded-xl p-5 backdrop-blur-xl shadow-2xl"
                  style={{ borderLeftColor: PALETTE.accentGreen }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <BrainCircuit size={12} color={PALETTE.accentGreen} />
                    </div>
                    <span className="text-[10px] font-bold tracking-[0.3em]" style={{ color: PALETTE.accentGreen }}>SENTRİX YANITI</span>
                    {isSpeaking && (
                      <span className="text-[9px] text-emerald-400/60 font-mono ml-auto flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        KONUŞUYOR
                      </span>
                    )}
                  </div>
                  <span className="text-lg text-white font-medium leading-relaxed">{aiResponse}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {systemActive && !transcript && !aiResponse && !isProcessing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
            <motion.span 
              className="text-[11px] font-mono tracking-[0.4em] text-white/30 border border-white/10 rounded-full px-6 py-2.5 bg-[#12141C]/50 inline-flex items-center gap-2"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Radio size={12} />
              [SPACE] BASILI TUTUN VE KONUŞUN
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [activeView, setActiveView] = useState("dashboard");
  const [systemActive, setSystemActive] = useState(false); 
  const [bootSequence, setBootSequence] = useState(false); 

  const [voiceGender, setVoiceGender] = useState<"female" | "male">("female");
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [volume, setVolume] = useState(0);

  const [transcript, setTranscript] = useState("");
  const [aiVoiceResponse, setAiVoiceResponse] = useState("");
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);

  const [metrics, setMetrics] = useState({ cpu: 0, ram: 0, net: 0, temp: 0, uptime: 0 });
  const metricsInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const ttsWatchdogRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeRequestId = useRef<string>("");
  const transcriptTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    const loadVoices = () => setAvailableVoices(window.speechSynthesis.getVoices());
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  useEffect(() => {
    if (systemActive) {
      setBootSequence(true);
      setTimeout(() => setBootSequence(false), 1500);

      metricsInterval.current = setInterval(() => {
        setMetrics(prev => ({
          cpu: Math.floor(Math.random() * 40) + 20, 
          ram: Math.floor(Math.random() * 15) + 45, 
          net: Math.floor(Math.random() * 30) + 70, 
          temp: Math.floor(Math.random() * 10) + 40, 
          uptime: prev.uptime + 1
        }));
      }, 1000);
    } else {
      if (metricsInterval.current) clearInterval(metricsInterval.current);
      if (ttsWatchdogRef.current) clearInterval(ttsWatchdogRef.current);
      if (transcriptTimeoutRef.current) clearTimeout(transcriptTimeoutRef.current);
      setMetrics({ cpu: 0, ram: 0, net: 0, temp: 0, uptime: 0 });
      setIsListening(false);
      setIsSpeaking(false);
      setIsProcessing(false);
      setVolume(0);
      setTranscript("");
      setAiVoiceResponse("");
      window.speechSynthesis.cancel();
    }
    return () => { if (metricsInterval.current) clearInterval(metricsInterval.current); };
  }, [systemActive]);

  const handleAudioState = useCallback((listening: boolean, speaking: boolean) => {
    if (!systemActive) return;
    setIsListening(listening);
    if (listening) {
      window.speechSynthesis.cancel(); 
      synthUtterances = [];
      setIsSpeaking(false);
      if (!isProcessingRef.current) {
        setIsProcessing(false);
      }
      setAiVoiceResponse(""); 
      activeRequestId.current = "";
      if (ttsWatchdogRef.current) clearInterval(ttsWatchdogRef.current);
    }
  }, [systemActive]);

  const handleVolumeChange = useCallback((vol: number) => {
    if (systemActive) setVolume(vol);
  }, [systemActive]);

  const triggerAIResponse = async (userText: string) => {
    if (!systemActive || !userText.trim() || isProcessingRef.current) return;

    const requestId = Math.random().toString(36);
    activeRequestId.current = requestId;
    isProcessingRef.current = true;

    setIsProcessing(true);
    setIsSpeaking(false);
    window.speechSynthesis.cancel(); 

    if (transcriptTimeoutRef.current) clearTimeout(transcriptTimeoutRef.current);

    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { 
            role: "system", 
            content: "Sen Sentrix'sin. Dünyanın en gelişmiş yapay zeka asistanısın. Türkçe yanıt ver. Kısa, net ve akıllıca cevaplar ver." 
          },
          ...conversationHistory.slice(-6).map(m => ({ role: m.role, content: m.content })),
          { role: "user", content: userText }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 300,
      });

      if (!systemActive || activeRequestId.current !== requestId) {
        isProcessingRef.current = false;
        return;
      }

      const reply = chatCompletion.choices[0]?.message?.content || "Anlaşılamadı.";

      setAiVoiceResponse(reply);
      setConversationHistory(prev => [
        ...prev.slice(-12), 
        { role: "user", content: userText, timestamp: new Date() }, 
        { role: "assistant", content: reply, timestamp: new Date() }
      ]);

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(reply);
      synthUtterances.push(utterance); 

      utterance.lang = "tr-TR";

      const trVoices = availableVoices.filter(v => v.lang.includes('tr') || v.lang.includes('TR'));
      let selectedVoice;

      if (voiceGender === "female") {
        selectedVoice = trVoices.find(v => 
          v.name.includes('Emel') || v.name.includes('Yelda') || 
          v.name.includes('Google Türkçe') || v.name.toLowerCase().includes('female')
        );
      } else {
        selectedVoice = trVoices.find(v => 
          v.name.includes('Tolga') || v.name.toLowerCase().includes('male')
        );
      }

      if (selectedVoice) utterance.voice = selectedVoice;
      else if (trVoices.length > 0) utterance.voice = trVoices[0];

      utterance.pitch = voiceGender === "female" ? 1.1 : 0.9;
      utterance.rate = 1.05;
      utterance.volume = 1.0;

      utterance.onstart = () => {
        if (activeRequestId.current !== requestId) {
          window.speechSynthesis.cancel();
          return;
        }
        setIsSpeaking(true);
        setIsProcessing(false);
        isProcessingRef.current = false;
        if (ttsWatchdogRef.current) clearInterval(ttsWatchdogRef.current);

        ttsWatchdogRef.current = setInterval(() => {
          if (!window.speechSynthesis.speaking) {
            clearInterval(ttsWatchdogRef.current!);
            setIsSpeaking(false);
            synthUtterances = [];
            transcriptTimeoutRef.current = setTimeout(() => { 
              if (systemActive) { 
                setTranscript(""); 
                setAiVoiceResponse(""); 
              } 
            }, 5000);
          }
        }, 500);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsProcessing(false);
        isProcessingRef.current = false;
        if (ttsWatchdogRef.current) clearInterval(ttsWatchdogRef.current);
        synthUtterances = [];
        transcriptTimeoutRef.current = setTimeout(() => { 
          if (systemActive) { 
            setTranscript(""); 
            setAiVoiceResponse(""); 
          } 
        }, 5000);
      };

      utterance.onerror = (event) => {
        if (event.error === 'canceled') return;
        setIsSpeaking(false);
        setIsProcessing(false);
        isProcessingRef.current = false;
        if (ttsWatchdogRef.current) clearInterval(ttsWatchdogRef.current);
        synthUtterances = [];
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      if (!systemActive || activeRequestId.current !== requestId) {
        isProcessingRef.current = false;
        return;
      }
      setAiVoiceResponse("HATA: Ağ bağlantısı koptu.");
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  };

  const handleTranscript = useCallback((text: string, isFinal: boolean) => {
    if (!systemActive || !text.trim()) return;

    setTranscript(text);

    if (transcriptTimeoutRef.current) clearTimeout(transcriptTimeoutRef.current);

    if (isFinal && text.trim().length > 1) {
      triggerAIResponse(text);
    }
  }, [systemActive]);

  const getCoreStatus = () => {
    if (!systemActive) return "KAPALI";
    if (bootSequence) return "BAŞLATILIYOR";
    if (isProcessing) return "İŞLENİYOR";
    if (isSpeaking) return "KONUŞUYOR";
    if (isListening) return "DİNLİYOR";
    return "HAZIR";
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <main 
      className="relative w-screen h-screen flex flex-col items-center px-10 py-6 font-sans overflow-hidden text-white transition-colors duration-1000"
      style={{ backgroundColor: PALETTE.bg70 }}
    >
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]">
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
      </div>
      <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-b from-transparent via-[#090A0F]/50 to-[#090A0F]" />

      {systemActive && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-white/20"
              style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
              animate={{ y: [0, -30, 0], opacity: [0, 0.5, 0] }}
              transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 5 }}
            />
          ))}
        </div>
      )}

      {systemActive && activeView === "dashboard" && (
        <VoiceEngine 
          onTranscript={handleTranscript} 
          onAudioState={handleAudioState} 
          onVolumeChange={handleVolumeChange} 
          isProcessing={isProcessing}
        />
      )}

      {activeView === "dashboard" && (
        <header className="w-full flex justify-between items-center z-50 mb-8 pb-4 border-b" style={{ borderColor: PALETTE.glassBorder }}>
          <div className="flex items-center gap-5">
            <motion.div 
              animate={systemActive ? { rotate: 360 } : { rotate: 0 }} 
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="relative"
            >
              <BrainCircuit size={36} color={systemActive ? PALETTE.accentGreen : PALETTE.accentRed} className="transition-colors duration-1000" />
              {systemActive && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ boxShadow: `0 0 20px ${PALETTE.accentGreen}` }}
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.div>
            <div>
              <h1 className="text-3xl font-black tracking-[0.4em] text-white">
                SENTRİX <span className="font-light opacity-50">AI</span>
              </h1>
              <div className="flex items-center gap-3 text-[10px] font-mono tracking-widest mt-1.5">
                <span 
                  className="w-2.5 h-2.5 rounded-sm transition-all duration-500" 
                  style={{ backgroundColor: systemActive ? PALETTE.accentGreen : PALETTE.accentRed, boxShadow: `0 0 12px ${systemActive ? PALETTE.accentGreen : PALETTE.accentRed}` }} 
                />
                <span style={{ color: systemActive ? PALETTE.textWhite : PALETTE.textMuted }} className="font-bold opacity-80">
                  {systemActive ? "ÇEKİRDEK ÇEVRİMİÇİ" : "SİSTEM ÇEVRİMDIŞI"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setVoiceGender(prev => prev === "female" ? "male" : "female")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border bg-[#12141C] text-xs font-bold tracking-widest transition-all hover:bg-white/5"
              style={{ borderColor: PALETTE.glassBorder, color: PALETTE.textWhite }}
            >
              <User size={14} color={voiceGender === "female" ? PALETTE.accentRed : PALETTE.accentBlue} />
              SES: {voiceGender === "female" ? "KADIN" : "ERKEK"}
            </button>

            <div className="flex items-center gap-3 p-1.5 rounded-lg border bg-[#12141C]" style={{ borderColor: PALETTE.glassBorder }}>
              <button 
                onClick={() => systemActive && setActiveView("dashboard")} 
                disabled={!systemActive}
                className={`flex items-center gap-2 px-6 py-2.5 rounded text-xs font-bold tracking-widest transition-all ${
                  activeView === "dashboard" && systemActive ? 'bg-white/10 text-white' : 'text-gray-500'
                } ${!systemActive && 'opacity-20 cursor-not-allowed'}`}
              >
                <LayoutDashboard size={16} /> KOMUTA
              </button>
              <button 
                onClick={() => systemActive && setActiveView("chat")} 
                disabled={!systemActive}
                className={`flex items-center gap-2 px-6 py-2.5 rounded text-xs font-bold tracking-widest transition-all ${
                  activeView === "chat" && systemActive ? 'bg-white/10 text-white' : 'text-gray-500'
                } ${!systemActive && 'opacity-20 cursor-not-allowed'}`}
              >
                <TerminalSquare size={16} /> TERMİNAL
              </button>
            </div>
          </div>
        </header>
      )}

      <AnimatePresence mode="wait">
        {activeView === "dashboard" ? (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full flex items-stretch justify-between z-10 gap-8">
            <section className="w-[340px] flex flex-col gap-5 h-full pb-8">
              <motion.button
                onClick={() => setSystemActive(!systemActive)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="relative w-full p-7 rounded-xl border-2 bg-[#12141C] shadow-2xl overflow-hidden group text-left transition-colors duration-500"
                style={{ borderColor: systemActive ? PALETTE.accentGreen : PALETTE.accentRed }}
              >
                <div className="absolute inset-0 opacity-[0.15] transition-colors duration-1000" style={{ backgroundColor: systemActive ? PALETTE.accentGreen : PALETTE.accentRed }} />
                <div className="relative flex items-center justify-between z-10">
                  <div className="flex flex-col">
                    <span className="text-2xl font-black tracking-widest text-white">{systemActive ? 'SİSTEM AÇIK' : 'SİSTEM KAPALI'}</span>
                    <span className="text-xs font-mono tracking-[0.2em] text-white/50 mt-2">{systemActive ? 'TÜM MODÜLLER DEVREDE' : 'BAŞLATMAK İÇİN ŞALTERE BAS'}</span>
                  </div>
                  <Power size={44} color={systemActive ? PALETTE.accentGreen : PALETTE.accentRed} className="drop-shadow-lg transition-colors duration-500" />
                </div>
              </motion.button>

              <GlassPanel title="DONANIM TELEMETRİSİ" isActive={systemActive} delay={0.1}>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "CPU", icon: Cpu, val: metrics.cpu, color: PALETTE.accentBlue },
                    { label: "RAM", icon: Database, val: metrics.ram, color: PALETTE.accentYellow },
                    { label: "AĞ", icon: Network, val: metrics.net, color: PALETTE.accentGreen },
                    { label: "ISI", icon: Activity, val: metrics.temp, color: PALETTE.accentRed, unit: "°C" },
                  ].map((item, i) => (
                    <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <item.icon size={12} color={systemActive ? item.color : PALETTE.textMuted} />
                        <span className="text-[9px] text-gray-400 font-mono tracking-widest">{item.label}</span>
                      </div>
                      <div className="text-xl font-bold text-white mb-1.5">
                        {systemActive ? item.val : 0}<span className="text-xs text-white/50 ml-1">{item.unit || "%"}</span>
                      </div>
                      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full rounded-full" 
                          style={{ backgroundColor: item.color }}
                          animate={{ width: `${systemActive ? item.val : 0}%` }}
                          transition={{ duration: 0.7, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-2.5 rounded-lg bg-black/40 border border-white/5 flex justify-between items-center">
                  <span className="text-[9px] font-mono tracking-widest text-gray-400 flex items-center gap-1">
                    <Clock size={10} /> UPTIME
                  </span>
                  <span className="text-sm font-bold font-mono text-white">{formatTime(metrics.uptime)}</span>
                </div>
              </GlassPanel>

              <GlassPanel title="BAĞLANTI AĞLARI" isActive={systemActive} delay={0.2}>
                <div className="flex flex-col gap-2.5">
                  {[
                    { text: "Llama-3.3-70b Motoru", sub: "Groq LPU", active: systemActive },
                    { text: "Uçtan Uca Şifreleme", sub: "AES-256 GCM", active: systemActive },
                    { text: "Ses Tanıma Motoru", sub: "Web Speech API", active: systemActive },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-black/40 border border-white/5">
                      <Server size={16} color={item.active ? PALETTE.accentGreen : PALETTE.textMuted} />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">{item.text}</span>
                        <span className="text-[9px] text-white/40 font-mono tracking-widest mt-0.5">{item.sub}</span>
                      </div>
                      {item.active && (
                        <motion.div
                          className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400"
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </GlassPanel>
            </section>

            <section className="flex-1 flex flex-col items-center justify-start relative px-4">
              <div className="mt-6 mb-12">
                <HolographicGlobe3D isActive={systemActive} status={getCoreStatus()} />
              </div>

              <div className="w-full flex flex-col items-center absolute bottom-8">
                <VoiceDialogPanel 
                  transcript={transcript}
                  aiResponse={aiVoiceResponse}
                  isListening={isListening}
                  isSpeaking={isSpeaking}
                  isProcessing={isProcessing}
                  systemActive={systemActive}
                />
              </div>
            </section>

            <section className="w-[340px] flex flex-col gap-5 h-full pb-8">
              <GlassPanel title="SES FREKANS ANALİZİ" isActive={systemActive} delay={0.1}>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Volume2 size={14} color={systemActive ? PALETTE.accentBlue : PALETTE.textMuted} />
                      <span className="text-[9px] text-gray-400 font-mono tracking-widest">GİRİŞ SEVİYESİ</span>
                    </div>
                    <span className="text-xs font-bold text-white font-mono">{systemActive ? volume.toFixed(0) : '0'}%</span>
                  </div>

                  <div className="flex gap-1 h-16 items-end justify-between">
                    {[...Array(24)].map((_, i) => {
                      const threshold = (i / 24) * 100;
                      const isLoud = volume > threshold;
                      return (
                        <motion.div
                          key={i}
                          className="w-full rounded-sm"
                          style={{ 
                            backgroundColor: systemActive && isLoud ? PALETTE.accentBlue : 'rgba(255,255,255,0.05)',
                            boxShadow: systemActive && isLoud ? `0 0 8px ${PALETTE.accentBlue}` : 'none'
                          }}
                          animate={{ height: `${systemActive && isLoud ? 20 + Math.random() * 80 : 8}%` }}
                          transition={{ duration: 0.1 }}
                        />
                      );
                    })}
                  </div>
                </div>
              </GlassPanel>

              <GlassPanel title="SİSTEM KAYITLARI" isActive={systemActive} delay={0.2}>
                <div className="flex flex-col gap-2 h-56 overflow-y-auto pr-2 custom-scrollbar">
                  {systemActive && conversationHistory.length > 0 ? (
                    conversationHistory.slice().reverse().map((msg, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex flex-col gap-1 p-2.5 rounded-lg bg-black/40 border border-white/5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold tracking-widest" style={{ color: msg.role === 'user' ? PALETTE.accentBlue : PALETTE.accentGreen }}>
                            {msg.role === 'user' ? 'KULLANICI' : 'SENTRİX'}
                          </span>
                          {msg.timestamp && (
                            <span className="text-[8px] text-white/30 font-mono">
                              {msg.timestamp.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-white/70 leading-relaxed line-clamp-2">{msg.content}</span>
                      </motion.div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-full flex-col gap-3 opacity-30">
                      <AlertTriangle size={24} />
                      <span className="text-[10px] font-mono tracking-widest text-center">
                        {!systemActive ? "SİSTEM KAPALI" : "KAYIT BULUNAMADI"}
                      </span>
                    </div>
                  )}
                </div>
              </GlassPanel>

              <GlassPanel title="KONTROL KISAYOLLARI" isActive={systemActive} delay={0.3}>
                <div className="flex flex-col gap-2">
                  {[
                    { key: "SPACE", desc: "Basılı Tut = Dinle", color: PALETTE.accentBlue },
                    { key: "O", desc: "Anında Sustur", color: PALETTE.accentRed },
                    { key: "MOUSE", desc: "Mikrofon Aç/Kapa", color: PALETTE.accentGreen },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-black/40 border border-white/5">
                      <span 
                        className="px-2 py-1 rounded text-[10px] font-bold font-mono"
                        style={{ backgroundColor: `${item.color}20`, color: item.color, border: `1px solid ${item.color}40` }}
                      >
                        {item.key}
                      </span>
                      <span className="text-xs text-white/60">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </GlassPanel>
            </section>
          </motion.div>
        ) : activeView === "chat" ? (
          <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full z-10">
            <ChatTerminal 
                onNavigateHome={() => setActiveView("dashboard")}
                onNavigateStory={() => setActiveView("story")} 
            />
          </motion.div>
        ) : activeView === "story" ? (
<motion.div key="story" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4 }} className="w-full h-full z-10 overflow-auto relative">
            <Story onNavigateBack={() => setActiveView("chat")} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </main>
  );
}