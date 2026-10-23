import { faqJsonLd, type Faq } from "@/lib/faq";

/** Questions as open/close rows, plus FAQ structured data so search and AI answers can quote them. */
export function FaqList({ title, faq }: { title: string; faq: Faq[] }) {
  if (!faq.length) return null;
  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-4 divide-y divide-line rounded-2xl border border-line bg-card">
        {faq.map((f, i) => (
          <details key={f.q} className="group p-4" open={i === 0}>
            <summary className="cursor-pointer list-none font-medium marker:hidden">
              {f.q}
              <span className="float-right text-muted group-open:rotate-45">+</span>
            </summary>
            <p className="mt-2 text-sm text-muted">{f.a}</p>
          </details>
        ))}
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faq)).replace(/</g, "\\u003c") }}
      />
    </section>
  );
}
