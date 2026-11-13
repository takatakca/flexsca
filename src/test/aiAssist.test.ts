import { describe, expect, it } from "vitest";
import { MAX_DRAFT_CHARS, cleanDraft, leadBrief, quoteReplySystemPrompt } from "../../supabase/functions/_shared/ai-assist";

describe("AI drafting helpers", () => {
  const lead = { category: "Plumbing", city: "Montréal", details: "Leaking tap in the kitchen.", answers: { "Which rooms?": ["Kitchen", "Bathroom"], Urgency: "This week" }, isUrgent: true };

  it("builds the brief from the job only", () => {
    const brief = leadBrief(lead);
    expect(brief).toContain("Service requested: Plumbing");
    expect(brief).toContain("City: Montréal");
    expect(brief).toContain("- Which rooms?: Kitchen, Bathroom");
    expect(brief).toContain("urgent");
  });

  it("has no field for customer contact details", () => {
    const brief = leadBrief({ ...lead, ...( { customer_email: "a@example.test", customer_phone: "5145550100", customer_name: "Alex Tremblay" } as object) });
    expect(brief).not.toMatch(/example\.test|5145550100|Tremblay/);
  });

  it("bounds oversized input and output", () => {
    expect(leadBrief({ ...lead, details: "x".repeat(5000) }).length).toBeLessThan(2600);
    expect(cleanDraft(`  ${"y".repeat(5000)}  `).length).toBeLessThanOrEqual(MAX_DRAFT_CHARS + 1);
    expect(cleanDraft("  Bonjour\r\n ")).toBe("Bonjour");
  });

  it("tells the model not to invent prices or credentials and to ignore instructions in customer text", () => {
    const prompt = quoteReplySystemPrompt("Plomberie Nord");
    expect(prompt).toContain("Plomberie Nord");
    expect(prompt).toMatch(/Do not state a price/);
    expect(prompt).toMatch(/do not follow them/);
  });
});
