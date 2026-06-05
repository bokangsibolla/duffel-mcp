/**
 * Live integration smoke test against the real Duffel API. Skips cleanly if no
 * token is set, so it is safe to run anywhere.
 *
 *   DUFFEL_ACCESS_TOKEN=duffel_test_xxx npm run live-smoke
 *
 * Get a free test token in the Duffel dashboard (toggle to Test mode). Test
 * searches and bookings cost nothing; use 'Duffel Airways' (IATA ZZ) routes.
 */
import { searchFlights, tokenMode } from "../src/duffel.js";

if (tokenMode() === "unset") {
  console.log("SKIPPED: set DUFFEL_ACCESS_TOKEN (a duffel_test_ token) to run the live smoke test.");
  process.exit(0);
}

console.log(`token mode: ${tokenMode()}`);
console.log("searching LHR -> JFK ...");
const offers = await searchFlights({
  origin: "LHR",
  destination: "JFK",
  departure_date: "2026-09-15",
  limit: 3,
});
console.log(`got ${offers.length} offers`);
for (const o of offers) {
  console.log(`  ${o.price}  ${o.airline}  stops=${o.slices[0]?.stops}`);
}
console.log("\nLIVE SMOKE OK");
