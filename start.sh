#!/usr/bin/env bash
# Installs, validates, builds, and launches Jeff with a friendly animated terminal experience.
set -Eeuo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="${TMPDIR:-/tmp}/jeff-the-chef-start.$$.log"
SKIP_INSTALL=0
SKIP_CHECKS=0
NO_DOCKER=0

cleanup() {
  rm -f "$LOG_FILE"
  printf '\033[?25h'
}
trap cleanup EXIT

usage() {
  cat <<'EOF'
Usage: ./start.sh [options]

  --no-docker     Build locally without starting Docker services
  --skip-checks   Skip formatting, type checks, and tests
  --skip-install  Skip bun install
  -h, --help      Show this help
EOF
}

while (($#)); do
  case "$1" in
    --no-docker) NO_DOCKER=1 ;;
    --skip-checks) SKIP_CHECKS=1 ;;
    --skip-install) SKIP_INSTALL=1 ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      printf "${RED}Unknown option:${RESET} %s\n" "$1" >&2
      usage
      exit 1
      ;;
  esac
  shift
done

banner() {
  printf "${PURPLE}${BOLD}"
  cat <<'EOF'
        .--.      JEFF THE CHEF
       /    \     Kitchen companion lab
      |  ()  |    Bun • TypeScript • Docker
       \ -- /     Mise en place, but for code.
    .---'  '---.
EOF
  printf "${RESET}\n"
}

info() {
  printf "${CYAN}◆${RESET} %s\n" "$1"
}

success() {
  printf "${GREEN}✔${RESET} %s\n" "$1"
}

fail() {
  printf "\n${RED}✖ %s${RESET}\n" "$1" >&2
  if [[ -s "$LOG_FILE" ]]; then
    printf "${DIM}Last command output:${RESET}\n" >&2
    tail -n 30 "$LOG_FILE" >&2
  fi
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "$1 is required but was not found."
}

run_step() {
  local message="$1"
  shift
  : >"$LOG_FILE"
  "$@" >"$LOG_FILE" 2>&1 &
  local pid=$!
  local frames=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')
  local frame=0

  if [[ -t 1 ]]; then
    printf '\033[?25l'
    while kill -0 "$pid" 2>/dev/null; do
      printf "\r${CYAN}%s${RESET} %s" "${frames[$frame]}" "$message"
      frame=$(((frame + 1) % ${#frames[@]}))
      sleep 0.08
    done
  fi

  if wait "$pid"; then
    [[ -t 1 ]] && printf "\r\033[2K"
    success "$message"
  else
    [[ -t 1 ]] && printf "\r\033[2K"
    fail "$message"
  fi
}

wait_for_service() {
  local service="$1"
  local attempts=30
  for ((attempt = 1; attempt <= attempts; attempt++)); do
    if docker compose ps --format json "$service" 2>/dev/null | grep -q '"Health":"healthy"'; then
      printf '\r\033[2K'
      success "$service is healthy"
      return 0
    fi
    printf "\r${YELLOW}◌${RESET} Waiting for %-20s %2d/%d" "$service" "$attempt" "$attempts"
    sleep 1
  done
  printf '\n'
  docker compose ps >&2
  fail "$service did not become healthy."
}

cd "$ROOT_DIR"
banner
require_command bun

printf "${DIM}Bun %s • %s${RESET}\n\n" "$(bun --version)" "$ROOT_DIR"

if ((SKIP_INSTALL == 0)); then
  run_step "Preparing Bun workspace" bun install --frozen-lockfile
else
  info "Skipping dependency installation"
fi

if ((SKIP_CHECKS == 0)); then
  run_step "Checking format, types, and tests" bun run check
else
  info "Skipping project checks"
fi

run_step "Building extension and backend" bun run build

if ((NO_DOCKER == 1)); then
  success "Local build is ready in extension/dist and backend/dist"
  exit 0
fi

require_command docker
docker info >/dev/null 2>&1 || fail "Docker is installed, but its daemon is not running."
run_step "Building and starting Docker services" docker compose up --build --detach
wait_for_service backend
wait_for_service extension-preview

printf "\n${GREEN}${BOLD}Jeff is ready.${RESET}\n"
printf "  ${CYAN}Extension preview${RESET}  http://localhost:4173/side-panel.html\n"
printf "  ${CYAN}Backend health${RESET}     http://localhost:8787/health\n"
printf "  ${DIM}Load extension/dist as an unpacked extension for Chrome API features.${RESET}\n"
printf "  ${DIM}Stop with: stop_lab  (docker-compose down)${RESET}\n"
