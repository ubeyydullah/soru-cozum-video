@echo off
title Soru Cozum Videosu Olusturucu
chcp 65001 > nul
echo ===================================================
echo     SORU ÇÖZÜM VİDEOSU OLUŞTURUCU (EduClip Maker)
echo ===================================================
echo.
echo Tarayıcınız açılıyor...
echo Doğrudan index.html dosyasını varsayılan tarayıcınızda açıyoruz.
echo.
start "" "%~dp0index.html"
exit
