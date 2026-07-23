import type { Metadata } from "next";
import Link from "next/link";
import { getArticles } from "@/lib/api";
import { CfImg } from "@/components/cf-img";
import { StoreShell } from "@/components/store-shell";

export const metadata: Metadata = {
  title: "Статии · Фермерски пазари",
  description: "Историите на фермерите и съвети за сезонните продукти.",
};

const fmtDate = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat("bg-BG", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso))
    : null;

export default async function ArticlesPage() {
  const articles = (await getArticles()).filter((a) => a.status === "published");

  return (
    <StoreShell>
      <div className="mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-6">
        <div className="text-[12.5px] font-extrabold uppercase tracking-[0.15em] text-sage-text">От пазара</div>
        <h1 className="mt-2 font-heading text-4xl font-bold tracking-tight">Статии</h1>
        <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-muted-foreground">
          Историите на фермерите и съвети за сезонните продукти.
        </p>

        {articles.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-dashed border-line-strong bg-card p-12 text-center text-muted-foreground">
            Очаквай първите статии скоро.
          </p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <Link
                key={a.id}
                href={`/articles/${a.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-10px_rgba(38,73,47,0.18)]"
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-secondary">
                  {a.coverImageUrl && (
                    <CfImg
                      src={a.coverImageUrl}
                      width={640}
                      sizes="(min-width:1024px) 370px, (min-width:640px) 50vw, 100vw"
                      alt={a.title}
                      className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  {(a.category || fmtDate(a.publishedAt)) && (
                    <div className="text-[12px] font-bold uppercase tracking-wide text-muted-foreground">
                      {[a.category, fmtDate(a.publishedAt)].filter(Boolean).join(" · ")}
                    </div>
                  )}
                  <h2 className="mt-1.5 font-heading text-[19px] font-bold leading-snug group-hover:text-primary">
                    {a.title}
                  </h2>
                  {a.excerpt && (
                    <p className="mt-2 line-clamp-3 text-[14.5px] leading-relaxed text-muted-foreground">{a.excerpt}</p>
                  )}
                  <span className="mt-auto pt-3 text-[13.5px] font-bold text-primary">Прочети →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </StoreShell>
  );
}
