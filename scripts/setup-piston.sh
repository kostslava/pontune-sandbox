#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

mkdir -p piston-data/packages

echo "Starting Piston container..."
docker compose up -d

echo "Waiting for Piston API..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:2000/api/v2/runtimes >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! curl -sf http://localhost:2000/api/v2/runtimes >/dev/null 2>&1; then
  echo "Piston failed to start. Check: docker logs piston_api"
  exit 1
fi

install_pkg() {
  local lang="$1"
  local ver="$2"
  local installed
  installed=$(curl -s http://localhost:2000/api/v2/packages | python3 -c "
import json, sys
pkgs = json.load(sys.stdin)
for p in pkgs:
    if p['language'] == '$lang' and p['language_version'] == '$ver':
        print('true' if p.get('installed') else 'false')
        break
else:
    print('false')
")
  if [ "$installed" = "true" ]; then
    echo "  ✓ $lang $ver already installed"
  else
    echo "  → Installing $lang $ver (may take 1–2 min)..."
    curl -sf -X POST http://localhost:2000/api/v2/packages \
      -H "Content-Type: application/json" \
      -d "{\"language\":\"$lang\",\"version\":\"$ver\"}" >/dev/null
    echo "  ✓ $lang $ver installed"
  fi
}

echo "Installing language runtimes..."
install_pkg java 15.0.2
install_pkg gcc 10.2.0

echo ""
echo "Piston is ready at http://localhost:2000"
echo "  REST:      http://localhost:2000/api/v2/execute"
echo "  WebSocket: ws://localhost:2000/api/v2/connect"
