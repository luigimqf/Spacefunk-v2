# Build
FROM node:22-alpine AS builder

ENV CI=true

# Dependências
RUN apk add --no-cache python3 make g++

WORKDIR /app
RUN npm install -g pnpm

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
RUN pnpm install

COPY . .
RUN pnpm build

# Imagem final
FROM node:22-alpine

RUN apk add --no-cache ffmpeg

WORKDIR /app
RUN npm install -g pnpm 

COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/pnpm-lock.yaml* ./
COPY --from=builder /app/dist ./dist

RUN pnpm install --prod

# Usa o script "start" do package.json
CMD ["pnpm", "start"]