#!/bin/sh
set -eu

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  echo "[entrypoint] Aplicando migrations Prisma..."
  npx prisma migrate deploy
fi

if [ "${RUN_ADMIN_BOOTSTRAP:-false}" = "true" ]; then
  echo "[entrypoint] Garantindo conta admin bootstrap..."
  node /app/docker/bootstrap-admin.mjs
fi

echo "[entrypoint] Iniciando aplicacao..."

APP_ROOT="/app"
if [ -f "/app/server.js" ]; then
  APP_ROOT="/app"
elif [ -f "/app/portal_inovaverso/server.js" ]; then
  APP_ROOT="/app/portal_inovaverso"
else
  DETECTED_SERVER="$(find /app -maxdepth 4 -type f -name server.js | head -n 1 || true)"
  if [ -z "$DETECTED_SERVER" ]; then
    echo "[entrypoint] Erro: server.js nao encontrado em /app"
    ls -la /app || true
    exit 1
  fi
  APP_ROOT="$(dirname "$DETECTED_SERVER")"
fi

if [ -d "/app/.next/static" ] && [ ! -d "$APP_ROOT/.next/static" ]; then
  mkdir -p "$APP_ROOT/.next"
  cp -R /app/.next/static "$APP_ROOT/.next/static"
fi

cd "$APP_ROOT"
exec node server.js
