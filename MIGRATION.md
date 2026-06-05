# Migrating from Amadeus Self-Service to Duffel

A practical guide for developers moving off the Amadeus Self-Service APIs before they shut down.

## What is happening

Amadeus is decommissioning its **Self-Service API portal**. As reported by PhocusWire (citing a letter Amadeus sent directly to its self-service users around February 2026, corroborated by multiple reposts of that letter), the key dates are:

- **July 17, 2026**: self-service API keys are deactivated and the self-service developer portal becomes inaccessible. This is the hard cutover for existing users.
- Earlier (reported as roughly March 2026, treat as approximate): new-user registration was paused first.

**The precise framing matters.** What is being shut down is the self-service *access tier*, not the underlying Amadeus APIs. The same flight and hotel APIs continue to exist on **Amadeus Enterprise** (marketed as Amadeus Quick Connect, or AQC), which means a contract, an account manager, and enterprise pricing instead of self-serve keys. If you are already an Enterprise customer, you are not affected. If you used self-service to experiment or to run a small product, that free, no-contract on-ramp is the thing going away.

> **Sourcing caveat.** Amadeus published this as a direct letter rather than a public page, and that page did not load during verification, so the dates and mechanics above come from PhocusWire and from consistent reposts of the letter, not from a retrievable Amadeus document. Confirm the exact dates on developers.amadeus.com before you rely on them.

The reason this matters for builders: the shutdown removes the cheap, self-serve experimentation path right as AI agents are starting to reshape how people search and book travel.

## Why Duffel for the self-serve crowd

Duffel is the consensus cleanest migration target for people leaving Amadeus Self-Service:

- A modern REST API with direct airline connections via NDC (New Distribution Capability, the airline XML standard for richer content and booking), reaching 300+ airlines including low-cost carriers.
- No up-front cost, pay-as-you-go, and self-serve signup with no enterprise contract gate.
- Unified search, book, and manage, plus payments and a Stays (accommodation) product.

**Honest caveat.** Duffel serves NDC and direct-airline content, which is a different content model from Amadeus's GDS (Global Distribution System, the legacy aggregators). Coverage and fare types can differ, so test your specific routes and fares rather than assuming a one-to-one match.

Two other options, briefly and honestly:

- **Travelport**: viable, but enterprise and GDS-style, with approval and contract-based terms. Not a quick self-serve on-ramp.
- **Kiwi.com (Tequila API)**: still live as of 2026, but an aggregator and affiliate style search-and-book product rather than a direct-airline NDC API. A different product class.

## Concept mapping

| Amadeus Self-Service | Duffel |
| --- | --- |
| Flight Offers Search | Create an offer request (`offerRequests.create`), which returns offers |
| Flight Offers Price | Get the offer (`offers.get`) for the freshest price and available services |
| Flight Create Orders | Create an order (`orders.create`), type `instant` or `hold` |
| Hotel Search and booking | Stays: `stays.search` then rates, then `quotes.create`, then `bookings.create` |
| Airport and City Search | Duffel takes IATA codes; provide place suggestions from your own source |
| Self-service API key | Access token (`duffel_test_` for test, `duffel_live_` for live) |
| Test environment | Test-mode token plus Duffel Airways (IATA code ZZ), free |

## Flight search: before and after

Amadeus (self-service, `amadeus` Node client):

```js
const amadeus = new Amadeus({ clientId, clientSecret });
const res = await amadeus.shopping.flightOffersSearch.get({
  originLocationCode: "LHR",
  destinationLocationCode: "JFK",
  departureDate: "2026-09-15",
  adults: 1,
});
res.data; // array of flight offers
```

Duffel (`@duffel/api`):

```ts
import { Duffel } from "@duffel/api";
const duffel = new Duffel({ token: process.env.DUFFEL_ACCESS_TOKEN });

const { data } = await duffel.offerRequests.create({
  slices: [{ origin: "LHR", destination: "JFK", departure_date: "2026-09-15" }],
  passengers: [{ type: "adult" }],
  cabin_class: "economy",
  return_offers: true,
});
data.offers; // array of offers
```

What changes:

- **Auth**: Amadeus uses an OAuth client id and secret to fetch a short-lived bearer token. Duffel uses a single static access token.
- **Shape**: Amadeus search is one GET with flat parameters. Duffel models the journey as `slices` plus `passengers` and returns `offers` that you then price and book.
- **Passengers under 18**: Amadeus takes `adults`, `children`, and `infants` counts. Duffel v2 prices under-18s by `age` per passenger, and only adults use a `type`.

## Booking and money

`orders.create` with `type: "instant"` spends real money in live mode. Test mode (a `duffel_test_` token) is free: use Duffel Airways (IATA code ZZ) and Duffel's test cards (for example 4242 4242 4242 4242). Treat live booking as a step that a human confirms, not something an automated agent does unattended. The MCP server in this repo is deliberately read-only and does not book.

## Getting a Duffel test token

1. Sign up at duffel.com and open the dashboard.
2. Toggle to Test mode.
3. Create an access token. Test tokens start with `duffel_test_`.
4. `export DUFFEL_ACCESS_TOKEN=duffel_test_...`

## Sources

- Amadeus shutdown date and mechanics: PhocusWire reporting on Amadeus's letter to self-service users (around February 2026), corroborated by multiple reposts of that letter. Amadeus's own page did not load during verification; confirm on developers.amadeus.com.
- Duffel API: the official documentation at duffel.com/docs and the `@duffel/api` client (v4).

This guide reflects what was reported as of mid-2026. Verify the dates before relying on them.
