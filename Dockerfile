FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production


COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY db ./db

USER node
EXPOSE 3000

CMD ["sh", "-c", "node src/db/migrate.js && node src/server.js"]
