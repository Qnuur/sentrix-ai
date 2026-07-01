# sentrix_guard.py
from transformers import pipeline

class SentrixNLPFilter:
    def __init__(self):
        print("🧠 Sentrix Semantic Guard: Gerçek Transformer NLP Modeli Yükleniyor...")
        # SÖZLÜK VEYA HİLE YOK. Metnin anlamını (semantiğini) anlayan model var.
        # Türkçe destekli, hafif ve çok zeki bir model kullanıyoruz.
        self.classifier = pipeline(
            "zero-shot-classification", 
            model="MoritzLaurer/mDeBERTa-v3-base-mnli-xnli" 
        )
        
        # Sadece modeli yönlendireceğimiz konseptleri veriyoruz, kelimeleri değil.
        self.candidate_labels = [
            "Bilgisayar Bilimleri ve Yapay Zeka", 
            "Siyaset ve Gündem", 
            "Spor ve Futbol", 
            "Magazin ve Ünlüler", 
            "Günlük Sohbet", 
            "Yemek Tarifleri"
        ]

    def analyze_query(self, text: str) -> dict:
        # 3 kelimeden kısa "sa", "naber" gibi anlamsız metinleri baştan ele
        if len(text.split()) < 3:
            return {"is_safe": False, "reason": "Soru çok kısa veya anlamsız."}

        # Model cümlenin "anlamını" okur ve yukarıdaki kategorilere matematiksel olarak böler
        result = self.classifier(text, self.candidate_labels)
        
        top_category = result['labels'][0]
        confidence = result['scores'][0]

        # Eğer cümlenin anlamı %100 Yazılım/Yapay zeka ise geçiş ver
        if top_category == "Bilgisayar Bilimleri ve Yapay Zeka":
            return {"is_safe": True, "reason": f"Akademik bağlam onaylandı (Eminlik: %{confidence*100:.1f})"}
        else:
            return {"is_safe": False, "reason": f"Alakasız konu tespiti: {top_category} (Eminlik: %{confidence*100:.1f})"}

# Dışarıdan çağrılacak ana fonksiyonumuz
sentrix_filter = SentrixNLPFilter()

def verify_academic_query(text: str) -> bool:
    result = sentrix_filter.analyze_query(text)
    return result["is_safe"]