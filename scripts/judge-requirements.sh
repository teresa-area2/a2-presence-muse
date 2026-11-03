#!/bin/sh
# No npm, downloads or writes: identify a supported existing Node, then preflight.
set -eu
if [ "$#" -ne 0 ]; then printf '%s\n' 'Use: sh scripts/judge-requirements.sh (no flags).' >&2; exit 2; fi
node=$(command -v node 2>/dev/null || :)
supported=0
case "$node" in
  /*)
    version=$(env -i PATH="$PATH" HOME="${HOME-}" "$node" --version 2>/dev/null || :)
    if printf '%s\n' "$version" | awk '
      function uint(v) {return v ~ /^(0|[1-9][0-9]*)$/ && v+0 <= 9007199254740991}
      NR==1 {sub(/^v/, ""); n=split($0,p,/[.]/); ok=(n==3 && uint(p[1]) && uint(p[2]) && uint(p[3]) && ((p[1]==22 && p[2]>=12) || (p[1]==24 && p[2]>=1)))}
      NR>1 {ok=0}
      END {exit !ok}'; then supported=1; fi ;;
esac
if [ "$supported" -ne 1 ]; then
  printf '%s\n' 'FAIL Node: a compatible existing Node was not found.' '     Fix: install/select Node 22.12+ (22.x) or 24.1+ (24.x), then repeat this check. Your existing Node has not been changed.' >&2
  exit 1
fi
repo=$(CDPATH= cd -P "$(dirname "$0")/.." && pwd -P)
set -- env -i "PATH=$PATH" 'LANG=C' 'LC_ALL=C'
if [ "${HOME+x}" = x ]; then set -- "$@" "HOME=$HOME"; fi
if [ "${XDG_CONFIG_HOME+x}" = x ]; then set -- "$@" "XDG_CONFIG_HOME=$XDG_CONFIG_HOME"; fi
exec "$@" "$node" "$repo/src/judge-requirements.mjs"
