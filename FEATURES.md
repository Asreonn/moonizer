# Moonizer Features

Moonizer, CSV veri setlerini tarayicinizda hizli bir sekilde yuklemenizi, incelemenizi ve gorsellestirmenizi saglayan lokal calisan bir aractir. Tum isleme adimlari kullanicinin bilgisayarinda gerceklesir.

## Veri Isleme
- CSV dosyalarini surukle birak veya dosya yoneticisiyle sec
- Otomatik ayrac (virgul, nokta virgulu, tab, pipe) ve karakter seti algilama
- Buyuk dosyalar icin akilli parcali yukleme
- Ornek veri kumesi depolama ve coklu dataset oturumu

## Analiz
- 7 kolon tipini (sayisal, kategorik, boolean, datetime, metin, ID/unique, sabit) otomatik tanima
- Kolon bazli istatistikler: adet, essiz deger, bosluk orani, dagilim metrikleri
- Tip bazli ileri analizler: Gini, entropy, ceyrekler, outlier yakalama
- Ornek satir onizlemesi ve null deger vurgulama

## Donusum
- 30'dan fazla kolon islemi icin ileri seviye is akisi
- Geri alma/yeniden uygulama (undo/redo) ve dallanan gecmis
- Metin, sayisal, boolean, zaman serisi ve kategorik donusum setleri
- Bul ve degistir, regex, kolon birlestirme, bosluk doldurma

## Veri Grid
- Uc durumlu siralama (artan, azalan, kapali) ve coklu kolon secimi
- Orta tusa basarak 2D kaydirma ve klavye ile navigasyon
- Tip bazli filtreleme, satir/sutun vurgulama ve pagination
- Veri tipine gore renklendirme, delta takibi ve outlier isaretleme

## Gorsellestirme
- Histogram, cizgi, scatter, bar, pasta, box plot ve area grafik tipleri
- Ikili grafik gorunumu ile yan yana karsilastirma
- Gercek zamanli ozellestirme paneli ve etkileşimli kontrol setleri

## Cikti Alma
- Uygulanan donusumlerle CSV, JSON, Excel uyumlu formatlar
- Filtrelenmis veri seti icin hedefe yonelik cikti
- Coklu tema ile PNG grafik exportu

## Teknik Yapi
- React 18 + TypeScript + Vite mimarisi
- Zustand + Immer durum yonetimi
- React Router 6 tabanli sayfa yonlendirme
- CSS Modules ve tasarim token yapisi

## Arayuz
- Klavye kisayolları ve context menuler
- Tooltip destekli yardim ve cok dilli altyapi
- Minimal ikonografi, solid renk paleti ve hafif animasyonlar

Moonizer, veri inceleme sureclerini hizlandirirken gizlilikten odun vermeden ekiplerin ayni workspace uzerinde calismasini hedefler.
