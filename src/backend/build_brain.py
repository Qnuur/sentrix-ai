import pickle
import numpy as np
from sentence_transformers import SentenceTransformer

# KAGGLE KALİTESİNDE DE DEVASA DERİN ÖĞRENME VERİ SETİ
mega_qa_dataset = [
    # TEMEL KAVRAMLAR
    {"question": "Epoch (Dönem) nedir?", "answer": "Epoch, yapay sinir ağlarında tüm eğitim veri setinin ağdan ileriye ve geriye doğru tam bir kez geçirilmesi işlemidir. Model, her epoch sonunda ağırlıklarını güncelleyerek hatasını azaltmaya çalışır."},
    {"question": "Batch Size (Grup Boyutu) nedir?", "answer": "Batch size, modelin ağırlıklarını güncellemeden önce ağdan geçirilen ve işlenen eğitim örneklerinin (verilerin) sayısıdır. Örneğin batch size 32 ise, model 32 veriyi işler, hatayı hesaplar ve ağırlıklarını günceller."},
    {"question": "Learning Rate (Öğrenme Oranı) nedir?", "answer": "Öğrenme oranı, gradyan inişi (gradient descent) optimizasyonunda model ağırlıklarının her adımda ne kadar güncelleneceğini belirleyen kritik bir hiperparametredir. Çok büyük olursa model yakınsamaz, çok küçük olursa eğitim inanılmaz yavaşlar."},
    
    # MİMARİLER
    {"question": "Evrişimli Sinir Ağları (CNN) nedir?", "answer": "CNN (Convolutional Neural Networks), özellikle görüntü işleme ve bilgisayarlı görü görevlerinde kullanılan bir derin öğrenme mimarisidir. Özellik çıkarımı (feature extraction) için evrişim (convolution) ve ortaklama (pooling) katmanlarını kullanır."},
    {"question": "Yinelemeli Sinir Ağları (RNN) nedir?", "answer": "RNN (Recurrent Neural Networks), zaman serileri, ses veya metin gibi sıralı (sequential) verileri işlemek için tasarlanmış bir mimaridir. Önceki adımlardaki bilgiyi gizli durumunda (hidden state) tutarak mevcut adımın işlenmesinde bağlam olarak kullanır."},
    {"question": "LSTM (Uzun Kısa Süreli Bellek) nedir?", "answer": "LSTM, standart RNN'lerdeki 'kaybolan gradyan' (vanishing gradient) problemini çözmek için geliştirilmiş özel bir RNN türüdür. İçerisindeki unutma, girdi ve çıktı kapıları (gates) sayesinde uzun vadeli bağımlılıkları çok daha iyi öğrenir."},
    {"question": "GRU (Geçitli Yinelemeli Birimler) nedir?", "answer": "GRU, LSTM'in daha basitleştirilmiş ve hızlı çalışan bir versiyonudur. Hücre durumu (cell state) yerine sadece gizli durum (hidden state) kullanır ve güncelleme ile sıfırlama kapılarına sahiptir."},
    {"question": "Transformer mimarisi nedir?", "answer": "Transformer, 'Dikkat Mekanizması' (Self-Attention) kullanarak sıralı verileri RNN'lere ihtiyaç duymadan paralel olarak işleyebilen devrim niteliğinde bir mimaridir. Günümüzdeki modern büyük dil modellerinin (LLM) temelini oluşturur."},
    {"question": "BERT modeli nedir?", "answer": "BERT (Bidirectional Encoder Representations from Transformers), metni sadece soldan sağa değil, her iki yönden de aynı anda okuyarak bağlamı mükemmel bir şekilde anlayan, Google tarafından geliştirilmiş bir dil modelidir."},
    {"question": "GAN (Çekişmeli Üretici Ağlar) nedir?", "answer": "GAN (Generative Adversarial Networks), yeni veriler (örneğin gerçekçi insan yüzleri veya sahte fotoğraflar) üretmek için kullanılan bir derin öğrenme mimarisidir. İki sinir ağından oluşur: Sahte veri üreten 'Üretici' (Generator) ve bu verinin gerçek mi sahte mi olduğunu anlamaya çalışan 'Ayrımcı' (Discriminator)."},
    {"question": "Autoencoder (Oto-Kodlayıcı) nedir?", "answer": "Autoencoder, girdiyi daha düşük boyutlu bir koda sıkıştıran (Encoder) ve sonra bu koddan orijinal girdiyi yeniden oluşturan (Decoder) denetimsiz bir öğrenme mimarisidir. Boyut azaltma ve gürültü temizleme için kullanılır."},
    {"question": "ResNet (Artık Ağlar) nedir?", "answer": "ResNet (Residual Networks), çok derin sinir ağlarını eğitirken ortaya çıkan kaybolan gradyan problemini çözmek için 'Atlama Bağlantıları' (Skip Connections) kullanan devrimsel bir CNN mimarisidir."},
    
    # EĞİTİM VE OPTİMİZASYON
    {"question": "Aşırı Öğrenme (Overfitting) nedir?", "answer": "Aşırı öğrenme, bir modelin eğitim verisini çok iyi ezberlemesi ancak daha önce hiç görmediği yeni veriler üzerinde başarısız olması durumudur. Model, genel örüntüleri öğrenmek yerine eğitim verisindeki gürültüyü ezberlediğinde ortaya çıkar."},
    {"question": "Eksik Öğrenme (Underfitting) nedir?", "answer": "Eksik öğrenme, bir modelin kapasitesinin, verideki temel örüntüleri ve karmaşıklığı öğrenmek için yetersiz kalması durumudur. Model hem eğitim verisinde hem de test verisinde yüksek hata oranları verir."},
    {"question": "Geri Yayılım (Backpropagation) nedir?", "answer": "Geri yayılım, sinir ağlarını eğitmek için kullanılan temel optimizasyon algoritmasıdır. Ağın ürettiği tahmin ile gerçek sonuç arasındaki hatayı hesaplar ve türev (gradyan) zincir kuralı kullanarak bu hatayı ağın gerisine doğru iletip ağırlıkları günceller."},
    {"question": "Dropout (Hattan Düşürme) nedir?", "answer": "Dropout, derin ağlarda aşırı öğrenmeyi (overfitting) engellemek için kullanılan bir düzenlileştirme tekniğidir. Eğitim sırasında her bir iterasyonda rastgele seçilen bazı nöronların geçici olarak ağdan çıkarılması (sıfırlanması) işlemidir."},
    {"question": "Adam Optimizasyon Algoritması nedir?", "answer": "Adam (Adaptive Moment Estimation), derin öğrenmede en çok kullanılan ve en başarılı optimizasyon algoritmalarından biridir. Gradyanların hem birinci hem de ikinci momentlerini (ortalama ve varyans) hesaplayarak öğrenme oranını her parametre için otomatik olarak uyarlar."},
    {"question": "SGD (Stokastik Gradyan İnişi) nedir?", "answer": "SGD, her iterasyonda tüm veri seti yerine rastgele seçilen tek bir örnek veya küçük bir grup (mini-batch) üzerinden hata payını hesaplayıp ağırlıkları güncelleyen bir optimizasyon algoritmasıdır."},
    {"question": "Kayıp Fonksiyonu (Loss Function) nedir?", "answer": "Kayıp fonksiyonu, yapay zeka modelinin yaptığı tahmin ile gerçek değer arasındaki farkı (hatayı) matematiksel olarak ölçen fonksiyondur. Modelin amacı, eğitim süresince bu kayıp değerini en aza indirmektir."},
    {"question": "Cross-Entropy Loss (Çapraz Entropi Kaybı) nedir?", "answer": "Çapraz entropi kaybı, özellikle sınıflandırma (classification) problemlerinde kullanılan bir kayıp fonksiyonudur. Modelin tahmin ettiği olasılık dağılımı ile gerçek sınıfın olasılık dağılımı arasındaki farkı ölçer."},
    {"question": "MSE (Ortalama Kare Hatası) nedir?", "answer": "MSE (Mean Squared Error), genellikle regresyon (tahmin) problemlerinde kullanılan bir kayıp fonksiyonudur. Tahmin edilen değerler ile gerçek değerler arasındaki farkların karelerinin ortalamasını alır."},
    
    # AKTİVASYON FONKSİYONLARI VE DİĞERLERİ
    {"question": "Aktivasyon Fonksiyonu nedir?", "answer": "Aktivasyon fonksiyonu, bir yapay nöronun üreteceği çıktıyı belirleyen matematiksel fonksiyondur. Ağa doğrusal olmama (non-linearity) özelliği katarak, modelin karmaşık problemleri çözmesini sağlar."},
    {"question": "ReLU (Rectified Linear Unit) nedir?", "answer": "ReLU, derin öğrenmede en çok kullanılan aktivasyon fonksiyonudur. Negatif girdileri 0'a eşitler, pozitif girdileri ise aynen geçirir. Matematiksel olarak f(x) = max(0, x) şeklinde ifade edilir."},
    {"question": "Sigmoid aktivasyon fonksiyonu nedir?", "answer": "Sigmoid, girdiyi 0 ile 1 arasında bir değere sıkıştıran aktivasyon fonksiyonudur. Genellikle ikili sınıflandırma (binary classification) problemlerinin son katmanında olasılık üretmek için kullanılır."},
    {"question": "Softmax fonksiyonu nedir?", "answer": "Softmax, bir sayı dizisini 0 ile 1 arasında olasılık değerlerine dönüştüren ve bu değerlerin toplamının 1 olmasını sağlayan bir fonksiyondur. Çok sınıflı sınıflandırma (multi-class classification) modellerinin çıktı katmanında kullanılır."},
    {"question": "Batch Normalization (Toplu Normalleştirme) nedir?", "answer": "Batch Normalization, her bir mini-batch için ağdaki katmanların girdilerini standardize ederek (ortalama 0, varyans 1) eğitimin daha hızlı, dengeli ve yüksek öğrenme oranlarıyla yapılmasını sağlayan bir tekniktir."},
    {"question": "Gradyan Kırpması (Gradient Clipping) nedir?", "answer": "Gradyan kırpması, özellikle RNN'lerde karşılaşılan 'patlayan gradyan' (exploding gradient) sorununu çözmek için gradyan değerlerinin belirli bir eşik değeri (threshold) aşmasını engelleyen bir tekniktir."}
]

print("🧠 MEGA Veri Seti Motoru Başlatılıyor...")
embedder = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

questions = [item["question"] for item in mega_qa_dataset]
answers = [item["answer"] for item in mega_qa_dataset]

print("⏳ Kaggle kalitesindeki veriler vektör uzayına dönüştürülüyor...")
q_embeddings = embedder.encode(questions, show_progress_bar=True)

brain_data = {
    "questions": questions,
    "answers": answers,
    "embeddings": q_embeddings
}

with open("sentrix_mega_beyin.pkl", "wb") as f:
    pickle.dump(brain_data, f)

print("🎯 KUSURSUZ MEGA Q&A BEYNİ OLUŞTURULDU: sentrix_mega_beyin.pkl")