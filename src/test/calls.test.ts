import { describe, expect, it } from "vitest";
import { bridgeTwiml, callState, northAmericanNumber, sameSignature, twilioSignature } from "../../supabase/functions/_shared/calls";

describe("calls through the phone provider", () => {
  it("accepts ordinary Canadian and US numbers in any common format", () => {
    expect(northAmericanNumber("(514) 555-0100")).toBe("+15145550100");
    expect(northAmericanNumber("+1 418 555 0199")).toBe("+14185550199");
    expect(northAmericanNumber("1-888-555-0100")).toBe("+18885550100");
  });
  it("refuses premium, special, foreign and malformed numbers", () => {
    for (const bad of ["1-900-555-0100", "514-976-0100", "911", "411 555 0100", "+33 1 42 68 53 00", "+44 20 7946 0958", "011 52 55 1234 5678", "555-0100", "", null, 5145550100, "+1 (014) 555-0100", "514 155 0100", "876 555 0100", "1-809-555-0100", "284 555 0100", "473-555-0100"]) {
      expect(northAmericanNumber(bad)).toBeNull();
    }
  });
  it("bridges to the customer with a time limit and never records", () => {
    const xml = bridgeTwiml("+15145550100", "+14385550111");
    expect(xml).toContain('<Number>+15145550100</Number>');
    expect(xml).toContain('callerId="+14385550111"');
    expect(xml).toContain('timeLimit="1800"');
    expect(xml).not.toMatch(/record/i);
    expect(bridgeTwiml('"><Hangup/>', "+14385550111")).not.toContain("<Hangup/>");
  });
  it("maps provider states and ignores unknown ones", () => {
    expect(callState("in-progress")).toBe("in_progress");
    expect(callState("no-answer")).toBe("no_answer");
    expect(callState("something-else")).toBeNull();
  });
  it("computes the provider's webhook signature", async () => {
    // Example published in Twilio's request-validation documentation.
    const signature = await twilioSignature("12345", "https://mycompany.com/myapp.php?foo=1&bar=2", { CallSid: "CA1234567890ABCDE", Caller: "+12349013030", Digits: "1234", From: "+12349013030", To: "+18005551212" });
    expect(signature).toBe("0/KCTR6DLpKmkAf8muzZqo1nDgQ=");
    expect(sameSignature(signature, "0/KCTR6DLpKmkAf8muzZqo1nDgQ=")).toBe(true);
    expect(sameSignature(signature, "0/KCTR6DLpKmkAf8muzZqo1nDgQ!")).toBe(false);
    expect(sameSignature(signature, "short")).toBe(false);
  });
});
