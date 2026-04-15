# Phase 10 Regression Hardening

## Coverage Added

- `GET /api/reports/operations`
  - Confirms the route still returns the report snapshot contract.
  - Verifies cache-control remains `no-store, no-cache, must-revalidate`.
  - Checks the operations metrics shape for total records, ready-to-pickup latency, and mail conversion.
- `POST /api/intake`
  - Confirms idempotent replay of a completed intake event returns the original record response.
  - Verifies the replay path does not create a duplicate record or duplicate completion event.
- `PUT /api/records/[id]`
  - Confirms the public API still applies queue state transitions for `ready`, `pickup_complete`, `moved_to_mail`, and `mailed`.
  - Verifies the returned queue enrichment communication state stays aligned with the requested workflow state.

## Known Residual Gaps

- These tests cover route contracts, not the full persistence stack.
- Database-level uniqueness, transaction isolation, and retry behavior are still covered only indirectly.
- Cross-request concurrency edge cases for intake idempotency are not fully simulated here.
- The operations report assertions use a focused snapshot rather than validating every derived KPI field.
