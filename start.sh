#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$SCRIPT_DIR"
PROJECT_ROOT="${SPECLINTER_PROJECT_ROOT:-$PWD}"
CHECK_ONLY=0

usage() {
  cat <<'EOF'
Usage: ./start.sh [--check]

Validates the SpecLinter runtime, project configuration, and MCP startup path.
Then starts the MCP server unless --check is provided.

Options:
  --check   Run validation and MCP healthcheck only, then exit
  --help    Show this message
EOF
}

log() {
  printf '[start] %s\n' "$*"
}

warn() {
  printf '[start] warning: %s\n' "$*" >&2
}

fail() {
  printf '[start] error: %s\n' "$*" >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --check)
      CHECK_ONLY=1
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      fail "Unknown argument: $1"
      ;;
  esac
done

require_command() {
  local command_name="$1"
  command -v "$command_name" >/dev/null 2>&1 || fail "Required command not found: $command_name"
}

require_file() {
  local file_path="$1"
  [[ -f "$file_path" ]] || fail "Required file not found: $file_path"
}

ensure_node_version() {
  local node_version
  node_version="$(node -p "process.versions.node")"

  if ! node --input-type=module <<'NODE' >/dev/null 2>&1
const major = Number.parseInt(process.versions.node.split('.')[0], 10);
if (Number.isNaN(major) || major < 18) {
  process.exit(1);
}
NODE
  then
    fail "Node.js 18+ is required. Found $node_version"
  fi

  log "Node.js $node_version detected"
}

ensure_build_artifacts() {
  if [[ -f "$APP_ROOT/dist/cli.js" && -f "$APP_ROOT/dist/server.js" && -f "$APP_ROOT/dist/types/config.js" && -f "$APP_ROOT/dist/utils/config-manager.js" ]]; then
    log "Build artifacts found"
    return
  fi

  require_command pnpm
  log "Build artifacts missing. Running pnpm build"
  (
    cd "$APP_ROOT"
    pnpm build
  ) || fail "pnpm build failed"

  require_file "$APP_ROOT/dist/cli.js"
  require_file "$APP_ROOT/dist/server.js"
  require_file "$APP_ROOT/dist/types/config.js"
  require_file "$APP_ROOT/dist/utils/config-manager.js"
}

validate_project_root() {
  [[ -d "$PROJECT_ROOT" ]] || fail "Project root does not exist: $PROJECT_ROOT"
  PROJECT_ROOT="$(cd "$PROJECT_ROOT" && pwd)"
  export PROJECT_ROOT
  export SPECLINTER_PROJECT_ROOT="$PROJECT_ROOT"
  log "Using project root: $PROJECT_ROOT"
}

validate_project_state() {
  local status
  local output_file
  output_file="$(mktemp)"

  set +e
  node "$APP_ROOT/scripts/start-runtime-check.mjs" validate-project "$APP_ROOT" "$PROJECT_ROOT" >"$output_file" 2>&1
  status=$?
  set -e

  case "$status" in
    0)
      while IFS= read -r line; do
        [[ "$line" == WARN:* ]] && warn "${line#WARN:}"
      done <"$output_file"
      log "Project configuration validated"
      ;;
    10)
      warn "SpecLinter is not initialized in $PROJECT_ROOT. The server can start, but tools that require project state will fail until speclinter_init_project is run."
      ;;
    11)
      cat "$output_file" >&2
      rm -f "$output_file"
      fail "Project configuration is invalid"
      ;;
    *)
      cat "$output_file" >&2
      rm -f "$output_file"
      fail "Unexpected validation failure"
      ;;
  esac
  rm -f "$output_file"
}

healthcheck_mcp_server() {
  log "Running MCP startup healthcheck"
  node "$APP_ROOT/scripts/start-runtime-check.mjs" healthcheck-mcp "$APP_ROOT" "$PROJECT_ROOT"
}

main() {
  require_command node
  validate_project_root
  require_file "$APP_ROOT/package.json"
  ensure_node_version
  ensure_build_artifacts
  validate_project_state
  healthcheck_mcp_server
  log "Validation complete"

  if [[ "$CHECK_ONLY" -eq 1 ]]; then
    exit 0
  fi

  log "Starting SpecLinter MCP server"
  cd "$APP_ROOT"
  exec node dist/cli.js serve
}

main "$@"
