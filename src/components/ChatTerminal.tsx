import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, Terminal, Cpu, Database, History, PlusCircle, 
  MessageSquare, Volume2, VolumeX, User, Bot, Copy, CheckCircle2, 
  ChevronRight, Wifi, Activity, XCircle, 
  Palette, Fingerprint, LayoutDashboard, Sun, Moon, Paperclip, 
  BookOpen, ScanLine, ImagePlus, Settings, Link, CheckCheck, Zap
} from "lucide-react";
import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "./ChatTerminal.css";

interface ExtendedNavigator extends Navigator {
  connection?: { rtt?: number; downlink?: number };
  mozConnection?: { rtt?: number; downlink?: number };
  webkitConnection?: { rtt?: number; downlink?: number };
  deviceMemory?: number;
}
interface ExtendedPerformance extends Performance {
  memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number; };
}

const groq = new Groq({ apiKey: import.meta.env.VITE_GROQ_API_KEY || "", dangerouslyAllowBrowser: true });
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

interface Msg { id: string; role: "user" | "ai"; content: string; timestamp: Date; isStreaming?: boolean; image?: string | null; }
interface Sess { id: string; title: string; date: Date; messageCount: number; isPinned?: boolean; }
interface Metric { label: string; value: number; max: number; unit: string; color: string; icon: React.ElementType; }

const genId = () => Math.random().toString(36).substring(2, 11);
const fmtTime = (d: Date) => d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const fmtDate = (d: Date) => d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });

function StreamText({ text, speed = 12 }: { text: string; speed?: number }) {
  const [disp, setDisp] = useState("");
  const [done, setDone] = useState(false);
  const idxRef = useRef(0);

  useEffect(() => {
    idxRef.current = 0; setDisp(""); setDone(false);
    const iv = setInterval(() => {
      if (idxRef.current < text.length) {
        idxRef.current++; setDisp(text.slice(0, idxRef.current));
      } else {
        setDone(true); clearInterval(iv);
      }
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed]);

  return <span>{disp}{!done && <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.3, repeat: Infinity }} className="sntx-cursor" />}</span>;
}

// 🔥 GERİ GELEN VE GELİŞTİRİLEN 5D JARVIS DÜNYA ANİMASYONU
function QuantumJarvisHologram() {
  return (
    <div className="sntx-jarvis-bg">
      {/* Renk Patlamaları */}
      <div className="sntx-orb sntx-orb-1" />
      <div className="sntx-orb sntx-orb-2" />
      <div className="sntx-orb sntx-orb-3" />

      {/* 3D Perspektif Alanı */}
      <div className="sntx-jarvis-perspective">
        {/* Dalgalanan Grid Zemin */}
        <div className="sntx-jarvis-grid" />
        
        {/* Tam Ortada Dönen Dev Sistem */}
        <div className="sntx-jarvis-system">
          
          {/* Tel Kafes Dünya (Wireframe Globe) */}
          <div className="sntx-globe">
            <div className="sntx-globe-ring sntx-g-1" />
            <div className="sntx-globe-ring sntx-g-2" />
            <div className="sntx-globe-ring sntx-g-3" />
            <div className="sntx-globe-ring sntx-g-4" />
            <div className="sntx-globe-equator" />
          </div>

          {/* Çapraz Dönen Yörüngeler ve Uydular */}
          <div className="sntx-orbit sntx-orbit-x">
            <div className="sntx-satellite" />
          </div>
          <div className="sntx-orbit sntx-orbit-y">
            <div className="sntx-satellite" />
          </div>
          <div className="sntx-orbit sntx-orbit-z">
            <div className="sntx-satellite" />
          </div>

          {/* Nefes Alan Kuantum Çekirdek */}
          <div className="sntx-core-energy" />
        </div>
      </div>
    </div>
  );
}

interface ChatTerminalProps {
  onNavigateHome?: () => void;
  onNavigateStory?: () => void; 
}

export default function ChatTerminal({ onNavigateHome, onNavigateStory }: ChatTerminalProps) {
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null); 
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [voiceGender, setVoiceGender] = useState<"female" | "male">("female"); 
  const [isDragging, setIsDragging] = useState(false); 
  
  const [inputMode, setInputMode] = useState<"chat" | "generate">("chat");
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [colabUrl, setColabUrl] = useState<string>(() => localStorage.getItem("sentrix_colab_url") || "");
  const [colabUrlInput, setColabUrlInput] = useState<string>(() => localStorage.getItem("sentrix_colab_url") || "");
  const [urlSaved, setUrlSaved] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showMetrics, setShowMetrics] = useState(true);
  const [streamId, setStreamId] = useState<string | null>(null);
  const [accentHue, setAccentHue] = useState(0); 
  const [theme, setTheme] = useState<"dark" | "light">("dark"); // Jarvis tarzı genelde koyu modda daha vurucu durur, ama light modu da çalışır.

  const [messages, setMessages] = useState<Msg[]>([
    { 
      id: "init", 
      role: "ai", 
      content: "✨ SENTRİX SÜPER VİZYON AĞI AKTİF ✨\n\nv5.0 Ultra Hızlı Sentezleme Motoru ve Otonom Gemini Ajanı devrede. Yeni nesil Quantum Jarvis arayüzü ile fikirlerini canlandırabilirsin.",
      timestamp: new Date()
    }
  ]);

  const [sessions, setSessions] = useState<Sess[]>([{ id: "1", title: "Sistem Başlatma", date: new Date(), messageCount: 1, isPinned: true }]);
  const [activeSession, setActiveSession] = useState<string | null>("1");

  const [metrics, setMetrics] = useState<Metric[]>([
    { label: "İŞLEMCİ YÜKÜ", value: 0, max: 100, unit: "%", color: "var(--sntx-accent)", icon: Cpu },
    { label: "JS BELLEK", value: 0, max: 1000, unit: "MB", color: "var(--sntx-accent-sec)", icon: Database },
    { label: "AĞ PING", value: 0, max: 500, unit: "ms", color: "var(--sntx-accent)", icon: Activity },
    { label: "BAĞLANTI", value: 0, max: 1000, unit: "Mbps", color: "var(--sntx-accent-sec)", icon: Wifi },
  ]);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); 
  const metInt = useRef<ReturnType<typeof setInterval> | null>(null);

  const accentPalettes = [
    { name: "breeze-cyan", primary: "#00c6ff", secondary: "#0072ff" },
    { name: "mint-glow", primary: "#00b09b", secondary: "#96c93d" },
    { name: "sunset-amber", primary: "#f6d365", secondary: "#fda085" },
    { name: "ocean-blue", primary: "#4facfe", secondary: "#00f2fe" }, 
  ];

  useEffect(() => {
    let lastTime = performance.now();
    let frameCount = 0;
    let currentFps = 60;

    const calcFPS = () => {
      const now = performance.now();
      frameCount++;
      if (now - lastTime >= 1000) { currentFps = frameCount; frameCount = 0; lastTime = now; }
      requestAnimationFrame(calcFPS);
    };
    requestAnimationFrame(calcFPS);

    const updateRealMetrics = () => {
      const nav = navigator as ExtendedNavigator;
      const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
      
      const basePing = connection?.rtt ? connection.rtt : 45; 
      const baseDownlink = connection?.downlink ? connection.downlink * 10 : 85; 

      const ping = Math.max(10, basePing + Math.floor(Math.random() * 12 - 6)); 
      const downlink = Math.max(1, baseDownlink + (Math.random() * 5 - 2.5)); 

      const perf = window.performance as ExtendedPerformance;
      const memory = perf?.memory;

      const usedHeapMB = memory 
        ? (memory.usedJSHeapSize / (1024 * 1024)) + (Math.random() * 1.5 - 0.75)
        : (nav.deviceMemory ? nav.deviceMemory * 25 : 120) + (Math.random() * 2 - 1);

      const maxHeapMB = memory ? memory.jsHeapSizeLimit / (1024 * 1024) : 1000;

      let cpuLoad = Math.max(0, Math.min(100, ((60 - currentFps) / 60) * 100));
      cpuLoad += Math.random() * 3.5 + 0.5;

      setMetrics([
        { label: "İŞLEMCİ YÜKÜ", value: cpuLoad, max: 100, unit: "%", color: "var(--sntx-accent)", icon: Cpu },
        { label: "JS BELLEK", value: usedHeapMB, max: maxHeapMB, unit: "MB", color: "var(--sntx-accent-sec)", icon: Database },
        { label: "AĞ PING", value: ping, max: 500, unit: "ms", color: "var(--sntx-accent)", icon: Activity },
        { label: "BAĞLANTI HIZI", value: downlink, max: 1000, unit: "Mbps", color: "var(--sntx-accent-sec)", icon: Wifi },
      ]);
    };

    metInt.current = setInterval(updateRealMetrics, 1000);
    updateRealMetrics(); 
    return () => clearInterval(metInt.current!);
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isLoading, selectedImage]);
  useEffect(() => { if (!isVoiceMode) window.speechSynthesis.cancel(); }, [isVoiceMode]);

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
      setInputMode("chat");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setSelectedImage(reader.result as string);
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowAttachMenu(false);
    setInputMode("chat");
  };

  function speak(text: string) {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 500));
    utterance.lang = "tr-TR";
    const voices = window.speechSynthesis.getVoices();
    const trVoices = voices.filter(v => v.lang.includes('tr') || v.lang.includes('TR'));
    
    if (voiceGender === "female") {
      utterance.pitch = 1.35; utterance.rate = 1.05;
      const femaleVoice = trVoices.find(v => v.name.includes('Emel') || v.name.includes('Yelda') || v.name.toLowerCase().includes('female'));
      if (femaleVoice) utterance.voice = femaleVoice;
      else if (trVoices.length > 0) utterance.voice = trVoices[0];
    } else {
      utterance.pitch = 0.9; utterance.rate = 1.0;
      const maleVoice = trVoices.find(v => v.name.includes('Tolga') || v.name.toLowerCase().includes('male'));
      if (maleVoice) utterance.voice = maleVoice;
      else if (trVoices.length > 0) utterance.voice = trVoices[0];
    }
    window.speechSynthesis.speak(utterance);
  }

  async function handleSend(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const text = input;
    if ((!text.trim() && !selectedImage) || isLoading) return;

    const userMessageContent = inputMode === "generate" ? `🎨 ${text} (Sentrix Sentezliyor...)` : text || "Görsel analizi başlatıldı.";
    setMessages(p => [...p, { id: genId(), role: "user", content: userMessageContent, image: selectedImage, timestamp: new Date() }]);
    setInput(""); 
    setIsLoading(true);
    const currentImage = selectedImage; 
    setSelectedImage(null); 

    let reply = "Hata oluştu.";

    try {
      if (inputMode === "generate") {
        const endpoint = `/colab-api/generate?prompt=${encodeURIComponent(text)}`;

        const response = await fetch(endpoint, {
            headers: {
                "ngrok-skip-browser-warning": "true",
                "Accept": "image/png, */*"
            }
        });

        if (!response.ok) {
           throw new Error(`SÜPER VİZYON AĞI HATASI (KOD: ${response.status}): Colab sunucusuna ulaşılamıyor. vite.config.ts içindeki Ngrok linkinin güncel olduğundan emin olun.`);
        }

        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob); 

        reply = `⚡ SÜPER SENTEZ TAMAMLANDI.\n\n"${text}" komutu Gemini Otonom Ajanı tarafından tasarlandı ve Sentrix v5.0 motoruyla çizildi.`;
        const aiId = genId();
        setStreamId(aiId);
        
        setMessages(p => [...p, { id: aiId, role: "ai", content: reply, image: imageUrl, timestamp: new Date(), isStreaming: true }]);

        setTimeout(() => {
          setStreamId(null);
          setMessages(p => p.map(m => m.id === aiId ? { ...m, isStreaming: false } : m));
        }, 1500);

        if (isVoiceMode) speak("Görsel sentezi süper hızda tamamlandı.");
        setIsLoading(false);
        return; 
      }

      let success = false;
      
      if (currentImage) {
        const base64Data = currentImage.split(",")[1];
        const mimeType = currentImage.match(/data:(.*?);/)?.[1] || "image/jpeg";
        const imagePart = { inlineData: { data: base64Data, mimeType } };
        const promptInfo = text || "Sen Sentrix'sin. Bu görseli detaylıca analiz et. İçindeki nesneleri, markaları, arabaları veya metinleri net bir Türkçe ile açıkla.";

        const geminiModelsToTry = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"];

        for (const modelName of geminiModelsToTry) {
          try {
            console.log(`[Sentrix] Gemini Modeli deneniyor: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent([promptInfo, imagePart]);
            reply = result.response.text();
            success = true;
            break; 
          } catch (geminiError: unknown) {
            console.warn(`[Sentrix] ${modelName} başarısız oldu, atlanıyor.`);
          }
        }

        if (!success) throw new Error("Google'ın tüm güncel vizyon modelleri reddetti veya aşırı yoğun.");

      } else {
        const apiMessages = messages.map(m => ({ 
          role: m.role === "ai" ? "assistant" as const : "user" as const, 
          content: m.content 
        }));
        apiMessages.push({ role: "user" as const, content: text });

        const res = await groq.chat.completions.create({
          messages: [
            { role: "system" as const, content: "Sen Hitit Üniversitesi projeleri için tasarlanmış Sentrix'sin. Gelecek odaklı, hiper-gelişmiş bir tensör yapay zekasısın. Net, zeki ve profesyonel Türkçe yanıt ver." }, 
            ...apiMessages.slice(-6)
          ],
          model: "llama-3.3-70b-versatile",
          temperature: 0.7, max_tokens: 2048,
        });

        reply = res.choices[0]?.message?.content || "Veri işlenemedi.";
      }

      const aiId = genId();
      setStreamId(aiId);
      setMessages(p => [...p, { id: aiId, role: "ai", content: reply, timestamp: new Date(), isStreaming: true }]);

      setTimeout(() => {
        setStreamId(null);
        setMessages(p => p.map(m => m.id === aiId ? { ...m, isStreaming: false } : m));
      }, Math.min(reply.length * 10, 3000));

      if (isVoiceMode) speak(reply);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu.";
      setMessages(p => [...p, { id: genId(), role: "ai", content: `[SİSTEM HATASI]: ${errorMessage}`, timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  }

  function copy(text: string, id: string) { navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); }
  
  function saveColabUrl() {
    const trimmed = colabUrlInput.trim();
    setColabUrl(trimmed);
    localStorage.setItem("sentrix_colab_url", trimmed);
    setUrlSaved(true);
    setTimeout(() => { setUrlSaved(false); setShowSettings(false); }, 1200);
  }
  function newSession() {
    const s: Sess = { id: genId(), title: `Nöral Döngü ${sessions.length + 1}`, date: new Date(), messageCount: 0 };
    setSessions(p => [s, ...p]);
    setMessages([{ id: "init", role: "ai", content: "YENİ TENSÖR AĞI OLUŞTURULDU.\n\nVeri bekleniyor.", timestamp: new Date() }]);
    setActiveSession(s.id);
  }

  return (
    <div className="sntx-root" data-accent={accentPalettes[accentHue].name} data-theme={theme}>
      <QuantumJarvisHologram />

      {/* AYARLAR MODALI */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowSettings(false)}
            className="sntx-settings-overlay"
          >
            <motion.div
              initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="sntx-settings-modal"
            >
              <div className="sntx-settings-header">
                <Settings size={18} style={{ color: "var(--sntx-accent)" }} />
                <h3>COLAB API AYARLARI</h3>
                <button onClick={() => setShowSettings(false)} className="sntx-settings-close"><XCircle size={18} /></button>
              </div>

              <p className="sntx-settings-desc">Colab'daki ngrok URL'sini buraya gir. Yeni URL aldığında buradan güncelle.</p>
              
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <input
                  type="text"
                  value={colabUrlInput}
                  onChange={(e) => setColabUrlInput(e.target.value)}
                  placeholder="https://xxxx.ngrok-free.dev"
                  onKeyDown={(e) => e.key === "Enter" && saveColabUrl()}
                  className="sntx-settings-input"
                />
              </div>

              <button onClick={saveColabUrl} className={`sntx-settings-save ${urlSaved ? 'saved' : ''}`}>
                {urlSaved ? <><CheckCheck size={16} /> KAYDEDİLDİ!</> : <><Link size={16} /> KAYDET</>}
              </button>

              {colabUrl && <div className="sntx-settings-success">✓ KAYITLI: {colabUrl}</div>}

              <div className="sntx-settings-warning">
                <div>⚡ ÇOK ÖNEMLİ: Proxy Ayarı</div>
                Sistemin 500 hatası vermemesi için <span style={{color:"var(--sntx-accent)"}}>vite.config.ts</span> dosyasındaki target URL'sinin yeni Colab linkiyle birebir aynı olduğundan emin olun ve sunucuyu yeniden başlatın.
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDragging && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="sntx-drag-overlay"
            onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
          >
            <div className="sntx-drag-box">
              <ImagePlus size={64} className="sntx-drag-icon" />
              <h2>GÖRSELİ BURAYA BIRAK</h2>
              <p>Sentrix Süper Vizyon Motoru ile Analiz Edilecek</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="sntx-layout-container" onDragOver={onDragOver}>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0, scale: 0.95 }} 
              animate={{ width: 300, opacity: 1, scale: 1 }} 
              exit={{ width: 0, opacity: 0, scale: 0.95 }} 
              transition={{ duration: 0.4, ease: "circOut" }}
              className="sntx-glass-panel sntx-sidebar"
            >
              <div className="sntx-sidebar-header">
                <div className="sntx-brand-icon-wrap"><Fingerprint size={28} style={{ color: "var(--sntx-accent)" }} /></div>
                <div className="sntx-brand-text">
                  <h3 className="sntx-brand-title">SENTRİX</h3>
                  <span className="sntx-brand-version">Organik Tensör v5</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="sntx-btn-icon" style={{marginLeft: 'auto'}}><ChevronRight size={18} /></button>
              </div>

              <div className="sntx-color-picker">
                <span className="sntx-color-label">TEMA AKIŞI</span>
                <div className="sntx-color-dots">
                  {accentPalettes.map((pal, i) => (
                    <button key={pal.name} onClick={() => setAccentHue(i)} className={`sntx-color-dot ${accentHue === i ? "active" : ""}`} style={{ background: `linear-gradient(135deg, ${pal.primary}, ${pal.secondary})` }} />
                  ))}
                </div>
              </div>

              <div className="sntx-sidebar-content">
                {onNavigateHome && (
                  <button onClick={onNavigateHome} className="sntx-btn-glass" style={{marginBottom: 10}}>
                    <LayoutDashboard size={16} /> KOMUTA MERKEZİ
                  </button>
                )}
                
                <button onClick={onNavigateStory} className="sntx-btn-glass" style={{marginBottom: 10}}>
                  <BookOpen size={16} /> BİLEŞEN HİKAYELERİ
                </button>

                <button onClick={newSession} className="sntx-btn-glass primary-glass">
                  <PlusCircle size={16} /> YENİ HESAPLAMA
                </button>

                <div className="sntx-list-header">Aktif Oturumlar</div>
                <div className="sntx-sessions">
                  {sessions.map((s) => (
                    <div key={s.id} onClick={() => setActiveSession(s.id)} className={`sntx-session ${activeSession === s.id ? "active" : ""}`}>
                      <div className="sntx-session-icon"><MessageSquare size={16} /></div>
                      <div className="sntx-session-info">
                        <span className="sntx-session-title">{s.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <main className="sntx-glass-panel sntx-main">
          <header className="sntx-header">
            <div className="sntx-header-left">
              {!sidebarOpen && <button onClick={() => setSidebarOpen(true)} className="sntx-btn-icon mr-3"><ChevronRight size={20} /></button>}
              <div className="sntx-header-text">
                <h2 className="sntx-header-title">Merkezi Sentez Ağı</h2>
                <div className="sntx-header-status">
                  <span className="sntx-status-dot" /> SİSTEM STABİL
                </div>
              </div>
            </div>
            <div className="sntx-header-actions">
              <button onClick={() => setShowSettings(true)} className={`sntx-btn-icon ${colabUrl ? "" : "active-warning"}`} title="Colab API Ayarları">
                <Settings size={18} />
              </button>
              <button onClick={() => setVoiceGender(g => g === "female" ? "male" : "female")} className="sntx-btn-icon text-btn" title="Sesi Değiştir">
                <User size={16} /> <span>{voiceGender === "female" ? "KADIN" : "ERKEK"}</span>
              </button>
              <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} className="sntx-btn-icon">
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button onClick={() => setShowMetrics(!showMetrics)} className={`sntx-btn-icon ${showMetrics ? "active" : ""}`}><Activity size={18} /></button>
              <button onClick={() => setIsVoiceMode(!isVoiceMode)} className={`sntx-btn-icon ${isVoiceMode ? "active" : ""}`}>
                {isVoiceMode ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
            </div>
          </header>

          <AnimatePresence>
            {showMetrics && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="sntx-metrics-wrap">
                <div className="sntx-metrics">
                  {metrics.map((m) => (
                    <div key={m.label} className="sntx-metric">
                      <m.icon size={16} style={{ color: m.color }} />
                      <div className="sntx-metric-body">
                        <div className="sntx-metric-header"><span>{m.label}</span><b style={{color: m.color}}>{m.value.toFixed(1)}{m.unit}</b></div>
                        <div className="sntx-metric-bar"><motion.div className="sntx-metric-fill" style={{ background: m.color }} animate={{ width: `${Math.min((m.value / m.max) * 100, 100)}%` }} transition={{ duration: 0.5 }} /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="sntx-messages">
            {messages.map((msg) => (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={msg.id} className={`sntx-msg ${msg.role === "user" ? "user" : "ai"}`}>
                <div className="sntx-avatar">{msg.role === "user" ? <User size={20} /> : <Bot size={20} />}</div>
                <div className="sntx-msg-col">
                  <div className="sntx-msg-meta">
                    <span className="sntx-msg-author">{msg.role === "user" ? "Sen" : "Sentrix"}</span>
                    <span className="sntx-msg-time">{fmtTime(msg.timestamp)}</span>
                  </div>
                  <div className="sntx-bubble">
                    {msg.image && <div className="sntx-msg-image"><img src={msg.image} alt="İçerik" /></div>}
                    <div className="sntx-bubble-content">
                      {msg.isStreaming && msg.id === streamId ? <StreamText text={msg.content} speed={8} /> : msg.content}
                    </div>
                    <button onClick={() => copy(msg.content, msg.id)} className="sntx-copy">
                      {copiedId === msg.id ? <CheckCircle2 size={16} style={{color: 'var(--sntx-accent)'}} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            {isLoading && !streamId && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="sntx-msg ai sntx-typing-row">
                <div className="sntx-avatar"><Cpu size={20} className="sntx-spin" /></div>
                <div className="sntx-msg-col">
                   <div className="sntx-bubble" style={{fontStyle: 'italic', opacity: 0.8}}>
                     {inputMode === "generate" ? "⚡ Süper Sentez Ağı Devrede, Fotogerçekçi Analiz Yapılıyor..." : "Kuantum Analizi Yapılıyor..."}
                   </div>
                </div>
              </motion.div>
            )}
            <div ref={endRef} />
          </div>

          <div className="sntx-input-area">
            <AnimatePresence>
              {selectedImage && (
                <motion.div initial={{ opacity: 0, y: 20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="sntx-image-preview">
                  <img src={selectedImage} alt="Önizleme" />
                  <div className="sntx-scanner-line" />
                  <div className="sntx-preview-overlay"><ScanLine size={24} /><span>ANALİZ HAZIR</span></div>
                  <button type="button" onClick={() => setSelectedImage(null)} className="sntx-image-remove"><XCircle size={18} /></button>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSend} className="sntx-form">
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="sntx-mode-hud"
                  style={{
                    background: inputMode === "generate" ? "var(--sntx-accent-sec)" : "var(--sntx-accent)",
                    color: "#fff"
                  }}
                >
                  {inputMode === "generate" ? <><Zap size={14}/> SÜPER SENTEZ MODU</> : <><MessageSquare size={14}/> SOHBET MODU</>}
                </motion.div>
              </AnimatePresence>

              <div className={`sntx-input-box ${inputMode === "generate" ? "generate-mode" : ""}`}>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} style={{ display: "none" }} />
                
                <div className="sntx-attach-dropdown">
                  <button type="button" onClick={() => setShowAttachMenu(!showAttachMenu)} className={`sntx-attach-btn ${showAttachMenu ? "active" : ""}`}>
                    <Paperclip size={20} />
                  </button>
                  
                  <AnimatePresence>
                    {showAttachMenu && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="sntx-attach-menu">
                        <button type="button" onClick={() => fileInputRef.current?.click()}>
                          <ImagePlus size={16} style={{color: 'var(--sntx-accent)'}} /> Görsel Yükle (Vision)
                        </button>
                        <button type="button" onClick={() => { setInputMode("generate"); setShowAttachMenu(false); }} className={inputMode === "generate" ? "active-item" : ""}>
                          <Zap size={16} style={{color: 'var(--sntx-accent-sec)'}} /> Süper Görsel Üret
                        </button>
                        <button type="button" onClick={() => { setInputMode("chat"); setShowAttachMenu(false); }} className={inputMode === "chat" ? "active-item" : ""}>
                          <MessageSquare size={16} /> Normal Sohbet
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <input 
                  ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} disabled={isLoading} 
                  placeholder={inputMode === "generate" ? "Ne çizmemi istersin? (Ajan fotogerçekçi bir şahesere dönüştürecek)..." : "Sürükle bırak, kod yapıştırın veya metin girin..."} 
                  className="sntx-input" 
                />
              </div>
              <motion.button 
                disabled={isLoading || (!input.trim() && !selectedImage)} type="submit" 
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
                className={`sntx-send-btn ${(input.trim() || selectedImage) ? "active" : ""}`}
              >
                {inputMode === "generate" ? <Zap size={20} /> : <Send size={20} style={{marginLeft: 2}} />}
              </motion.button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}