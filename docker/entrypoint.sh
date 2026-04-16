#!/bin/sh
set -eu

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  echo "[entrypoint] Aplicando migrations Prisma..."
  npx prisma migrate deploy
fi

echo "[entrypoint] Iniciando aplicacao..."
exec node server.js

