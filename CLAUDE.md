# SIM320 — תיאום תורים לסימולטור

## מה זה
אתר שיבוץ עצמי לעובדי החברה לחלונות תדריך (קבוצתי, עד 10) ולסבבי סימולטור (זוגות, חצי שעה),
עם אדמין ומסך הקרנה בסגנון לוח טיסות.

## החלטות מפתח
- **DB:** Neon Postgres דרך Drizzle (`drizzle-orm/neon-http`). ה-client ב-`lib/db/index.ts` נוצר בעצלתיים (Proxy) כדי ש-`next build` לא ידרוש `DATABASE_URL`.
- **אימות אדמין:** סיסמה אחת (`ADMIN_PASSWORD`) → עוגיית סשן חתומה HMAC (`ADMIN_SESSION_SECRET`), `lib/auth.ts`. אין טבלת משתמשים.
- **מודל:** `cycles` → `slots` (kind: `briefing`|`sim`) → `bookings`. שיבוץ מזוהה ע"י `phone` מנורמל; אין חשבונות.
- **חוקי עסק:** שיבוץ `sim` דורש `booking` פעיל מסוג `briefing` באותו `cycle` לאותו טלפון (`hasActiveBriefing`). קיבולת נבדקת אטומית ב-`INSERT ... SELECT ... WHERE count < capacity`. אינדקס ייחודי חלקי מונע כפילות טלפון באותו חלון.
- **זמן:** נשמר UTC, מוצג `Asia/Jerusalem`. המרה מקלט טופס ב-`israelLocalToUtc` (`lib/time.ts`).
- **מסך הקרנה:** `/display` (SSR ראשוני) + polling כל 15ש' ל-`/api/display`.
- **linter:** לא לקרוא ל-`Date.now()` ישירות בגוף רכיב שרת — יש `nowMs()` / `isPast()` ב-`lib/time.ts`.

## פקודות
- `npm run dev` · `npm run build` · `npm run lint`
- `npm run db:push` — מסנכרן סכימה ל-Neon (ללא קבצי migration)
- `npm run db:seed` — מחזור דמו

## מבנה ניתובים
`app/admin/(dash)/` הוא route group מוגן (ה-layout קורא `requireAdmin()`); `app/admin/login/` מחוץ לו כדי למנוע לולאת הפניה.
