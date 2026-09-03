# תיאום תורים לסימולטור (SIM320)

אתר שיבוץ עצמי לעובדים: חלונות **תדריך קבוצתי** (עד 10 משתתפים) ו**סבבי סימולטור לזוגות** (חצי שעה),
עם מערכת אדמין ומסך הקרנה בסגנון לוח טיסות בשדה תעופה.

- **שיבוץ ציבורי** בשם מלא + טלפון בלבד. ביטול/שינוי דרך «השיבוצים שלי» (שם + טלפון, ללא סיסמה).
- **תנאי מקדים:** שיבוץ לסימולטור מחייב שיבוץ תדריך פעיל באותו מחזור, לפי אותו מספר טלפון.
- **אדמין** (`/admin`) מוגן בסיסמה אחת (`ADMIN_PASSWORD`). ניהול מחזורים, חלונות, פרסום, וצפייה/ביטול שיבוצים.
- **מסך הקרנה** (`/display`) מתרענן אוטומטית, מדגיש את התור הנוכחי ומתחלף בין «תדריך» ל«טיסה».
- רספונסיבי לנייד ולמחשב, עברית RTL, אזור זמן `Asia/Jerusalem`.

## סטאק

Next.js 16 (App Router) · React 19 · Tailwind v4 · Drizzle ORM · Neon Postgres · פריסה ל-Vercel.

## הרצה מקומית

```bash
npm install
cp .env.example .env.local        # ומלאו ערכים אמיתיים
npm run db:push                   # יוצר את הטבלאות ב-Neon
npm run db:seed                   # (רשות) מחזור דמו לבדיקה
npm run dev
```

משתני סביבה (`.env.local`):

| משתנה | תיאור |
| --- | --- |
| `DATABASE_URL` | מחרוזת החיבור המאגרת (pooled) של Neon Postgres |
| `ADMIN_PASSWORD` | סיסמת הכניסה ל-`/admin` |
| `ADMIN_SESSION_SECRET` | מחרוזת אקראית ארוכה לחתימת עוגיית הסשן |

## פריסה (Vercel + GitHub)

1. צרו ריפו ב-GitHub ודחפו את התיקייה הזו (ראו פקודות למטה).
2. ב-Vercel: **New Project → Import** מה-GitHub repo (Framework: Next.js, זוהה אוטומטית).
3. **Storage → Marketplace → Neon** — צרו בסיס נתונים; Vercel יזריק `DATABASE_URL` אוטומטית.
4. **Settings → Environment Variables** — הוסיפו `ADMIN_PASSWORD` ו-`ADMIN_SESSION_SECRET` (Production + Preview).
5. אחרי הדפלוי הראשון הריצו את יצירת הסכימה מול Neon:
   ```bash
   vercel env pull .env.local
   npm run db:push
   ```
6. פתחו את `/admin`, צרו מחזור, הוסיפו חלונות ו**פרסמו**.

## מבנה

```
app/
  page.tsx                     רשימת מחזורים וחלונות פתוחים לשיבוץ
  book/[slotId]/               טופס שיבוץ (שם + טלפון)
  my/                          צפייה וביטול לפי שם + טלפון
  display/                     מסך הקרנה (client polling ל-/api/display)
  api/display/                 פיד JSON לתור ההקרנה
  admin/login/                 כניסת אדמין
  admin/(dash)/                אזור מוגן: מחזורים, חלונות, שיבוצים
lib/
  db/schema.ts                 cycles · slots · bookings
  queries.ts                   קריאות
  actions.ts                   Server Actions (שיבוץ, ביטול, אדמין)
  auth.ts                      עוגיית סשן חתומה ל-HMAC
  time.ts / validation.ts      עזרי זמן (Asia/Jerusalem) ו-Zod
```
