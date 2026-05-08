FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate resolve --applied '20260507120000_insert_active_clients' 2>/dev/null; true && until npx prisma migrate deploy; do echo 'Aguardando banco de dados...'; sleep 3; done && node dist/seed.js && node dist/index.js"]
