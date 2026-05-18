#!/usr/bin/env sh
set -eu

POSTGRES_ENTRYPOINT="/usr/local/bin/docker-entrypoint.sh"
SCHEMA_PATH="/opt/bootstrap/schema.sql"

if [ ! -f "$SCHEMA_PATH" ]; then
  echo "Schema file not found at $SCHEMA_PATH" >&2
  exit 1
fi

"$POSTGRES_ENTRYPOINT" postgres &
postgres_pid="$!"

forward_signal() {
  kill -TERM "$postgres_pid" 2>/dev/null || true
}

trap forward_signal INT TERM

wait_for_tcp_postgres() {
  retries=120
  attempt=0

  while [ "$attempt" -lt "$retries" ]; do
    if pg_isready -h 127.0.0.1 -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-postgres}" >/dev/null 2>&1; then
      return 0
    fi

    if ! kill -0 "$postgres_pid" 2>/dev/null; then
      wait "$postgres_pid" || true
      echo "PostgreSQL process stopped before schema could be applied." >&2
      return 1
    fi

    attempt=$((attempt + 1))
    sleep 1
  done

  echo "Timed out waiting for PostgreSQL to accept TCP connections." >&2
  return 1
}

if wait_for_tcp_postgres; then
  export PGPASSWORD="${POSTGRES_PASSWORD:-}"
  if ! psql \
    -h 127.0.0.1 \
    -U "${POSTGRES_USER:-postgres}" \
    -d "${POSTGRES_DB:-postgres}" \
    -v ON_ERROR_STOP=1 \
    -f "$SCHEMA_PATH"; then
    kill -TERM "$postgres_pid" 2>/dev/null || true
    wait "$postgres_pid" || true
    exit 1
  fi
else
  kill -TERM "$postgres_pid" 2>/dev/null || true
  wait "$postgres_pid" || true
  exit 1
fi

wait "$postgres_pid"
