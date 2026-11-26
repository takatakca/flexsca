// Email wording, in French then English in the same message: FLEXS serves Quebec, and the
// reader's language is not always known (a customer who posts a request has no account yet).
// Pure functions, covered by src/test/emails.test.ts.

export interface OutboxEmail { kind: string; payload: Record<string, unknown>; lead_id: string | null }
export interface RenderedEmail { subject: string; text: string; html: string }

const SITE = "https://flexs.ca";
const escapeHtml = (value: string) => value.replace(/[<>&"']/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" }[c]!));
/** Text that came from a person is cut and stripped of line breaks before it goes into a subject or a sentence. */
const clean = (value: unknown, max = 80) => (typeof value === "string" ? value : "").replace(/[\r\n\t]+/g, " ").trim().slice(0, max);

interface Part { subject: string; lines: string[]; button: string }

function parts(email: OutboxEmail): { fr: Part; en: Part; link: string } | null {
  const service = clean(email.payload.service);
  const city = clean(email.payload.city, 60);
  const where = city ? ` (${city})` : "";
  const request = email.lead_id && /^[0-9a-f-]{36}$/i.test(email.lead_id) ? email.lead_id : null;
  switch (email.kind) {
    case "request_received":
      return { link: `${SITE}/my-requests`,
        fr: { subject: `Nous avons reçu votre demande${service ? ` : ${service}` : ""}`, button: "Voir ma demande", lines: ["Votre demande est publiée. Les professionnels de votre secteur peuvent maintenant vous répondre avec leurs soumissions.", "Connectez-vous avec ce courriel pour suivre votre demande, comparer les soumissions et écrire aux professionnels. Publier une demande est gratuit."] },
        en: { subject: `We received your request${service ? `: ${service}` : ""}`, button: "See my request", lines: ["Your request is posted. Professionals in your area can now reply with their quotes.", "Sign in with this email address to follow your request, compare quotes and message professionals. Posting a request is free."] } };
    case "new_request":
      return { link: request ? `${SITE}/app/leads/${request}` : `${SITE}/app/leads`,
        fr: { subject: `Nouvelle demande${service ? ` : ${service}` : ""}${where}`, button: "Voir la demande", lines: [`Un client vient de publier une demande${service ? ` pour le service « ${service} »` : ""}${where}.${email.payload.urgent === true ? " Elle est marquée urgente." : ""}`, "Consultez-la gratuitement. Vous n'utilisez des crédits que si vous débloquez les coordonnées du client."] },
        en: { subject: `New request${service ? `: ${service}` : ""}${where}`, button: "See the request", lines: [`A customer has just posted a request${service ? ` for "${service}"` : ""}${where}.${email.payload.urgent === true ? " It is marked urgent." : ""}`, "Read it for free. You only use credits if you unlock the customer's contact details."] } };
    case "quote_received":
      return { link: request ? `${SITE}/my-requests/${request}` : `${SITE}/my-requests`,
        fr: { subject: `Vous avez reçu une soumission${service ? ` : ${service}` : ""}`, button: "Voir la soumission", lines: ["Un professionnel a répondu à votre demande avec une soumission.", "Connectez-vous pour la lire, la comparer aux autres et lui écrire. Rien ne vous oblige à l'accepter."] },
        en: { subject: `You received a quote${service ? `: ${service}` : ""}`, button: "See the quote", lines: ["A professional has replied to your request with a quote.", "Sign in to read it, compare it with the others and message them. You are free to accept it or not."] } };
    case "notification": {
      const title = clean(email.payload.title, 160);
      if (!title) return null;
      return { link: `${SITE}/app/notifications`,
        fr: { subject: "Du nouveau dans votre compte FLEXS", button: "Ouvrir FLEXS", lines: ["Vous avez une nouvelle notification dans votre compte FLEXS :", title] },
        en: { subject: "Something new in your FLEXS account", button: "Open FLEXS", lines: ["You have a new notification in your FLEXS account:", title] } };
    }
    default: return null;
  }
}

/** Builds the message, or null when the event is unknown or has nothing to say. */
export function renderEmail(email: OutboxEmail): RenderedEmail | null {
  const content = parts(email);
  if (!content) return null;
  const { fr, en, link } = content;
  const footerFr = "Vous recevez ce courriel parce que vous utilisez FLEXS. Pour ne plus recevoir les notifications par courriel, ouvrez Paramètres dans votre compte.";
  const footerEn = "You receive this email because you use FLEXS. To stop notification emails, open Settings in your account.";
  const text = [...fr.lines, `${fr.button} : ${link}`, "", "— — —", "", ...en.lines, `${en.button}: ${link}`, "", footerFr, footerEn, "FLEXS · Groupe TAKATAK inc., Montréal (Québec)"].join("\n");
  const block = (part: Part, lang: string) => `<div lang="${lang}">${part.lines.map(line => `<p style="margin:0 0 12px;font-size:16px;line-height:24px;color:#14183d">${escapeHtml(line)}</p>`).join("")}<p style="margin:20px 0 0"><a href="${link}" style="display:inline-block;background:#2a6fdb;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:4px;font-size:16px">${escapeHtml(part.button)}</a></p></div>`;
  const html = `<!doctype html><html><body style="margin:0;background:#f5f6fa;font-family:Arial,Helvetica,sans-serif"><div style="max-width:560px;margin:0 auto;padding:28px 20px"><p style="margin:0 0 20px;font-size:24px;font-weight:bold;color:#14183d">FLEXS</p><div style="background:#ffffff;border-radius:6px;padding:24px">${block(fr, "fr")}<hr style="border:0;border-top:1px solid #e3e6ef;margin:24px 0">${block(en, "en")}</div><p style="margin:18px 0 0;font-size:12px;line-height:18px;color:#6b7190">${escapeHtml(footerFr)}<br>${escapeHtml(footerEn)}<br>FLEXS · Groupe TAKATAK inc., Montréal (Québec)</p></div></body></html>`;
  return { subject: `${fr.subject} / ${en.subject}`.slice(0, 200), text, html };
}
