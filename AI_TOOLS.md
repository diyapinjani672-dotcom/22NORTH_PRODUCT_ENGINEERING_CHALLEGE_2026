# AI Tools Used

- **Claude (Anthropic)** — used to design and generate the full-stack MVP:
  backend (FastAPI/SQLAlchemy), frontend (React/Vite/Tailwind), business
  logic (recovery scoring, refund eligibility), documentation, and demo data.
  Code was run and smoke-tested (seed script, live API calls against every
  endpoint, a production frontend build) during generation, not only
  written.
- **OpenAI API (optional, runtime)** — the in-app AI assistant can use a
  real OpenAI model (`gpt-4o-mini`) for chat completions if `OPENAI_API_KEY`
  is supplied at runtime. It is not required: the assistant ships with a
  deterministic rule-based fallback so the app works fully offline.
