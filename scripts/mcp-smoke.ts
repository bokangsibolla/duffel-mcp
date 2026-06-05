/**
 * MCP protocol smoke test. Starts the built server over stdio, handshakes, and
 * lists tools. Works WITHOUT a Duffel token (the client is created lazily), so
 * it verifies the server wiring independently of API access.
 *
 * Build first (npm run build), then:  npm run mcp-smoke
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["dist/index.js"],
});

const client = new Client({ name: "mcp-smoke", version: "0.0.0" });
await client.connect(transport);

const tools = await client.listTools();
console.log("tools:", tools.tools.map((t) => t.name).join(", "));

// Calling a tool with no token should fail cleanly (not crash the server).
const res = await client.callTool({
  name: "search_flights",
  arguments: { origin: "LHR", destination: "JFK", departure_date: "2026-07-21" },
});
const text =
  Array.isArray(res.content) && res.content[0]?.type === "text" ? res.content[0].text : "";
console.log("search_flights (no token) ->", text.slice(0, 200));

await client.close();
console.log("\nMCP SMOKE OK");
