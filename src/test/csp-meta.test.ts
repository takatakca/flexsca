// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { metaPolicy } from "../../scripts/csp-meta.mjs";

describe("content security policy written into the page", () => {
  const nginx = readFileSync("deploy/security-headers.conf", "utf8");

  it("is the policy nginx sends, minus what a meta tag cannot carry", () => {
    const policy: string = metaPolicy(nginx);
    expect(policy).toContain("script-src 'self'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("https://ysghtkallwuoodwqgkjm.supabase.co");
    expect(policy).not.toContain("frame-ancestors");
    expect(policy).not.toMatch(/unsafe-eval|script-src[^;]*unsafe-inline/);
  });

  it("refuses a header file without a policy or with scripts opened up", () => {
    expect(() => metaPolicy(`add_header X-Frame-Options "DENY" always;`)).toThrow();
    expect(() => metaPolicy('add_header Content-Security-Policy "default-src *; script-src *" always;')).toThrow();
  });

  it("the Apache file keeps the same policy and is not part of the public folder", () => {
    const apache = readFileSync("deploy/apache.htaccess", "utf8");
    const header = /Content-Security-Policy "([^"]+)"/.exec(apache)?.[1];
    // Apache adds upgrade-insecure-requests; everything else must match what nginx sends.
    expect(header?.replace("; upgrade-insecure-requests", "")).toBe(/Content-Security-Policy\s+"([^"]+)"/.exec(nginx)?.[1]);
    expect(() => readFileSync("public/.htaccess")).toThrow();
  });
});
