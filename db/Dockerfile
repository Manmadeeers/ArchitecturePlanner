FROM postgres:16-alpine

COPY backend/db/schema.sql /opt/bootstrap/schema.sql
COPY db/run-schema-on-start.sh /usr/local/bin/run-schema-on-start.sh
RUN chmod +x /usr/local/bin/run-schema-on-start.sh

ENTRYPOINT ["/usr/local/bin/run-schema-on-start.sh"]
