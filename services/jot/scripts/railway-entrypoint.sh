#!/bin/sh
# Write the JWT secret into config.json, then start jot-server.
# The image has no env for this. config.json is root-owned, so the service
# runs as root (RAILWAY_RUN_UID=0).
set -eu

node /usr/local/bin/configure-config.js
exec docker-entrypoint.sh "$@"
