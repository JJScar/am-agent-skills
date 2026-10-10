#!/usr/bin/env bash
# Installs am-skills-mcp as a macOS LaunchAgent: starts at login, restarts if it
# crashes, keeps the Mac awake while it runs (on power), and logs to
# ~/Library/Logs/am-skills-mcp.log. See docs/self-hosting.md.
#
# Usage:
#   deploy/macos/install-service.sh <public-host> [--no-auth] [--dry-run]
#   deploy/macos/install-service.sh --uninstall
#
#   <public-host>  the laptop's Funnel name, e.g. my-laptop.tail1234.ts.net
#   --no-auth      turn sign-in off — only for a skills-only server, never with account data
#   --dry-run      print the generated plist and exit without installing anything
#
# Sign-in is on by default: set a passphrase first with `npm run auth:set-passphrase`.
set -euo pipefail

LABEL="com.amskills.mcp"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
LOG="$HOME/Library/Logs/am-skills-mcp.log"
PORT="${AM_SKILLS_PORT:-8787}"
REPO_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
DOMAIN="gui/$(id -u)"

if [[ "${1:-}" == "--uninstall" ]]; then
  launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null || true
  rm -f "$PLIST"
  echo "Removed $LABEL. (Funnel is unchanged — run: tailscale funnel --https=443 off)"
  exit 0
fi

PUBLIC_HOST="${1:-}"
DRY_RUN=""
AUTH="oauth"
if [[ -z "$PUBLIC_HOST" || "$PUBLIC_HOST" == --* ]]; then
  echo "Usage: $0 <public-host> [--no-auth] [--dry-run]   e.g. $0 my-laptop.tail1234.ts.net" >&2
  exit 1
fi
shift
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN="--dry-run" ;;
    --no-auth) AUTH="none" ;;
    *) echo "Unknown option: $arg" >&2; exit 1 ;;
  esac
done
if [[ "$PUBLIC_HOST" == http* || "$PUBLIC_HOST" == */* ]]; then
  echo "Give just the host name, without https:// or a path (e.g. my-laptop.tail1234.ts.net)." >&2
  exit 1
fi

STATE_DIR="${AM_SKILLS_STATE_DIR:-$HOME/.am-skills}"
if [[ "$AUTH" == "oauth" && -z "$DRY_RUN" && ! -f "$STATE_DIR/auth.json" ]]; then
  echo "Sign-in is on, but no passphrase is set yet. Run this first, then install again:" >&2
  echo "  npm run auth:set-passphrase" >&2
  exit 1
fi

NODE_BIN="$(command -v node || true)"
if [[ -z "$NODE_BIN" ]]; then
  echo "node not found on PATH. Install Node.js 18+ first (see docs/self-hosting.md)." >&2
  exit 1
fi

# caffeinate -s keeps the Mac from sleeping while the server runs and the laptop
# is on power, so the connector stays reachable. It can't stop sleep when the lid
# is closed without an external display — keep the lid open.
PLIST_CONTENT="<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">
<plist version=\"1.0\">
<dict>
  <key>Label</key>
  <string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/bin/caffeinate</string>
    <string>-s</string>
    <string>$NODE_BIN</string>
    <string>$REPO_DIR/mcp-server/main.mjs</string>
    <string>--http</string>
  </array>
  <key>WorkingDirectory</key>
  <string>$REPO_DIR</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>AM_SKILLS_PORT</key>
    <string>$PORT</string>
    <key>AM_SKILLS_PUBLIC_HOSTS</key>
    <string>$PUBLIC_HOST</string>
    <key>AM_SKILLS_AUTH</key>
    <string>$AUTH</string>
    <key>AM_SKILLS_STATE_DIR</key>
    <string>$STATE_DIR</string>
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>ThrottleInterval</key>
  <integer>10</integer>
  <key>StandardOutPath</key>
  <string>$LOG</string>
  <key>StandardErrorPath</key>
  <string>$LOG</string>
</dict>
</plist>"

if [[ "$DRY_RUN" == "--dry-run" ]]; then
  echo "$PLIST_CONTENT"
  exit 0
fi

mkdir -p "$(dirname "$PLIST")" "$(dirname "$LOG")"
launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null || true
printf '%s\n' "$PLIST_CONTENT" > "$PLIST"
plutil -lint "$PLIST" >/dev/null
launchctl bootstrap "$DOMAIN" "$PLIST"

echo "Installed $LABEL (node: $NODE_BIN, port: $PORT, public host: $PUBLIC_HOST, sign-in: $AUTH)."
echo "Waiting for it to start..."
for _ in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS "http://127.0.0.1:$PORT/health" >/dev/null 2>&1; then
    echo "Running: http://127.0.0.1:$PORT/health is OK. Logs: $LOG"
    exit 0
  fi
  sleep 1
done
echo "It didn't answer on port $PORT within 10 seconds. Check the log: tail -50 \"$LOG\"" >&2
exit 1
