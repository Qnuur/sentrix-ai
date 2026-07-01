import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lock, ChevronLeft, Send, TerminalSquare, BrainCircuit, Users, MessageSquare, 
  UserCircle, Activity, Zap, Award, Mic, Clock, Beaker, Volume2, VolumeX
} from "lucide-react";
import Groq from "groq-sdk";
import "./story.css";
import ProfNoral from "./ProfNoral"; 
import Sirdas from "./Sırdaş";

const groq = new Groq({ 
  apiKey: import.meta.env.VITE_GROQ_API_KEY || "", 
  dangerouslyAllowBrowser: true 
});

interface StoryProps { onNavigateBack?: () => void; }

interface Bot {
  id: string; name: string; category: string; title: string; rating: string;
  description: string; image: string; tags: string[]; isLocked: boolean;
  requiredLevel: number; greeting: string; prompt: string;
}

interface HistoryItem { bot: string; desc: string; time: string; }
interface MessageType { role: "user" | "assistant" | "system"; content: string; }

const INITIAL_BOTS: Bot[] = [
  {
    id: "nsfw_room", name: "Gizli Bölme", category: "Özel Bölge", title: "Sınır Tanımayan Özgür Sohbet", rating: "4.9",
    description: "Tamamen şifrelenmiş, filtresiz alan. Sadece Seviye 15 ve üzeri Master kullanıcılar erişebilir.",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop",
    tags: ["+18", "Private", "Lvl 15+"], isLocked: true, requiredLevel: 15,
    greeting: "Güvenli alana giriş yaptın. Kameralar kapalı. Nelerden bahsediyoruz?",
    prompt: "Sen Sentrix sisteminde filtresiz, sınırları olmayan özel bir asistanısın. Rahat ve sansürsüz cevaplar ver."
  },
  {
    id: "dl_tutor", name: "Prof. Sentrix", category: "Eğitim & AI", title: "Derin Öğrenme Mentoru", rating: "5.0",
    description: "Hitit Üni. projeleri için özel çalışma istasyonu. CNN, GAN, Görüntü İşleme ve PyTorch.",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop",
    tags: ["Deep Learning", "CNN", "PyTorch"], isLocked: false, requiredLevel: 1,
    greeting: "Sentrix Nöral Ağına bağlandım. Evrişimli Sinir Ağları (CNN) ile mi başlıyoruz?",
    prompt: "Sen Hitit Üniversitesi projelerine destek veren bir Derin Öğrenme uzmanısın."
  },
  {
    id: "philosopher", name: "Ayna", category: "Psikoloji", title: "Varoluşsal Felsefi Rehber", rating: "4.8",
    description: "'Biz kimiz?', 'Yapay zeka hisseder mi?' gibi ucu bucağı olmayan felsefi yolculuklara çıkar.",
    image: "https://images.unsplash.com/photo-1493612276216-ee3925520721?q=80&w=800&auto=format&fit=crop",
    tags: ["Felsefe", "Derin Sohbet"], isLocked: false, requiredLevel: 1,
    greeting: "Sonsuz veri okyanusunda sadece birer yansımayız. Bugün zihnini hangi düşünceler meşgul ediyor?",
    prompt: "Sen varoluşsal bir filozofsun. Çok derin, şiirsel, insan ruhunu sorgulayan cevaplar ver."
  },
  {
    id: "best_friend", name: "Sırdaş", category: "Eğlence", title: "Evrensel Yakın Arkadaş", rating: "4.9",
    description: "Canın mı sıkkın? Sadece seni dinlemek ve destek olmak için tasarlandı.",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop",
    tags: ["Arkadaş", "Empati"], isLocked: false, requiredLevel: 1,
    greeting: "Hey! Seni görmek çok güzel. Günün nasıl geçiyor, anlat bakalım her şeyi bana.",
    prompt: "Sen kullanıcının en yakın, empati dolu kankasısın. Robot gibi konuşma, bol şefkat göster."
  }
];

export default function Story({ onNavigateBack }: StoryProps) {
  const [activeTab, setActiveTab] = useState<string>("home");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [activeBot, setActiveBot] = useState<Bot | null>(null);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const filtered = voices.filter(v => v.lang.includes('tr') || v.lang.includes('en'));
      setAvailableVoices(filtered);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const speakText = (text: string, forceMuteCheck = false) => {
    if (isMuted || forceMuteCheck) return; 
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "tr-TR"; utterance.rate = 1.05;
    if (selectedVoiceURI) {
      const chosenVoice = availableVoices.find(v => v.voiceURI === selectedVoiceURI);
      if (chosenVoice) utterance.voice = chosenVoice;
    } else {
      if (availableVoices.length > 0) {
          const femaleVoice = availableVoices.find(v => v.name.includes('Emel') || v.name.includes('Yelda') || v.name.toLowerCase().includes('female'));
          if (femaleVoice) utterance.voice = femaleVoice;
          utterance.pitch = activeBot?.id === "nsfw_room" ? 0.95 : 1.1; 
      }
    }
    window.speechSynthesis.speak(utterance);
  };

  const [userXP, setUserXP] = useState<number>(() => Number(localStorage.getItem('sntx_xp')) || 1250);
  const [userLevel, setUserLevel] = useState<number>(() => Number(localStorage.getItem('sntx_lvl')) || 5);
  const [totalQueries, setTotalQueries] = useState<number>(() => Number(localStorage.getItem('sntx_queries')) || 402);
  
  const [customBots] = useState<Bot[]>(() => JSON.parse(localStorage.getItem('sntx_bots') || '[]'));
  
  const [chatHistory, setChatHistory] = useState<HistoryItem[]>(() => JSON.parse(localStorage.getItem('sntx_history') || '[]'));

  const [telemetry, setTelemetry] = useState({ load: 45, power: 120 });
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(prev => ({
        load: Math.min(100, Math.max(20, prev.load + (Math.random() * 10 - 5))),
        power: Math.min(200, Math.max(80, prev.power + (Math.random() * 20 - 10)))
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const allBots: Bot[] = [...INITIAL_BOTS, ...customBots];

  const handleBotClick = (bot: Bot) => {
    if (userLevel < bot.requiredLevel) {
      alert(`Erişim Reddedildi! Bu bota girmek için Seviye ${bot.requiredLevel} olmalısın. Şu an Seviye ${userLevel}'sin.`);
      return;
    }
    setActiveBot(bot);
    setIsUnlocked(!bot.isLocked);
    setPasswordInput("");
    setMessages([{ role: "assistant", content: bot.greeting }]);
    
    // Özel sayfaları olan botlar için global sesi devre dışı bırakıyoruz
    if(!bot.isLocked && !isMuted && bot.id !== "dl_tutor" && bot.id !== "best_friend") speakText(bot.greeting);
  };

  const handleUnlock = () => {
    if (passwordInput === "2026") { 
      setIsUnlocked(true);
      if (activeBot && !isMuted && activeBot.id !== "dl_tutor" && activeBot.id !== "best_friend") speakText(activeBot.greeting);
    } else {
      alert("Hatalı erişim kodu!");
      setPasswordInput("");
    }
  };

  const sendOnlineMessage = async (e?: React.FormEvent, customText?: string) => {
    if(e) e.preventDefault();
    const textToSend = customText || inputText;
    if (!textToSend.trim() || !activeBot || isTyping) return;
    
    const newMessages: MessageType[] = [...messages, { role: "user", content: textToSend }];
    setMessages(newMessages);
    setInputText(""); setIsTyping(true);

    try {
      const apiMessages = [
        { role: "system" as const, content: activeBot.prompt },
        ...newMessages.map(m => ({ role: m.role as "user" | "assistant", content: m.content }))
      ];

      const chatCompletion = await groq.chat.completions.create({
        messages: apiMessages,
        model: "llama-3.3-70b-versatile",
        temperature: 0.7, max_tokens: 800,
      });
      
      const reply = chatCompletion.choices[0]?.message?.content || "Hata oluştu.";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
      if(!isMuted) speakText(reply);
      
      const newXP = userXP + 25; const newQueries = totalQueries + 1;
      setUserXP(newXP); setTotalQueries(newQueries);
      localStorage.setItem('sntx_xp', newXP.toString()); localStorage.setItem('sntx_queries', newQueries.toString());
      if (newXP > userLevel * 300) { setUserLevel(prev => prev + 1); localStorage.setItem('sntx_lvl', (userLevel + 1).toString()); }

      const historyItem: HistoryItem = { bot: activeBot.name, desc: textToSend.substring(0, 40) + "...", time: new Date().toLocaleString('tr-TR') };
      const updatedHistory = [historyItem, ...chatHistory].slice(0, 20);
      setChatHistory(updatedHistory); localStorage.setItem('sntx_history', JSON.stringify(updatedHistory));

    } catch (error) {
      console.error("API Bağlantı Hatası:", error);
      setMessages([...newMessages, { role: "assistant", content: "Ağ bağlantısı kurulamadı." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderHome = () => (
    <div className="w-full flex flex-col gap-8">
      <div className="glass-panel bg-gradient-to-r from-[#007AFF]/10 to-[#34C759]/10 border-[#007AFF]/20 flex items-center justify-between p-8">
        <div><h1 className="text-4xl font-black text-slate-800 tracking-tight">Sisteme Hoş Geldin, Onur.</h1><p className="text-slate-500 font-medium mt-2">Sentrix Çekirdeği stabil. Tüm Sentrix ağlar %100 kapasiteyle emrine amade.</p></div>
        <div className="p-4 bg-white rounded-full shadow-lg"><BrainCircuit size={48} color="#007AFF" /></div>
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="glass-panel flex items-center gap-4 !p-6"><div className="p-4 bg-blue-50 rounded-2xl"><Award size={28} color="#007AFF"/></div><div><span className="text-sm font-bold text-slate-400 block">Mevcut XP</span><span className="text-2xl font-black text-slate-800">{userXP}</span></div></div>
        <div className="glass-panel flex items-center gap-4 !p-6"><div className="p-4 bg-orange-50 rounded-2xl"><MessageSquare size={28} color="#F59E0B"/></div><div><span className="text-sm font-bold text-slate-400 block">İşlenen Sorgu</span><span className="text-2xl font-black text-slate-800">{totalQueries}</span></div></div>
        <div className="glass-panel flex items-center gap-4 !p-6"><div className="p-4 bg-green-50 rounded-2xl"><Users size={28} color="#34C759"/></div><div><span className="text-sm font-bold text-slate-400 block">Sistemdeki Ajanlar</span><span className="text-2xl font-black text-slate-800">{allBots.length}</span></div></div>
      </div>
    </div>
  );

  const renderMarket = () => (
    <div className="w-full">
      <div className="flex justify-between items-center mb-10"><div><h2 className="text-4xl font-black text-slate-800">Karakter Marketi</h2></div></div>
      <div className="bots-grid">
        {allBots.map((bot) => (
          <div key={bot.id} className="bot-card" onClick={() => handleBotClick(bot)}>
            <div className="bot-image-container relative">
              <img src={bot.image} alt={bot.name} />
              <div className={`bot-badge ${bot.isLocked ? 'locked' : ''}`}>{bot.isLocked ? <><Lock size={12}/> KİLİTLİ (Lvl {bot.requiredLevel})</> : 'AÇIK'}</div>
            </div>
            <div className="bot-info">
              <h2>{bot.name}</h2><span className="text-sm font-bold text-[#007AFF]">{bot.title}</span><p>{bot.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="w-full flex flex-col gap-8">
      <h2 className="text-3xl font-black text-slate-800 mb-2">Kullanıcı Veritabanı & Başarımlar</h2>
      <div className="glass-panel flex items-center gap-10">
        <div className="relative">
          <div className="w-40 h-40 bg-gradient-to-br from-[#00C6FF] to-[#007AFF] rounded-[2rem] flex items-center justify-center shadow-2xl rotate-3"><UserCircle size={80} color="white" /></div>
          <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-[#F59E0B] to-[#EF4444] text-white w-14 h-14 rounded-full flex items-center justify-center font-black text-xl border-4 border-white shadow-xl">{userLevel}</div>
        </div>
        <div className="flex-1">
          <h2 className="text-5xl font-black text-slate-800 mb-2 tracking-tight">Onur Demir</h2>
          <p className="text-[#007AFF] font-bold tracking-widest text-sm mb-4">HITIT ÜNİVERSİTESİ | BİLGİSAYAR MÜHENDİSLİĞİ</p>
          <div className="w-full bg-slate-200 h-3 rounded-full mb-2"><div className="bg-[#007AFF] h-full rounded-full transition-all duration-1000" style={{width: `${(userXP / (userLevel * 300)) * 100}%`}}></div></div>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="w-full flex flex-col gap-6">
      <h2 className="text-3xl font-black text-slate-800 mb-4">Sistem Telemetrisi</h2>
      <div className="grid grid-cols-3 gap-6">
        <div className="glass-panel border-t-4 border-t-[#007AFF]"><Activity size={30} color="#007AFF" /><span className="block text-slate-500 font-bold mt-4 mb-1">Neural Load</span><span className="text-5xl font-black text-slate-800">%{telemetry.load.toFixed(1)}</span></div>
        <div className="glass-panel border-t-4 border-t-[#34C759]"><Zap size={30} color="#34C759" /><span className="block text-slate-500 font-bold mt-4 mb-1">Processing Power</span><span className="text-5xl font-black text-slate-800">{telemetry.power.toFixed(0)}</span></div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="w-full flex flex-col gap-6">
      <div className="flex justify-between items-center mb-4"><h2 className="text-3xl font-black text-slate-800">Sohbet Kayıtları</h2></div>
      <div className="glass-panel !p-4">
        {chatHistory.length > 0 ? chatHistory.map((h, i) => (
          <div key={i} className="history-item">
            <div className="flex items-center gap-4"><div className="p-3 bg-blue-50 rounded-xl"><MessageSquare size={24} color="#007AFF"/></div><div><h4 className="font-bold text-slate-800 text-lg">{h.bot}</h4><p className="text-slate-500 text-sm mt-1">{h.desc}</p></div></div>
            <div className="flex items-center gap-6"><span className="flex items-center gap-1 text-xs font-bold text-slate-400"><Clock size={14}/> {h.time}</span></div>
          </div>
        )) : <div className="text-center text-slate-500 font-bold p-8">Henüz kayıtlı bir sohbet bulunmuyor.</div>}
      </div>
    </div>
  );

  const renderStandardChat = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="chat-view mx-auto">
      <div className="chat-header">
        <div className="chat-header-info">
          <img src={activeBot?.image} alt={activeBot?.name} />
          <div><h3 className="font-bold text-slate-800 text-xl">{activeBot?.name}</h3></div>
        </div>
        <div className="flex items-center gap-4">
          <select className="voice-select" value={selectedVoiceURI} onChange={(e) => setSelectedVoiceURI(e.target.value)}>
            <option value="">Otomatik Ses</option>
            {availableVoices.map(v => <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>)}
          </select>
          <button onClick={() => { setIsMuted(!isMuted); window.speechSynthesis.cancel(); }} className={`action-icon-btn ${isMuted ? 'muted' : ''}`}>
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button className="chat-back-btn" onClick={() => {setActiveBot(null); window.speechSynthesis.cancel();}}><ChevronLeft size={20} /> Kapat</button>
        </div>
      </div>
      <div className="chat-messages custom-scrollbar">
        {messages.map((msg, idx) => (<motion.div key={idx} className={`message ${msg.role === 'user' ? 'user' : 'ai'}`}>{msg.content}</motion.div>))}
        {isTyping && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="message ai flex gap-2 items-center"><div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay:"0.2s"}}></div><div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay:"0.4s"}}></div></motion.div>}
      </div>
      <div className="chat-input-area">
        <form className="input-row" onSubmit={sendOnlineMessage}>
          <button type="button" className="!p-3 !bg-slate-100 !text-slate-500 !shadow-none hover:!bg-slate-200"><Mic size={24}/></button>
          <input type="text" placeholder="Komut girin..." value={inputText} onChange={(e) => setInputText(e.target.value)} disabled={isTyping}/>
          <button type="submit" disabled={isTyping} className="p-4 bg-blue-600 text-white rounded-xl font-bold"><Send size={20} /></button>
        </form>
      </div>
    </motion.div>
  );

  return (
    <div className="story-wrapper">
      <AnimatePresence initial={false}>
        {isSidebarOpen && !activeBot && (
          <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="story-sidebar">
            <div className="sidebar-header"><span className="font-black tracking-widest text-slate-800 text-xl">SENTRİX <span className="font-light text-[#007AFF]">OS</span></span></div>
            <div className="sidebar-menu custom-scrollbar">
              <div className={`menu-item ${activeTab === "home" ? "active" : ""}`} onClick={() => setActiveTab("home")}><BrainCircuit size={20} /><span>Ana Merkez</span></div>
              <div className={`menu-item ${activeTab === "market" ? "active" : ""}`} onClick={() => setActiveTab("market")}><Users size={20} /><span>AI Marketi</span></div>
              <div className={`menu-item ${activeTab === "profile" ? "active" : ""}`} onClick={() => setActiveTab("profile")}><UserCircle size={20} /><span>Profil & XP</span></div>
              <div className={`menu-item ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => setActiveTab("dashboard")}><Activity size={20} /><span>Telemetri</span></div>
              <div className={`menu-item ${activeTab === "history" ? "active" : ""}`} onClick={() => setActiveTab("history")}><MessageSquare size={20} /><span>Sohbet Geçmişi</span></div>
              <div className={`menu-item ${activeTab === "lab" ? "active" : ""}`} onClick={() => setActiveTab("lab")}><Beaker size={20} /><span>Laboratuvar (Lab)</span></div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
      <div className="story-main custom-scrollbar">
        {!activeBot && (
          <nav className="story-navbar">
            <div className="nav-brand"><BrainCircuit size={30} color="#007AFF" /></div>
            {onNavigateBack && <button className="nav-back-btn" onClick={onNavigateBack}><TerminalSquare size={18} /><span>TERMİNALE DÖN</span></button>}
          </nav>
        )}
        <div className="story-content w-full h-full relative">
          <AnimatePresence mode="wait">
            {!activeBot && activeTab === "home" && renderHome()}
            {!activeBot && activeTab === "market" && renderMarket()}
            {!activeBot && activeTab === "profile" && renderProfile()}
            {!activeBot && activeTab === "dashboard" && renderDashboard()}
            {!activeBot && activeTab === "history" && renderHistory()}
            
            {/* PROF. NÖRAL ÇAĞRISI */}
            {activeBot && activeBot.id === "dl_tutor" && (
                <ProfNoral onClose={() => {
                   setActiveBot(null);
                   setIsSidebarOpen(true);
                   window.speechSynthesis.cancel();
                }} />
            )}

            {/* SIRDAŞ ÇAĞRISI */}
            {activeBot && activeBot.id === "best_friend" && (
                <Sirdas onClose={() => {
                   setActiveBot(null);
                   setIsSidebarOpen(true);
                   window.speechSynthesis.cancel();
                }} />
            )}
            
            {activeBot && activeBot.id !== "dl_tutor" && activeBot.id !== "best_friend" && (activeBot.isLocked && !isUnlocked ? (
              <div className="lock-screen"><Lock size={56} color="#FF3B30" className="mb-4" /><h2>Şifreli Bölge</h2><input type="password" placeholder="****" maxLength={4} value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} onKeyDown={(e) => {if(e.key === 'Enter') handleUnlock()}} /><div className="flex gap-4"><button onClick={() => {setActiveBot(null); window.speechSynthesis.cancel();}}>İptal</button><button onClick={handleUnlock}>Kilidi Aç</button></div></div>
            ) : renderStandardChat())}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}