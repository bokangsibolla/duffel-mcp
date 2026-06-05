/**
 * Thin wrappers around the official @duffel/api client.
 *
 * The client is created lazily so the MCP server can start and list its tools
 * even before a token is configured; the token is only required when a tool runs.
 */
import { Duffel } from "@duffel/api";
import {
  buildPassengers,
  buildSlices,
  summarizeOffer,
  summarizeStay,
  type FlightSearchInput,
  type OfferLike,
  type StayResultLike,
} from "./shape.js";

let client: Duffel | null = null;

export function getClient(): Duffel {
  const token = process.env.DUFFEL_ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      "DUFFEL_ACCESS_TOKEN is not set. Create a test token in the Duffel dashboard (toggle to Test mode) and set DUFFEL_ACCESS_TOKEN."
    );
  }
  if (!client) client = new Duffel({ token });
  return client;
}

export function tokenMode(): "live" | "test" | "unset" {
  const t = process.env.DUFFEL_ACCESS_TOKEN ?? "";
  if (!t) return "unset";
  return t.startsWith("duffel_live_") ? "live" : "test";
}

export async function searchFlights(input: FlightSearchInput) {
  const duffel = getClient();
  const mc = input.max_connections;
  const res = await duffel.offerRequests.create({
    slices: buildSlices(input).map((s) => ({
      ...s,
      arrival_time: null,
      departure_time: null,
    })),
    passengers: buildPassengers(input),
    cabin_class: input.cabin_class ?? "economy",
    max_connections: mc === 0 || mc === 1 || mc === 2 ? mc : undefined,
    return_offers: true,
  });
  const offers = (res.data as unknown as { offers?: OfferLike[] }).offers ?? [];
  return offers.slice(0, input.limit ?? 10).map(summarizeOffer);
}

export async function getOffer(offerId: string) {
  const duffel = getClient();
  const res = await duffel.offers.get(offerId, { return_available_services: true });
  return summarizeOffer(res.data as unknown as OfferLike);
}

export interface StaySearchInput {
  latitude: number;
  longitude: number;
  radius_km?: number;
  check_in_date: string;
  check_out_date: string;
  adults?: number;
  limit?: number;
}

export async function searchStays(input: StaySearchInput) {
  const duffel = getClient();
  const guests = Array.from({ length: Math.max(1, input.adults ?? 2) }, () => ({
    type: "adult" as const,
  }));
  const res = await duffel.stays.search({
    rooms: 1,
    check_in_date: input.check_in_date,
    check_out_date: input.check_out_date,
    guests,
    location: {
      radius: input.radius_km ?? 5,
      geographic_coordinates: {
        latitude: input.latitude,
        longitude: input.longitude,
      },
    },
  });
  const results = (res.data as unknown as { results?: StayResultLike[] }).results ?? [];
  return results.slice(0, input.limit ?? 10).map(summarizeStay);
}
