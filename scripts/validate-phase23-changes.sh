#!/usr/bin/env bash
# Validate Phase 2/3 wiring + deposit intent fix from this session.
# Run from /Users/admin/Documents/MorcaLabs/tasmil/tasmil-org/tasmil-finance.
#
# Reports pass/fail for:
#   1. tasmil-finance: type-check
#   2. tasmil-finance: Phase 2/3 mock-track E2E (21 specs)
#   3. ai: deposit intent pytest (4 cases)
#
# Exits 0 if all three pass, 1 otherwise.

set -u

FRONTEND_DIR="/Users/admin/Documents/MorcaLabs/tasmil/tasmil-org/tasmil-finance"
AI_DIR="/Users/admin/Documents/MorcaLabs/tasmil/tasmil-org/ai"

red() { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
bold() { printf '\033[1m%s\033[0m\n' "$*"; }

fail=0

bold "==== 1/3  type-check (tasmil-finance) ===="
if (cd "$FRONTEND_DIR" && pnpm type-check); then
  green "PASS type-check"
else
  red "FAIL type-check"
  fail=1
fi

bold "==== 2/3  Phase 2/3 mock-track E2E (21 specs) ===="
if (cd "$FRONTEND_DIR" && pnpm test:e2e:chat:mock --reporter=list); then
  green "PASS mock-track E2E"
else
  red "FAIL mock-track E2E"
  fail=1
fi

bold "==== 3/3  deposit intent pytest (ai) ===="
if (cd "$AI_DIR" && poetry run pytest tests/test_deposit_intent.py -v); then
  green "PASS deposit intent pytest"
else
  red "FAIL deposit intent pytest"
  fail=1
fi

if [ "$fail" -eq 0 ]; then
  green "ALL GREEN"
  exit 0
fi
red "VALIDATION FAILED"
exit 1
