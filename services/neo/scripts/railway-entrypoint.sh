#!/bin/sh
# The image ships source and no prebuilt app. Write the customization files
# compose bind-mounts, build on boot, then listen on 3000. Railway injects
# PORT=8080 unless this overrides it. The public domain targets 3000.
set -eu

cd /app
node /usr/local/bin/write-customization.js
yarn --cwd apps/next build
exec env PORT=3000 yarn --cwd apps/next start
