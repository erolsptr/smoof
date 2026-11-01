# 🦎 Smoof - Sigarayı Bırakma Uygulaması

**Smoof**, sigarayı tamamen bırakmak veya kademeli azaltmak isteyenlere yardımcı olan ücretsiz mobil uygulamadır.

## 🎯 Özellikler

### ✅ Mevcut (v0.1.0 - Core)
- 🎨 Duolingo-tarzı renkli arayüz (açık/koyu tema)
- 🦎 Smoof maskotu
- 📊 Streak (sigarasız gün) sayacı
- 💰 Para tasarrufu hesaplayıcı
- 🚭 İçilmeyen sigara sayacı
- 📝 Basit onboarding akışı (3 adım)
- 🎮 Streak dondurucu sistemi

### 🚧 Planlanan (Sonraki Sürümler)
- 🆘 Kriz modu (nefes egzersizi, mini oyun, motivasyon)
- 🏆 Rozet ve başarı sistemi
- 📈 Detaylı ilerleme grafikleri
- 📱 Widget desteği
- ⌚ Apple Watch entegrasyonu
- 🤖 AI koçu
- 📊 Haftalık raporlar
- 👥 Arkadaş desteği

## 🛠️ Teknoloji Stack

- **Framework:** React Native + Expo (SDK 58)
- **Dil:** TypeScript
- **Routing:** Expo Router (file-based)
- **State Management:** Zustand
- **Veritabanı:** Expo SQLite (çevrimdışı)
- **Animasyonlar:** React Native Reanimated
- **Backend (gelecek):** Supabase

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+
- npm veya yarn
- iOS için: macOS + Xcode
- Android için: Android Studio

### Adımlar

1. **Repoyu klonla**
```bash
git clone <repo-url>
cd smoof
```

2. **Bağımlılıkları yükle**
```bash
npm install
```

3. **Geliştirme sunucusunu başlat**
```bash
npx expo start
```

4. **Test et**
- **iOS:** `i` tuşuna bas veya Expo Go uygulamasında QR kodu tara
- **Android:** `a` tuşuna bas veya Expo Go uygulamasında QR kodu tara
- **Web:** `w` tuşuna bas (sınırlı destek)

## 📱 Uygulamayı Çalıştırma

### Expo Go ile (Geliştirme)
```bash
npx expo start
```
Telefonunda **Expo Go** uygulamasını indir ve QR kodu tara.

### Development Build ile
```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

### Production Build (EAS)
```bash
# İlk kurulum
npm install -g eas-cli
eas login
eas build:configure

# iOS build
eas build --platform ios

# Android build
eas build --platform android
```

## 🧪 Test & QA

```bash
# TypeScript kontrolü
npx tsc --noEmit

# Lint (henüz yapılandırılmadı)
npx expo lint

# Proje sağlık kontrolü
npx expo-doctor
```

## 📂 Proje Yapısı

```
smoof/
├── src/
│   ├── app/                 # Expo Router ekranları
│   │   ├── _layout.tsx      # Root layout
│   │   ├── index.tsx        # Splash/router
│   │   ├── onboarding/      # Onboarding akışı
│   │   │   ├── index.tsx    # Hoş geldin
│   │   │   ├── step1.tsx    # Sigara bilgisi
│   │   │   ├── step2.tsx    # Bırakma yöntemi
│   │   │   └── step3.tsx    # Başlangıç tarihi
│   │   └── (tabs)/          # Ana uygulama (tab navigation)
│   │       ├── index.tsx    # Ana sayfa (dashboard)
│   │       ├── progress.tsx # İlerleme ekranı
│   │       └── profile.tsx  # Profil & ayarlar
│   │
│   ├── components/          # Yeniden kullanılabilir componentler
│   ├── constants/           # Renkler, tipografi, spacing
│   ├── hooks/               # Custom hooks (useColorScheme)
│   ├── store/               # Zustand stores
│   │   ├── userStore.ts     # Kullanıcı profili
│   │   └── statsStore.ts    # İstatistikler
│   ├── types/               # TypeScript tipleri
│   ├── services/            # API ve veritabanı servisleri (gelecek)
│   └── utils/               # Yardımcı fonksiyonlar
│
├── assets/                  # Görseller, fontlar, iconlar
├── app.json                 # Expo konfigürasyonu
└── tsconfig.json            # TypeScript konfigürasyonu
```

## 🎨 Tasarım Sistemi

### Renk Paleti
- **Primary (Yeşil):** Başarı, büyüme (#10B981)
- **Secondary (Sarı/Turuncu):** Enerji, motivasyon (#F59E0B)
- **Accent (Mavi):** Sakinlik, kriz modu (#3B82F6)

### Tipografi
- **Fontlar:** System default (SF Pro iOS, Roboto Android)
- **Boyutlar:** xs(12) → 5xl(48)
- **Ağırlıklar:** normal, medium, semibold, bold, extrabold

### Spacing Scale
- xs(4), sm(8), md(16), lg(24), xl(32), 2xl(40), 3xl(48), 4xl(64)

## 🔐 Veri Güvenliği

- ✅ Tüm veriler cihazda saklanır (SQLite)
- ✅ KVKK uyumlu
- ✅ Çevrimdışı çalışır
- ⏳ Gelecekte: Supabase ile opsiyonel bulut yedekleme

## 📝 Lisans

Bu proje henüz bir lisansa sahip değil. Geliştirme aşamasında.

## 🤝 Katkıda Bulunma

Henüz açık kaynak değil. İleride topluluk katkısına açılabilir.

## 📧 İletişim

Sorular için: [İletişim bilgisi eklenecek]

---

**Not:** Bu proje aktif geliştirme aşamasındadır. İlk stable sürüm (v1.0) için roadmap:
1. ✅ Core özellikler (v0.1)
2. 🚧 Kriz modu + oyunlaştırma (v0.2)
3. 🚧 SQLite entegrasyonu (v0.3)
4. 🚧 Grafikler ve analizler (v0.4)
5. 🚧 Widget + bildirimler (v0.5)
6. 🚧 Beta test + polish (v0.9)
7. 🎉 Public release (v1.0)
