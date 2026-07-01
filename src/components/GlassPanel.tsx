import { ReactNode } from "react";

interface GlassPanelProps {
  title: string;
  children: ReactNode;
}

export default function GlassPanel({ title, children }: GlassPanelProps) {
  return (
    // %20 Kuralı: Ferah, boğuk olmayan, yarı saydam koyu gri zemin ve ince beyaz sınırlar
    <div className="bg-[#1a1a1a]/60 backdrop-blur-2xl border border-white/5 rounded-3xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
      <h3 className="text-gray-300 font-bold tracking-[0.2em] mb-5 flex items-center gap-3 text-xs uppercase border-b border-white/5 pb-3">
        {/* %10 Kuralı: Sadece küçük bir Google Mavisi nokta */}
        <span className="w-2 h-2 rounded-full bg-[#4285F4] shadow-[0_0_8px_#4285F4]" />
        {title}
      </h3>
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}