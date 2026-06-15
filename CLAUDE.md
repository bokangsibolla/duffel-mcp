# duffel-mcp

> A read-only MCP (Model Context Protocol) server that lets AI agents search flights and stays through the Duffel travel API. Pitched as a developer-first replacement for Amadeus Self-Service.

## Status

active-dev (open source) · published to npm as `duffel-mcp` v0.1.0 (MIT) · GitHub bokangsibolla/duffel-mcp · no web deploy (runs as a local stdio server) · last meaningful update 2026-06-05

## Stack

Node (>=20) + TypeScript, ES modules. `@modelcontextprotocol/sdk` (MCP server), `@duffel/api` (Duffel client), `zod` (input schemas). Tests with vitest, dev/scripts run via tsx, build via tsc.

## Structure

- `src/index.ts` — entry point: registers the MCP server over stdio and defines the three tools (`search_flights`, `get_offer`, `search_stays`). stdout is reserved for the MCP protocol, logs go to stderr.
- `src/duffel.ts` — Duffel API calls and the `tokenMode` helper (reads `DUFFEL_ACCESS_TOKEN`, reports test/live/unset).
- `src/shape.ts` — pure functions that shape Duffel request/response payloads into compact agent-friendly JSON.
- `test/shape.test.ts` — offline unit tests for the request/response shaping.
- `scripts/mcp-smoke.ts` — MCP protocol check, no token needed.
- `scripts/live-smoke.ts` — real Duffel API check, needs a token.
- `dist/` — compiled output (gitignored); `bin` `duffel-mcp` points at `dist/index.js`.
- `MIGRATION.md` — Amadeus Self-Service shutdown (July 17, 2026) migration guide and how booking works in Duffel.

## Commands

```bash
# dev (run the server from source)
npm run dev

# test (offline unit tests)
npm test

# build
npm run build

# smoke checks
npm run mcp-smoke                                          # protocol check, no token
DUFFEL_ACCESS_TOKEN=duffel_test_xxx npm run live-smoke     # real API check

# "deploy": this is an npm package, not a web app. Publish a release with:
npm publish                                                # runs build via prepublishOnly
```

## Conventions

- Read-only by design. v0.1 searches and inspects offers but does NOT book. A booking tool (`create_order`) is roadmap-only and must sit behind an explicit, human-confirmed opt-in, test mode by default.
- stdout is for the MCP protocol only. All logging goes to stderr.
- Tool inputs are validated with zod. Responses are shaped (in `src/shape.ts`) into compact JSON, not raw Duffel payloads.
- Open source repo: README and MIGRATION.md are public-facing, so they follow Bokang's voice rules (no em-dashes, no AI tells, acronyms defined on first use).

## Gotchas

- Needs a Duffel access token in `DUFFEL_ACCESS_TOKEN`. Use a `duffel_test_` token unless there is a reason not to; test searches and bookings are free and avoid spending real money. The server prints its token mode (test/live/unset) on startup.
- The token is read from the environment and never written to disk. `.env` is gitignored.
- MCP clients point at the built file `dist/index.js`, so run `npm run build` before wiring up a client.
- Not affiliated with Duffel or Amadeus.

## Related

- Memory: [[project_github_oss_strategy]]
- npm: https://www.npmjs.com/package/duffel-mcp
- GitHub: https://github.com/bokangsibolla/duffel-mcp
