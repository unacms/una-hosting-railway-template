# NEO on Railway. The upstream command is `node` with no script, so a container
# with no TTY exits 0 and ON_FAILURE does not restart it. This image builds the
# Next app on boot and listens on 3000, which is the public domain target.
# Change NEO_IMAGE_TAG to move the base image, then redeploy.
ARG NEO_IMAGE_TAG=latest
FROM unaio/neo:${NEO_IMAGE_TAG}

COPY scripts/railway-entrypoint.sh /usr/local/bin/railway-entrypoint.sh
RUN set -eux; \
    chmod 0755 /usr/local/bin/railway-entrypoint.sh; \
    ln -sf "$(command -v tini)" /usr/local/bin/tini

EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/tini", "--", "/usr/local/bin/railway-entrypoint.sh"]
