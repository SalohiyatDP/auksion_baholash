# YerAuksion

**Yer auksioni boshlang'ich narxini hisoblash va rasmiy hujjat (Word) generatsiya qilish tizimi**

Davlat tashkilotlari xodimlari uchun mo'ljallangan ichki axborot tizimi. Yer uchastkasi ijara
huquqini elektron onlayn-auksionga chiqarish uchun boshlang'ich narxni hisoblaydi va rasmiy
`.docx` ma'lumotnomani avtomatik shakllantiradi.

> Barcha hisoblash mantig'i va hujjat tuzilishi loyihaning manba fayllaridan
> (`формула.xlsx` va namunaviy Word hujjati) aynan olingan. Batafsil tahlil: [`PLAN.md`](./PLAN.md).

---

## ⚡ Tez ishga tushirish (Docker Desktop)

Talab: **Docker Desktop** (Docker Engine + Docker Compose).

```bash
docker compose up --build
```

So'ng brauzerda oching: **http://localhost:3000**

Konteyner:
- `yerauksion-app` — Next.js + **SQLite** (avtomatik: sxema qo'llash + seed + start). Alohida DB serveri kerak emas.

To'xtatish:
```bash
docker compose down          # konteynerlarni to'xtatadi
docker compose down -v       # ma'lumotlar bazasini ham tozalaydi
```

### Demo kirish ma'lumotlari

| Rol | Login | Parol |
|-----|-------|-------|
| Administrator | `admin@yerauksion.uz` | `admin123` |
| Operator | `operator@yerauksion.uz` | `operator123` |

Seed bilan **Sharshara-1** namunaviy hujjati ham yaratiladi (boshlang'ich narx: **651 537 810 so'm**).

---

## 🧮 Hisoblash formulasi

```
C = S × T × B × G × F × M + E
```

| Belgi | Ma'nosi | Manba |
|-------|---------|-------|
| S | Lot maydoni (kv.m) | Foydalanuvchi kiritadi |
| T | Hudud toifa koeffitsiyenti | `territory_categories` (tuman bo'yicha) |
| B | Yer solig'i stavkasi (so'm/kv.m) | `tax_rates` (yillik stavka ÷ 10000) |
| G | Muhandislik-kommunikatsiya koeff. | Foydalanuvchi (0,5–3), default 1,0 |
| F | Foydalanish turi koeffitsiyenti | `land_usage_coefficients` |
| M | Maydon kamaytiruvchi koeff. | `area_coefficients` — **maydondan avtomatik** |
| E | Qo'shimcha xarajatlar (so'm) | Foydalanuvchi, default 0 |

**M avtomatik aniqlanadi** (Excel `IF` mantig'iga aynan mos):

| Maydon | M |
|--------|-----|
| < 1000 kv.m | 1,0 |
| 1000 – 10000 kv.m | 0,9 |
| 10000 – 50000 kv.m | 0,8 |
| > 50000 kv.m | 0,7 |

Namunaviy hisob: `7 700 × 15 × 5 698 × 1,0 × 1,1 × 0,9 + 0 = 651 537 810 so'm`.

### ⚠️ Manba fayllardagi nomuvofiqlik haqida

Namunaviy Word hujjatida M koeffitsiyenti **0,8** deb ko'rsatilgan, ammo undagi yakuniy natija
(651 537 810) faqat **M = 0,9** bilan chiqadi (Excel ham 0,9 ni beradi, chunki 0,77 gektar
"0,1–1 ga" bandiga tegishli). Word'dagi `0,8` — matn terish xatosi. **Tizim Excel mantig'iga amal
qiladi (M = 0,9)** va to'g'ri natijani beradi. Batafsil: `PLAN.md`, 7-bo'lim.

---

## 🛠 Texnologiyalar

- **Frontend:** Next.js 15 (App Router), TypeScript, React 19, Tailwind CSS, shadcn uslubidagi komponentlar, Lucide
- **Backend:** Next.js API Routes (modulli servis qatlami)
- **DB:** SQLite + Prisma ORM (fayl asosidagi baza — server/kredentsial talab qilinmaydi)
- **Hujjat:** [`docx`](https://www.npmjs.com/package/docx) — haqiqiy `.docx` (A4, Times New Roman, jadval, xarita rasmi)
- **Auth:** JWT (httpOnly cookie) + rol asosida (RBAC)
- **Fayl saqlash:** lokal disk (`StorageProvider` abstraktsiyasi orqali kelajakda S3 ga o'tish mumkin)

---

## 📂 Loyiha tuzilishi

```
app/
  (dashboard)/         # himoyalangan sahifalar (sidebar + topbar)
    dashboard/         # bosh sahifa (statistika)
    documents/         # ma'lumotnomalar: ro'yxat, yangi, ko'rish, tahrirlash
    calculations/      # tezkor kalkulyator
    reports/           # hisobotlar
    settings/          # koeffitsiyentlar (admin)
    users/             # foydalanuvchilar (admin)
  api/                 # REST endpointlar
  login/               # kirish sahifasi
components/
  ui/                  # qayta ishlatiluvchi UI komponentlar
  dashboard/           # sidebar, topbar
  documents/           # forma, preview, xarita yuklash, amallar
services/              # calculation, coefficient, document (docx), storage
lib/                   # prisma, auth, jwt, format, validations, image-size
prisma/                # schema.prisma, seed.ts
```

Qatlamlar ajratilgan: **UI / biznes-mantiq / DB / hujjat generatsiyasi / hisoblash dvigateli**.

---

## 🔌 API endpointlar

| Metod | Yo'l | Tavsif |
|-------|------|--------|
| POST | `/api/auth/login` | Tizimga kirish |
| POST | `/api/auth/logout` | Chiqish |
| GET | `/api/regions`, `/api/districts`, `/api/mfys` | Hudud ma'lumotlari |
| GET | `/api/coefficients` | Barcha koeffitsiyentlar |
| POST | `/api/calculations` | Jonli hisoblash (saqlamaydi) |
| GET/POST | `/api/documents` | Ro'yxat / yaratish |
| GET/PUT/DELETE | `/api/documents/:id` | Ko'rish / tahrirlash / o'chirish |
| POST | `/api/documents/:id/generate-word` | Word generatsiya |
| GET | `/api/documents/:id/download` | `.docx` yuklab olish |
| GET/POST/DELETE | `/api/documents/:id/map` | Xarita rasmi |
| GET/POST | `/api/users`, PUT/DELETE `/api/users/:id` | Foydalanuvchilar (admin) |

---

## 💻 Lokal ishga tushirish (Docker'siz)

Talab: Node.js 20+ (alohida ma'lumotlar bazasi serveri **kerak emas** — SQLite).

```bash
cp .env.example .env          # standart DATABASE_URL SQLite (data/app.db)
npm install
npx prisma db push            # data/app.db bazasini yaratadi
npx prisma db seed            # boshlang'ich ma'lumotlar
npm run dev                   # http://localhost:3000
```

Testlar (hisoblash dvigateli):
```bash
npm test
```

---

## 🔐 Ma'lumotlar yaxlitligi

Har bir hujjatda ishlatilgan koeffitsiyentlar (S, T, B, G, F, M, E) va huquqiy asos matni
**snapshot** sifatida saqlanadi. Koeffitsiyentlar kelajakda o'zgarsa ham, avval yaratilgan
hujjatlarning hisob-kitobi o'zgarmaydi.

---

## 🌐 Ishlab chiqarishga joylash (Deployment)

`narx.namresort.uz` kabi domenga joylash — Caddy orqali avtomatik HTTPS bilan:
```bash
cp .env.prod.example .env   # qiymatlarni to'ldiring
docker compose -f docker-compose.prod.yml up -d --build
```
To'liq bosqichma-bosqich qo'llanma:
- **Docker'li server (VPS):** [`DEPLOY.md`](./DEPLOY.md)
- **Umumiy hosting (ISPmanager, Docker'siz):** [`DEPLOY_HOSTING.md`](./DEPLOY_HOSTING.md)

## 🗺 Xarita: SHP / KMZ / KML / GeoJSON (KALITSIZ)

Hujjat formasida ikkita geografik yuklash mavjud:
- **Umumiy maydon** — xaritada **qizil** chiziq bilan
- **Lotlar** — xaritada **ko'k** chiziq bilan

Qo'llab-quvvatlanadigan formatlar: **SHP** (`.zip` shaklida), **KMZ**, **KML**, **GeoJSON**. Fayllar
brauzerda GeoJSON ga o'giriladi.

**Xarita hech qanday API kalit talab qilmaydi.** Ochiq manbalar ishlatiladi:
- **Interaktiv xarita:** [Leaflet](https://leafletjs.com) + OpenStreetMap / Esri sun'iy yo'ldosh /
  Google tayllar (qatlamni almashtirish mumkin).
- **Hujjatdagi rasm (.docx):** [`staticmaps`](https://www.npmjs.com/package/staticmaps) kutubxonasi
  serverda tayllarni yig'ib, qizil/ko'k poligonli PNG rasm shakllantiradi.

> Ya'ni faqat internet ulanishi bo'lsa kifoya — kalit sozlash shart emas.

## 🔤 Alifbo (Lotin / Kirill)

Har bir hujjat uchun alifbo tanlanadi: **Lotin**, **Kirill** yoki **Ikkalasi**. Tanlov ham web
ko'rinishga, ham generatsiya qilingan `.docx` ga ta'sir qiladi. "Ikkalasi" tanlanganda hujjat lotin
va kirill matnlarini ketma-ket ko'rsatadi.

## ⚙️ Koeffitsiyentlarni tahrirlash

Administrator **Sozlamalar** bo'limida barcha koeffitsiyent jadvallarini (T, B, F, M, G) va huquqiy
asosni to'g'ridan-to'g'ri qo'shishi, tahrirlashi va o'chirishi mumkin. O'zgarishlar faqat yangi
hujjatlarga ta'sir qiladi (snapshot tufayli eski hujjatlar o'zgarmaydi).

## 🚧 Keyingi bosqichlar

- Kelajakda ko'zda tutilgan (arxitektura tayyor): PDF eksport, ERI (elektron raqamli imzo), ko'p viloyat/shablon.
- Docker image demo uchun `prisma db push` ishlatadi; ishlab chiqarishda `prisma migrate` bilan migratsiya fayllari yaratish tavsiya etiladi.

---

## 📄 Litsenziya

Ichki foydalanish uchun. © YerAuksion.
