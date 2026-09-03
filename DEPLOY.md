# YerAuksion — `narx.namresort.uz` ga joylash (Deployment)

Ushbu qo'llanma loyihani serverга (VPS) joylash va **avtomatik HTTPS** bilan
`https://narx.namresort.uz` domenida ishga tushirish tartibini beradi.

Ishlatiladigan texnologiya: **Docker Compose** + **Caddy** (Let's Encrypt SSL avtomatik) +
**Next.js** + **PostgreSQL**. Hech qanday API kalit shart emas.

---

## 1. Talablar

- Linux server (Ubuntu 22.04+ tavsiya etiladi), root yoki `sudo` huquqi.
- Serverда **Docker** va **Docker Compose** o'rnatilgan bo'lishi kerak.
- Serverning **80** va **443** portlari ochiq (internetdan).
- `namresort.uz` domenining DNS boshqaruviga kirish.

---

## 2. DNS sozlash (eng muhim qadam)

`narx.namresort.uz` uchun **A yozuvi** qo'shing va uni serveringiz IP manziliga yo'naltiring:

```
Tur:   A
Nomi:  narx        (yoki narx.namresort.uz — DNS panelingizga bog'liq)
Qiymat: <SERVER_IP_MANZILI>
TTL:   3600
```

Tekshirish (bir necha daqiqadan so'ng):
```bash
ping narx.namresort.uz
# yoki
dig +short narx.namresort.uz
```
IP serveringiznikiga to'g'ri kelishi kerak. **SSL faqat DNS to'g'ri bo'lgandagina oladi.**

---

## 3. Docker o'rnatish (agar yo'q bo'lsa)

```bash
curl -fsSL https://get.docker.com | sh
sudo systemctl enable --now docker
```

Firewall (agar `ufw` ishlatilsa):
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 4. Loyihani serverga olish

```bash
git clone https://github.com/SalohiyatDP/auksion_baholash.git
cd auksion_baholash
# Kerakli branch (hozircha feat/yerauksion; main'ga merge qilingach main):
git checkout feat/yerauksion
```

---

## 5. Maxfiy sozlamalar (.env)

Namunani nusxalang va qiymatlarni to'ldiring:
```bash
cp .env.prod.example .env
nano .env
```

`.env` ichida:
- `POSTGRES_PASSWORD` — kuchli parol.
- `JWT_SECRET` — uzun tasodifiy kalit. Yaratish:
  ```bash
  openssl rand -hex 32
  ```
- `SEED_ADMIN_PASSWORD`, `SEED_OPERATOR_PASSWORD` — boshlang'ich parollar.

> `.env` fayli git'ga qo'shilmaydi — u faqat serverда qoladi.

---

## 6. Domen va email'ni tekshirish

`Caddyfile` ichida domen `narx.namresort.uz` ekanini va ACME `email` ni o'zingiznikiga
o'zgartirganingizni tekshiring:
```
{
	email admin@namresort.uz
}
narx.namresort.uz {
	...
}
```

---

## 7. Ishga tushirish

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Bu:
1. PostgreSQL'ni ko'taradi,
2. ilovani build qiladi, bazani tayyorlaydi (`prisma db push`) va boshlang'ich ma'lumotlarni yuklaydi (seed),
3. Caddy avtomatik ravishda Let's Encrypt'дан **SSL sertifikat** oladi.

Loglarni kuzatish:
```bash
docker compose -f docker-compose.prod.yml logs -f caddy app
```

Bir-ikki daqiqadan so'ng oching: **https://narx.namresort.uz**

Kirish (`.env` dagi qiymatlar bilan): `admin@namresort.uz` / (siz belgilagan parol).

> Birinchi kirgach, **Foydalanuvchilar** bo'limida parollarni yangilang.

---

## 8. Yangilash (kod o'zgargach)

```bash
cd auksion_baholash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 9. To'xtatish / qayta ishga tushirish

```bash
docker compose -f docker-compose.prod.yml restart      # qayta ishga tushirish
docker compose -f docker-compose.prod.yml down          # to'xtatish (ma'lumotlar saqlanadi)
docker compose -f docker-compose.prod.yml down -v       # ⚠️ ma'lumotlar bazasini ham o'chiradi
```

---

## 10. Zaxira nusxa (backup)

**Ma'lumotlar bazasi:**
```bash
docker exec yerauksion-db pg_dump -U yerauksion yerauksion > backup_$(date +%F).sql
```

**Yuklangan/generatsiya qilingan fayllar** (`storage` volume) va DB volume'lari Docker
volume'larida saqlanadi:
```bash
docker volume ls | grep yerauksion   # pgdata, storage
```

Tiklash (DB):
```bash
cat backup_2026-01-01.sql | docker exec -i yerauksion-db psql -U yerauksion yerauksion
```

---

## 11. Muhim eslatmalar

- **SSL avtomatik** — Caddy Let's Encrypt'дан oladi va o'zi yangilab turadi. Buning uchun
  80/443 portlar ochiq va DNS to'g'ri bo'lishi shart.
- **Xarita kalitsiz** ishlaydi (Leaflet + OpenStreetMap/Esri/Google tayllar). Word hujjatiga
  xarita `staticmaps` orqali serverда chiziladi — buning uchun serverда internet bo'lishi kerak.
- Agar Word hujjatiда Google sun'iy yo'ldosh o'rniga Esri chiqsa — bu Google tayllari serverdan
  bloklanگani (403) sababli; tizim avtomatik Esri'ga o'tadi (xarita baribir chiqadi).
- Ilova va baza portlari tashqariga ochilmagan — faqat Caddy 80/443 orqali kiriladi.

---

## 12. Muammolarni bartaraf etish

| Muammo | Yechim |
|--------|--------|
| SSL olinmayapti | DNS to'g'ri (A yozuv → server IP), 80/443 ochiq ekanini tekshiring. `docker compose -f docker-compose.prod.yml logs caddy` |
| Sayt ochilmayapti | `docker compose -f docker-compose.prod.yml ps` — barcha konteynerlar `running` bo'lsin |
| Baza xatosi | `logs app` va `logs db` ni ko'ring; `.env` dagi DB parol mosligini tekshiring |
| Kirib bo'lmayapti | Seed loglarida yaratilgan admin email/parolini tekshiring |
