#!/bin/bash
# Coda script locator — source this file to export paths to bundled scripts.
#
# Usage:
#   . /path/to/coda/scripts/coda-env.sh
#
# This file is sourced by workflow snippets. Do not set global shell options here.

_coda_env_source="${BASH_SOURCE[0]:-$0}"
_coda_script_dir="$(cd "$(dirname "$_coda_env_source")" && pwd -P)"
_coda_env_sourced=0
(return 0 2>/dev/null) && _coda_env_sourced=1

export CODA_GUARD="${CODA_GUARD:-${_coda_script_dir}/coda-guard.sh}"
export CODA_STATE="${CODA_STATE:-${_coda_script_dir}/coda-state.sh}"
export CODA_HANDOFF="${CODA_HANDOFF:-${_coda_script_dir}/coda-handoff.sh}"
export CODA_ARCHIVE="${CODA_ARCHIVE:-${_coda_script_dir}/coda-archive.sh}"
export CODA_YAML_VALIDATE="${CODA_YAML_VALIDATE:-${_coda_script_dir}/coda-yaml-validate.sh}"

_CODA_BASH_is_usable() {
  local _CODA_BASH_candidate="$1"
  if [ -z "$_CODA_BASH_candidate" ]; then
    return 1
  fi
  case "$_CODA_BASH_candidate" in
    */Windows/System32/bash.exe|*/windows/system32/bash.exe|*\\Windows\\System32\\bash.exe|*\\windows\\system32\\bash.exe)
      return 1
      ;;
  esac
  "$_CODA_BASH_candidate" -lc 'printf coda-bash-ok' >/dev/null 2>&1
}

_coda_resolve_bash() {
  local _CODA_BASH_candidate

  if _CODA_BASH_is_usable "${CODA_BASH:-}"; then
    printf '%s\n' "$CODA_BASH"
    return 0
  fi

  if _CODA_BASH_is_usable "${BASH:-}"; then
    printf '%s\n' "$BASH"
    return 0
  fi

  _CODA_BASH_candidate="$(command -v sh 2>/dev/null | awk '{ sub(/\/sh(\.exe)?$/, "/bash.exe"); print }')"
  if _CODA_BASH_is_usable "$_CODA_BASH_candidate"; then
    printf '%s\n' "$_CODA_BASH_candidate"
    return 0
  fi

  _CODA_BASH_candidate="$(command -v bash 2>/dev/null || true)"
  if _CODA_BASH_is_usable "$_CODA_BASH_candidate"; then
    printf '%s\n' "$_CODA_BASH_candidate"
    return 0
  fi

  return 1
}

CODA_BASH="$(_coda_resolve_bash || true)"
export CODA_BASH

_coda_env_fail() {
  echo "ERROR: Coda scripts not found. Ensure the Coda skill is installed completely." >&2
  echo "Expected path pattern: */coda/scripts/coda-*.sh under project or platform skill directories" >&2
}

_CODA_BASH_fail() {
  echo "ERROR: usable bash not found. Install Git Bash or set CODA_BASH to a working bash executable." >&2
  echo "Windows WSL launcher bash.exe is not supported for Coda scripts." >&2
}

_coda_env_abort() {
  local _coda_env_was_sourced="$_coda_env_sourced"
  unset _coda_env_source _coda_script_dir _coda_script _coda_env_missing _coda_env_sourced
  unset _CODA_BASH_candidate
  unset -f _coda_env_fail _CODA_BASH_fail _CODA_BASH_is_usable _coda_resolve_bash
  if [ "$_coda_env_was_sourced" -eq 1 ]; then
    unset -f _coda_env_abort
    return 1
  fi
  exit 1
}

_coda_env_missing=0
if [ -z "$CODA_BASH" ]; then
  _CODA_BASH_fail
  _coda_env_missing=1
fi
for _coda_script in \
  "$CODA_GUARD" \
  "$CODA_STATE" \
  "$CODA_HANDOFF" \
  "$CODA_ARCHIVE" \
  "$CODA_YAML_VALIDATE"; do
  if [ ! -f "$_coda_script" ]; then
    _coda_env_fail
    _coda_env_missing=1
    break
  fi
done

if [ "$_coda_env_missing" -ne 0 ]; then
  _coda_env_abort
else
  unset _coda_env_source _coda_script_dir _coda_script _coda_env_missing _coda_env_sourced
  unset _CODA_BASH_candidate
  unset -f _coda_env_fail _CODA_BASH_fail _CODA_BASH_is_usable _coda_resolve_bash _coda_env_abort
fi
