#!/bin/sh
set -e

echo "==> Ma'lumotlar bazasi tayyor bo'lishini kutmoqda..."
# DB tayyor bo'lguncha kutamiz (prisma db push urinishlari orqali)
RETRIES=20
until npx prisma db push --skip-generate --accept-data-loss 2>/dev/null; do
  RETRIES=$((RETRIES-1))
  if [ "$RETRIES" -le 0 ]; then
    echo "!! Ma'lumotlar bazasiga ulanib bo'lmadi. Chiqilmoqda."
    exit 1
  fi
  echo "   ... DB hali tayyor emas, 3s dan so'ng qayta urinamiz ($RETRIES qoldi)"
  sleep 3
done

echo "==> Sxema qo'llandi. Boshlang'ich ma'lumotlar (seed) yuklanmoqda..."
npx prisma db seed || echo "   (seed allaqachon mavjud yoki o'tkazib yuborildi)"

echo "==> Next.js ilovasi ishga tushmoqda (http://localhost:3000)"
exec npm run start
