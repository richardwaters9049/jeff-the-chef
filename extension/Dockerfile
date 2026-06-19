# Builds the extension with Bun and serves the static package for a quick browser preview.
FROM oven/bun:1.3.14-alpine AS build
WORKDIR /app

COPY package.json bun.lock tsconfig.base.json ./
COPY backend/package.json backend/package.json
COPY extension/package.json extension/package.json
RUN bun install --frozen-lockfile

COPY extension extension
WORKDIR /app/extension
RUN bun run build

FROM nginx:1.29-alpine AS preview
COPY --from=build /app/extension/dist /usr/share/nginx/html
EXPOSE 80
