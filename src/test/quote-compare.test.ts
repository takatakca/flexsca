import { describe, expect, it } from "vitest";
import { availabilityLabel, lowestPricedQuoteId, sortQuotes, type ComparableQuote } from "@/lib/quote-compare";

const quote = (id: string, min: number | null, max: number | null, created: string, status = "sent"): ComparableQuote =>
  ({ id, pro_id: `pro-${id}`, price_min: min, price_max: max, availability: null, status, created_at: created });

describe("quote comparison", () => {
  const a = quote("a", 300, 400, "2026-11-20T10:00:00Z");
  const b = quote("b", 250, null, "2026-11-21T10:00:00Z");
  const c = quote("c", null, null, "2026-11-22T10:00:00Z");

  it("sorts by starting price with unpriced quotes last, or by date", () => {
    expect(sortQuotes([a, b, c], "price").map(q => q.id)).toEqual(["b", "a", "c"]);
    expect(sortQuotes([a, b, c], "newest").map(q => q.id)).toEqual(["c", "b", "a"]);
  });

  it("marks the lowest price only when it is unambiguous", () => {
    expect(lowestPricedQuoteId([a, b, c])).toBe("b");
    expect(lowestPricedQuoteId([a, c])).toBeNull();
    expect(lowestPricedQuoteId([a, quote("d", 300, null, "2026-11-23T10:00:00Z")])).toBeNull();
    expect(lowestPricedQuoteId([a, quote("e", 100, null, "2026-11-23T10:00:00Z", "declined")])).toBeNull();
  });

  it("labels availability without leaking raw values", () => {
    expect(availabilityLabel("this_week")).toBe("This week");
    expect(availabilityLabel(null)).toBe("Not specified");
    expect(availabilityLabel("something_else")).toBe("To be arranged");
  });
});
