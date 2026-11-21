/**
 * French version of the site, applied as a translation layer over the rendered page.
 *
 * Components keep their English text. When the language is French, every text node and
 * every `placeholder`, `aria-label`, `title` and `alt` attribute is looked up in
 * `src/i18n/fr.json` and replaced in place; a MutationObserver keeps up with React.
 * Entries of `patterns` are regular expressions for sentences that contain a number or a service name.
 * Text that is not in the dictionary stays as it is, so names of businesses, towns and
 * customers are never changed. Mark an element `translate="no"` to leave it alone.
 */
export type Language = "en" | "fr";

const STORAGE_KEY = "flexs.lang";
const ATTRIBUTES = ["placeholder", "aria-label", "title", "alt"] as const;

interface Dictionary { strings: Record<string, string>; patterns: [string, string][] }

let dictionary: Dictionary | null = null;
let patterns: [RegExp, string][] = [];
let observer: MutationObserver | null = null;
const translatedText = new WeakMap<Node, string>();
const missing = new Set<string>();

export function getLanguage(): Language {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "fr" || saved === "en") return saved;
  } catch { /* storage can be unavailable in private windows */ }
  return typeof navigator !== "undefined" && /^fr\b/i.test(navigator.language || "") ? "fr" : "en";
}

/** Saves the choice and reloads, so every screen starts again in the chosen language. */
export function setLanguage(language: Language) {
  try { window.localStorage.setItem(STORAGE_KEY, language); } catch { /* the choice then lasts for this page only */ }
  window.location.reload();
}

/** Translates one string, keeping the spaces around it. Returns the input when there is no translation. */
export function translate(value: string): string {
  if (!dictionary) return value;
  const core = value.trim();
  if (!core || !/\p{L}/u.test(core)) return value;
  let result = dictionary.strings[core];
  if (result === undefined) {
    for (const [pattern, replacement] of patterns) {
      if (pattern.test(core)) {
        // A captured group that is itself a known phrase (a service name, a status) is translated too.
        result = core.replace(pattern, (...args) => replacement.replace(/\$(l?)(\d)/g, (_, lower, n) => {
          const part = String(args[Number(n)] ?? "");
          // Captured text is looked up as written, then as a capitalised phrase ("plumbing" is stored as "Plumbing").
          const word = dictionary!.strings[part] ?? dictionary!.strings[part.charAt(0).toUpperCase() + part.slice(1)] ?? part;
          // "$l1" starts the inserted phrase with a small letter: "professionnels en plomberie".
          return lower ? word.charAt(0).toLowerCase() + word.slice(1) : word;
        }));
        break;
      }
    }
  }
  if (result === undefined) { missing.add(core); return value; }
  return value.replace(core, () => result!);
}

function skipped(node: Node | null): boolean {
  for (let el = node instanceof Element ? node : node?.parentElement ?? null; el; el = el.parentElement) {
    const tag = el.tagName;
    if (tag === "SCRIPT" || tag === "STYLE" || tag === "TEXTAREA" || tag === "CODE" || el.getAttribute("translate") === "no" || (el as HTMLElement).isContentEditable) return true;
  }
  return false;
}

function translateTextNode(node: Node) {
  const current = node.nodeValue ?? "";
  if (translatedText.get(node) === current || skipped(node)) return;
  const next = translate(current);
  translatedText.set(node, next);
  if (next !== current) node.nodeValue = next;
}

function translateAttributes(el: Element) {
  if (skipped(el)) return;
  for (const name of ATTRIBUTES) {
    const current = el.getAttribute(name);
    if (!current) continue;
    const next = translate(current);
    if (next !== current) el.setAttribute(name, next);
  }
}

function translateTree(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) { translateTextNode(root); return; }
  if (!(root instanceof Element)) return;
  translateAttributes(root);
  root.querySelectorAll("[placeholder],[aria-label],[title],[alt]").forEach(translateAttributes);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) translateTextNode(node);
}

/** Call once before the first render. Resolves when the page is ready to be shown in the chosen language. */
export async function initLanguage(): Promise<Language> {
  const language = getLanguage();
  document.documentElement.lang = language === "fr" ? "fr-CA" : "en-CA";
  if (language !== "fr" || observer) return language;
  const loaded = (await import("@/i18n/fr.json")).default as unknown as Dictionary;
  dictionary = loaded;
  patterns = loaded.patterns.map(([source, replacement]) => [new RegExp(source, "u"), replacement]);
  observer = new MutationObserver(records => {
    for (const record of records) {
      if (record.type === "characterData") translateTextNode(record.target);
      else if (record.type === "attributes") translateAttributes(record.target as Element);
      else record.addedNodes.forEach(translateTree);
    }
  });
  translateTree(document.documentElement);
  observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRIBUTES] });
  // Lets the coverage check list what is shown on screen without a French translation.
  (window as unknown as { __flexsUntranslated?: () => string[] }).__flexsUntranslated = () => [...missing];
  return language;
}
