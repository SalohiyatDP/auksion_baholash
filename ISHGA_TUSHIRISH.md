# narx.namresort.uz — TOZA O'RNATISH (0 dan)

Quyidagi buyruqlarни **ketma-ket**, SSH orqali bajaring. `USER` = `s0277`,
socket yo'li panelда ko'rsatilgan (`/var/www/s0277/data/nodejs/21.sock`).

> Node versiyasi: **20 yoki 22** bo'lsin (panelда tanlanadi).

---

## 1. Eski papkani tozalab, qaytadan clone qilish

```bash
cd /var/www/s0277/data/www
rm -rf narx.namresort.uz
git clone -b feat/yerauksion https://github.com/SalohiyatDP/auksion_baholash.git narx.namresort.uz
cd narx.namresort.uz
```

## 2. `.env` faylini yaratish

```bash
cat > .env <<'EOF'
DATABASE_URL="file:/var/www/s0277/data/www/narx.namresort.uz/data/app.db"
JWT_SECRET="BU_YERGA_UZUN_TASODIFIY_KALIT"
STORAGE_DIR="/var/www/s0277/data/www/narx.namresort.uz/storage"
NEXT_PUBLIC_APP_URL="https://narx.namresort.uz"
SEED_ADMIN_EMAIL="admin@namresort.uz"
SEED_ADMIN_PASSWORD="Admin123!"
SEED_OPERATOR_EMAIL="operator@namresort.uz"
SEED_OPERATOR_PASSWORD="Operator123!"
EOF
```
> `JWT_SECRET` uchun tasodifiy kalit: `openssl rand -hex 32` — chiqqan qiymatni qo'ying.
> **Diqqat:** `.env` ichига `NODE_ENV=production` YOZMANG (build paytida kerakли paketlar
> o'rnatilishi uchun). Ilova baribir production'да ishlaydi.

## 3. Papkalar, o'rnatish, build, baza

```bash
mkdir -p data storage
npm install
npm run build
npx prisma db push
npm run seed
```
- `npm run build` oxirida `✓ Compiled successfully` va `.next` papkasi paydo bo'lishi kerak.
- Xato bo'lsa — shu bosqichdagi xato matnini yuboring (502 ning asosiy sababi shu yerда bo'ladi).

## 4. Socketда qo'lда sinash

```bash
pkill -f "node server.js" 2>/dev/null ; true
PORT=/var/www/s0277/data/nodejs/21.sock node server.js
```
Kutilayotgan natija:
```
[YerAuksion] PORT="/var/www/s0277/data/nodejs/21.sock" (socket), NODE_ENV=production
> YerAuksion tayyor (socket): /var/www/s0277/data/nodejs/21.sock
```
Shu chiqsa — **hammasi tayyor**. `Ctrl+C` bilan to'xtating.

## 5. Panelда sozlash

**Параметры запуска Node.js:**
- **Команда запуска:** `node server.js`
- **Дополнительная команда (pre-launch):**
  ```
  npm install
  npm run build
  npx prisma db push
  npm run seed
  ```
- **Переменная окружения:**
  - `PORT` = `/var/www/s0277/data/nodejs/21.sock`
  - (Xohlasangiz `NODE_ENV` = `production` — LEKIN u holда pre-launch'да `npm install` o'rniga
    `npm install --include=dev` yozing. Eng oson yo'l — `NODE_ENV`ни umuman qo'ymaslik.)

So'ng **"Сохранить и перезапустить"**.

## 6. Ochish

https://narx.namresort.uz — login sahifasi chiqadi. Kirish: `admin@namresort.uz` / `Admin123!`
(yoki `.env` da qo'yganingiz). Kirgach parolni almashtiring.

---

## Nega ilgari ishlamаgan (sabablar)

1. **Eski `server.js`** diskда qolган (socketни bilmaydi). — Endi qayta clone qilinади.
2. **`NODE_ENV=production` + `npm install`** devDependencies'ni tushirmagan → build buzilган.
   — Endi `typescript`, `tailwindcss`, `prisma`, `tsx` `dependencies`ga ko'chirildi, doim o'rnatiladi.
3. **Socket** — panel TCP port emas, socket beradi; `server.js` endi socketни qo'llaydi.

Agar 3-yoki-4 bosqichда xato chiqsa — o'sha matnни yuboring, aniq hал qilamiz.
