# phpMyAdmin on Railway. The stock image loads more than one Apache MPM and
# exits with AH00534. This image keeps mpm_prefork only.
# Change PMA_IMAGE_TAG to move the base image, then redeploy.
# phpmyadmin:5.2.3 is the same image as phpmyadmin:5.2.3-apache.
ARG PMA_IMAGE_TAG=5.2.3
FROM phpmyadmin:${PMA_IMAGE_TAG}

RUN set -eux; \
    rm -f /etc/apache2/mods-enabled/mpm_*.load /etc/apache2/mods-enabled/mpm_*.conf; \
    a2enmod mpm_prefork; \
    test "$(ls /etc/apache2/mods-enabled/ | grep -c '^mpm_.*\.load$')" = "1"

COPY scripts/railway-entrypoint.sh /usr/local/bin/railway-entrypoint.sh
RUN chmod 0755 /usr/local/bin/railway-entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/usr/local/bin/railway-entrypoint.sh"]
CMD ["apache2-foreground"]
