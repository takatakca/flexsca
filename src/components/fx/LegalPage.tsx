import { useEffect } from "react";
import SiteHeader from "@/components/fx/SiteHeader";
import SiteFooter from "@/components/fx/SiteFooter";

export interface LegalSection { title: string; body: (string | string[])[] }

/** Layout of the policy frames (72:1751, 74:2941, 73:2590): centred title, date, numbered sections. */
export default function LegalPage({ title, updated, intro, sections, tabs }: { title: string; updated: string; intro?: string; sections: LegalSection[]; tabs?: React.ReactNode }) {
  useEffect(() => { document.title = `${title} | FLEXS`; }, [title]);
  return (
    <div className="min-h-screen bg-background text-fx-ink">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-gutter pb-20 pt-10">
        {tabs}
        <h1 className="mx-auto max-w-md text-center text-4xl leading-tight">{title}</h1>
        <p className="mt-6 text-sm text-fx-ink">Last updated: {updated}</p>
        {intro && <p className="mt-4 text-sm leading-6 text-fx-secondary">{intro}</p>}
        <ol className="mt-8 space-y-8">
          {sections.map((section, index) => (
            <li key={section.title}>
              <h2 className="text-lg leading-snug"><span className="mr-3 tabular-nums">{index + 1}</span>{section.title}</h2>
              <div className="mt-3 space-y-3 text-sm leading-6 text-fx-secondary">
                {section.body.map((part, i) => Array.isArray(part)
                  ? <ul key={i} className="list-disc space-y-1.5 pl-5">{part.map(item => <li key={item}>{item}</li>)}</ul>
                  : <p key={i}>{part}</p>)}
              </div>
            </li>
          ))}
        </ol>
      </main>
      <SiteFooter />
    </div>
  );
}
