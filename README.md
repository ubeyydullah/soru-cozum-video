# 🎬 Soru Çözüm Videosu Oluşturucu (EduClip Maker)

Eğitim odaklı soru çözüm videoları (Reels, Shorts, TikTok ve YouTube video içerikleri) üretmek için tasarlanmış, **harici hiçbir yapay zeka modeline (Whisper, OCR vb.) bağımlı olmayan**, tamamen tarayıcı üzerinde çalışan modern ve yarı otomatik bir web stüdyosudur.

---

## 🚀 Öne Çıkan Gelişmiş Özellikler

1. **İzlenme Oranını Artıran İlerleme Çubuğu (Retention Bar):**
   - Video boyunca en altta (veya en üstte) kesintisiz akan, izleyicinin videoda kalma süresini ve tamamlama oranını artıran dinamik bar.
   - **Damlalık (EyeDropper):** Ekrandaki herhangi bir pikselden (soru görselindeki bir logo veya renkten) tek tıkla damlalıkla renk çekebilme.
   - Kalınlık (3px - 14px) ve konum (En Alt / En Üst) ayarı.

2. **Çoklu Vurgu & Yanlış Şıkkı Eleme (Multi-Annotation):**
   - **🔴 Yanlış Eleme (✕):** Soru çözülürken elenen yanlış şıkları kırmızı kutu/elips ve animasyonlu `✕` çarpı işaretiyle işaretleme.
   - **🟢 Doğru Cevap (✓):** Doğru cevabı zümrüt yeşili neon çerçeve ve el yazısı gibi çizilen `✓` onay işaretiyle patlatma.
   - **🪄 Sihirli Tıkla-Sar:** Görseldeki şıkkın üzerine sadece bir kez dokunun; sistem metin sınırlarını algılayıp şıkkı otomatik çevreler.
   - **Kalıcılık:** İşaretlenen her seçenek kendi zaman damgasında (timestamp) devreye girer ve videonun sonuna kadar ekranda sabit kalır.
   - **Katman Listesi:** Eklenen tüm şıklar zaman çizelgesinde rozet olarak listelenir, tek tıkla seçilip düzenlenebilir veya silinebilir.

3. **WebCodecs + Donanım Hızlandırmalı Render (2-3 Saniye!):**
   - Standart gerçek zamanlı kayıt yerine doğrudan GPU video enkoderi (WebCodecs + MP4-Muxer) kullanılır.
   - 60 saniyelik bir video çıktısı ortalama 2-3 saniyede %100 çevrimdışı olarak MP4 formatında üretilir.

4. **İstemci Taraflı Sıfır-Kurulum (Zero-Install & Zero-AI):**
   - Node.js veya harici bir sunucu gerekmez. Çift tıklayarak veya `start.bat` ile anında açılır.
   - Hiçbir API kotası veya token tüketimi yoktur.

---

## 📁 Proje Dosya Yapısı

```
soru-cozum-video-maker/
├── index.html            # Ana uygulama arayüzü (Tailwind CSS, WaveSurfer, Lucide, EyeDropper)
├── app.js                # Canvas çizim, çoklu katman, Tıkla-Sar ve WebCodecs motoru
├── mp4-muxer.js          # Donanım hızlandırmalı MP4 video paketleyici
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
| <kbd>M</kbd> | O anki ses saniyesini **Doğru Şık (✓)** zamanı olarak kaydet |
| <kbd>X</kbd> | O anki ses saniyesini **Yanlış Şık (✕)** eleme zamanı olarak kaydet |
| <kbd>1</kbd> | Vurgu türünü **🟢 Doğru (✓)** moduna al |
| <kbd>2</kbd> | Vurgu türünü **🔴 Yanlış (✕)** moduna al |
| <kbd>Tab</kbd> / <kbd>Shift+Tab</kbd> | Sonraki / Önceki şıkkı seç |
| <kbd>Z</kbd> | Son işaretlenen şıkkı geri al |
| <kbd>P</kbd> | Vurgu anından 1.5 saniye öncesinden önizlemeyi başlat |
| <kbd>Yön Tuşları (← ↑ → ↓)</kbd> | Seçili vurgu alanını 2px kaydır (Shift ile 10px) |
| <kbd>Delete / Backspace</kbd> | Seçili vurgu katmanını sil |

---

## 🛠️ Nasıl Kullanılır?

### 1. Hızlı Başlangıç (Demo Deneyimi)
1. [`index.html`](file:///C:/Users/Ubeydullah/.gemini/antigravity/scratch/soru-cozum-video-maker/index.html) dosyasını tarayıcınızda açın veya `start.bat` dosyasına çift tıklayın.
2. Sağ üstteki **"✨ Örnek Demo Yükle"** butonuna basın.
3. Otomatik olarak:
   - 1.8s: Yanlış olan **A şıkkı kırmızı vurgu ve ✕ işaretiyle** elenir.
   - 3.6s: Doğru olan **C şıkkı yeşil neon kutu ve ✓ onay işaretiyle** parlar.
   - Video tabanında **Retention Bar** akarak süreyi gösterir.
4. **"Videoyu Render Al & İndir (MP4)"** butonuna basarak 2 saniyede videoyu bilgisayarınıza kaydedin!

### 2. Kendi Sorularınızla Üretim:
1. **Dosyaları Yükle:** Soru görselinizi (PNG, JPG, WebP) ve ses kaydınızı (MP3, WAV, M4A) yükleyin.
2. **Şıkları Belirleyin:**
   - **🪄 Tıkla-Sar:** Şıkkın üzerine dokunun; otomatik olarak şıkkı çevrelesin.
   - Veya üst araç çubuğundan **"🔴 Yanlış Eleme"** / **"🟢 Doğru"** seçip elle çizin.
3. **Zaman Damgalarını İşaretleyin:** Sesi dinlerken yanlış şıkkı elediğiniz yerde <kbd>X</kbd>, doğru cevabı söylediğiniz yerde <kbd>M</kbd> tuşuna basın.
4. **İlerleme Çubuğunu Renklendirin:** Damlalık aracına tıklayıp sorunun logosuna veya istediğiniz renge dokunun.
5. **Dışa Aktar:** Çözünürlüğü seçip **"Render Al"** butonuna tıklayın. Video donanım hızında 2 saniyede hazır olur!
