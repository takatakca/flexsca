"""Builds the FLEXS Supabase Auth email templates (French first, then English).
Style copied from supabase/functions/_shared/emails.ts so every FLEXS email looks the same."""
import html, pathlib, sys

OUT = pathlib.Path(sys.argv[1])
OUT.mkdir(parents=True, exist_ok=True)

INK, BLUE, MUTED, LINE, BG = "#14183d", "#2a6fdb", "#6b7190", "#e3e6ef", "#f5f6fa"

FOOT_FR = "Vous recevez ce courriel parce qu'une action a été demandée pour cette adresse sur FLEXS. Si ce n'est pas vous, ignorez-le : rien ne changera dans votre compte."
FOOT_EN = "You receive this email because an action was requested for this address on FLEXS. If it was not you, ignore it: nothing will change in your account."
SIGN = "FLEXS · Groupe TAKATAK inc., Montréal (Québec) · <a href=\"https://flexs.ca/support\" style=\"color:%s\">flexs.ca/support</a>" % MUTED

T = {
 "1-confirmer-inscription": dict(
   supa="Confirm signup",
   subject="Confirmez votre adresse courriel FLEXS / Confirm your FLEXS email",
   fr=dict(title="Bienvenue sur FLEXS", lines=["Merci de vous être inscrit. Il reste une étape : confirmer que cette adresse courriel est bien la vôtre."], button="Confirmer mon courriel", after="Ce lien ne sert qu'une fois et expire bientôt."),
   en=dict(title="Welcome to FLEXS", lines=["Thank you for signing up. One step left: confirm that this email address is yours."], button="Confirm my email", after="This link works only once and expires soon."),
   url="{{ .ConfirmationURL }}"),
 "2-lien-de-connexion": dict(
   supa="Magic Link",
   subject="Votre lien de connexion FLEXS / Your FLEXS sign-in link",
   fr=dict(title="Connexion à FLEXS", lines=["Cliquez sur le bouton ci-dessous pour vous connecter à votre compte FLEXS. Aucun mot de passe n'est nécessaire."], button="Me connecter", after="Ce lien ne sert qu'une fois et expire bientôt. Ouvrez-le sur l'appareil où vous avez fait la demande."),
   en=dict(title="Sign in to FLEXS", lines=["Click the button below to sign in to your FLEXS account. No password is needed."], button="Sign me in", after="This link works only once and expires soon. Open it on the device where you asked for it."),
   url="{{ .ConfirmationURL }}"),
 "3-reinitialiser-mot-de-passe": dict(
   supa="Reset Password",
   subject="Choisissez un nouveau mot de passe FLEXS / Choose a new FLEXS password",
   fr=dict(title="Nouveau mot de passe", lines=["Nous avons reçu une demande pour changer le mot de passe du compte FLEXS lié à {{ .Email }}."], button="Choisir un nouveau mot de passe", after="Ce lien expire bientôt. Si vous n'avez rien demandé, votre mot de passe actuel reste valide."),
   en=dict(title="New password", lines=["We received a request to change the password of the FLEXS account linked to {{ .Email }}."], button="Choose a new password", after="This link expires soon. If you did not ask for this, your current password stays valid."),
   url="{{ .ConfirmationURL }}"),
 "4-changer-adresse-courriel": dict(
   supa="Change Email Address",
   subject="Confirmez votre nouvelle adresse FLEXS / Confirm your new FLEXS email",
   fr=dict(title="Changement d'adresse courriel", lines=["Vous avez demandé de remplacer {{ .Email }} par {{ .NewEmail }} pour votre compte FLEXS.", "Confirmez ce changement avec le bouton ci-dessous."], button="Confirmer la nouvelle adresse", after="Tant que vous ne confirmez pas, l'ancienne adresse reste celle du compte."),
   en=dict(title="Email address change", lines=["You asked to replace {{ .Email }} with {{ .NewEmail }} for your FLEXS account.", "Confirm the change with the button below."], button="Confirm the new address", after="Until you confirm, the old address stays on the account."),
   url="{{ .ConfirmationURL }}"),
 "5-invitation": dict(
   supa="Invite user",
   subject="Vous êtes invité sur FLEXS / You are invited to FLEXS",
   fr=dict(title="Invitation à FLEXS", lines=["Vous avez été invité à ouvrir un compte sur FLEXS, la plateforme qui met en relation les clients et les professionnels du Québec.", "Acceptez l'invitation pour créer votre compte avec cette adresse courriel."], button="Accepter l'invitation", after="Ce lien ne sert qu'une fois et expire bientôt."),
   en=dict(title="Invitation to FLEXS", lines=["You have been invited to open an account on FLEXS, the platform that connects customers with professionals in Quebec.", "Accept the invitation to create your account with this email address."], button="Accept the invitation", after="This link works only once and expires soon."),
   url="{{ .ConfirmationURL }}"),
 "6-code-de-verification": dict(
   supa="Reauthentication",
   subject="Votre code de vérification FLEXS / Your FLEXS verification code",
   fr=dict(title="Code de vérification", lines=["Pour confirmer une action sensible dans votre compte FLEXS, entrez ce code :"], code=True, after="Ce code expire bientôt. Ne le donnez à personne : l'équipe FLEXS ne vous le demandera jamais."),
   en=dict(title="Verification code", lines=["To confirm a sensitive action in your FLEXS account, enter this code:"], code=True, after="This code expires soon. Do not share it: the FLEXS team will never ask you for it."),
   url=None),
}

def esc(s):  # keep Go template tags intact, escape the rest
    parts = s.split("{{")
    out = [html.escape(parts[0], quote=False)]
    for p in parts[1:]:
        tag, rest = p.split("}}", 1)
        out.append("{{" + tag + "}}" + html.escape(rest, quote=False))
    return "".join(out)

def block(part, url, lang):
    p = f'<div lang="{lang}">'
    p += f'<p style="margin:0 0 14px;font-size:20px;line-height:28px;font-weight:bold;color:{INK}">{esc(part["title"])}</p>'
    for line in part["lines"]:
        p += f'<p style="margin:0 0 12px;font-size:16px;line-height:24px;color:{INK}">{esc(line)}</p>'
    if part.get("code"):
        p += f'<p style="margin:16px 0;font-size:30px;line-height:38px;font-weight:bold;letter-spacing:6px;color:{INK};font-family:Consolas,Menlo,monospace">{{{{ .Token }}}}</p>'
    else:
        p += f'<p style="margin:20px 0 16px"><a href="{url}" style="display:inline-block;background:{BLUE};color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:4px;font-size:16px;font-weight:bold">{esc(part["button"])}</a></p>'
        alt = "Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :" if lang == "fr" else "If the button does not work, copy this link into your browser:"
        p += f'<p style="margin:0 0 12px;font-size:13px;line-height:19px;color:{MUTED}">{alt}<br><a href="{url}" style="color:{BLUE};word-break:break-all">{url}</a></p>'
    p += f'<p style="margin:0;font-size:14px;line-height:21px;color:{MUTED}">{esc(part["after"])}</p></div>'
    return p

for name, t in T.items():
    body = (f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(t["subject"])}</title></head>'
            f'<body style="margin:0;background:{BG};font-family:Arial,Helvetica,sans-serif">'
            f'<div style="max-width:560px;margin:0 auto;padding:28px 20px">'
            f'<p style="margin:0 0 20px;font-size:24px;font-weight:bold;color:{INK}">FLEXS</p>'
            f'<div style="background:#ffffff;border-radius:6px;padding:24px">'
            f'{block(t["fr"], t["url"], "fr")}<hr style="border:0;border-top:1px solid {LINE};margin:24px 0">{block(t["en"], t["url"], "en")}</div>'
            f'<p style="margin:18px 0 0;font-size:12px;line-height:18px;color:{MUTED}">{esc(FOOT_FR)}<br>{esc(FOOT_EN)}<br>{SIGN}</p>'
            f'</div></body></html>\n')
    (OUT / f"{name}.html").write_text(body, encoding="utf-8")
    print(f"{t['supa']:22} | {name}.html | {t['subject']}")
