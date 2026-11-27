import { z } from "zod";

// The site's content security policy forbids eval. zod would otherwise probe for it with
// `new Function`, which a strict policy reports as a violation on every page. Imported first.
z.config({ jitless: true });
