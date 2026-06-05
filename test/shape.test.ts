import { describe, it, expect } from "vitest";
import {
  buildSlices,
  buildPassengers,
  summarizeOffer,
  summarizeStay,
  type OfferLike,
} from "../src/shape";

describe("buildSlices", () => {
  it("makes one slice for a one-way trip", () => {
    const slices = buildSlices({ origin: "lhr", destination: "jfk", departure_date: "2026-07-21" });
    expect(slices).toEqual([{ origin: "LHR", destination: "JFK", departure_date: "2026-07-21" }]);
  });

  it("adds a reversed slice for a round trip", () => {
    const slices = buildSlices({
      origin: "LHR",
      destination: "JFK",
      departure_date: "2026-07-21",
      return_date: "2026-07-28",
    });
    expect(slices).toHaveLength(2);
    expect(slices[1]).toEqual({ origin: "JFK", destination: "LHR", departure_date: "2026-07-28" });
  });
});

describe("buildPassengers", () => {
  it("defaults to a single adult", () => {
    expect(buildPassengers({ origin: "A", destination: "B", departure_date: "2026-01-01" })).toEqual([
      { type: "adult" },
    ]);
  });

  it("expands adults by count and under-18s by age (Duffel v2)", () => {
    const pax = buildPassengers({
      origin: "A",
      destination: "B",
      departure_date: "2026-01-01",
      adults: 2,
      child_ages: [4, 9],
    });
    expect(pax.filter((p) => "type" in p && p.type === "adult")).toHaveLength(2);
    const ages = pax.filter((p) => "age" in p).map((p) => (p as { age: number }).age);
    expect(ages).toEqual([4, 9]);
  });
});

describe("summarizeOffer", () => {
  const offer: OfferLike = {
    id: "off_123",
    total_amount: "412.50",
    total_currency: "GBP",
    owner: { name: "Duffel Airways", iata_code: "ZZ" },
    expires_at: "2026-07-01T12:00:00Z",
    slices: [
      {
        origin: { iata_code: "LHR" },
        destination: { iata_code: "JFK" },
        duration: "PT8H",
        segments: [
          {
            origin: { iata_code: "LHR" },
            destination: { iata_code: "JFK" },
            departing_at: "2026-07-21T09:00:00",
            arriving_at: "2026-07-21T12:00:00",
            marketing_carrier: { iata_code: "ZZ", name: "Duffel Airways" },
            marketing_carrier_flight_number: "100",
          },
        ],
      },
    ],
  };

  it("flattens price, airline, and segments and computes stops", () => {
    const s = summarizeOffer(offer);
    expect(s.offer_id).toBe("off_123");
    expect(s.price).toBe("412.50 GBP");
    expect(s.airline).toBe("Duffel Airways");
    expect(s.slices[0].from).toBe("LHR");
    expect(s.slices[0].stops).toBe(0);
    expect(s.slices[0].segments[0].flight).toBe("ZZ 100");
  });

  it("counts stops as segments minus one", () => {
    const twoLeg = summarizeOffer({
      ...offer,
      slices: [{ segments: [{}, {}] }],
    });
    expect(twoLeg.slices[0].stops).toBe(1);
  });
});

describe("summarizeStay", () => {
  it("flattens name, rating, and cheapest rate", () => {
    const s = summarizeStay({
      id: "ssr_1",
      cheapest_rate_total_amount: "180.00",
      cheapest_rate_currency: "USD",
      accommodation: { name: "Hotel Test", rating: 4, location: { address: { city_name: "Lisbon" } } },
    });
    expect(s.name).toBe("Hotel Test");
    expect(s.rating).toBe(4);
    expect(s.city).toBe("Lisbon");
    expect(s.cheapest_rate).toBe("180.00 USD");
  });
});
