#!/bin/sh
set -e

mkdir -p /app/data /app/storage

echo "==> SQLite sxemasi qo'llanmoqda..."
npx prisma db push --skip-generate --accept-data-loss

echo "==> Boshlang'ich ma'lumotlar (seed)..."
npx prisma db seed || echo "   (seed allaqachon mavjud yoki o'tkazib yuborildi)"

echo "==> Ilova ishga tushmoqda..."
exec node server.js
