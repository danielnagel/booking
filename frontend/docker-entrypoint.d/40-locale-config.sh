#!/bin/sh
set -e

# Runs as a nginx:alpine /docker-entrypoint.d/ script (executed by the base
# image's own entrypoint before nginx starts, see Dockerfile).
#
# DEFAULT_LOCALE is a docker-compose environment variable, but this is a
# prebuilt static SPA - it can't read process.env at runtime like the
# backend does, so the value is written into a small script the app loads
# before it boots (see frontend/index.html and frontend/src/i18n/index.js),
# regenerated fresh on every container start.
cat > /usr/share/nginx/html/locale-config.js <<EOF
window.__APP_LOCALE__ = "${DEFAULT_LOCALE:-en}";
EOF
