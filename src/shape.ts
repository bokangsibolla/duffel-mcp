/**
 * Pure request/response shaping for the Duffel tools.
 *
 * Kept free of the Duffel SDK and network so it can be unit-tested offline.
 * The SDK is only touched in duffel.ts.
 */

export type CabinClass = "first" | "business" | "premium_economy" | "economy";

export interface FlightSearchInput {
  origin: string;
  destination: string;
  departure_date: string;
  return_date?: string;
  adults?: number;
  /** Ages of any passengers under 18. Duffel v2 prices under-18s by age, not type. */
  child_ages?: number[];
  cabin_class?: CabinClass;
  max_connections?: number;
  limit?: number;
}

export interface DuffelSlice {
  origin: string;
  destination: string;
  departure_date: string;
}

/** Duffel v2: adults are typed; everyone under 18 is given by age. */
export type DuffelPassenger = { type: "adult" } | { age: number };

/** One slice for one-way, two for a round trip. */
export function buildSlices(input: FlightSearchInput): DuffelSlice[] {
  const slices: DuffelSlice[] = [
    {
      origin: input.origin.trim().toUpperCase(),
      destination: input.destination.trim().toUpperCase(),
      departure_date: input.departure_date,
    },
  ];
  if (input.return_date) {
    slices.push({
      origin: input.destination.trim().toUpperCase(),
      destination: input.origin.trim().toUpperCase(),
      departure_date: input.return_date,
    });
  }
  return slices;
}

/** Expand passenger inputs into Duffel's per-passenger array (at least one adult). */
export function buildPassengers(input: FlightSearchInput): DuffelPassenger[] {
  const out: DuffelPassenger[] = [];
  const adults = Math.max(0, input.adults ?? 1);
  for (let i = 0; i < adults; i++) out.push({ type: "adult" });
  for (const age of input.child_ages ?? []) out.push({ age: Math.max(0, Math.floor(age)) });
  if (out.length === 0) out.push({ type: "adult" });
  return out;
}

// --- Offer summarization (structural subset of a Duffel Offer) --------------

export interface SegmentLike {
  origin?: { iata_code?: string };
  destination?: { iata_code?: string };
  departing_at?: string;
  arriving_at?: string;
  marketing_carrier?: { iata_code?: string; name?: string };
  marketing_carrier_flight_number?: string;
}

export interface SliceLike {
  origin?: { iata_code?: string };
  destination?: { iata_code?: string };
  duration?: string;
  segments?: SegmentLike[];
}

export interface OfferLike {
  id: string;
  total_amount: string;
  total_currency: string;
  owner?: { name?: string; iata_code?: string };
  slices?: SliceLike[];
  expires_at?: string;
}

export function summarizeOffer(offer: OfferLike) {
  return {
    offer_id: offer.id,
    price: `${offer.total_amount} ${offer.total_currency}`,
    airline: offer.owner?.name ?? offer.owner?.iata_code,
    expires_at: offer.expires_at,
    slices: (offer.slices ?? []).map((s) => ({
      from: s.origin?.iata_code,
      to: s.destination?.iata_code,
      duration: s.duration,
      stops: Math.max(0, (s.segments?.length ?? 1) - 1),
      segments: (s.segments ?? []).map((seg) => ({
        flight: [seg.marketing_carrier?.iata_code, seg.marketing_carrier_flight_number]
          .filter(Boolean)
          .join(" "),
        from: seg.origin?.iata_code,
        to: seg.destination?.iata_code,
        depart: seg.departing_at,
        arrive: seg.arriving_at,
      })),
    })),
  };
}

// --- Stays summarization (structural subset of a Stays search result) -------

export interface StayResultLike {
  id?: string;
  cheapest_rate_total_amount?: string;
  cheapest_rate_currency?: string;
  accommodation?: {
    name?: string;
    rating?: number;
    review_score?: number;
    location?: { address?: { city_name?: string } };
  };
}

export function summarizeStay(result: StayResultLike) {
  return {
    search_result_id: result.id,
    name: result.accommodation?.name,
    rating: result.accommodation?.rating,
    review_score: result.accommodation?.review_score,
    city: result.accommodation?.location?.address?.city_name,
    cheapest_rate:
      result.cheapest_rate_total_amount && result.cheapest_rate_currency
        ? `${result.cheapest_rate_total_amount} ${result.cheapest_rate_currency}`
        : undefined,
  };
}
