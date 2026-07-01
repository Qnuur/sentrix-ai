import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface VoiceEngineProps {
  onTranscript: (text: string, isFinal: boolean) => void;
  onAudioState: (listening: boolean, speaking: boolean) => void;
  onVolumeChange: (volume: number) => void;
  isProcessing: boolean;
}

export default function VoiceEngine({ 
  onTranscript, 
  onAudioState, 
  onVolumeChange,
  isProcessing 
}: VoiceEngineProps) {
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>(0);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spacePressedRef = useRef(false);
  const isListeningRef = useRef(false);
  const lastTranscriptRef = useRef("");
  const interimBufferRef = useRef("");

  // Ses analizi başlat
  const startVolumeAnalysis = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      analyserRef.current = analyser;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const analyze = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const normalizedVolume = Math.min((average / 128) * 100, 100);
        setVolume(normalizedVolume);
        onVolumeChange(normalizedVolume);
        animationFrameRef.current = requestAnimationFrame(analyze);
      };
      analyze();
    } catch (err) {
      console.warn("Mikrofon erişimi reddedildi:", err);
    }
  }, [onVolumeChange]);

  const stopVolumeAnalysis = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (audioContextRef.current) audioContextRef.current.close();
    setVolume(0);
    onVolumeChange(0);
  }, [onVolumeChange]);

  const startRecognition = useCallback(() => {
    if (!recognitionRef.current || isListeningRef.current) return;
    try {
      recognitionRef.current.start();
      isListeningRef.current = true;
      setIsListening(true);
      onAudioState(true, false);
      startVolumeAnalysis();
    } catch (e) {}
  }, [onAudioState, startVolumeAnalysis]);

  const stopRecognition = useCallback(() => {
    if (!recognitionRef.current || !isListeningRef.current) return;
    try { recognitionRef.current.stop(); } catch (e) {}
    isListeningRef.current = false;
    setIsListening(false);
    onAudioState(false, false);
    stopVolumeAnalysis();
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
  }, [onAudioState, stopVolumeAnalysis]);

  // Speech Recognition kurulum - HIZLI TEPKİ
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Tarayıcı Ses API'sini desteklemiyor.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'tr-TR';
    recognition.maxAlternatives = 1;
    // HIZLI TEPKİ için düşük eşik değerleri
    // @ts-ignore
    if (recognition.vad) recognition.vad = true;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      isListeningRef.current = true;
      setIsListening(true);
      onAudioState(true, false);
    };

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      // ANINDA interim gönder - ekrana hemen yazsın
      const currentText = final || interim;
      if (currentText && currentText !== lastTranscriptRef.current) {
        lastTranscriptRef.current = currentText;
        interimBufferRef.current = currentText;
        onTranscript(currentText, false); // interim olarak gönder
      }

      if (final) {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        // ÇOK HIZLI final gönder - 300ms sessizlik
        silenceTimerRef.current = setTimeout(() => {
          if (final.trim().length > 1) {
            onTranscript(final.trim(), true);
            lastTranscriptRef.current = "";
            interimBufferRef.current = "";
          }
        }, 300);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') return;
      if (event.error === 'aborted') return;
      console.error("Ses Hatası:", event.error);
      if (isListeningRef.current) {
        setTimeout(() => {
          if (isListeningRef.current) {
            try { recognition.start(); } catch (e) {}
          }
        }, 200);
      }
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        setTimeout(() => {
          if (isListeningRef.current) {
            try { recognition.start(); } catch (e) {}
          }
        }, 50);
      } else {
        setIsListening(false);
      }
    };

    return () => {
      try { recognition.stop(); } catch (e) {}
      stopVolumeAnalysis();
    };
  }, []); // BOŞ DEPENDENCY

  // KLAVYE KONTROLLERİ
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !spacePressedRef.current && !e.repeat) {
        e.preventDefault();
        spacePressedRef.current = true;
        startRecognition();
      }

      if (e.code === 'KeyO' && !e.repeat) {
        e.preventDefault();
        window.speechSynthesis.cancel();
        setIsMuted(true);
        setTimeout(() => setIsMuted(false), 100);
        stopRecognition();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spacePressedRef.current = false;
        stopRecognition();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [startRecognition, stopRecognition]);

  // MOUSE İLE MANUEL KONTROL
  const toggleListening = () => {
    if (isListeningRef.current) {
      stopRecognition();
    } else {
      startRecognition();
    }
  };

  return (
    <motion.div
      className="fixed bottom-6 left-6 z-50 flex flex-col items-center gap-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1 mb-2"
          >
            {[...Array(12)].map((_, i) => {
              const threshold = (i / 12) * 100;
              const isActive = volume > threshold;
              return (
                <motion.div
                  key={i}
                  className="w-1 rounded-full"
                  style={{
                    backgroundColor: isActive ? '#10B981' : 'rgba(255,255,255,0.1)',
                    height: isActive ? 8 + Math.random() * 16 : 4,
                    boxShadow: isActive ? '0 0 8px #10B981' : 'none'
                  }}
                  animate={{ height: isActive ? [8, 20, 8] : 4 }}
                  transition={{ duration: 0.15, repeat: Infinity, delay: i * 0.02 }}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleListening}
        className={`p-4 rounded-full border-2 shadow-2xl transition-all duration-500 flex items-center gap-3 ${
          isListening 
            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.4)]' 
            : 'bg-gray-900/90 border-gray-600 text-gray-400 hover:border-gray-400'
        }`}
      >
        <AnimatePresence mode="wait">
          {isListening ? (
            <motion.div key="listening" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="relative flex items-center gap-3">
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500" />
              </span>
              <Mic size={24} />
              <span className="text-xs font-bold tracking-widest uppercase hidden md:block">DİNLİYOR...</span>
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-3">
              <MicOff size={24} />
              <span className="text-xs font-bold tracking-widest hidden md:block">MİKROFON KAPALI</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          window.speechSynthesis.cancel();
          setIsMuted(true);
          setTimeout(() => setIsMuted(false), 100);
          stopRecognition();
        }}
        className={`p-3 rounded-full border-2 shadow-xl transition-all duration-300 flex items-center gap-2 ${
          isMuted 
            ? 'bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]' 
            : 'bg-gray-900/90 border-gray-600 text-gray-400 hover:border-red-400 hover:text-red-400'
        }`}
      >
        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        <span className="text-[10px] font-bold tracking-widest uppercase hidden md:block">SUSTUR</span>
      </motion.button>

      <div className="flex flex-col gap-1 text-center">
        <span className="text-[9px] text-white/30 font-mono tracking-wider">[SPACE] Basılı Tut = Dinle</span>
        <span className="text-[9px] text-white/30 font-mono tracking-wider">[O] Anında Sustur</span>
        <span className="text-[9px] text-emerald-400/50 font-mono tracking-wider">Mouse ile Aç/Kapa</span>
      </div>
    </motion.div>
  );
}