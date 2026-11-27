// One source for the content security policy: deploy/security-headers.conf (what nginx sends).
// The build also writes it into the page itself, so the policy protects visitors on any host,
// including one that sends no security headers at all.
import { readFileSync } from 'node:fs';

/** The policy from the nginx header file, minus what a browser ignores in a <meta> tag. */
export function metaPolicy(nginxText) {
  const found = /add_header\s+Content-Security-Policy\s+"([^"]+)"/.exec(nginxText);
  if (!found) throw new Error('No Content-Security-Policy in deploy/security-headers.conf');
  const directives = found[1].split(';').map(part => part.trim()).filter(Boolean)
    .filter(part => !/^(frame-ancestors|report-uri|report-to|sandbox)\b/.test(part));
  if (!directives.some(part => part.startsWith("script-src 'self'"))) throw new Error('The policy must keep script-src to this site');
  return directives.join('; ');
}

/** Vite plugin: production builds only (the dev server needs its own inline scripts). */
export function cspMeta(file = 'deploy/security-headers.conf') {
  return {
    name: 'flexs-csp-meta',
    apply: 'build',
    transformIndexHtml(html) {
      const policy = metaPolicy(readFileSync(file, 'utf8'));
      const tags = `<meta http-equiv="Content-Security-Policy" content="${policy}" />\n    <meta name="referrer" content="strict-origin-when-cross-origin" />`;
      if (!html.includes('<meta charset="UTF-8" />')) throw new Error('index.html: charset tag not found');
      return html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    ${tags}`);
    },
  };
}
