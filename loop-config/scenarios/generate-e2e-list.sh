#!/usr/bin/env bash
set -euo pipefail
TASMIL="/Users/admin/Documents/MorcaLabs/tasmil/tasmil-org/tasmil-finance"
OUT="$TASMIL/loop-config/scenarios/e2e-replay.yaml"

PRIORITY=(chat.spec.ts journey-new-user.spec.ts journey-returning-user.spec.ts onboarding.spec.ts setup-flow.spec.ts)

{
  echo "# Auto-generated. Regenerate via generate-e2e-list.sh"
  for f in "${PRIORITY[@]}"; do
    p="$TASMIL/e2e/$f"
    if [[ -f "$p" ]]; then
      echo "- id: e2e-${f%.spec.ts}"
      echo "  type: e2e_replay"
      echo "  layer_hint: [frontend]"
      echo "  spec_path: e2e/$f"
      echo "  expect: {}"
    fi
  done
} > "$OUT"
echo "Wrote $OUT"
