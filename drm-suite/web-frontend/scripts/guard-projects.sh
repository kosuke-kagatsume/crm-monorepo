#!/usr/bin/env bash
set -e
CHANGED=$(git diff --cached --name-only | grep '^web-frontend/src/app/projects/' || true)
if [ -n "$CHANGED" ]; then
  echo "✖ /projects 配下は改変禁止です。コミットを中断します。"
  echo "$CHANGED"
  exit 1
fi