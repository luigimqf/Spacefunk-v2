# Build
FROM node:22-alpine AS builder

ENV CI=true

# Dependências
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Ativa o corepack para gerenciar o pnpm de forma nativa e rápida
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# Imagem final
FROM node:22-alpine

RUN apk add --no-cache ffmpeg

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/pnpm-lock.yaml* ./
COPY --from=builder /app/dist ./dist

RUN pnpm install --prod --frozen-lockfile

# Usa o script "start" do package.json
CMD ["pnpm", "start"]