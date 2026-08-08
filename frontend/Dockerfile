# Build context is the repository root (npm workspaces), see the
# `build.context`/`build.dockerfile` settings in the root docker-compose.yml.

# ---- Build stage --------------------------------------------------------
FROM node:22-alpine AS build

WORKDIR /app

# Only the workspace manifests are needed to resolve dependencies via the
# single root package-lock.json (backend/package.json must be present too so
# npm recognizes the full workspaces list, even though its deps aren't
# installed here).
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm ci --workspace=frontend

COPY frontend ./frontend

WORKDIR /app/frontend

RUN npm run build

# ---- Runtime stage -------------------------------------------------------
FROM nginx:alpine

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/docker-entrypoint.d/40-locale-config.sh /docker-entrypoint.d/40-locale-config.sh
RUN chmod +x /docker-entrypoint.d/40-locale-config.sh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
