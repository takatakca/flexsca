import { useEffect } from "react";
import SiteHeader from "@/components/fx/SiteHeader";
import SiteFooter from "@/components/fx/SiteFooter";

export interface LegalSection { title: string; body: (string | string[])[]; terms?: [string, string][] }

/**
 * Layout of the policy frames (72:1751, 74:2941, 73:2590, 819:1415): optional tab band,
 * centred title, date, optional notice and lead block, numbered sections.
 * A section may carry a list of defined terms, drawn as two grey cells per row.
 */
export default function LegalPage({ title, updated, intro, sections, tabs, notice, lead }: {
  title: string; updated: string; intro?: string; sections: LegalSection[];
  tabs?: React.ReactNode; notice?: React.ReactNode; lead?: React.ReactNode;
}) {
  useEffect(() => { document.title = `${title} | FLEXS`; }, [title]);
  return (
    <div className="min-h-screen bg-background text-fx-ink">
      <SiteHeader />
      {tabs && <div className="bg-fx-soft px-gutter pt-5 lg:pt-4">{tabs}</div>}
      <main className="mx-auto max-w-3xl px-gutter pb-20 pt-10 lg:max-w-[1290px] lg:px-[100px] lg:pt-20">
        <h1 className="mx-auto max-w-md text-center text-4xl leading-tight lg:max-w-2xl lg:text-6xl">{title}</h1>
        <p className="mt-6 text-sm text-fx-ink lg:mt-8 lg:text-xl">Last updated: {updated}</p>
        {notice}
        {intro && <p className="mt-4 text-sm leading-6 text-fx-secondary lg:mt-8 lg:text-xl lg:leading-[1.7]">{intro}</p>}
        {lead}
        <ol className="mt-8 space-y-8 lg:mt-12 lg:space-y-12">
          {sections.map((section, index) => (
            <li key={section.title}>
              <h2 className="text-lg leading-snug lg:text-[32px]"><span className="mr-3 tabular-nums lg:mr-8">{index + 1}</span>{section.title}</h2>
              <div className="mt-3 space-y-3 text-sm leading-6 text-fx-secondary lg:mt-5 lg:space-y-5 lg:text-xl lg:leading-[1.7]">
                {section.body.map((part, i) => Array.isArray(part)
                  ? <ul key={i} className="list-disc space-y-1.5 pl-5">{part.map(item => <li key={item}>{item}</li>)}</ul>
                  : <p key={i}>{part}</p>)}
                {section.terms && <dl className="space-y-1.5 lg:space-y-2.5">
                  {section.terms.map(([term, meaning]) => (
                    <div key={term} className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-1.5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)] lg:gap-5">
                      <dt className="flex items-center rounded-fx-xs bg-fx-soft px-2.5 py-2 text-xs text-fx-ink lg:px-5 lg:py-4 lg:text-lg">“{term}”</dt>
                      <dd className="rounded-fx-xs bg-fx-soft px-2.5 py-2 text-xs leading-5 lg:px-5 lg:py-4 lg:text-lg lg:leading-[1.6]">{meaning}</dd>
                    </div>
                  ))}
                </dl>}
              </div>
            </li>
          ))}
        </ol>
      </main>
      <SiteFooter />
    </div>
  );
}
