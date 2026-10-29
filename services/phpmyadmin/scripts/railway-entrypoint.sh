#!/usr/bin/env bash
# Boot phpMyAdmin on Railway.
# The image entrypoint runs whatever it is given, so this script is the
# entrypoint and then execs the image entrypoint. mod_php needs mpm_prefork.
# mpm_event is also loaded and Apache exits with AH00534 until it is removed.
set -Eeuo pipefail

log() { echo "[railway-entrypoint] $*" >&2; }

mpm_count="$(find /etc/apache2/mods-enabled -maxdepth 1 -name 'mpm_*.load' | wc -l | tr -d ' ')"
if [ "$mpm_count" != "1" ] || [ ! -e /etc/apache2/mods-enabled/mpm_prefork.load ]; then
    log "found ${mpm_count} enabled MPM modules; enabling mpm_prefork only"
    rm -f /etc/apache2/mods-enabled/mpm_*.load /etc/apache2/mods-enabled/mpm_*.conf
    a2enmod -q mpm_prefork
fi

exec /docker-entrypoint.sh "$@"
