#!/bin/sh
# macOS convenience entry. System Node, nvm, shell profiles and Muse settings
# remain untouched. Unsupported/missing Node uses a private verified Node22 copy.
set -eu
umask 077

error() { printf '%s\n' "$*" >&2; exit 1; }
usage() { printf '%s\n' 'Use: sh scripts/judge-mac.sh install' '  or sh scripts/judge-mac.sh start [--consent-typing] [--port N]'; }
action=${1-}
case "$action" in install|start) shift ;; -h|--help) usage; exit 0 ;; *) usage >&2; exit 2 ;; esac
if [ "$action" = install ]; then
  [ "$#" -eq 0 ] || { usage >&2; exit 2; }
else
  # Validate a copy, preserving the exact original flags for judge-start.mjs.
  validate_start() {
    consent_seen=0; port_seen=0
    while [ "$#" -gt 0 ]; do
      case "$1" in
        --consent-typing) [ "$consent_seen" -eq 0 ] || return 1; consent_seen=1; shift ;;
        --port)
          [ "$port_seen" -eq 0 ] && [ "$#" -ge 2 ] || return 1
          case "$2" in ''|*[!0-9]*) return 1 ;; esac
          awk -v p="$2" 'BEGIN {exit !(p+0 <= 65535)}' || return 1
          port_seen=1; shift 2 ;;
        *) return 1 ;;
      esac
    done
  }
  validate_start "$@" || { usage >&2; exit 2; }
fi
[ "$(uname -s)" = Darwin ] || error 'This helper is for macOS. Use the documented Linux/WSL setup on other systems.'
repo=$(CDPATH= cd -P "$(dirname "$0")/.." && pwd -P)
cd "$repo"

supported_node() {
  version=$("$1" --version 2>/dev/null) || return 1
  printf '%s\n' "$version" | awk '
    function uint(v) {return v ~ /^(0|[1-9][0-9]*)$/ && v+0 <= 9007199254740991}
    NR==1 {sub(/^v/, ""); n=split($0,p,/[.]/); supported=(n==3 && uint(p[1]) && uint(p[2]) && uint(p[3]) && ((p[1]==22 && p[2]>=12) || (p[1]==24 && p[2]>=1)))}
    NR>1 {supported=0}
    END {exit !supported}'
}
node_bin=
host_node=$(command -v node 2>/dev/null || :)
case "$host_node" in
  /*) if supported_node "$host_node" && [ -x "$(dirname "$host_node")/npm" ]; then node_bin=$(dirname "$host_node"); fi ;;
esac

if [ -z "$node_bin" ]; then
  case "$(uname -m)" in
    arm64) arch=arm64; expected=293dcc6c2408da21562d135b0412525e381bb6fe150d688edb58fe850d0f3e13 ;;
    x86_64) arch=x64; expected=52bc25dd026db7247c3c00439afdb83e95087248267f02d6c1a7250d1f896173 ;;
    *) error 'This Mac architecture has no verified bundled Node runtime.' ;;
  esac
  local_root=$repo/.local
  runtime=$local_root/judge-node-22.12.0-$arch
  bundle=node-v22.12.0-darwin-$arch
  private_dir() {
    [ ! -L "$1" ] && [ -d "$1" ] || return 1
    LC_ALL=C ls -ldn "$1" | awk -v uid="$(id -u)" 'NR==1 {exit !($3==uid && substr($1,1,10)=="drwx------")}'
  }
  inode() { ls -di "$1" | awk '{print $1}'; }
  cached_ready() {
    private_dir "$runtime" && [ ! -L "$runtime/bin" ] && [ -d "$runtime/bin" ] &&
      [ ! -L "$runtime/bin/node" ] && [ -f "$runtime/bin/node" ] && [ -x "$runtime/bin/node" ] &&
      [ -x "$runtime/bin/npm" ] && [ ! -L "$runtime/.verified-sha256" ] &&
      [ "$(cat "$runtime/.verified-sha256" 2>/dev/null)" = "$expected" ] &&
      [ "$("$runtime/bin/node" --version 2>/dev/null)" = v22.12.0 ]
  }
  if [ ! -e "$local_root" ] && [ ! -L "$local_root" ]; then mkdir "$local_root"; fi
  private_dir "$local_root" || error 'The checkout .local folder is not a safe private directory. Preserve it and report this error; do not broadly change permissions.'
  if [ -e "$runtime" ] || [ -L "$runtime" ]; then
    cached_ready || error 'The private Node cache is incomplete or unsafe. Preserve it and report this error; system Node has not been changed.'
  else
    temporary=; temporary_inode=; lock=$local_root/.judge-node-lock-$arch; lock_inode=; download_pid=
    cleanup() {
      if [ -n "$download_pid" ]; then kill -TERM "$download_pid" 2>/dev/null || :; wait "$download_pid" 2>/dev/null || :; fi
      if [ -n "$temporary" ] && private_dir "$temporary" && [ "$(inode "$temporary")" = "$temporary_inode" ]; then rm -rf -- "$temporary"; fi
      if [ -n "$lock_inode" ] && private_dir "$lock" && [ "$(inode "$lock")" = "$lock_inode" ]; then rmdir "$lock" 2>/dev/null || :; fi
    }
    trap cleanup 0
    trap 'exit 130' 1 2 15
    mkdir "$lock" 2>/dev/null || error 'Another private Node setup may be in progress. Preserve the folder and retry only after that setup finishes.'
    lock_inode=$(inode "$lock")
    # Recheck after acquiring the lock; another completed launch may have won.
    if [ -e "$runtime" ] || [ -L "$runtime" ]; then
      cached_ready || error 'The private Node cache changed during setup. Preserve it and report this error.'
    else
      temporary=$(mktemp -d "$local_root/.node-download.XXXXXX")
      temporary_inode=$(inode "$temporary")
      private_dir "$temporary" || error 'Could not create a private Node download folder.'
      archive=$temporary/node.tar.gz
      printf '%s\n' 'Preparing private Node22.12.0 for this checkout; system Node stays unchanged.'
      curl --disable --fail --silent --show-error --proto '=https' --tlsv1.2 --connect-timeout 15 --max-time 120 --max-filesize 100000000 --output "$archive" "https://nodejs.org/dist/v22.12.0/$bundle.tar.gz" &
      download_pid=$!
      if wait "$download_pid"; then download_pid=; else download_pid=; error 'Node download failed. No archive was executed; retry when the connection is available.'; fi
      actual=$(shasum -a 256 "$archive" | awk '{print $1}')
      [ "$actual" = "$expected" ] || error 'Node download checksum did not match. Nothing was extracted or executed.'
      TAR_OPTIONS= tar -tzf "$archive" > "$temporary/entries" || error 'Node archive could not be inspected.'
      awk -v p="$bundle" '($0!=p && index($0,p"/")!=1) || $0 ~ /(^|\/)\.\.(\/|$)/ {bad=1} END {exit bad}' "$temporary/entries" || error 'Node archive paths were not valid.'
      TAR_OPTIONS= tar -xzf "$archive" -C "$temporary"
      [ ! -L "$temporary/$bundle" ] && [ -d "$temporary/$bundle" ] || error 'Node archive did not contain the expected runtime.'
      chmod 700 "$temporary/$bundle"
      printf '%s\n' "$expected" > "$temporary/$bundle/.verified-sha256"
      [ ! -e "$runtime" ] && [ ! -L "$runtime" ] || error 'Private Node destination changed during setup; no existing runtime was replaced.'
      mv "$temporary/$bundle" "$runtime"
      cached_ready || error 'Downloaded Node could not run on this Mac. Preserve the private cache and report this error.'
    fi
    cleanup; temporary=; lock_inode=; trap - 0 1 2 15
  fi
  node_bin=$runtime/bin
fi

PATH=$node_bin:$PATH
export PATH
printf '%s\n' "Using $("$node_bin/node" --version) for this checkout; global Node is unchanged."
if [ "$action" = install ]; then
  exec "$node_bin/npm" run judge:install
fi
exec "$node_bin/node" --experimental-strip-types "$repo/scripts/judge-start.mjs" "$@"
