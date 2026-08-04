# Build context is the repository root (npm workspaces), see the
# `build.context`/`build.dockerfile` settings in the root docker-compose.yml.

FROM node:22-alpine

WORKDIR /app

# bcrypt ships a native addon that needs to be compiled on install. The build
# toolchain is removed again right after `npm ci` so it doesn't bloat the
# final image.
RUN apk add --no-cache --virtual .build-deps python3 make g++

# Only the workspace manifests are needed to resolve dependencies via the
# single root package-lock.json (frontend/package.json must be present too so
# npm recognizes the full workspaces list, even though its deps aren't
# installed here).
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm ci --workspace=backend --omit=dev

RUN apk del .build-deps

COPY backend ./backend

WORKDIR /app/backend

# NODE_ENV is deliberately NOT set to "production" here: the auth route
# (backend/src/routes/auth.js) marks the JWT cookie Secure when
# NODE_ENV=production, which browsers refuse to store over plain HTTP. This
# image is used by the root docker-compose.yml, which has no TLS termination
# (that's added in Meilenstein 2 via my-webservers' nginx+certbot); setting
# "production" here would silently break browser-based login over
# http://localhost.

EXPOSE 3000

# Run pending migrations, then start the Express app.
CMD ["sh", "-c", "npm run migrate && npm start"]
