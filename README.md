# OmniMarketX — Market Discovery & Creation System

A production-oriented internal tool for the OmniMarketX workflow:

**Discover → Analyze → Structure → Validate → Review → Create**

The assignment brief explicitly requires that automated discovery must not publish a market; an authorized human must review and approve a candidate first. This implementation enforces that boundary in the API: `/api/markets/from-candidate/:id` only accepts candidates whose status is `approved`.

## What is implemented

- Public-source discovery adapter with timeout/failure fallback.
- Structured market candidate generation.
- Validation engine for ambiguous questions, missing dates, weak resolution criteria, missing resolution source, insufficient outcomes, missing support, and possible duplicates.
- Review queue with status filters.
- Candidate editing followed by automatic re-validation.
- Approve/reject workflow.
- Mock market-creation service boundary after human approval.
- Supporting source inspection.
- Quality/confidence score with documented limitations.
- MongoDB persistence.
- Backend tests for validation and approval boundary.
- Responsive internal-tool UI designed for a reviewer rather than a public consumer.

These map directly to the brief's required flow and acceptance criteria: discover/ingest information, generate a useful candidate, inspect sources, surface validation issues, edit, approve/reject, and transform an approved candidate into a market.

## Architecture

```text
                 ┌─────────────────────────────┐
                 │ Public Sources              │
                 │ RSS / Official APIs / Data  │
                 └──────────────┬──────────────┘
                                │
                         Discovery Adapter
                                │
                                ▼
┌───────────────┐      ┌───────────────────┐      ┌──────────────────┐
│ React Review  │◄────►│ Express REST API  │◄────►│ MongoDB           │
│ Queue / UX    │      │                   │      │ Candidates/Sources│
└──────┬────────┘      └─────────┬─────────┘      └──────────────────┘
       │                          │
       │                   Validation Service
       │                          │
       │                    Human Review
       │                          │
       └──────────────────────────┤
                                  ▼
                         Market Creation Service
                              (Mock API)
```

The repository intentionally separates discovery, validation, candidate/review operations, and market creation. The assignment asks for reasonable production engineering across architecture, data modelling, API design, validation/error handling, testing, security, logging, deployment, maintainability and failure handling.

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- RSS parsing: fast-xml-parser
- Tests: Node built-in test runner
- Deployment target: Vercel (frontend) + Render/Railway/Fly.io (API) + MongoDB Atlas

## Local setup

### 1. Start MongoDB

Option A — Docker:

```bash
docker compose up -d
```

Option B — use MongoDB Atlas and set `MONGODB_URI` to your connection string.

### 2. Start API

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

API: `http://localhost:5000`

### 3. Start frontend

```bash
cd frontend
npm install
npm run dev
```

UI: `http://localhost:5173`

If the API is deployed, set the Vercel environment variable:

```text
VITE_API_URL=https://YOUR-API-DOMAIN/api
```

## Demo flow

1. Open the frontend.
2. Click **Run Discovery**.
3. Select a generated candidate.
4. Inspect supporting sources and validation warnings.
5. Edit the candidate and click **Save & Revalidate**.
6. Approve it only after blocking validation errors are resolved.
7. Click **Create Market**.
8. The API creates a mock market ID such as `OMX-A1B2C3D4`.

The live application requirement in the brief asks reviewers to be able to trigger discovery, inspect a candidate, edit it, approve/reject it, and see the resulting structured market.

## Data model

### Source

```text
Source
- _id
- title
- url
- publisher
- publishedAt
- snippet
- sourceType
- createdAt / updatedAt
```

### Candidate

```text
Candidate
- _id
- fingerprint              // duplicate prevention
- question
- category
- description
- outcomes[]
- eventDate
- closingDate
- resolutionCriteria
- resolutionSource
- sourceLinks[]            // references Source
- status                   // needs_review | approved | rejected | created
- confidence               // 0–100
- validationIssues[]
- reviewerNote
- createdMarket             // populated after mock creation
- createdAt / updatedAt
```

The candidate fields deliberately cover the brief's requested question, category, description, outcomes, event/closing time, resolution criteria/source, supporting links, status, and optional quality indicator.

## Validation design

The validator is intentionally deterministic for the demo. It checks:

- minimum question quality
- question phrasing
- vague language
- missing event date
- missing closing date
- closing date after event date
- weak resolution criteria
- missing resolution source
- fewer than two outcomes
- missing supporting source
- possible duplicate question

Errors block approval. Warnings do not block approval but remain visible to the reviewer.

The score is a heuristic, not a probability: `100 - 25 × errors - 8 × warnings`, clamped to 0–100. This is intentionally simple and explainable; in a production system I would calibrate the score against reviewed historical markets rather than presenting it as an objective truth. The assignment explicitly allows scoring/classification but asks for its mechanism and limitations to be explained.

## Discovery and failure handling

The discovery adapter attempts a public NASA RSS feed with an 8-second timeout. If that source fails, the workflow falls back to deterministic demo events so a reviewer can still exercise the complete product flow.

This is important for the assignment's reliability criterion: the system should explain what happens when sources fail or information is incomplete.

For a production deployment, I would add:

- per-source adapters and health metrics
- retries with exponential backoff
- persisted ingestion runs
- source freshness tracking
- content hashing
- stronger semantic duplicate detection
- source conflict detection
- a queue/worker for scheduled discovery

## API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/discovery/run` | Trigger discovery |
| GET | `/api/candidates` | List candidates; optional `?status=` |
| GET | `/api/candidates/stats` | Queue statistics |
| GET | `/api/candidates/:id` | Candidate detail |
| PATCH | `/api/candidates/:id` | Edit + revalidate |
| POST | `/api/candidates/:id/review` | Approve/reject |
| POST | `/api/markets/from-candidate/:id` | Create mock market from approved candidate |

## Tests

```bash
cd backend
npm install
npm test
```

The tests cover validation failures, valid-candidate validation, and the approval boundary. The assignment asks for meaningful paths, edge cases, and failure conditions rather than only happy-path tests.

## Security considerations

- No credentials are committed.
- `.env` is ignored.
- CORS can be restricted to the deployed frontend origin.
- Market creation is authorization-by-state in this demo: only `approved` candidates can reach the creation boundary.
- The production version should add authentication/authorization, audit logs, rate limiting, request validation, CSRF protection where relevant, secret management, and role-based approval permissions.

## Deployment

### Backend

Deploy `backend/` to Render/Railway/Fly.io.

Environment:

```text
PORT=5000
MONGODB_URI=<MongoDB Atlas URI>
CLIENT_URL=https://<your-vercel-app>
```

Start command:

```text
npm start
```

### Frontend

Deploy `frontend/` to Vercel.

Build command:

```text
npm run build
```

Environment:

```text
VITE_API_URL=https://<your-backend>/api
```

## Walkthrough video outline

The assignment recommends an 8–10 minute walkthrough, with a maximum of 12 minutes, including introduction, product demo, repository, data model, decisions, hardest problem/failure case, and OmniMarketX feedback.

Suggested recording:

1. **0:00–0:30** — Introduce yourself and the system.
2. **0:30–2:30** — Run discovery and walk through a candidate.
3. **2:30–4:00** — Show validation, edit, approve/reject, and creation.
4. **4:00–5:00** — Explain repo and stack.
5. **5:00–6:00** — Explain Source/Candidate data model and status transitions.
6. **6:00–7:30** — Explain architecture and trade-offs.
7. **7:30–9:00** — Demonstrate source failure fallback and explain duplicate/validation handling.
8. **9:00–10:00** — Share 2–3 specific product improvements for OmniMarketX.

## Product decisions

### Prioritized
- Complete end-to-end workflow over feature count.
- Human approval boundary.
- Explainable validation.
- Source traceability.
- Failure fallback for a live demo.
- Reviewer-oriented UX.

### Intentionally left out
- Real OmniMarketX production integration.
- Automated publishing.
- Full authentication/role management.
- Complex LLM orchestration.
- High-scale asynchronous infrastructure.

The brief explicitly says a mock/demo market API is acceptable and production OmniMarketX connectivity is not required.

## Known limitations

This is an assignment-grade demo, not a production trading/market-creation system. The public source adapter is intentionally narrow, the demo fallback is deterministic, duplicate detection is conservative, and the market creation API is mocked. These limitations are documented rather than hidden, matching the assignment's instruction to explain important trade-offs or incomplete areas.

## Submission checklist

- [ ] Push this repository to GitHub.
- [ ] Deploy frontend publicly.
- [ ] Deploy backend publicly.
- [ ] Configure MongoDB Atlas.
- [ ] Record 8–10 minute walkthrough.
- [ ] Make sure links work without requesting permissions.
- [ ] Submit GitHub URL, live URL, video URL, README, architecture/schema/test instructions and known limitations through the provided form.

The brief's final checklist specifically asks for GitHub, live app, walkthrough video, README, architecture, database/schema explanation, test instructions, known limitations and demo credentials if authentication is used.
# Omnimarket-X
