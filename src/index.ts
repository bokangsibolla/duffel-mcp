#!/usr/bin/env node
/**
 * duffel-mcp: an MCP server for searching flights and stays via the Duffel API.
 *
 * v0.1 is read-only on purpose: it searches and inspects offers but does NOT
 * book. Letting an AI agent create real flight orders (which spend money) is
 * out of scope until there is an explicit, well-guarded opt-in. See MIGRATION.md
 * for how booking works in Duffel.
 *
 * stdout is reserved for the MCP protocol; logs go to stderr.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { searchFlights, getOffer, searchStays, tokenMode } from "./duffel.js";

const server = new McpServer({ name: "duffel-mcp", version: "0.1.0" });

function json(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function fail(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

const cabin = z.enum(["first", "business", "premium_economy", "economy"]);

server.tool(
  "search_flights",
  "Search flight offers via Duffel. Give origin and destination as IATA codes (airport like 'LHR' or city/metro like 'NYC'), a departure_date (YYYY-MM-DD), and optionally a return_date for a round trip. Returns a ranked list of offers with price, airline, and segments.",
  {
    origin: z.string().describe("Origin IATA code, e.g. 'LHR' or 'NYC'"),
    destination: z.string().describe("Destination IATA code, e.g. 'JFK'"),
    departure_date: z.string().describe("Outbound date, YYYY-MM-DD"),
    return_date: z.string().optional().describe("Return date for a round trip, YYYY-MM-DD"),
    adults: z.number().optional().describe("Number of adults aged 18+ (default 1)"),
    child_ages: z
      .array(z.number())
      .optional()
      .describe("Ages of any passengers under 18, e.g. [4, 9]. Duffel prices under-18s by age."),
    cabin_class: cabin.optional().describe("Cabin class (default economy)"),
    max_connections: z.number().optional().describe("Max connections, e.g. 0 for direct only"),
    limit: z.number().optional().describe("Max offers to return (default 10)"),
  },
  async (args) => {
    try {
      return json(await searchFlights(args));
    } catch (e) {
      return fail(`search_flights failed: ${(e as Error).message}`);
    }
  }
);

server.tool(
  "get_offer",
  "Get the full, freshest detail for a single flight offer by id (from search_flights), including current price, conditions, and available services.",
  {
    offer_id: z.string().describe("Duffel offer id, e.g. 'off_...'"),
  },
  async ({ offer_id }) => {
    try {
      return json(await getOffer(offer_id));
    } catch (e) {
      return fail(`get_offer failed: ${(e as Error).message}`);
    }
  }
);

server.tool(
  "search_stays",
  "Search accommodation via Duffel Stays around a location (latitude/longitude) for a date range. Requires Stays to be enabled on your Duffel account. Returns accommodations with rating and cheapest rate.",
  {
    latitude: z.number().describe("Latitude of the search center"),
    longitude: z.number().describe("Longitude of the search center"),
    radius_km: z.number().optional().describe("Search radius in km (default 5)"),
    check_in_date: z.string().describe("Check-in date, YYYY-MM-DD"),
    check_out_date: z.string().describe("Check-out date, YYYY-MM-DD"),
    adults: z.number().optional().describe("Number of adult guests (default 2)"),
    limit: z.number().optional().describe("Max results (default 10)"),
  },
  async (args) => {
    try {
      return json(await searchStays(args));
    } catch (e) {
      return fail(`search_stays failed: ${(e as Error).message}`);
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`duffel-mcp running on stdio (token mode: ${tokenMode()})`);
