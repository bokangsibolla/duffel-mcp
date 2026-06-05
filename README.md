# duffel-mcp

An MCP server that lets AI agents search flights and stays through the [Duffel](https://duffel.com) API. A developer-first, no-contract alternative to Amadeus Self-Service, which [shuts down on July 17, 2026](./MIGRATION.md).

> **MCP** (Model Context Protocol) is the open standard that lets an AI assistant call external tools and data through a small local server.

<!-- demo: drop an ~8s GIF here of an agent searching a flight -->

## What it does

Gives an agent three read-only tools over Duffel:

| Tool | Answers |
| --- | --- |
| `search_flights` | "Find flights from LHR to JFK on 2026-09-15, direct only." |
| `get_offer` | "Show the full price, conditions, and baggage for this offer." |
| `search_stays` | "Find hotels near these coordinates for these dates." |

It is **read-only by design**. v0.1 searches and inspects but does not book: letting an AI agent create real flight orders (which spend money) is out of scope until there is an explicit, human-confirmed step. How booking works in Duffel is covered in [MIGRATION.md](./MIGRATION.md).

## Quickstart

Requires Node 20 or newer and a Duffel access token (a free test token is fine).

```bash
git clone https://github.com/bokangsibolla/duffel-mcp.git
cd duffel-mcp
npm install
npm run build
```

Get a test token: sign up at duffel.com, toggle the dashboard to Test mode, and create an access token (it starts with `duffel_test_`). Then point your MCP client at the server with the token in its environment:

```json
{
  "mcpServers": {
    "duffel": {
      "command": "node",
      "args": ["/absolute/path/to/duffel-mcp/dist/index.js"],
      "env": { "DUFFEL_ACCESS_TOKEN": "duffel_test_xxx" }
    }
  }
}
```

Ask your agent: "Search direct flights from London to New York on 15 September 2026 and show me the three cheapest."

## Safety

- **Read-only.** No booking tool is exposed in v0.1.
- The token is read from `DUFFEL_ACCESS_TOKEN` and never leaves your machine. Use a `duffel_test_` token unless you have a reason not to. Test searches and bookings are free.
- The server reports its token mode (`test`, `live`, or `unset`) on startup so you always know which world you are in.

## Development

```bash
npm test                       # unit tests for the request/response shaping (offline)
npm run build && npm run mcp-smoke   # MCP protocol check (no token needed)
DUFFEL_ACCESS_TOKEN=duffel_test_xxx npm run live-smoke   # real API check
```

## Roadmap

- Booking (`create_order`) behind an explicit opt-in flag, test mode only by default
- Offer pricing refresh and seat/baggage services
- Multi-city slices and flexible date windows
- Airport and city code lookup

## License

MIT © Bokang Sibolla

Built on the [Duffel API](https://duffel.com/docs). Not affiliated with Duffel or Amadeus.
