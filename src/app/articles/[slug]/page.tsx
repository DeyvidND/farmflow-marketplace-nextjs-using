import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getArticle } from "@/lib/api";
import { bodyToHtml } from "@/lib/article-html";
import { CfImg } from "@/components/cf-img";
import { StoreShell } from "@/components/store-shell";

const fmtDate = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat("bg-BG", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso))
    : null;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = await getArticle(slug);
  if (!a) return { title: "Статия" };
  return { title: `${a.title} · Статии`, description: a.excerpt?.trim() || undefined };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await getArticle(slug);
  if (!a || a.status !== "published") notFound();

  // Inline media below the body, in the operator's order. Video/embed types are
  // linked out rather than iframed — the strict Worker CSP and the reading flow
  // both prefer it.
  const gallery = [...(a.media ?? [])]
    .sort((x, y) => x.position - y.position)
    .filter((m) => m.type === "image" && m.url && m.url !== a.coverImageUrl);

  return (
    <StoreShell>
      <article className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <Link href="/articles" className="inline-flex items-center gap-1.5 text-[13.5px] font-bold text-primary">
          <ArrowLeft className="size-4" /> Всички статии
        </Link>

        {(a.category || fmtDate(a.publishedAt)) && (
          <div className="mt-5 text-[12.5px] font-extrabold uppercase tracking-[0.15em] text-sage">
            {[a.category, fmtDate(a.publishedAt)].filter(Boolean).join(" · ")}
          </div>
        )}
        <h1 className="mt-2 font-heading text-4xl font-bold leading-tight tracking-tight">{a.title}</h1>
        {a.excerpt && (
          <p className="mt-4 text-[17px] leading-relaxed text-foreground/80">{a.excerpt}</p>
        )}

        {a.coverImageUrl && (
          <div className="relative mt-7 aspect-[16/9] w-full overflow-hidden rounded-2xl bg-secondary">
            <CfImg
              src={a.coverImageUrl}
              width={1000}
              sizes="(min-width:768px) 720px, 100vw"
              alt={a.title}
              priority
              className="absolute inset-0 size-full object-cover"
            />
          </div>
        )}

        {a.body && (
          <div
            className="prose-article mt-8 text-[16.5px] leading-[1.75] text-foreground/90 [&_a]:font-semibold [&_a]:text-primary [&_h2]:mt-8 [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mt-6 [&_h3]:font-heading [&_h3]:text-xl [&_h3]:font-bold [&_li]:mt-1.5 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5"
            // Body is server-sanitized HTML (or escaped plain text) — see bodyToHtml.
            dangerouslySetInnerHTML={{ __html: bodyToHtml(a.body) }}
          />
        )}

        {gallery.length > 0 && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {gallery.map((m) => (
              <figure key={m.id} className="overflow-hidden rounded-2xl bg-secondary">
                <CfImg src={m.url} width={640} sizes="(min-width:640px) 350px, 100vw" alt={m.caption ?? ""} className="w-full object-cover" />
                {m.caption && (
                  <figcaption className="px-3 py-2 text-[13px] text-muted-foreground">{m.caption}</figcaption>
                )}
              </figure>
            ))}
          </div>
        )}
      </article>
    </StoreShell>
  );
}
