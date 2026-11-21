# French version

FLEXS is written in English in the code and shown in French through a translation layer.

- `src/lib/i18n.ts` replaces, in the rendered page, every text and every `placeholder`, `aria-label`, `title` and `alt` found in `src/i18n/fr.json`. A MutationObserver keeps up with React. Text that is not in the dictionary is left alone, which is how business names, towns and customer messages stay untouched. Put `translate="no"` on an element to exclude it.
- Language: the visitor's choice (`localStorage` key `flexs.lang`), otherwise French when the browser language starts with `fr`, otherwise English. The switch is in the header, the mobile menu, the footer, the professional settings and the sign-in pages.
- `fr.json` has two parts: `strings` (exact English text → French) and `patterns` (regular expressions for sentences that contain a number or a service name; `$1` inserts a captured part, translated when it is a known phrase, and `$l1` starts it with a small letter).

## Adding or changing text

1. Write the English text in the component as usual. Keep a sentence in one piece: use a template string (`` {`Find ${name} professionals`} ``) rather than text around `{name}`, otherwise each fragment is translated on its own.
2. Add the French to `src/i18n/fr.json` (`strings`, or `patterns` when it contains a number or a name).
3. `npm test` checks the dictionary (no empty entry, numbers preserved, rules compile). `npm run test:browser` visits the signed-in screens in French and prints how many texts were left as written; with `SWEEP_DIR=<folder>` it saves pictures and the list in `fr-untranslated.json`.

## Known limits

- Sign-in emails come from Supabase templates and are in English.
- Dates and amounts use Canadian English formats.
- The French text has not been reviewed by a native editor or, for the legal pages, by a lawyer.
