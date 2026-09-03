# YerAuksion — Umumiy hosting (ISPmanager, Docker'siz) ga joylash

Agar serveringiz **Docker** emas, balki **ISPmanager / cPanel** kabi panel bilan Node.js
ilovalarini ishlatsa (masalan `/var/www/.../narx.namresort.uz`), quyidagicha joylashtiring.

> Build muvaffaqiyatli o'tdi. Yagona kerakli narsa — **`.env` fayl** va **PostgreSQL bazasi**.

---

## ⚠️ Sizdagi xatoning sababi

```
Error: Environment variable not found: DATABASE_URL.
```

`prisma db push` loyiha papkasidagi **`.env`** faylidan `DATABASE_URL` ni o'qiydi. U hozircha yo'q.
Uni yaratsak, muammo hal bo'ladi.

---

## 1. PostgreSQL bazasini yarating (panel orqali)

ISPmanager panelида: **Ma'lumotlar bazalari → PostgreSQL → Baza yaratish**.
- Baza nomi: masalan `narx_db`
- Foydalanuvchi: masalan `narx_user`
- Parol: kuchli parol

> Agar panelда faqat **MySQL** bo'lsa (PostgreSQL yo'q bo'lsa) — menga ayting, Prisma'ni MySQL'ga
> o'tkazib beraman (bir necha qatorlik o'zgarish).

---

## 2. `.env` faylini yarating

Loyiha papkasida (`.../narx.namresort.uz`) `.env` fayl yarating:

```bash
cd /var/www/s0277/data/www/narx.namresort.uz
nano .env
```

Ichiga (o'z qiymatlaringiz bilan):

```env
DATABASE_URL="postgresql://narx_user:PAROL@127.0.0.1:5432/narx_db?schema=public"
JWT_SECRET="BU_YERGA_UZUN_TASODIFIY_KALIT"
STORAGE_DIR="./storage"
NEXT_PUBLIC_APP_URL="https://narx.namresort.uz"
SEED_ADMIN_EMAIL="admin@namresort.uz"
SEED_ADMIN_PASSWORD="ADMIN_PAROLI"
SEED_OPERATOR_EMAIL="operator@namresort.uz"
SEED_OPERATOR_PASSWORD="OPERATOR_PAROLI"
NODE_ENV="production"
```

`JWT_SECRET` yaratish:
```bash
openssl rand -hex 32
```

> `PAROL`, `narx_user`, `narx_db` — 1-qadamda yaratgan qiymatlaringiz.
> Agar PostgreSQL boshqa portда bo'lsa (masalan panel ko'rsatgan), portni moslang.

---

## 3. Baza jadvallarini yaratish va boshlang'ich ma'lumotlar

```bash
npx prisma db push
npx prisma db seed
```

yoki bitta buyruq bilan:
```bash
npm run deploy:db
```

Muvaffaqiyatли bo'lsa: admin va operator foydalanuvchilari + namunaviy hujjat yaratiladi.

---

## 4. Ilovani ishga tushirish

### a) Panel orqali (tavsiya etiladi)
ISPmanager'да **Node.js ilovasi** sozlamalarida:
- **Ilova papkasi:** loyiha papkasi (`.../narx.namresort.uz`)
- **Ishga tushirish buyrug'i:** `npm start`  (bu `next start` ni ishlatadi)
- **Port:** panel bergan portni ishlatadi (Next.js `PORT` muhit o'zgaruvchisini avtomatik oladi).
- Muhit o'zgaruvchilari: `.env` fayl o'qiladi (yoki panel maydonlariga ham qo'shishingiz mumkin).

Panel domenni (`narx.namresort.uz`) va **SSL (HTTPS)** ni o'zi ulaydi (reverse proxy).

### b) Qo'lда (SSH, sinov uchun)
```bash
PORT=3000 npm start
```
So'ng panelда reverse proxy `narx.namresort.uz` → `127.0.0.1:3000` qilib sozlanadi.

---

## 5. Yangilash (kod o'zgargach)

```bash
cd /var/www/s0277/data/www/narx.namresort.uz
git pull
npm install
npm run build
npm run deploy:db     # sxema o'zgargan bo'lsa
# panelда ilovани "Restart" qiling (yoki jarayonni qayta ishga tushiring)
```

---

## 6. Muhim eslatmalar

- **Node versiyasi:** sizда Node 26 ko'rindi. `sharp`/`staticmaps` (Word xaritasi uchun) juda yangi
  Node'да muammo qilsa, hujjat generatsiyasi ishlamasligi mumkin. Agar shunday bo'lsa —
  **Node 20 yoki 22 LTS** ni tanlang (ISPmanager'да Node versiyasini o'zgartirish mumkin).
- **Xavfsizlik (Next.js):** `next@15.1.4` da ogohlantirish bor. Yangilash tavsiya etiladi:
  `npm i next@^15` (so'ng `npm run build`). Buni sinov muhitида tekshirib ko'ring.
- **`.env` maxfiy** — hech kimga bermang, git'ga qo'shilmaydi.
- **storage** papkasi (yuklangan xaritalar va generatsiya qilingan `.docx`) saqlanib turishi kerak —
  uni backup qiling.

---

## 7. Tez tekshiruv ro'yxati

- [ ] PostgreSQL baza yaratildi (yoki MySQL — menga xabar bering)
- [ ] `.env` fayl to'g'ri `DATABASE_URL` bilan yaratildi
- [ ] `npm run deploy:db` xatosiz o'tdi
- [ ] `npm start` ishladi, panel portга ulandi
- [ ] `https://narx.namresort.uz` ochildi va login sahifasi chiqdi
