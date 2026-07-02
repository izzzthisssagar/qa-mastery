# buggyapi-ws — tiny standalone WebSocket practice service (Fly.io).
# Self-contained on purpose: no monorepo build graph, just this folder.
FROM node:22-alpine

WORKDIR /app

COPY package.json ./
# Standalone install (no workspace lockfile inside the image) — the dep list
# is 4 packages; reproducibility comes from the pinned ranges + CI.
RUN npm install --omit=dev --no-audit --no-fund

COPY src ./src
COPY tsconfig.json ./

ENV NODE_ENV=production
EXPOSE 8080

CMD ["npx", "tsx", "src/server.ts"]
