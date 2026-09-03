# ============================================================
# YerAuksion — Next.js 15 + Prisma ilovasi uchun Dockerfile
# ============================================================
FROM node:20-bookworm-slim AS base
# Prisma engine uchun kerakli kutubxonalar
RUN apt-get update -y && apt-get install -y openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- Bog'liqliklarni o'rnatish ----
FROM base AS deps
COPY package.json package-lock.json* ./
# package-lock.json bo'lmasa ham ishlashi uchun
RUN npm install

# ---- Ilovani build qilish ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- Ishga tushirish (runner) ----
FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app ./
# entrypoint skriptini bajariladigan qilish
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
