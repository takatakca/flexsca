import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const HOME = "FLEXS — Find local professionals in Quebec";

/** Browser-tab titles for pages that do not set their own. Rendered before the routes, so a page's own title wins. */
const TITLES: [RegExp, string][] = [
  [/^\/$/, HOME],
  [/^\/post-job\/success/, "Request sent"],
  [/^\/post-job/, "Request quotes"],
  [/^\/my-requests/, "Your requests"],
  [/^\/customer-notifications/, "Notifications"],
  [/^\/pro$/, "For professionals"],
  [/^\/about/, "About FLEXS"],
  [/^\/affiliates/, "Affiliates"],
  [/^\/support/, "Support"],
  [/^\/terms/, "Terms of use"],
  [/^\/privacy/, "Privacy policy"],
  [/^\/cookies/, "Cookie policy"],
  [/^\/open-in-app/, "Open in the app"],
  [/^\/profile\//, "Professional profile"],
  [/^\/auth\/login/, "Login"],
  [/^\/auth\/welcome/, "Welcome"],
  [/^\/auth\/forgot-password/, "Forgot your password"],
  [/^\/auth\/reset-password/, "Choose a new password"],
  [/^\/auth\/check-email/, "Check your email"],
  [/^\/auth\//, "Sign in"],
  [/^\/onboarding/, "Set up your professional account"],
  [/^\/app\/dashboard/, "Overview"],
  [/^\/app\/leads/, "Leads"],
  [/^\/app\/responses/, "Responses"],
  [/^\/app\/reminders/, "Reminders"],
  [/^\/app\/notifications/, "Updates"],
  [/^\/app\/settings\/credits/, "Credits and billing"],
  [/^\/app\/settings/, "Settings"],
  [/^\/app\/admin/, "Administration"],
  [/^\/app/, "Workspace"],
];

export default function RouteTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const match = TITLES.find(([pattern]) => pattern.test(pathname));
    if (!match) return;
    document.title = match[1] === HOME ? HOME : `${match[1]} | FLEXS`;
  }, [pathname]);
  return null;
}
