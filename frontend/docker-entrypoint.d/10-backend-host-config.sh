#!/bin/sh
set -e

# Runs as a nginx:alpine /docker-entrypoint.d/ script (executed by the base
# image's own entrypoint before nginx starts, see Dockerfile), before nginx
# reads its config.
#
# BACKEND_HOST lets a deployment point /api at a different backend hostname
# than this repo's local docker-compose.yml service name ("backend") -
# e.g. a deployment using real per-instance service names instead of
# aliasing containers as "backend". Defaults to "backend" so local dev/CI
# need no changes.
sed -i "s/__BACKEND_HOST__/${BACKEND_HOST:-backend}/g" /etc/nginx/conf.d/default.conf
