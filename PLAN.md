# YerAuksion — Loyiha rejasi (PLAN.md)

**Yer auksioni boshlang'ich narxini hisoblash va rasmiy hujjat (Word) generatsiya qilish tizimi**

Ushbu hujjat ikki manba fayl tahlili asosida tayyorlangan:

1. `формула.xlsx` — hisoblash formulasi, koeffitsiyentlar va manba mantiq.
2. `Поп_тумани_ер_участкаси_бўйича_ҳокимга_хат.docx` — rasmiy hujjatning aniq tashqi ko'rinishi (layout) va matni.

> ⚠️ **MUHIM:** Kod yozishdan oldin quyidagi tahlil va aniqlangan nomuvofiqliklar (7-bo'lim) diqqat bilan o'qilishi kerak. Excel hisoblash mantig'i o'zgartirilmaydi.

---

## 1. Manba fayllar tahlili

### 1.1. Excel (`формула.xlsx`) — 5 ta varaq

| Varaq | Vazifasi |
|-------|----------|
| `хисоблаш` | Asosiy hisoblash: formula, kirish qiymatlari, natija |
| `Т` | Hudud (tuman) → toifa → **T** koeffitsiyenti jadvali |
| `B` | Tuman → yer solig'i stavkasi (yillik) jadvali (**B** manbasi) |
| `М` | Yer maydoni oralig'i → **M** kamaytiruvchi koeffitsiyent jadvali |
| `шаблон` | Bo'sh (namuna shabloni sifatida rejalashtirilgan) |

#### `хисоблаш` varag'idagi kalit yacheykalar

Namuna (Pop tumani, 7700 kv.m):

| Ustun | Belgi | Yacheyka | Qiymat | Manba mantiq |
|-------|-------|----------|--------|--------------|
| B4 | **S** | 7700 | 7700 | Qo'lda kiritiladi (ijaraga taklif etilayotgan maydon, kv.m) |
| C4 | **T** | 15 | 15 | `=VLOOKUP(A4, Т!$A$2:$C$15, 3, 0)` — tuman nomidan T koeffitsiyenti |
| D4 | **B** | 5698 | 5698 | `=VLOOKUP(A4, B!$B$3:$E$16, 4, 0)/10000` — yillik stavka / 10000 |
| E4 | **G** | 1 | 1,0 | Qo'lda kiritiladi (0,5–3 oralig'ida) |
| F4 | **F** | 1,1 | 1,1 | Qo'lda kiritiladi (foydalanish turiga qarab) |
| G4 | **M** | 0,9 | 0,9 | `=IF(B4<1000,1,IF(B4<10000,0.9,IF(B4<=50000,0.8,0.7)))` — maydondan avtomatik |
| H4 | **E** | 0 | 0 | Qo'lda kiritiladi (qo'shimcha xarajatlar) |

**Natija (B6):** `=B4*C4*D4*E4*F4*G4+H4` → **651 537 810**

**Gektar (E6):** `=B4/10000` → `0,77 gektar` ("boshlang'ich narx 0,77 gektar uchun hisoblangan").

#### `Т` varag'i — Hudud toifa koeffitsiyenti (T)

| Toifa | T | Namangan tumanlari |
|-------|----|--------------------|
| 1-toifa | 25 | Namangan shahri, Yangi Namangan, Davlatobod |
| 2-toifa | 20 | To'raqo'rg'on, Uychi, Uchqo'rg'on |
| 3-toifa | 15 | Kosonsoy, Namangan tumani, **Pop**, Chortoq, Chust, Yangiqo'rg'on |
| 4-toifa | 10 | Norin |
| 5-toifa | 5 | Mingbuloq |

#### `B` varag'i — Yer solig'i stavkasi (2026-yil)

Manba: Xalq deputatlari Namangan viloyati Kengashining 2025-yil 29-dekabrdagi **VII-17-165-6-0-K/25-son** qaroriga 6-ilova.

Formula: `Yer solig'i stavkasi = Bazaviy miqdor × Koeffitsiyent`, keyin **B = stavka / 10000** (gektardan kv.metrga).

| Tuman | Bazaviy miqdor | Koeff. | Yillik stavka | B (so'm/kv.m) |
|-------|----------------|--------|---------------|----------------|
| Namangan shahri | 51 800 000 | 1,65 | 85 470 000 | 8 547 |
| **Pop tumani** | 51 800 000 | 1,10 | **56 980 000** | **5 698** |
| Naman. tumani, To'raqo'rg'on, Uychi, Chust | 51 800 000 | 1,20 | 62 160 000 | 6 216 |
| Mingbuloq, Kosonsoy, Chortoq, Yangiqo'rg'on, Norin, Uchqo'rg'on | 51 800 000 | 1,10 | 56 980 000 | 5 698 |

> Izoh: Yangi Namangan va Davlatobod tumanlari uchun stavka `B` varag'ida `0` (hali belgilanmagan).

#### `М` varag'i — Maydon bo'yicha kamaytiruvchi koeffitsiyent (M)

Exceldagi `IF` formulasi bilan **to'liq mos** (chegaralarga e'tibor bering):

| Maydon (kv.m) | Gektar | M |
|---------------|--------|-----|
| S < 1000 | < 0,1 ga | **1,0** |
| 1000 ≤ S < 10000 | 0,1 – 1 ga | **0,9** |
| 10000 ≤ S ≤ 50000 | 1 – 5 ga | **0,8** |
| S > 50000 | > 5 ga | **0,7** |

**7700 kv.m** → `1000 ≤ 7700 < 10000` → **M = 0,9**.

---

### 1.2. Word (`...docx`) — hujjat tuzilishi

**Sahifa sozlamalari:** A4 (11906 × 16838 twip), Times New Roman. Chetlar (twip): yuqori/past = 1020, chap = 1417, o'ng = 850. Ichida `image1.png` (~1,9 MB) joylashtirilgan.

**1-SAHIFA:**

1. **Sarlavha bloki** (markazlashtirilgan, katta harflar, qalin):
   - `NAMANGAN VILOYATI POP TUMANI`
   - `GULISTON MFY HUDUDIDA JOYLASHGAN YER UCHASTKASINI`
   - `ELEKTRON ONLAYN-AUKSIONGA CHIQARISH TO'G'RISIDA`
   - `MA'LUMOT`

2. **Kirish paragrafi** (dinamik): loyiha maqsadi, tashkilot nomi, jami maydon, loyiha nomi, lot maydoni (ga va kv.m).

3. **Huquqiy asos paragrafi** (sozlanadigan): VM 14.02.2022-y 71-son qarori, 2-ilova, Nizomning 22-bandi.

4. **Formula** (markazda, qalin): `C = S × T × B × G × F × M + E`

5. Matn: "Mazkur formula bo'yicha hisob-kitob uchun quyidagi ko'rsatkichlar qabul qilindi:"

6. **Koeffitsiyentlar jadvali** (`Belgi | Ko'rsatkich | Qiymat`) — 2.3-bo'limga qarang.

7. Matn: "Yuqoridagi ko'rsatkichlardan kelib chiqib, ... boshlang'ich narxi quyidagicha hisoblanadi:"

8. **Yakuniy hisob** (markazda): `C = 7 700 × 15 × 5 698 × 1,0 × 1,1 × M + 0 = 651 537 810 so'm`

9. **Yakuniy narx** (markazda): "Boshlang'ich narxi 651 537 810 so'mni tashkil etadi."

**2-SAHIFA (xarita ko'chirmasi):**

- Sarlavha: `"{PROJECT_NAME}" dam olish maskanini tashkil etish uchun alohida lot sifatida ajratilgan {LOT_AREA_HA} gektar ({LOT_AREA_M2} kv.metr) yer uchastkasi xaritasidan KO'CHIRMASI`
- Xarita rasmi (yuklangan)
- Izohlar (legenda):
  - 🔴 **Qizil chiziq** — jami ro'yxatdan o'tkazilgan yer maydoni ({TOTAL_AREA_HA} gektar)
  - 🔵 **Ko'k chiziq** — auksion lot maydoni ({LOT_AREA_HA} gektar)

---

## 2. Ajratilgan o'zgaruvchilar (Extracted variables)

### 2.1. Foydalanuvchi kiritadigan qiymatlar (input)

| O'zgaruvchi | Tavsif | Namuna | Birlik |
|-------------|--------|--------|--------|
| region | Viloyat | Namangan viloyati | — |
| district | Tuman | Pop tumani | — |
| mfy | MFY | Guliston MFY | — |
| project_name | Loyiha / lot nomi | Sharshara-1 | — |
| organization | Balansdagi tashkilot nomi | "Namangan turistik-rekreatsion hududlarini rivojlantirish direksiyasi" | — |
| project_purpose | Loyiha maqsadi jumlasi | "turistik-rekreatsion loyihani amalga oshirish" | — |
| total_area_ha | Jami ro'yxatdan o'tgan maydon | 4,92 | gektar |
| lot_area_m2 | Auksion lot maydoni (**S**) | 7700 | kv.m |
| land_usage | Foydalanish turi (**F** manbasi) | Rekreatsiya (kod 7.0) | — |
| G | Muhandislik-kommunikatsiya koeff. | 1,0 | — |
| E | Qo'shimcha xarajatlar | 0 | so'm |

### 2.2. Avtomatik aniqlanadigan qiymatlar

| O'zgaruvchi | Manba |
|-------------|-------|
| lot_area_ha | `lot_area_m2 / 10000` = 0,77 |
| **T** | `territory_categories` jadvali (tuman bo'yicha) = 15 |
| **B** | `tax_rates` jadvali (tuman bo'yicha, stavka/10000) = 5698 |
| **F** | `land_usage_coefficients` jadvali = 1,1 |
| **M** | `area_coefficients` jadvali (**maydondan avtomatik**) = 0,9 |
| starting_price | formula natijasi = 651 537 810 |

### 2.3. Koeffitsiyentlar jadvali qiymatlari (namuna)

| Belgi | Ko'rsatkich | Qiymat |
|-------|-------------|--------|
| S | Yer uchastkasining maydoni | 7 700 kv. metr |
| T | Hudud toifasi (Pop tumani — 3-toifa hudud) | 15 |
| B | 1 kv.metr uchun yuridik shaxslardan olinadigan yer solig'i stavkasi | 5 698 so'm |
| G | Muhandislik-kommunikatsiya tarmoqlari koeffitsiyenti | 1,0 |
| F | Tabiatni muhofaza qilish, sog'lomlashtirish va rekreatsiya (kod 7.0) | 1,1 |
| M | Yer maydoni bo'yicha kamaytiruvchi koeffitsiyent | **0,9** (Excel bo'yicha — 7-bo'limga qarang) |
| E | Yer uchastkasiga oid qo'shimcha xarajatlar | 0 so'm |

---

## 3. Hisoblash formulasi

```
C = S × T × B × G × F × M + E
```

Namuna:
```
C = 7 700 × 15 × 5 698 × 1,0 × 1,1 × 0,9 + 0
C = 651 537 810 so'm
```

Tekshiruv: 7700 × 15 = 115 500 → × 5698 = 658 119 000 → × 1,0 = 658 119 000 → × 1,1 = 723 930 900 → × 0,9 = **651 537 810** ✓ (Excel B6 bilan bir xil).

**Aniqlash tartibi (calculation engine):**
1. `S = lot_area_m2`
2. `T` ← territory_categories (region + district)
3. `B` ← tax_rates (region + district, faol yil), qiymat = yillik_stavka / 10000
4. `G` ← input (default 1,0)
5. `F` ← land_usage_coefficients (tanlangan tur)
6. `M` ← area_coefficients (S qaysi oraliqqa tushishiga qarab)
7. `E` ← input (default 0)
8. `C = S*T*B*G*F*M + E`

---

## 4. Ma'lumotlar bazasi entity'lari (PostgreSQL / Prisma)

| Jadval | Asosiy maydonlar |
|--------|------------------|
| `users` | id, full_name, email, username, password_hash, role (ADMIN/OPERATOR), is_active, created_at |
| `regions` | id, name |
| `districts` | id, region_id → regions, name |
| `mfys` | id, district_id → districts, name |
| `territory_categories` | id, region_id, district_id, category (1..5), coefficient_t |
| `tax_rates` | id, region_id, district_id, base_amount, coefficient, annual_rate, rate_b (=annual_rate/10000), year, effective_from, effective_to |
| `land_usage_coefficients` | id, code (masalan "7.0"), name, coefficient_f |
| `area_coefficients` | id, min_area, max_area (nullable = ∞), coefficient_m, description |
| `engineering_coefficients` | id, name, coefficient_g |
| `legal_references` | id, title, body, is_active |
| `documents` | id, document_number, region_id, district_id, mfy, project_name, organization, project_purpose, total_area_ha, lot_area_m2, lot_area_ha, **s, t, b, g, f, m, e** (snapshot), starting_price, legal_reference_text (snapshot), status (DRAFT/GENERATED/ARCHIVED), created_by, created_at, updated_at |
| `document_calculations` | id, document_id, formula_string, result, breakdown_json |
| `document_files` | id, document_id, type (MAP_IMAGE/GENERATED_DOCX), path, original_name, size, mime |

> **Muhim (data integrity):** `documents` jadvalida S, T, B, G, F, M, E va huquqiy asos matni **snapshot** sifatida saqlanadi. Kelajakda koeffitsiyentlar o'zgarsa, eski hujjatlar qayta hisoblanmaydi.

---

## 5. Hujjat shabloni o'zgaruvchilari (docxtemplater placeholder'lari)

| Placeholder | Manba | Namuna |
|-------------|-------|--------|
| `{REGION}` | region.name (upper) | NAMANGAN VILOYATI |
| `{DISTRICT}` | district.name | Pop tumani |
| `{DISTRICT_UPPER}` | district.name (upper) | POP TUMANI |
| `{MFY}` | mfy | Guliston MFY |
| `{MFY_UPPER}` | mfy (upper) | GULISTON MFY |
| `{PROJECT_NAME}` | project_name | Sharshara-1 |
| `{ORGANIZATION}` | organization | Namangan turistik-rekreatsion... direksiyasi |
| `{PROJECT_PURPOSE}` | project_purpose | turistik-rekreatsion loyihani amalga oshirish |
| `{TOTAL_AREA_HA}` | total_area_ha (formatlangan) | 4,92 |
| `{LOT_AREA_HA}` | lot_area_ha | 0,77 |
| `{LOT_AREA_M2}` | lot_area_m2 | 7700 / 7 700 |
| `{S} {T} {B} {G} {F} {M} {E}` | snapshot qiymatlar | 7 700 / 15 / 5 698 / 1,0 / 1,1 / 0,9 / 0 |
| `{T_DESC}` | toifa tavsifi | Pop tumani — 3-toifa hudud |
| `{F_DESC}` | foydalanish turi tavsifi | Tabiatni muhofaza qilish... (kod 7.0) |
| `{FORMULA}` | to'liq yakuniy satr | C = 7 700 × 15 × 5 698 × 1,0 × 1,1 × 0,9 + 0 = 651 537 810 so'm |
| `{STARTING_PRICE}` | formatlangan narx | 651 537 810 |
| `{LEGAL_REFERENCE}` | legal_references snapshot | O'zbekiston Respublikasi VM... |
| `{MAP_IMAGE}` | yuklangan rasm | (image module) |
| `{CURRENT_DATE}` | generatsiya sanasi | 03.09.2026 |

---

## 6. Raqam formati (Uzbek)

- Mingliklar ajratgichi: **bo'sh joy** (thin space) → `651 537 810 so'm`
- O'nlik ajratgichi: **vergul** → `0,77 gektar`, `1,0`, `1,1`, `0,9`
- Ko'paytirish belgisi: `×` (hujjatda `x` ham uchraydi — biz `×` ishlatamiz)

---

## 7. ⚠️ Aniqlangan NOMUVOFIQLIKLAR (Excel ↔ Word)

Talab bo'yicha nomuvofiqliklar jimgina hal qilinmasdan, ochiq xabar qilinadi:

### 7.1. KRITIK: M koeffitsiyenti (Word = 0,8, lekin natija 0,9 ni talab qiladi)

- **Word hujjati** koeffitsiyentlar jadvalida va yakuniy formulada **M = 0,8** deb ko'rsatilgan:
  `C = 7 700 x 15 x 5 698 x 1,0 x 1,1 x 0,8 + 0 = 651 537 810 so'm`
- **Ammo** `0,8` bilan haqiqiy natija: `723 930 900 × 0,8 = 579 144 720` — bu **651 537 810 EMAS**.
- **651 537 810** natijasi faqat **M = 0,9** bilan chiqadi (`723 930 900 × 0,9`).
- **Excel** ham M = 0,9 ni beradi: `IF(7700<10000 → 0,9)`, chunki 7700 kv.m = 0,77 ga oralig'i **0,1–1 ga** bandiga tegishli (M=0,9). `0,8` esa **1–5 ga** bandi uchun.

**Xulosa:** Word namunasidagi `0,8` — texnik xato (matn terishda). To'g'ri qiymat **M = 0,9**. Ikkala manbadagi **yakuniy narx (651 537 810)** bir xil va u faqat M=0,9 bilan mos keladi.

**Qaror:** Tizim **Excel mantig'iga amal qiladi** — M maydondan avtomatik aniqlanadi (`area_coefficients`). 7700 kv.m uchun M = 0,9 va natija 651 537 810 so'm. Word shabloni ham M ni dinamik qiymatdan (0,9) chiqaradi, hardcode qilinmaydi.

### 7.2. M — "sozlanadigan" emas, avtomatik

Texnik topshiriqda M "configurable" deb aytilgan, lekin Excel'da M **qo'lda kiritilmaydi** — u S (maydon)dan step-funksiya orqali hisoblanadi. Tizimda M `area_coefficients` jadvalidan avtomatik olinadi (administrator jadval chegaralarini boshqarishi mumkin, lekin operator M ni qo'lda kiritmaydi).

### 7.3. B qiymatining kelib chiqishi

Excel'da B to'g'ridan-to'g'ri 5698 emas: `tax_rates` yillik stavkasi (56 980 000) / 10000 = 5698. `tax_rates` jadvalida bazaviy miqdor, koeffitsiyent, yillik stavka va hosila `rate_b` (5698) saqlanadi.

### 7.4. Til: Kirill → Lotin

Manba Word hujjati **kirill** yozuvida. Texnik topshiriq bo'yicha ilova va hujjat **lotin (o'zbek)** yozuvida bo'lishi shart. Shuning uchun barcha turg'un matnlar lotinga o'girib beriladi (tuzilma va layout aynan saqlanadi). Kelajakda kirill shablonini qo'shish arxitekturada ko'zda tutiladi.

---

## 8. Texnologiyalar

| Qatlam | Tanlov |
|--------|--------|
| Frontend | Next.js 15 (App Router), TypeScript, React, Tailwind CSS, shadcn/ui, Lucide |
| Backend | Next.js API Routes (modulli servis qatlami) |
| DB | PostgreSQL + Prisma ORM |
| Hujjat | docxtemplater (+ image module) — haqiqiy `.docx` |
| Fayl saqlash | Lokal (`/storage`), keyinchalik S3 ga o'tish uchun `StorageProvider` abstraktsiyasi |
| Auth | Credentials (username/parol) + rol asosida (RBAC) |

**Arxitektura:** UI / Biznes-mantiq / DB / Hujjat generatsiyasi / Hisoblash dvigateli — alohida qatlamlar.

```
/app (dashboard, documents, calculations, settings, users, api)
/components (ui, dashboard, documents, calculator)
/lib (format, auth, utils)
/services (calculation, document, coefficient, storage)
/database (prisma schema, seed)
/types
/templates (namuna .docx shablon)
```

---

## 9. Bajarish rejasi (Implementation plan)

| Qadam | Tavsif | Holat |
|-------|--------|-------|
| 1 | Loyiha init + bog'liqliklar | ⏳ |
| 2 | Prisma sxema + migratsiya + seed (Namangan/Pop/Guliston, Sharshara-1) | ⏳ |
| 3 | Autentifikatsiya + RBAC | ⏳ |
| 4 | Koeffitsiyentlarni boshqarish (admin) | ⏳ |
| 5 | Hisoblash dvigateli (`calculateStartingPrice`, testlanadigan) | ⏳ |
| 6 | Yangi hujjat formasi (ko'p bo'limli) | ⏳ |
| 7 | Avtomatik jonli hisoblash | ⏳ |
| 8 | Hujjat veb-preview | ⏳ |
| 9 | Word (.docx) generatsiya + xarita rasmini joylash | ⏳ |
| 10 | Ma'lumotnomalar tarixi (qidiruv/filtr/paginatsiya) | ⏳ |
| 11 | UI/UX yaxshilash | ⏳ |
| 12 | Validatsiya + xatoliklarni boshqarish | ⏳ |
| 13 | Hujjatlashtirish (README, Docker, .env namuna) | ⏳ |

---

## 10. Seed ma'lumotlari (namuna)

- **Viloyat:** Namangan viloyati (14 tuman toifalari `Т` varag'idan)
- **Tuman:** Pop tumani (3-toifa, T=15)
- **MFY:** Guliston MFY
- **Loyiha:** Sharshara-1
- **tax_rates:** barcha tumanlar (`B` varag'idan), Pop uchun rate_b=5698
- **land_usage_coefficients:** Tabiatni muhofaza qilish/Sog'lomlashtirish/Rekreatsiya (kod 7.0, F=1,1), Turizm, Savdo, Xizmat ko'rsatish, Boshqa
- **area_coefficients:** 4 ta oraliq (1,0 / 0,9 / 0,8 / 0,7)
- **engineering_coefficients:** default G=1,0
- **legal_references:** VM 71-son (14.02.2022) 2-ilova, 22-band
- **users:** admin + operator (namuna)

Namunaviy hisob natijasi: **651 537 810 so'm**.
