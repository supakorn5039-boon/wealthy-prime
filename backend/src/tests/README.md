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

Not yet scaffolded. The recommended pattern when you add them:

1. Add a `helpers/testdb.go` that opens `TEST_DATABASE_URL` and skips if unset.
2. Gate the test file with a build tag: `//go:build integration`.
3. Run with `go test -tags integration ./...` (also wired in `make test-integration` once added).

This keeps the default `go test ./...` fast and DB-free, while letting CI run the full suite when a test postgres is available.

## Running

```bash
make test          # all packages — fast (no DB)
make test-v        # same but verbose
make cover         # generate + open HTML coverage report
```

`lefthook` runs `make test` on every `git push`, so a failing test blocks the push.
