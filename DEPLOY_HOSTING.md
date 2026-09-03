# YerAuksion — Umumiy hosting (ISPmanager, `narx.namresort.uz`) ga joylash

Bu qo'llanma ilovani **ISPmanager** panelida Docker'siz, to'g'ridan-to'g'ri **Node.js** ilovasi
sifatida ishga tushirish uchun.

> **MUHIM:** Baza sifatida **SQLite** ishlatiladi — server, foydalanuvchi/parol, PostgreSQL/MySQL
> **kerak emas**. Barcha ma'lumot `data/app.db` faylida saqlanadi. Shu sabab P1000/P1010 kabi baza
> kredentsial xatolari umuman bo'lmaydi.

---

## 1. Node.js versiyasi

Panelda ilovaga **Node.js 20 yoki 22** ni tanlang.

> Node 26 kabi juda yangi versiyalarda `sharp`/`staticmaps` (Word hujjatidagi static xarita rasmi
> uchun) ishlamasligi mumkin. **20/22 LTS** eng barqaror.

---

## 2. Loyihani serverga olish (SSH)

```bash
cd /var/www/USER/data/www           # USER — hosting login
rm -rf narx.namresort.uz            # bo'sh bo'lsa shart emas
git clone https://github.com/SalohiyatDP/auksion_baholash.git narx.namresort.uz
cd narx.namresort.uz
git checkout feat/yerauksion
```

## 3. O'rnatish va build

```bash
npm install
npm run build
```
> RAM yetmasa: `NODE_OPTIONS="--max-old-space-size=1024" npm run build`

## 4. `.env` faylini yaratish

Loyiha papkasining to'liq yo'lini `pwd` bilan aniqlang, so'ng:

```bash
cp .env.example .env
nano .env
```

`.env` ichi (TO'LIQ yo'l bilan — `USER` ni o'zingiznikiga almashtiring):

```env
DATABASE_URL="file:/var/www/USER/data/www/narx.namresort.uz/data/app.db"
JWT_SECRET="UZUN_TASODIFIY_KALIT"
STORAGE_DIR="/var/www/USER/data/www/narx.namresort.uz/storage"
NEXT_PUBLIC_APP_URL="https://narx.namresort.uz"
SEED_ADMIN_EMAIL="admin@namresort.uz"
SEED_ADMIN_PASSWORD="KUCHLI_PAROL"
SEED_OPERATOR_EMAIL="operator@namresort.uz"
SEED_OPERATOR_PASSWORD="KUCHLI_PAROL2"
NODE_ENV="production"
```
`JWT_SECRET` uchun: `openssl rand -hex 32`

## 5. Baza va boshlang'ich ma'lumotlar (bir marta)

```bash
mkdir -p data storage
npx prisma generate
npx prisma db push
npm run seed
```
- `prisma db push` — `data/app.db` SQLite bazasini yaratadi.
- `npm run seed` — admin/operator va namunaviy ma'lumotlarni yozadi.

## 6. Panelda Node.js ilovasini sozlash

ISPmanager: **Node.js ilovasini ishga tushirish parametrlari**:

| Maydon | Qiymat |
|--------|--------|
| **Ilova papkasi (App root)** | `/var/www/USER/data/www/narx.namresort.uz` |
| **Ishga tushirish buyrug'i (Команда запуска)** | `node server.js` |
| **Node.js versiyasi** | 20 yoki 22 |
| **Rejim** | Production |

**Ishga tushirishdan oldingi buyruq (ixtiyoriy):**
```
npm install && npm run build && npm run prisma:push && npm run seed
```
> Bu har restartda build qiladi (sekin). Odatda 2–5-bosqichni bir marta qo'lda bajarib,
> pre-launch'ни o'chirib qo'yish yoki faqat `npm run prisma:push` qoldirish yaxshiroq.

**Muhit o'zgaruvchilari (Переменная окружения)** — `.env` fayldan o'qiladi. Ishonch uchun panelga
ham qo'shishingiz mumkin: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, `STORAGE_DIR`,
`NEXT_PUBLIC_APP_URL`, seed parollari.

So'ng **"Сохранить и перезапустить"**. Panel domen + SSL + portga proxy'ni o'zi ulaydi.

## 7. SSL (HTTPS)

Panelda **Let's Encrypt** sertifikatini `narx.namresort.uz` uchun oling va **HTTP → HTTPS**
yo'naltirishни yoqing. (Cookie HTTPS'da avtomatik `secure` bo'ladi — kodda hisobga olingan.)

## 8. Katta fayl yuklash (SHP/KMZ/rasm) — Nginx limiti

Domen → **Nginx qo'shimcha direktivalari**:
```
client_max_body_size 30m;
```

## 9. Yangilash

```bash
cd /var/www/USER/data/www/narx.namresort.uz
git pull
npm install
npm run build
npx prisma db push     # sxema o'zgargan bo'lsa
```
So'ng panelda ilovани **Restart**. Ma'lumotlar `data/` va `storage/` da saqlanib qoladi.

## 10. Zaxira (backup)

```bash
tar czf ~/backup-$(date +%F).tar.gz data storage
```

---

## 11. Tez-tez uchraydigan muammolar

| Muammo | Yechim |
|--------|--------|
| **`EADDRINUSE :::3000`** | Panel `PORT` bermayapti yoki 3000 band. `PORT` muhit o'zgaruvchisini qo'shing (panel bergan port yoki bo'sh port, masalan `39876`). `server.js` `process.env.PORT` ni oladi. |
| **`502 Bad Gateway`** | Node ilova ishlamayapti yoki port mos emas. Panel loglarini ko'ring; `PORT` panel proxy porti bilan bir xilligini tekshiring. |
| **Baza xatosi** | `DATABASE_URL` to'liq yo'l ekanini va `data/` papka yozuvга ruxsatli ekanini tekshiring. |
| **Word'da xarita chiqmaydi** | `sharp`/`staticmaps` Node versiyasiga mos emas — Node **20/22** ga o'ting. (Preview xarita baribir ishlaydi.) |
| **Katta fayl yuklanmaydi** | Nginx `client_max_body_size 30m;` qo'shing. |
| **Prisma engine/openssl xatosi** | `npx prisma generate` ni serverda qayta bajaring. |

---

## 12. Tez tekshiruv ro'yxati

- [ ] Node 20/22 tanlandi
- [ ] `npm install && npm run build` xatosiz o'tdi
- [ ] `.env` yaratildi (SQLite `DATABASE_URL` to'liq yo'l bilan)
- [ ] `npx prisma db push && npm run seed` o'tdi (`data/app.db` yaratildi)
- [ ] Panel: startup `node server.js`, kerak bo'lsa `PORT` env qo'shildi
- [ ] Ilova ishga tushdi, `https://narx.namresort.uz` ochildi
