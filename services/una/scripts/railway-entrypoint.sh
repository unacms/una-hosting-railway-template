#!/usr/bin/env bash
# Boot UNA on Railway.
# 1. Leave exactly one Apache MPM (mod_php needs prefork; AH00534 otherwise).
# 2. Make the /var/www volume writable by www-una before the image entrypoint
#    downloads the zip. The volume is root-owned; without this, curl cannot
#    create una.zip and the container exits. Not recursive: the tree can be large.
# 3. After Studio install, UNA serves a blocker until install/ is removed.
#    Only remove it when the installed config is present.
# 4. Hand off to the image entrypoint.
# Do not apply addon SQL or insert API keys from this script.
set -Eeuo pipefail

log() { echo "[railway-entrypoint] $*" >&2; }

mpm_count="$(find /etc/apache2/mods-enabled -maxdepth 1 -name 'mpm_*.load' | wc -l | tr -d ' ')"
if [ "$mpm_count" != "1" ] || [ ! -e /etc/apache2/mods-enabled/mpm_prefork.load ]; then
    log "found ${mpm_count} enabled MPM modules; enabling mpm_prefork only"
    rm -f /etc/apache2/mods-enabled/mpm_*.load /etc/apache2/mods-enabled/mpm_*.conf
    a2enmod -q mpm_prefork
fi

mkdir -p /var/www/html
chown www-una:www-una /var/www /var/www/html

if [ -f /var/www/html/inc/header.inc.php ]; then
    rm -rf /var/www/html/install
fi
if [ -f /var/www/inc/header.inc.php ]; then
    rm -rf /var/www/install
fi

exec docker-entrypoint.sh "$@"
