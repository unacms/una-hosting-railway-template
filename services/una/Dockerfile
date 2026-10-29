# UNA on Railway. Core files come from unaio/una. This image only adds the
# boot script: one Apache MPM, volume ownership, and install/ cleanup.
# Change UNA_IMAGE_TAG to move the base image, then redeploy.
ARG UNA_IMAGE_TAG=latest
FROM unaio/una:${UNA_IMAGE_TAG}

# mod_php needs mpm_prefork. The stock image also loads mpm_event, and Apache
# exits with AH00534 until every other MPM is removed.
RUN set -eux; \
    rm -f /etc/apache2/mods-enabled/mpm_*.load /etc/apache2/mods-enabled/mpm_*.conf; \
    a2enmod mpm_prefork; \
    test "$(ls /etc/apache2/mods-enabled/ | grep -c '^mpm_.*\.load$')" = "1"

COPY scripts/railway-entrypoint.sh /usr/local/bin/railway-entrypoint.sh
RUN chmod 0755 /usr/local/bin/railway-entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/usr/local/bin/railway-entrypoint.sh"]
CMD ["apache2-foreground"]
