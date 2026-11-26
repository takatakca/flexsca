/** Helpers for the customer's side-by-side quote comparison. Pure, so they can be tested without a browser. */
export interface ComparableQuote {
  id: string;
  pro_id: string;
  price_min: number | null;
  price_max: number | null;
  availability: string | null;
  status: string;
  created_at: string;
}

export type QuoteSort = "price" | "newest";

/** The figure a quote is ranked by: its starting price. Quotes without a price cannot be ranked. */
export function quotePrice(quote: Pick<ComparableQuote, "price_min" | "price_max">): number | null {
  return quote.price_min ?? quote.price_max ?? null;
}

export function sortQuotes<T extends ComparableQuote>(quotes: readonly T[], sort: QuoteSort): T[] {
  const newest = (a: T, b: T) => b.created_at.localeCompare(a.created_at);
  if (sort === "newest") return [...quotes].sort(newest);
  return [...quotes].sort((a, b) => {
    const pa = quotePrice(a), pb = quotePrice(b);
    if (pa === null && pb === null) return newest(a, b);
    if (pa === null) return 1;
    if (pb === null) return -1;
    return pa - pb || newest(a, b);
  });
}

/**
 * The quote to mark "Lowest price": only when at least two open or accepted quotes carry a price
 * and one is strictly the lowest. A tie or a lone price marks nothing, so the label never misleads.
 */
export function lowestPricedQuoteId(quotes: readonly ComparableQuote[]): string | null {
  const priced = quotes
    .filter(quote => quote.status !== "declined" && quotePrice(quote) !== null)
    .map(quote => ({ id: quote.id, price: quotePrice(quote)! }))
    .sort((a, b) => a.price - b.price);
  if (priced.length < 2 || priced[0].price === priced[1].price) return null;
  return priced[0].id;
}

const AVAILABILITY: Record<string, string> = { today: "Today", tomorrow: "Tomorrow", this_week: "This week", custom: "To be arranged" };
export function availabilityLabel(value: string | null): string {
  return value ? AVAILABILITY[value] ?? "To be arranged" : "Not specified";
}
