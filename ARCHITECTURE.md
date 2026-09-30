# Architecture Decision Record

## Goal
Provide a coherent internal workflow from public information to a reviewable market candidate while keeping market publication behind a human approval boundary.

## Why this architecture

**React + Express + MongoDB** was selected because the workflow is CRUD/review heavy, the user interface benefits from fast local state updates, Express keeps the API boundary simple, and MongoDB maps naturally to flexible source/candidate documents during an assignment prototype.

## Boundaries

1. **Discovery** — adapters fetch public information and normalize it.
2. **Candidate generation** — normalized events become candidate documents.
3. **Validation** — deterministic checks return errors/warnings and a heuristic quality score.
4. **Review** — human edits and decides approve/reject.
5. **Creation** — approved candidate crosses a separate mock service boundary.

## Status state machine

```text
discovered → needs_review → approved → created
                    └────→ rejected
```

An `approved` candidate can only move to `created` through the market service. A `rejected` candidate cannot be created without a future explicit re-open workflow.

## Production evolution

- Add authentication and role-based authorization.
- Store discovery runs and source health.
- Move discovery to a queue/worker.
- Add event-level source conflict detection.
- Replace lexical duplicate detection with embeddings + deterministic safeguards.
- Add audit log entries for every edit/review/creation.
- Add idempotency keys to market creation.
- Add observability: structured logs, metrics, traces and alerts.
