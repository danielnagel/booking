#!/bin/sh
set -e

# Runs as a nginx:alpine /docker-entrypoint.d/ script (executed by the base
# image's own entrypoint before nginx starts, see Dockerfile).
#
# MODE is a docker-compose environment variable, but this is a prebuilt
# static SPA - it can't read process.env at runtime like the backend does, so
# the value is written into a small script the app loads before it boots
# (see frontend/index.html and frontend/src/constants/mode.js), regenerated
# fresh on every container start.
cat > /usr/share/nginx/html/mode-config.js <<EOF
window.__APP_MODE__ = "${MODE:-}";
EOF
