# Backend tests

Two layers, both run by `go test ./...`:

```
backend/src/
├── <package>/xxx_test.go         ← unit tests (Go convention: next to code)
└── tests/
    ├── helpers/                   ← shared setup (router factories, test DB)
    └── feature/                   ← cross-package HTTP-level tests
        └── *_test.go
```

## Unit tests — next to the code

Standard Go pattern. Examples already in the repo:

| File | What it covers |
|---|---|
| `security/auth_test.go` | JWT generation + validation |
| `security/password_test.go` | bcrypt hashing |
| `apiwebserver/middleware/middleware_test.go` | RBAC + Protected |
| `apiwebserver/service/review_token_test.go` | signed review tokens |
| `apiwebserver/controller/property_controller_test.go` | CSV / price-range parsers |

When you add a new service or controller, drop `xxx_test.go` next to `xxx.go`. Same package — test gets access to unexported identifiers.

## Feature tests — `tests/feature/`

For things that span packages or exercise the HTTP layer end-to-end. Use `helpers.NewPublicEngine()` for no-DB endpoints; for DB-backed flows, see "Integration tests" below.

| File | What it covers |
|---|---|
| `feature/health_test.go` | /healthz shape stays `{"status":"ok"}` |

## Integration tests (DB-backed)

`helpers.TestDB(t)` opens the URL in `TEST_DATABASE_URL`, runs every migration, and truncates all tables before each test so it starts from a known-empty state. When the env var is unset, the test is **skipped** (not failed) — so `make test` stays fast for everyone without a test postgres.

Run them:

```bash
# 1. spin up a dedicated test database (NEVER reuse dev / prod)
createdb wealthy_prime_test

# 2. point the tests at it
TEST_DATABASE_URL='postgres://postgres:postgres@localhost:5433/wealthy_prime_test?sslmode=disable' \
  make test-integration
```

The build tag `//go:build integration` at the top of a test file gates it so only `-tags integration` picks it up.

| File | What it covers |
|---|---|
| `feature/agent_dashboard_test.go` | the six dashboard counters the agent pie chart depends on, scoping across agents |

### Adding a new integration test

1. Drop a `*_test.go` file under `tests/feature/` (or wherever it belongs).
2. First line: `//go:build integration`.
3. Use `helpers.TestDB(t)` for the DB and `helpers.SeedAgent(t, db, email)` for a quick agent fixture.
4. Construct the service against the test DB via `NewXxxServiceWithDB(db)` — don't mutate the package-global `database.DB`.

## Running

```bash
make test          # all packages — fast (no DB)
make test-v        # same but verbose
make cover         # generate + open HTML coverage report
```

`lefthook` runs `make test` on every `git push`, so a failing test blocks the push.
