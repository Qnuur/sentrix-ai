import { motion } from "framer-motion";

interface HologramVoiceOrbProps {
  isListening: boolean;
  isSpeaking: boolean;
  volume: number;
  wakeWordDetected: boolean;
}

export default function HologramVoiceOrb({ 
  isListening, 
  isSpeaking, 
  volume, 
  wakeWordDetected 
}: HologramVoiceOrbProps) {
  const dynamicScale = 1 + (volume / 100);
  const isActive = isListening || isSpeaking;
  const isRecording = wakeWordDetected && isListening;

  // Halka konfigürasyonları
  const rings = [
    { size: 320, duration: 20, direction: 1, opacity: 0.3, width: 1 },
    { size: 280, duration: 15, direction: -1, opacity: 0.4, width: 1.5 },
    { size: 240, duration: 12, direction: 1, opacity: 0.5, width: 2 },
    { size: 200, duration: 10, direction: -1, opacity: 0.6, width: 2 },
    { size: 160, duration: 8, direction: 1, opacity: 0.7, width: 2.5 },
  ];

  return (
    <div className="relative flex items-center justify-center" style={{ width: 400, height: 400 }}>
      {/* Dış pulse efekti */}
      {isActive && (
        <motion.div
          className={`absolute rounded-full border-2 ${isRecording ? 'border-red-500/30' : 'border-cyan-500/30'}`}
          style={{ width: 360, height: 360 }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Döner halkalar */}
      {rings.map((ring, index) => (
        <motion.div
          key={index}
          className={`absolute rounded-full border ${isRecording ? 'border-red-400' : 'border-cyan-400'}`}
          style={{
            width: ring.size,
            height: ring.size,
            borderWidth: ring.width,
            opacity: isActive ? ring.opacity : ring.opacity * 0.3,
            borderStyle: index % 2 === 0 ? 'solid' : 'dashed',
          }}
          animate={{
            rotate: isActive ? 360 * ring.direction : 0,
            scale: isActive ? dynamicScale : 1,
          }}
          transition={{
            rotate: {
              duration: isActive ? ring.duration : 60,
              repeat: Infinity,
              ease: "linear",
            },
            scale: {
              duration: 0.1,
              ease: "easeOut",
            },
          }}
        >
          {/* Halka üzerindeki noktalar */}
          <div 
            className={`absolute w-2 h-2 rounded-full ${isRecording ? 'bg-red-400' : 'bg-cyan-400'}`}
            style={{
              top: '50%',
              left: '-1px',
              transform: 'translateY(-50%)',
              boxShadow: isActive ? `0 0 10px ${isRecording ? '#f87171' : '#22d3ee'}` : 'none',
            }}
          />
          <div 
            className={`absolute w-1.5 h-1.5 rounded-full ${isRecording ? 'bg-red-300' : 'bg-cyan-300'}`}
            style={{
              top: '0%',
              left: '50%',
              transform: 'translateX(-50%)',
              opacity: 0.7,
            }}
          />
        </motion.div>
      ))}

      {/* Ses dalgası çemberi */}
      {isActive && (
        <motion.div
          className={`absolute rounded-full border ${isRecording ? 'border-red-500/50' : 'border-cyan-500/50'}`}
          style={{ width: 120, height: 120 }}
          animate={{
            scale: [1, 1 + (volume / 200)],
            opacity: [0.8, 0.3],
          }}
          transition={{
            duration: 0.3,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      )}

      {/* Merkez çekirdek */}
      <motion.div
        className={`relative w-28 h-28 rounded-full flex flex-col items-center justify-center backdrop-blur-xl ${
          isRecording 
            ? 'bg-gradient-to-br from-red-900/90 to-black border-red-500' 
            : isActive 
              ? 'bg-gradient-to-br from-cyan-900/90 to-black border-cyan-500' 
              : 'bg-gradient-to-br from-cyan-950/60 to-black border-cyan-500/30'
        } border-2`}
        animate={{
          scale: isActive ? [1, 1.05, 1] : 1,
          boxShadow: isActive 
            ? isRecording 
              ? `0 0 ${30 + volume}px rgba(239,68,68,0.6), inset 0 0 ${20 + volume/2}px rgba(239,68,68,0.4)` 
              : `0 0 ${30 + volume}px rgba(34,211,238,0.6), inset 0 0 ${20 + volume/2}px rgba(34,211,238,0.4)`
            : '0 0 20px rgba(34,211,238,0.1), inset 0 0 20px rgba(34,211,238,0.1)',
        }}
        transition={{
          scale: {
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          },
          boxShadow: {
            duration: 0.2,
          },
        }}
      >
        {/* İçeride dönen geometrik şekil */}
        <motion.div
          className="absolute inset-2 rounded-full border border-cyan-400/20"
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute top-0 left-1/2 w-1 h-1 bg-cyan-400/60 rounded-full transform -translate-x-1/2" />
        </motion.div>

        {/* Ses simgesi */}
        <motion.svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke={isRecording ? "#f87171" : "#22d3ee"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={isActive ? {
            scale: [1, 1.2, 1],
          } : {}}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {isRecording ? (
            <>
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </>
          ) : isSpeaking ? (
            <>
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </>
          ) : (
            <>
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </>
          )}
        </motion.svg>

        {/* Durum metni */}
        <span className={`text-[10px] font-mono tracking-[0.2em] mt-2 font-bold ${
          isRecording 
            ? 'text-red-300' 
            : isActive 
              ? 'text-cyan-300' 
              : 'text-cyan-600'
        }`}>
          {isRecording 
            ? 'KAYIT' 
            : isSpeaking 
              ? 'KONUŞUYOR' 
              : isListening 
                ? 'DİNLİYOR' 
                : 'BEKLEMEDE'
          }
        </span>
      </motion.div>

      {/* Ses seviyesi göstergesi */}
      {isActive && (
        <div className="absolute -bottom-8 flex items-center gap-1">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className={`w-1 rounded-full ${isRecording ? 'bg-red-400' : 'bg-cyan-400'}`}
              animate={{
                height: volume > (i * 5) ? [4, 16, 4] : 4,
                opacity: volume > (i * 5) ? 1 : 0.2,
              }}
              transition={{
                height: {
                  duration: 0.3,
                  repeat: Infinity,
                  delay: i * 0.05,
                },
              }}
              style={{
                boxShadow: volume > (i * 5) ? `0 0 6px ${isRecording ? '#f87171' : '#22d3ee'}` : 'none',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}