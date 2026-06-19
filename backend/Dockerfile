# Builds a small production image for the Bun-powered Jeff API gateway.
FROM oven/bun:1.3.14-alpine AS dependencies
WORKDIR /app

COPY package.json bun.lock tsconfig.base.json ./
COPY backend/package.json backend/package.json
COPY extension/package.json extension/package.json
RUN bun install --frozen-lockfile

FROM dependencies AS build
COPY backend backend
WORKDIR /app/backend
RUN bun run build

FROM oven/bun:1.3.14-alpine AS runtime
WORKDIR /app/backend
ENV HOST=0.0.0.0 PORT=8787 LOG_LEVEL=info NODE_ENV=production

COPY --from=dependencies /app/node_modules /app/node_modules
COPY --from=dependencies /app/backend/node_modules ./node_modules
COPY --from=build /app/backend/package.json ./package.json
COPY --from=build /app/backend/dist ./dist

USER bun
EXPOSE 8787
CMD ["bun", "dist/index.js"]
