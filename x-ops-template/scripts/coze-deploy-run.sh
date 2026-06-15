#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

export PORT="${PORT:-5000}"
export X_OPS_DATA_DIR="${X_OPS_DATA_DIR:-/tmp/x-ops-data}"

mkdir -p "$X_OPS_DATA_DIR"

echo "[x-ai-content-radar] starting coze server"
echo "[x-ai-content-radar] PORT=$PORT"
echo "[x-ai-content-radar] X_OPS_DATA_DIR=$X_OPS_DATA_DIR"

node scripts/coze-server.js
