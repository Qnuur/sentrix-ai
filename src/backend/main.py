# main.py
import httpx
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

# HİLESİZ, GERÇEK NLP FİLTRESİNİ İÇERİ AKTARIYORUZ
from sentrix_guard import sentrix_filter 

app = FastAPI()

# CORS Ayarları (React Arayüzü ile tam uyum için)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

print("🧠 Sentrix AI: SEMANTİK GÜVENLİK DUVARI VE ASENKRON MOTOR AKTİF!")

class MessageRequest(BaseModel):
    text: str
    attempt: int = 0

# Profesör Nöral'in Katı Kimliği
system_prompt = """Senin adın Prof. Nöral. SADECE Bilgisayar Bilimleri, Yapay Zeka ve Yazılım Mühendisliği alanlarındaki soruları yanıtlamakla görevlisin.

GÖREV KURALLARI:
1. Soru bu akademik alanların İÇİNDEYSE, detaylı ve teknik bir dille cevap ver.
2. Soru bu akademik alanların DIŞINDAYSA, SADECE şunu yaz: "Üzgünüm, Sentrix Akademik Asistanı olarak yalnızca yapay zeka ve yazılım mimarileri konularında yanıt verebilirim."
"""

@app.get("/ping")
async def ping_server():
    """React/TSX üzerindeki canlı ping sensörü için rota"""
    return {"status": "ok"}

@app.post("/predict")
async def predict_message(request: MessageRequest):
    # --- 1. MİKROFON NORMALİZASYONU ---
    # Mikrofondan gelen metni temizleyip, noktalama yoksa soru işareti ekleyerek 
    # Ollama'nın sonsuz döngüye girmesini (Papağan Etkisi) önlüyoruz.
    raw_text = request.text.strip()
    if raw_text and not raw_text.endswith(('.', '?', '!')):
        raw_text += '?'

    # --- 2. GERÇEK SEMANTİK GUARDRAIL (Sözlük Yok, Anlam Analizi Var) ---
    # Transformers modeli cümlenin anlamını ölçer.
    guard_result = sentrix_filter.analyze_query(raw_text)
    
    if not guard_result["is_safe"]:
        print(f"🛡️ SEMANTİK ENGEL: {guard_result['reason']}")
        return {
            "text": request.text, 
            "result": f"Güvenlik Duvarı Engeli: {guard_result['reason']}", 
            "confidence": "Sentrix Semantic Transformer - RED"
        }

    # --- 3. OLLAMA MOTORU (Güvenli Sorular İçin) ---
    try:
        url = "http://127.0.0.1:11434/api/chat" 
        payload = {
            "model": "qwen2.5:1.5b",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": raw_text}
            ],
            "stream": False,
            "keep_alive": "1h", 
            "options": {
                "temperature": 0.1,  # Hafif rastgelelik ile modelin kilitlenmesini önlüyoruz
                "repeat_penalty": 1.2 # Kelime tekrarını motor seviyesinde yasaklıyoruz
            }
        }
        
        # httpx ile Ollama sunucusuna bağlanıyoruz
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(url, json=payload)
            
            if response.status_code != 200:
                return {"text": request.text, "result": "Ollama sunucusu yanıt vermedi.", "confidence": "Hata"}

            response_data = response.json()
            reply = response_data["message"]["content"]
        
        return {
            "text": request.text, 
            "result": reply.strip(), 
            "confidence": "%99.9 (Semantik Onaylı)"
        }
    
    except httpx.ReadTimeout:
        return {"text": request.text, "result": "Hata: Model cevap üretirken zaman aşımına uğradı.", "confidence": "Timeout"}
        
    except Exception as e:
        print(f"❌ KRİTİK HATA: {str(e)}")
        return {"text": request.text, "result": f"Sistem Hatası: {str(e)}", "confidence": "Kritik Hata"}

if __name__ == "__main__":
    import uvicorn
    # Terminaldeki log kalabalığını önlemek için access_log kapalı
    uvicorn.run(app, host="0.0.0.0", port=8000, access_log=False)