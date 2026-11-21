import { describe, expect, it } from "vitest";
import { renderEmail } from "../../supabase/functions/_shared/emails";

const lead = "11111111-2222-4333-8444-555555555555";

describe("notification emails", () => {
  it("confirms a request to the customer in French and English", () => {
    const mail = renderEmail({ kind: "request_received", lead_id: lead, payload: { service: "Plumbing", city: "Laval" } })!;
    expect(mail.subject).toBe("Nous avons reçu votre demande : Plumbing / We received your request: Plumbing");
    expect(mail.text).toContain("https://flexs.ca/my-requests");
    expect(mail.text.indexOf("Votre demande est publiée")).toBeLessThan(mail.text.indexOf("Your request is posted"));
    expect(mail.html).toContain('lang="fr"');
    expect(mail.html).toContain('lang="en"');
  });
  it("tells a professional about a new request and links to it", () => {
    const mail = renderEmail({ kind: "new_request", lead_id: lead, payload: { service: "Plumbing", city: "Laval", urgent: true } })!;
    expect(mail.text).toContain(`https://flexs.ca/app/leads/${lead}`);
    expect(mail.text).toContain("Elle est marquée urgente.");
    expect(mail.text).toContain("It is marked urgent.");
  });
  it("never reveals the customer's contact details or message", () => {
    const mail = renderEmail({ kind: "new_request", lead_id: lead, payload: { service: "Plumbing", city: "Laval", customer_email: "client@example.com", customer_phone: "5145550100", details: "secret" } })!;
    for (const body of [mail.subject, mail.text, mail.html]) { expect(body).not.toContain("client@example.com"); expect(body).not.toContain("5145550100"); expect(body).not.toContain("secret"); }
  });
  it("escapes text that came from a person and keeps it on one line", () => {
    const mail = renderEmail({ kind: "notification", lead_id: null, payload: { title: "<script>alert(1)</script>\nBcc: someone@example.com" } })!;
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
    expect(mail.subject).not.toMatch(/[\r\n]/);
    const hostile = renderEmail({ kind: "request_received", lead_id: lead, payload: { service: "Plumbing\r\nBcc: x@example.com" } })!;
    expect(hostile.subject).not.toMatch(/[\r\n]/);
  });
  it("ignores unknown events, empty notices and malformed request ids", () => {
    expect(renderEmail({ kind: "something", lead_id: null, payload: {} })).toBeNull();
    expect(renderEmail({ kind: "notification", lead_id: null, payload: { title: "  " } })).toBeNull();
    expect(renderEmail({ kind: "quote_received", lead_id: "../admin", payload: {} })!.text).toContain("https://flexs.ca/my-requests\n");
  });
});
