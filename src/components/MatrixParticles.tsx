import React, { useEffect, useRef } from 'react';

// ==========================================
// SENTRİX AI - PURE HOLOGRAPHIC 3D MATRIX
// Sadece ve Sadece Yatay 3D Matrisler
// ==========================================

export default function MatrixParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const CHARS = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛ0123456789".split("");
    // SADECE HOLOGRAFIK RENKLER (MAVİ YOK)
    const COLORS = ["#00FF41", "#FF00FF"]; // Matrix Yeşili ve Hologram Pembesi

    const streams: any[] = [];
    const fov = 350; // 3D Derinlik Açısı

    // SADECE YATAY 3D MATRIX AKIŞLARI OLUŞTURULUYOR
    for (let i = 0; i < 200; i++) { 
      streams.push({
        x: (Math.random() - 0.5) * width * 3, 
        y: (Math.random() - 0.5) * height * 2.5,
        z: Math.random() * 2000 + 100, // Z ekseninde derinlik
        speed: (Math.random() * 2 + 1) * (Math.random() > 0.5 ? 1 : -1), // Sağ veya Sol
        len: Math.floor(Math.random() * 20 + 10), // Kuyruk uzunluğu
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        chars: Array.from({ length: 30 }, () => CHARS[Math.floor(Math.random() * CHARS.length)])
      });
    }

    let animId: number;

    const render = () => {
      // ZEMİNİ TEMİZLE (Tamamen Simsiyah Uzay)
      ctx.fillStyle = "#030303";
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Derinliğe göre sırala (Arkada kalanlar öndekilerin üstüne çıkmasın)
      streams.sort((a, b) => b.z - a.z);

      streams.forEach(s => {
        s.x += s.speed;
        
        // Ekrandan çıkınca başa sar
        if (s.x > width * 1.5 || s.x < -width * 1.5) {
          s.x = s.speed > 0 ? -width * 1.5 : width * 1.5;
          s.y = (Math.random() - 0.5) * height * 2.5;
        }

        const scale = fov / s.z;
        const px = cx + s.x * scale;
        const py = cy + s.y * scale;
        const fontSize = 16 * scale;

        // Sadece ekranda görünenleri çiz
        if (fontSize > 1 && px > -200 && px < width + 200 && py > -100 && py < height + 100) {
          ctx.font = `${Math.max(1, fontSize)}px monospace`; 
          
          for (let i = 0; i < s.len; i++) {
            const charX = px - (i * fontSize * (s.speed > 0 ? 1 : -1));
            
            // %2 ihtimalle harf değişir
            if (Math.random() < 0.02) s.chars[i] = CHARS[Math.floor(Math.random() * CHARS.length)]; 

            if (i === 0) {
              // Lider harf beyaz parlar
              ctx.fillStyle = "#ffffff";
              ctx.shadowBlur = 10 * scale;
              ctx.shadowColor = s.color;
            } else {
              // Kuyruktaki harfler kendi renginde yarı saydam olur (Hologram efekti)
              ctx.fillStyle = s.color;
              ctx.globalAlpha = Math.max(0, 1 - (i / s.len)) * 0.7;
              ctx.shadowBlur = 0;
            }
            ctx.fillText(s.chars[i], charX, py);
            
            ctx.globalAlpha = 1; // Sıfırla
            ctx.shadowBlur = 0;
          }
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();

    // --- EKRAN BOYUTU DEĞİŞİMİNİ DİNLE ---
    const onResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 w-full h-full pointer-events-none" 
      style={{ zIndex: 1, backgroundColor: "#030303" }} 
    />
  );
}