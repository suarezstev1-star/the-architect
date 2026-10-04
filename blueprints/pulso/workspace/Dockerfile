# syntax=docker/dockerfile:1
# Cloud Run image for @pulso/server. The tag below is derived from the pinned Node version;
# VERIFICAR antes de construir que la etiqueta existe en Docker Hub (no se pudo comprobar offline).
FROM node:24.21.0-bookworm-slim AS build
ENV PNPM_HOME=/pnpm
ENV PATH=/pnpm:$PATH
ENV CI=true
RUN corepack enable && corepack prepare pnpm@11.28.2 --activate
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @pulso/shared build && pnpm --filter @pulso/server build

FROM node:24.21.0-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app/apps/server
COPY --from=build /app /app
USER node
EXPOSE 8080
CMD ["node", "dist/index.js"]
