#!/bin/sh
set -eu

RCLONE_CONFIG_FILE_PATH="${RCLONE_CONFIG_FILE:-/tmp/rclone/rclone.conf}"

if [ -n "${RCLONE_CONFIG_CONTENT_BASE64:-}" ]; then
  mkdir -p "$(dirname "$RCLONE_CONFIG_FILE_PATH")"
  printf '%s' "$RCLONE_CONFIG_CONTENT_BASE64" | base64 -d > "$RCLONE_CONFIG_FILE_PATH"
  chmod 600 "$RCLONE_CONFIG_FILE_PATH"
fi

exec node apps/api/dist/main.js
