# Loop scenarios

Each scenario exercises one AI chat behavior. Validators code-first in `loop/validators/`. Spec: `docs/superpowers/specs/2026-06-19-overnight-loop-spec-A-sweeper.md`.

## Adding a scenario

1. Pick a category (tool_routing, slot_filling, hallucination, streaming, auth_state, error_recovery, ui_render, multi_turn)
2. Write the user's prompt
3. Define `expect`
4. Run one Sweeper manually to confirm scenario produces PASS on healthy stack
