# FocusFlow

AI destekli görev ve odaklanma asistanı.

- Karanlık neon arayüz (`#00d2ff` / `#0b111e`), glassmorphism
- Sürükle-bırak Kanban (Yapılacaklar / Yapılıyor / Tamamlandı)
- Öncelik etiketleri, düzenleme, tamamlama
- 25/5 Pomodoro, tarayıcı bildirimi + ses
- Yağmur / Lo-Fi ambient (Web Audio)
- AI koç: yerel kural motoru + `NEXT_PUBLIC_AI_COACH_URL` ile API iskeleti
- `localStorage` kalıcılığı, PWA manifest

## Çalıştırma

```bash
npm install
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000)

## Veri modeli

`lib/types.ts` içindeki `Task`, `PomodoroSession`, `AppState` yapıları Supabase / Firebase’e taşınmaya hazırdır.
