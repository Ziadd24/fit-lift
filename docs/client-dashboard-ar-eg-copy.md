# Client Dashboard Arabic UX Copy

## Scope
This note defines the Arabic product voice for the client dashboard in [D:\lastfitlift\fit-lift\app\client\dashboard](D:/lastfitlift/fit-lift/app/client/dashboard), paired with the strings file at [D:\lastfitlift\fit-lift\locales\client-dashboard.ar-EG.json](D:/lastfitlift/fit-lift/locales/client-dashboard.ar-EG.json).

## Voice
The voice is calm, encouraging, and locally familiar to an Egyptian user. It avoids stiff textbook Arabic and avoids slang that would feel too casual for a premium fitness product.

## Glossary
| Term | Arabic | Why this choice |
| --- | --- | --- |
| Dashboard | الرئيسية | Simpler and more natural for clients than `لوحة التحكم`. |
| Workouts | التمارين | Clear, standard, and instantly scannable. |
| Nutrition | التغذية | Most familiar product term for meal tracking. |
| Progress | التقدم | Feels positive and product-friendly. |
| Assessments | التقييمات | More natural than `التكليفات` for body-check flows. |
| Coach | الكوتش | Common in Egyptian fitness context and friendlier than `المدرب` in UI chrome. |
| Membership Code | كود العضوية | Keeps the SaaS feel and matches local product language. |
| Subscription | الاشتراك | Standard and trusted wording. |
| Log Out | تسجيل الخروج | Consistent with wider app language. |
| Quick Log | تسجيل سريع | Action-led and easy to understand. |
| Goal | هدف | Short and familiar. |
| Protein Target | هدف البروتين | More natural than `مستهدف البروتين`. |
| Pending | معلّق / مستني ردك | Contextual: general status vs assessment status. |
| In Progress | شغّال دلوقتي | More human and immediate than `قيد التنفيذ`. |
| Completed | تم / مكتمل | `تم` works for compact labels; `مكتمل` works in status groups. |
| Save | احفظ | Verb-led and faster to scan than `حفظ`. |
| Cancel | إلغاء | Standard, compact, and expected. |
| Search | ابحث | Action-led and clear. |
| Shared Files | الملفات المشتركة | Precise and easy to recognize. |
| Weight Progress | تقدم الوزن | Reads naturally and avoids awkward literal phrasing. |

## Tone Check
1. `Welcome back!` became `أهلاً بيك تاني، {name}`
Why: `مرحبًا بعودتك` feels translated; the chosen version sounds warmer and more natural in Egyptian product UX.

2. `Your request is being processed` style copy was localized as `بنعالج...` patterns
Why: Active first-person plural softens the message and sounds more supportive than passive formal Arabic.

3. `Insufficient balance` style severity was mirrored in dashboard errors with `مش قادرين...`
Why: Helpful and human, avoids robotic blame-heavy error wording.

4. `Assignment` was localized as `التقييمات`
Why: In this product, the feature is about body checks and coach review, not homework. `التقييمات` matches user intent better.

5. `Global Search` became `بحث شامل`
Why: `بحث عام` feels vague; `بحث شامل` better communicates that the search spans the whole dashboard.

## Numeral Choice
The strings file uses standard numerals (`0-9`) for consistency with the current fitness UI, mixed technical units, and existing dashboard data patterns. If product direction changes, this file can be converted to Eastern Arabic numerals in a single pass.
