# 🎬 Soru Çözüm Videosu Oluşturucu (EduClip Maker)

Eğitim odaklı soru çözüm videoları (Reels, Shorts, TikTok ve YouTube video içerikleri) üretmek için tasarlanmış, **harici hiçbir yapay zeka modeline (Whisper, OCR vb.) bağımlı olmayan**, tamamen tarayıcı üzerinde çalışan modern ve yarı otomatik bir web aracıdır.

---

## 🚀 Öne Çıkan Özellikler

1. **İstemci Taraflı Sıfır-Kurulum (Zero-Install):**
   - Node.js, Python veya harici bir sunucu kurmanıza gerek yoktur.
   - `index.html` dosyasını çift tıklayarak veya `start.bat` ile Chrome, Edge, Firefox ya da Safari üzerinde hemen kullanmaya başlayabilirsiniz.
   - Tüm video ve ses işleme doğrudan tarayıcının donanım hızlandırmalı HTML5 Canvas ve Web Audio motorları ile yapılır. Verileriniz bilgisayarınızdan dışarı çıkmaz.

2. **İnteraktif Alan Seçimi (Bounding Box & Handles):**
   - Görsel üzerine fare ile sürükleyip bırakarak cevap alanını çizebilirsiniz.
   - **8 Tutamaç (Handles):** Köşelerden ve kenarlardan hassas yeniden boyutlandırma.
   - **Şekil Desteği:** İster yuvarlak hatlı dikdörtgen (Rounded Rectangle), ister şık bir elips (çember) seçin.
   - **Klavye Desteği:** Yön tuşlarıyla piksel hassasiyetinde taşıma (Shift ile 10px hızlı kaydırma).

3. **Zaman Damgası (WaveSurfer Dalga Formu):**
   - Yüklenen ses kaydının interaktif frekans dalga formunu (waveform) gösterir.
   - Sesi dinlerken cevabı açıkladığınız anda klavyeden <kbd>M</kbd> veya **"Şu Anı İşaretle"** butonuna basarak tam saniyeyi işaretleyebilirsiniz.
   - Milisaniye hassasiyetinde ince ayar (+/- 0.1s butonları).
   - **"Vurguyu Test Et"** butonu ile cevaptan 1.5 saniye geriden başlatıp tam senkronizasyonu anında dinleyebilirsiniz.

4. **Mikro Animasyon, Yeşil Vurgu & Onay İşareti (Tik ✓):**
   - Pat diye belirmek yerine **Scale-Up (0.85 ➔ 1.05 ➔ 1.0) + Fade-In + Canlı Neon Glow (Parlama Nabzı)** mikro animasyonu.
   - **Animasyonlu Onay Rozeti (✓ Tik):** Cevap anında beliren, el yazısı gibi sırayla çizilen ve yaylanan zümrüt rozet veya yalın onay işareti.
   - **Rozet Konumu:** Sağ kenar, Sol kenar (şık harfinin yanı örn: ✓ C), Sağ üst köşe veya Kutu içi.
   - Renk seçici, dolgu opaklığı (%10 - %80), kenarlık kalınlığı ve köşe yuvarlaklığı ayarları.
   - Belirlenen saniyede belirip videonun sonuna kadar ekranda kalır.

5. **Tek Tıkla Video Çıktısı (Export & Render):**
   - Orijinal görsel çözünürlüğünde (veya 1080p Full HD) 30/60 FPS **MP4** formatında bilgisayarınıza indirir.
   - Canlı render ilerleme çubuğu (%0 - %100) ve render edilen karelerin anlık önizlemesi.
   - Terminal kullanıcıları için hazır 1-tık **FFmpeg CLI komutu** ve `render_ffmpeg.py` betiği.

---

## 📁 Proje Dosya Yapısı

```
soru-cozum-video-maker/
├── index.html            # Ana uygulama arayüzü (Tailwind CSS, WaveSurfer, Lucide)
├── app.js                # Canvas çizim, bounding box, animasyon ve render motoru
├── styles.css            # Özel koyu tema, cam efekti (glassmorphism) ve animasyonlar
├── start.bat             # Windows için tek tıkla başlatıcı
├── render_ffmpeg.py      # İsteğe bağlı CLI & Terminal FFmpeg render betiği
└── README.md             # Kullanım kılavuzu ve teknik detaylar
```

---

## ⌨️ Klavye Kısayolları

| Kısayol | İşlem |
| :--- | :--- |
| <kbd>Boşluk (Space)</kbd> | Ses kaydını Oynat / Duraklat |
| <kbd>M</kbd> | Oynatılan o anı cevap başlangıç zaman damgası olarak kaydet |
| <kbd>P</kbd> | Vurgu anından 1.5 saniye öncesinden önizlemeyi başlat |
| <kbd>Yön Tuşları (← ↑ → ↓)</kbd> | Seçili vurgu alanını 2px kaydır |
| <kbd>Shift + Yön Tuşları</kbd> | Seçili vurgu alanını 10px hızlı kaydır |
| <kbd>Delete / Backspace</kbd> | Çizilen vurgu alanını temizle |

---

## 🛠️ Nasıl Kullanılır?

### 1. Hızlı Başlangıç (Demo Deneyimi)
1. [`index.html`](file:///C:/Users/Ubeydullah/.gemini/antigravity/scratch/soru-cozum-video-maker/index.html) dosyasını tarayıcınızda açın veya `start.bat` dosyasına çift tıklayın.
2. Sağ üstteki **"✨ Örnek Demo Yükle"** butonuna basın.
3. Otomatik olarak 1600x1000 çözünürlükte örnek bir geometri sorusu, C şıkkı vurgusu ve anlatım sesi yüklenecektir.
4. **"Vurguyu Test Et"** butonuna basarak yeşil animasyonun sesle nasıl eşleştiğini görün.
5. **"Videoyu Render Al & İndir (MP4)"** butonuna basarak videonuzu saniyeler içinde bilgisayarınıza kaydedin!

### 2. Kendi Sorularınızla Üretim:
1. **Dosyaları Yükle:** Soru görselinizi (PNG, JPG, WebP) ve ses kaydınızı (MP3, WAV, M4A) yükleyin.
2. **Alanı Çiz:** Canvas üzerinde doğru cevabın olduğu şıkkın üzerine fareyle bir kutu çizin. Boyutları köşelerdeki tutamaçlarla ayarlayın.
3. **Zaman Damgasını Belirle:** Sesi dinlerken doğru cevabı telaffuz ettiğiniz anda <kbd>M</kbd> tuşuna basın.
4. **Animasyonu Özelleştir:** İstediğiniz yeşil tonunu, saydamlığı ve Scale-Up / Neon Glow efektini belirleyin.
5. **Dışa Aktar:** Çözünürlüğü seçip **"Render Al"** butonuna tıklayın.
