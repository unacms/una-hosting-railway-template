# jot-server on Railway. The image has no environment variable for the JWT
# secret, so the boot script writes JOT_JWT_SECRET into config.json.
# Change JOT_IMAGE_TAG to move the base image, then redeploy.
ARG JOT_IMAGE_TAG=latest
FROM unaio/jot-server:${JOT_IMAGE_TAG}

# Base image is not root. chmod as that user returns "Operation not permitted".
USER root
COPY scripts/configure-config.js scripts/railway-entrypoint.sh /usr/local/bin/
RUN chmod 0755 /usr/local/bin/railway-entrypoint.sh

EXPOSE 5000
ENTRYPOINT ["/usr/local/bin/railway-entrypoint.sh"]
CMD ["node", "app.js"]
