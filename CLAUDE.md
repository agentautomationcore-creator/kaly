# CLAUDE.md — Kaly (CalorieAI)

## Проект
- Kaly — AI calorie tracker. Фото еды → калории/макросы за ~8 сек. 10 языков.
- Bundle ID: app.kaly.mobile
- Stack: Expo SDK 55+, React Native, TypeScript, Claude Haiku Vision, Supabase (DB + Auth + Edge Functions + Storage), RevenueCat

## Критические правила [из DocLear]
1. Pressable — ТОЛЬКО plain style objects. НИКОГДА callback style
2. Auth — anonymous → updateUser() (НЕ signUp) при регистрации
3. State — Zustand (клиент), React Query (сервер), MMKV (persistence)
4. Console — через debug.ts: `const log = __DEV__ ? console.log : () => {}`
5. Error boundaries — на КАЖДУЮ фичу, не один глобальный
6. Один writer — или клиент или сервер пишет в таблицу, не оба
7. EAS Update — JS через OTA, билд только для native changes
8. TypeScript strict — 0 ошибок после каждого изменения
9. Feature-based структура — components/, hooks/, store/, types.ts
10. Коммит по логическому блоку
11. Нет hardcoded цветов — всегда через useColors()
12. Все API routes проверяют JWT

## Бэкенд
- Supabase Edge Functions (НЕ Vercel)
- JWT verification на каждом endpoint
- Rate limiting через PostgreSQL функцию check_daily_scan_limit()

## Языки
- 10 языков с первого дня: en, fr, ru, de, es, it, ar, pt, tr, zh

## Pricing
- Free: 3 скана/день, ручной ввод без лимита
- Pro: €4.99/мес или €39.99/год
- Trial: 7 дней in-app (НЕ через RevenueCat, без карты)
