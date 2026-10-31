FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

# Salin package*.json dulu supaya layer npm ci ter-cache selama dependency tidak berubah.
COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY db ./db

# Jangan jalankan sebagai root.
USER node
EXPOSE 3000

# Jalankan migrasi lalu start server.
CMD ["sh", "-c", "node src/db/migrate.js && node src/server.js"]
