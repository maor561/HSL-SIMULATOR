import Link from "next/link";
import { Assistant } from "next/font/google";
import "./guide.css";

const assistant = Assistant({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-assistant",
  display: "swap",
});

export const metadata = {
  title: "מדריך הרשמה לסימולטור",
  description: "מדריך שלב-אחר-שלב לעובדים: הרשמה עצמית לתדריך ולסבב סימולטור מהטלפון.",
};

const PLANE =
  '<svg class="plane" viewBox="0 0 200 200" aria-hidden="true"><path d="M88 74 L10 128 L10 141 L88 102 Z"/><path d="M112 74 L190 128 L190 141 L112 102 Z"/><path d="M92 150 L54 172 L54 181 L92 162 Z"/><path d="M108 150 L146 172 L146 181 L108 162 Z"/><path d="M100 6 C108 6 113 18 113 40 L113 150 C113 168 107 183 100 192 C93 183 87 168 87 150 L87 40 C87 18 92 6 100 6 Z"/></svg>';
const PLANE_SM =
  '<svg class="plane" viewBox="0 0 200 200"><path d="M88 74 L10 128 L10 141 L88 102 Z"/><path d="M112 74 L190 128 L190 141 L112 102 Z"/><path d="M100 6 C108 6 113 18 113 40 L113 150 C113 168 107 183 100 192 C93 183 87 168 87 150 L87 40 C87 18 92 6 100 6 Z"/></svg>';

const BODY = `
<div class="wrap">

  <header class="masthead">
    <div class="eyebrow">${PLANE} HSL · A320 FULL FLIGHT SIMULATOR</div>
    <h1>מדריך הרשמה לסימולטור</h1>
    <p>איך משתבצים לתדריך ולסבב סימולטור מהטלפון — שלב אחר שלב, עם צילומי המסך.</p>
    <div class="perf"><span>EMPLOYEE SELF-CHECK-IN</span><span>גרסה למכשיר נייד</span></div>
  </header>

  <p class="lede">
    ההרשמה נעשית מהדפדפן בטלפון, בכתובת <strong>hsl-simulator.vercel.app</strong>. אין צורך בהתקנה או בסיסמה —
    רק שם מלא ומספר טלפון. ההרשמה נעשית בשני שלבים: קודם <strong>תדריך</strong>, ואחר כך <strong>סבב סימולטור</strong>.
  </p>

  <div class="facts">
    <div class="fact">
      <h3>מה צריך</h3>
      <p><strong>שם מלא</strong> (פרטי ומשפחה) ו<strong>מספר טלפון נייד</strong>. אותם פרטים משמשים גם לצפייה ולביטול.</p>
    </div>
    <div class="fact">
      <h3>כמה זמן</h3>
      <p>תדריך והסבר תאורטי — כ־45 דקות לקבוצה. סבב סימולטור — 45 דקות לזוג.</p>
    </div>
  </div>

  <div class="rulecard">
    <h3>שלושה כללים שחשוב לדעת</h3>
    <ul>
      <li><strong>תדריך לפני סבב.</strong> אי אפשר לתפוס חלון סימולטור בלי שיבוץ פעיל לתדריך.</li>
      <li><strong>אחד מכל סוג.</strong> כל אדם נרשם לתדריך אחד ולסבב סימולטור אחד בלבד.</li>
      <li><strong>אותו מחזור.</strong> את חלון הסימולטור אפשר לתפוס רק במחזור שבו נרשמתם לתדריך.</li>
    </ul>
  </div>

  <div class="part"><span class="tag">חלק א׳</span><h2>הרשמה לתדריך</h2></div>

  <div class="steps">

    <div class="step">
      <div class="pinwrap">
        <div class="phone">
          <div class="screen">
            <div class="s-head">
              <div><div class="brand">רישום · סימולטור A320</div><div class="sub">שם מלא וטלפון בלבד</div></div>
              <div class="badge">${PLANE_SM}</div>
            </div>
            <div class="s-nav">
              <div class="btn">‹ הבא</div>
              <div class="mid"><div class="name">מחזור הדגמה</div><div class="meta">יום שלישי, 08.09 · מחזור 1 מתוך 4</div></div>
              <div class="btn">הקודם ›</div>
            </div>
            <div class="s-sect"><div class="h">תדריך והסבר תאורטי</div></div>
            <div class="s-card">
              <div class="row"><span class="time">09:45–09:00</span><span class="pill free">7 פנויים</span></div>
              <div class="chips"><span class="chip">נועה כהן</span><span class="chip">איתי לוי</span><span class="chip">מעיין בר</span></div>
              <div class="bar"><i style="width:30%"></i></div>
              <div class="count">3/10 משובצים</div>
            </div>
            <div class="s-sect" style="margin-top:8px"><div class="h">סבב סימולטור · זוג · חצי שעה</div></div>
          </div>
          <div class="pin" style="top:41px; right:18px">1</div>
          <div class="pin" style="top:126px; right:150px">2</div>
        </div>
      </div>
      <div class="step-body">
        <div class="step-num" data-n="1">פותחים את דף הרישום</div>
        <h3>בוחרים את המחזור הנכון</h3>
        <p>נכנסים ל־<strong>hsl-simulator.vercel.app</strong>. המסך פותח מחזור אחד בכל פעם.</p>
        <div class="legend"><span class="n">1</span><span>לחצו <strong>‹ הבא</strong> או <strong>הקודם ›</strong> עד שמופיע שם המחזור שלכם והתאריך הנכון.</span></div>
        <div class="legend"><span class="n">2</span><span>מתחת ל“תדריך והסבר תאורטי” יופיע חלון עם <strong>“X פנויים”</strong> בירוק — זה חלון שאפשר להירשם אליו.</span></div>
        <span class="next">→ השלב הבא: לחיצה על חלון התדריך</span>
      </div>
    </div>

    <div class="step">
      <div class="pinwrap">
        <div class="phone">
          <div class="screen">
            <div class="s-head">
              <div><div class="brand">רישום · סימולטור A320</div><div class="sub">שם מלא וטלפון בלבד</div></div>
              <div class="badge">${PLANE_SM}</div>
            </div>
            <div class="s-modal">
              <div class="s-sheet">
                <span class="x">✕</span>
                <div class="eb">תדריך והסבר תאורטי</div>
                <h4>מחזור הדגמה</h4>
                <div class="when">יום שלישי, 08.09.2026 · 09:45–09:00</div>
                <hr>
                <div class="s-field"><label>שם מלא</label><div class="s-input ph">ישראל ישראלי</div></div>
                <div class="s-field"><label>טלפון נייד</label><div class="s-input ph ltr">0501234567</div></div>
                <div class="s-btn">אישור שיבוץ</div>
              </div>
            </div>
          </div>
          <div class="pin" style="top:118px; right:22px">1</div>
          <div class="pin" style="top:158px; right:22px">2</div>
          <div class="pin" style="top:196px; left:22px">3</div>
        </div>
      </div>
      <div class="step-body">
        <div class="step-num" data-n="2">ממלאים פרטים</div>
        <h3>שם מלא ומספר טלפון</h3>
        <p>אחרי הלחיצה על חלון התדריך נפתחת חלונית קטנה עם פרטי החלון.</p>
        <div class="legend"><span class="n">1</span><span>בשדה <strong>שם מלא</strong> — שם פרטי ושם משפחה.</span></div>
        <div class="legend"><span class="n">2</span><span>בשדה <strong>טלפון נייד</strong> — מספר בן 10 ספרות, למשל <span class="kbd">0501234567</span>. <strong>זכרו את המספר הזה</strong> — צריך אותו שוב לסבב הסימולטור.</span></div>
        <div class="legend"><span class="n">3</span><span>לחצו <strong>אישור שיבוץ</strong>.</span></div>
        <span class="next">→ השלב הבא: מסך האישור</span>
      </div>
    </div>

    <div class="step">
      <div class="pinwrap">
        <div class="phone">
          <div class="screen">
            <div class="s-head">
              <div><div class="brand">רישום · סימולטור A320</div><div class="sub">שם מלא וטלפון בלבד</div></div>
              <div class="badge">${PLANE_SM}</div>
            </div>
            <div class="s-modal mid">
              <div class="s-sheet flush">
                <div class="s-ok">
                  <div class="t">השיבוץ נקלט ✓</div>
                  <div class="d">נרשמת לתדריך. עכשיו אפשר לתפוס גם חלון סימולטור באותו מחזור.</div>
                  <div class="acts"><span class="go">המשך</span><span class="alt">לשיבוצים שלי</span></div>
                </div>
              </div>
            </div>
          </div>
          <div class="pin" style="top:150px; right:74px">1</div>
        </div>
      </div>
      <div class="step-body">
        <div class="step-num" data-n="3">מאשרים</div>
        <h3>“השיבוץ נקלט ✓”</h3>
        <p>הודעה ירוקה מאשרת שנרשמתם לתדריך.</p>
        <div class="legend"><span class="n">1</span><span>לחצו <strong>המשך</strong> כדי לחזור לרשימה ולהמשיך לסבב הסימולטור.</span></div>
        <p>אם משהו השתבש תופיע כאן הודעה אדומה — ראו “תקלות נפוצות” בסוף המדריך.</p>
        <span class="next">→ עוברים לחלק ב׳</span>
      </div>
    </div>

  </div>

  <div class="part"><span class="tag">חלק ב׳</span><h2>הרשמה לסבב סימולטור</h2></div>

  <div class="steps">

    <div class="step">
      <div class="pinwrap">
        <div class="phone">
          <div class="screen">
            <div class="s-nav">
              <div class="btn">‹ הבא</div>
              <div class="mid"><div class="name">מחזור הדגמה</div><div class="meta">מחזור 1 מתוך 4</div></div>
              <div class="btn">הקודם ›</div>
            </div>
            <div class="s-sect"><div class="h">סבב סימולטור · זוג · חצי שעה</div><div class="note">נדרש שיבוץ פעיל לתדריך של אותו מחזור.</div></div>
            <div class="s-card pick">
              <div class="row"><span class="time">10:30–09:45</span><span class="pill free">1 פנויים</span></div>
              <div class="lbl">זוג 1</div>
              <div class="chips"><span class="chip">נועה כהן</span></div>
              <div class="bar"><i style="width:50%"></i></div>
              <div class="count">1/2 משובצים</div>
            </div>
            <div class="s-card">
              <div class="row"><span class="time">11:15–10:30</span><span class="pill dim">מלא</span></div>
              <div class="lbl">זוג 2</div>
              <div class="chips"><span class="chip">איתי לוי</span><span class="chip">מעיין בר</span></div>
              <div class="bar full"><i style="width:100%"></i></div>
              <div class="count">2/2 משובצים</div>
            </div>
          </div>
          <div class="pin" style="top:70px; right:150px">1</div>
        </div>
      </div>
      <div class="step-body">
        <div class="step-num" data-n="4">חוזרים לרשימה</div>
        <h3>בוחרים זוג פנוי</h3>
        <p>גוללים מטה אל “סבב סימולטור · זוג · חצי שעה”, <strong>באותו מחזור של התדריך</strong>.</p>
        <div class="legend"><span class="n">1</span><span>לחצו על זוג עם <strong>“1 פנויים”</strong> או <strong>“2 פנויים”</strong>. זוג שמסומן <strong>“מלא”</strong> אפור ולא לחיץ — בחרו אחר.</span></div>
        <span class="next">→ השלב הבא: אותו טופס, אותם פרטים</span>
      </div>
    </div>

    <div class="step">
      <div class="pinwrap">
        <div class="phone">
          <div class="screen">
            <div class="s-modal">
              <div class="s-sheet">
                <span class="x">✕</span>
                <div class="eb">סבב סימולטור · A320</div>
                <h4>מחזור הדגמה</h4>
                <div class="when">יום שלישי, 08.09.2026 · 10:30–09:45 · זוג 1</div>
                <div class="amber">צריך שיבוץ פעיל לתדריך של מחזור זה עם אותו מספר טלפון.</div>
                <hr>
                <div class="s-field"><label>שם מלא</label><div class="s-input">ישראל ישראלי</div></div>
                <div class="s-field"><label>טלפון נייד</label><div class="s-input ltr">0501234567</div></div>
                <div class="s-btn">אישור שיבוץ</div>
              </div>
            </div>
          </div>
          <div class="pin" style="top:150px; right:22px">1</div>
          <div class="pin" style="top:190px; left:22px">2</div>
        </div>
      </div>
      <div class="step-body">
        <div class="step-num" data-n="5">ממלאים שוב</div>
        <h3>אותו שם, אותו טלפון</h3>
        <p>נפתחת אותה חלונית. הפעם יש למעלה הערה כתומה שמזכירה שצריך תדריך פעיל באותו מחזור.</p>
        <div class="legend"><span class="n">1</span><span>הזינו את <strong>אותו שם מלא ואותו מספר טלפון</strong> שאיתם נרשמתם לתדריך — אחרת השיבוץ יידחה.</span></div>
        <div class="legend"><span class="n">2</span><span>לחצו <strong>אישור שיבוץ</strong>.</span></div>
        <span class="next">→ השלב האחרון: אישור</span>
      </div>
    </div>

    <div class="step">
      <div class="pinwrap">
        <div class="phone">
          <div class="screen">
            <div class="s-modal mid">
              <div class="s-sheet flush">
                <div class="s-ok">
                  <div class="t">השיבוץ נקלט ✓</div>
                  <div class="d">נרשמת לסבב הסימולטור.</div>
                  <div class="acts"><span class="go">המשך</span><span class="alt">לשיבוצים שלי</span></div>
                </div>
              </div>
            </div>
          </div>
          <div class="pin" style="top:150px; right:74px">1</div>
        </div>
      </div>
      <div class="step-body">
        <div class="step-num" data-n="6">סיום</div>
        <h3>רשומים לתדריך ולסבב</h3>
        <p>הודעה ירוקה: <strong>“נרשמת לסבב הסימולטור.”</strong> זהו — ההרשמה הושלמה.</p>
        <div class="legend"><span class="n">1</span><span>לחצו <strong>המשך</strong>, או <strong>לשיבוצים שלי</strong> כדי לראות את שני השיבוצים.</span></div>
        <span class="next">→ הגיעו במועד. מסך התצוגה באתר מראה מי הבא בתור.</span>
      </div>
    </div>

  </div>

  <div class="after">
    <h2>צפייה בשיבוצים וביטול</h2>
    <p>רוצים לבדוק, לשנות מועד או לבטל? הכל דרך “השיבוצים שלי”, עם אותם שם וטלפון.</p>

    <div class="steps" style="margin-top:22px">
      <div class="step">
        <div class="pinwrap">
          <div class="phone">
            <div class="screen light">
              <div class="my-head"><span class="brand">HSL · A320 SIM</span><span class="link">השיבוצים שלי</span></div>
              <div class="my-body">
                <h4>השיבוצים שלי</h4>
                <div class="sub">הזינו שם מלא וטלפון כדי לראות ולבטל שיבוצים.</div>
                <div class="my-cardw" style="border-radius:14px">
                  <div class="s-field"><label style="color:#43536b">שם מלא</label><div class="s-input">ישראל ישראלי</div></div>
                  <div class="s-field"><label style="color:#43536b">טלפון נייד</label><div class="s-input ltr">0501234567</div></div>
                  <div class="s-btn">הצגת השיבוצים שלי</div>
                </div>
                <div class="my-cardw">
                  <div class="eb">תדריך</div>
                  <h5>מחזור הדגמה</h5>
                  <div class="meta">08.09.2026 · 09:45–09:00</div>
                  <span class="my-cancel">ביטול</span>
                </div>
              </div>
            </div>
            <div class="pin" style="top:16px; right:20px">1</div>
            <div class="pin" style="top:150px; right:74px">2</div>
            <div class="pin" style="top:250px; left:26px">3</div>
          </div>
        </div>
        <div class="step-body">
          <div class="step-num" data-n="•">בכל שלב</div>
          <h3>“השיבוצים שלי”</h3>
          <div class="legend"><span class="n">1</span><span>למעלה בכל מסך יש קישור <strong>“השיבוצים שלי”</strong>.</span></div>
          <div class="legend"><span class="n">2</span><span>הזינו <strong>שם מלא וטלפון</strong> (אותם פרטים מההרשמה) ולחצו <strong>הצגת השיבוצים שלי</strong>.</span></div>
          <div class="legend"><span class="n">3</span><span>ליד כל שיבוץ יש כפתור <strong>ביטול</strong>. לשינוי מועד — מבטלים ונרשמים מחדש לחלון אחר.</span></div>
        </div>
      </div>
    </div>
  </div>

  <div class="after">
    <h2>תקלות נפוצות</h2>
    <div class="trouble">
      <div class="tr">
        <div class="q">“כבר קיים שיבוץ לתדריך עם מספר הטלפון הזה”</div>
        <div class="a">כבר נרשמתם לתדריך. אפשר להירשם רק לאחד. אם צריך לשנות — היכנסו ל“השיבוצים שלי”, בטלו, והירשמו מחדש.</div>
      </div>
      <div class="tr">
        <div class="q">“כדי לתפוס חלון סימולטור צריך קודם להירשם לתדריך של אותו מחזור”</div>
        <div class="a">עוד לא נרשמתם לתדריך, או שהזנתם מספר טלפון אחר. חזרו לחלק א׳ והירשמו לתדריך עם אותו מספר.</div>
      </div>
      <div class="tr">
        <div class="q">“אפשר לתפוס חלון סימולטור רק במחזור שבו נרשמת לתדריך”</div>
        <div class="a">אתם מנסים לתפוס זוג במחזור שונה מזה של התדריך שלכם. לחצו ‹ הבא / הקודם › עד המחזור של התדריך.</div>
      </div>
      <div class="tr">
        <div class="q">“החלון מלא. נסו חלון אחר”</div>
        <div class="a">הזוג נתפס בזמן שמילאתם את הטופס. סגרו את החלונית ובחרו זוג אחר עם “פנויים”.</div>
      </div>
      <div class="tr">
        <div class="q">“מספר טלפון לא תקין”</div>
        <div class="a">הזינו 10 ספרות שמתחילות ב־05, בלי מקפים או רווחים — למשל 0501234567.</div>
      </div>
    </div>
  </div>

  <div class="gfoot">
    ${PLANE}
    <span>HSL · Airbus A320 Full Flight Simulator — מדריך הרשמה לעובדים</span>
  </div>

</div>
`;

export default function GuidePage() {
  return (
    <main className={`guide ${assistant.variable}`} dir="rtl">
      <div className="wrap" style={{ paddingBottom: 0 }}>
        <Link href="/" className="backlink">← לדף הרישום</Link>
      </div>
      <div dangerouslySetInnerHTML={{ __html: BODY }} />
    </main>
  );
}
