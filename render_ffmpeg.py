"""
Soru Çözüm Videosu Oluşturucu - FFmpeg CLI Render Motoru
Görsel, ses ve zaman damgası parametreleriyle yüksek kaliteli MP4 video üretir.
"""

import sys
import os
import argparse
import subprocess

def render_video(image_path, audio_path, timestamp, box, output_path="cikti.mp4", color="0x22c55e", opacity=0.35, border_width=4):
    """
    FFmpeg drawbox filtresi ile soru görseli üzerine belirlenen saniyede yeşil vurgu ekler.
    
    :param image_path: Soru görseli yolu (PNG, JPG)
    :param audio_path: Anlatım sesi yolu (MP3, WAV, M4A)
    :param timestamp: Vurgunun belireceği saniye (float, örn: 3.25)
    :param box: Dikdörtgen koordinatları (x, y, w, h)
    :param output_path: Çıktı MP4 dosya adı
    """
    if not os.path.exists(image_path):
        print(f"Hata: Görsel bulunamadı -> {image_path}")
        return False
    if not os.path.exists(audio_path):
        print(f"Hata: Ses dosyası bulunamadı -> {audio_path}")
        return False

    bx, by, bw, bh = box
    ts = float(timestamp)

    # FFmpeg Filtresi:
    # 1. drawbox fill: Belirlenen saniyede yarı saydam yeşil dolgu
    # 2. drawbox stroke: Belirlenen saniyede yeşil kenarlık
    filter_complex = (
        f"[0:v]drawbox=x={bx}:y={by}:w={bw}:h={bh}:color={color}@{opacity}:t=fill:enable='gte(t,{ts})',"
        f"drawbox=x={bx}:y={by}:w={bw}:h={bh}:color={color}:t={border_width}:enable='gte(t,{ts})'[v]"
    )

    cmd = [
        "ffmpeg",
        "-loop", "1",
        "-i", image_path,
        "-i", audio_path,
        "-filter_complex", filter_complex,
        "-map", "[v]",
        "-map", "1:a",
        "-c:v", "libx264",
        "-tune", "stillimage",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        "-y", output_path
    ]

    print("\n[EduClip CLI] Video oluşturuluyor...")
    print(f"Komut: {' '.join(cmd)}\n")

    try:
        process = subprocess.run(cmd, check=True)
        print(f"\n[Başarılı] Video oluşturuldu: {output_path}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n[Hata] FFmpeg çalışırken hata oluştu: {e}")
        return False
    except FileNotFoundError:
        print("\n[Hata] Sistemde FFmpeg kurulu değil veya PATH'e eklenmemiş.")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Soru Çözüm Videosu Oluşturucu - FFmpeg CLI")
    parser.add_argument("--image", "-i", required=True, help="Soru görseli dosya yolu")
    parser.add_argument("--audio", "-a", required=True, help="Ses kaydı dosya yolu")
    parser.add_argument("--time", "-t", type=float, default=0.0, help="Vurgunun belireceği saniye (örn: 3.5)")
    parser.add_argument("--box", "-b", required=True, help="Alan koordinatları: x,y,w,h (örn: 120,625,620,60)")
    parser.add_argument("--output", "-o", default="soru_cozum_cikti.mp4", help="Çıktı video dosyası")
    parser.add_argument("--color", "-c", default="0x22c55e", help="Vurgu rengi hex (örn: 0x22c55e)")

    if len(sys.argv) == 1:
        print("Kullanım örneği:")
        print("python render_ffmpeg.py --image soru.png --audio ses.mp3 --time 3.2 --box 120,625,620,60 --output video.mp4")
        sys.exit(0)

    args = parser.parse_args()
    coords = [int(val.strip()) for val in args.box.split(",")]
    if len(coords) != 4:
        print("Hata: --box parametresi 4 değer içermelidir: x,y,w,h")
        sys.exit(1)

    render_video(
        image_path=args.image,
        audio_path=args.audio,
        timestamp=args.time,
        box=coords,
        output_path=args.output,
        color=args.color
    )
