# 🌿 Smoof - Sigarayı Bırakma Uygulaması

Smoof, sigarayı bırakma yolculuğunda yanınızda olan, Türkçe bir mobil uygulamadır. React Native ve Expo ile geliştirilmiştir.

## ✨ Özellikler

### 🎯 Temel Özellikler
- **Adım Adım Onboarding**: Kullanıcı dostu, hafif sorularla başlangıç
- **Branching Logic**: Tamamen bırak veya kademeli azalt seçenekleri
- **Hazırlık Modu**: Gelecek tarihte başlayacaklar için özel ekran
- **Streak Takibi**: Sigarasız geçen günleri takip et
- **Tasarruf Hesaplayıcı**: Biriktirdiğin parayı gör
- **Milestone Sistemi**: 1, 3, 7, 14, 30, 90, 180, 365 gün başarıları

### 🚨 Kriz Yönetimi
- **Kriz Modu**: Sigara içme isteği geldiğinde anında destek
- **Slip Flow**: Kayma durumunda streak freeze sistemi
- **Motivasyon Sözleri**: Smoof karakteri ile samimi konuşmalar

### 📊 İlerleme & İstatistikler
- **Günlük Takip**: İçilmeyen sigara, tasarruf, kazanılan zaman
- **Sağlık Faydaları**: Vücudunda iyileşen sistemleri gör
- **İlerleme Ekranı**: Detaylı milestone'lar ve sağlık timeline'ı

### 🔔 Bildirimler
- **Günlük Motivasyon**: Her sabah farklı bir motivasyon mesajı
- **Milestone Kutlamaları**: Başarıları kutlayan bildirimler
- **Kritik Saatler**: Genelde içtiğin saatlerde destek mesajları
- **Su Hatırlatıcıları**: Detoks için su içmeyi hatırlat
- **Akşam Değerlendirmesi**: Günü değerlendirme bildirimi
- **Başlangıç Günü**: Hazırlık modundayken hatırlatıcılar

### 👤 Profil & Ayarlar
- **Kişiselleştirme**: Motivasyonlarını ve hedeflerini belirle
- **Test Modu**: Geliştirici araçları (gizli)
- **Bildirim Ayarları**: Tüm bildirimleri özelleştir

### 🦎 Smoof Karakteri
- Samimi, destekleyici maskot karakteri
- AI-generated turquoise chameleon
- Tüm ekranlarda kullanıcıyla etkileşim

## 🛠 Teknolojiler

- **React Native** - Mobil framework
- **Expo SDK 58** - Development platform
- **TypeScript** - Type safety
- **Expo Router** - File-based navigation
- **Zustand** - State management
- **AsyncStorage** - Local persistence
- **Expo Notifications** - Push notifications
- **Expo Linear Gradient** - Gradients
- **@react-native-community/datetimepicker** - Date selection
- **Ionicons** - Icons

## 📱 Kurulum

### Gereksinimler
- Node.js 18+
- npm veya bun
- Expo Go app (test için) veya
- Android Studio / Xcode (native build için)

### Adımlar

1. **Depoyu klonla**
```bash
git clone https://github.com/erolsptr/smoof.git
cd smoof
```

2. **Bağımlılıkları yükle**
```bash
npm install
# veya
bun install
```

3. **Geliştirme sunucusunu başlat**
```bash
npx expo start
```

4. **Uygulamayı çalıştır**
- **iOS Simulator**: `i` tuşuna bas
- **Android Emulator**: `a` tuşuna bas
- **Fiziksel cihaz**: QR kodu Expo Go ile tara

## 🚀 Build & Deploy

### Development Build
```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

### Production Build (EAS)
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure
eas build:configure

# Build
eas build --platform ios
eas build --platform android
```

## 📂 Proje Yapısı

```
smoof/
├── src/
│   ├── app/              # Expo Router pages
│   │   ├── (tabs)/       # Tab navigation
│   │   │   ├── index.tsx      # Ana ekran
│   │   │   ├── progress.tsx   # İlerleme
│   │   │   └── profile.tsx    # Profil
│   │   ├── onboarding/   # Onboarding akışı
│   │   │   ├── index.tsx      # Welcome
│   │   │   ├── step1.tsx      # Günlük sigara
│   │   │   ├── step2.tsx      # Paket fiyatı
│   │   │   ├── step3.tsx      # Motivasyon
│   │   │   ├── step4.tsx      # Yöntem (branching)
│   │   │   ├── step5.tsx      # Kademeli plan
│   │   │   └── step6.tsx      # Başlangıç tarihi
│   │   ├── settings/     # Ayarlar
│   │   │   └── notifications.tsx
│   │   ├── crisis.tsx    # Kriz modu
│   │   └── _layout.tsx   # Root layout
│   ├── components/       # Reusable components
│   ├── constants/        # Sabitler (colors, spacing, typography)
│   ├── hooks/            # Custom hooks
│   ├── services/         # Services
│   │   └── notificationService.ts
│   ├── store/            # Zustand stores
│   │   ├── userStore.ts
│   │   ├── statsStore.ts
│   │   ├── onboardingStore.ts
│   │   └── notificationStore.ts
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
├── assets/               # Images, fonts, icons
│   └── smoof.png        # Maskot karakteri
├── app.json             # Expo config
├── package.json
└── tsconfig.json
```

## 🧪 Test Modu

Uygulamada gizli bir test modu var:

1. Profil ekranına git
2. Smoof avatar'ına 5 kez tıkla
3. Test modu açılır
4. Geçmiş ve gelecek tarihler test edebilirsin

## 🎨 Tasarım Kararları

- **Renkler**: Turquoise/teal (#4ECDC4) - sakinleştirici, sağlık odaklı
- **Tipografi**: System fonts - okunabilirlik
- **Iconlar**: Ionicons - tutarlılık
- **Animasyonlar**: Minimal ama anlamlı - streak, milestone kutlamaları
- **Dil**: Samimi, destekleyici, "sen" dili kullanımı

## 🔒 Gizlilik

- Tüm veriler cihazda saklanır (AsyncStorage)
- Sunucuya veri gönderilmez
- Push notification token sadece bildirimler için kullanılır

## 🤝 Katkıda Bulunma

1. Fork'la
2. Feature branch oluştur (`git checkout -b feature/amazing-feature`)
3. Commit'le (`git commit -m 'feat: add amazing feature'`)
4. Push'la (`git push origin feature/amazing-feature`)
5. Pull Request aç

## 📝 Lisans

MIT License - detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 👨‍💻 Geliştirici

**Erol Saptır**
- GitHub: [@erolsptr](https://github.com/erolsptr)

## 🙏 Teşekkürler

- Smoof karakterini AI ile oluşturmada yardımcı olan Microsoft Copilot
- React Native ve Expo topluluğu
- Sigarayı bırakma yolculuğundaki tüm savaşçılar

---

Made with 💚 by Smoof Team
