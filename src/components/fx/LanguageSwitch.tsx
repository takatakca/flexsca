import { getLanguage, setLanguage } from "@/lib/i18n";

/** Offers the other language. The label is written in that language, so it is never translated. */
export default function LanguageSwitch({ className = "" }: { className?: string }) {
  const french = getLanguage() === "fr";
  return (
    <button type="button" translate="no" lang={french ? "en" : "fr"} onClick={() => setLanguage(french ? "en" : "fr")}
      aria-label={french ? "Switch to English" : "Passer au français"} className={`hover:text-primary ${className}`}>
      {french ? "English" : "Français"}
    </button>
  );
}
