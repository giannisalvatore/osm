# ---- build CLI package ----
FROM node:20-alpine AS cli-builder

WORKDIR /cli
COPY src/cli/package.json ./
RUN npm install --omit=dev
COPY src/cli/ .
RUN npm pack && mv osm-cli-*.tgz osm-cli.tgz

# ---- build frontend ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY src/frontend/package.json ./
RUN npm install

COPY src/frontend/ .

# Inject the CLI package built in the previous stage
COPY --from=cli-builder /cli/osm-cli.tgz ./public/osm-cli.tgz

# PUBLIC_API_URL must be baked in at build time so Astro SSR
# can embed it in the client-side bundle (import.meta.env.PUBLIC_API_URL)
ARG PUBLIC_API_URL
ENV PUBLIC_API_URL=$PUBLIC_API_URL

RUN npm run build

# ---- runtime ----
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

ENV HOST=0.0.0.0
ENV PORT=4321

EXPOSE 4321

CMD ["node", "./dist/server/entry.mjs"]
