import type { Metadata } from "next";
import { Star } from "lucide-react";
import { getReviews } from "@/lib/api";
import { cn } from "@/lib/utils";
import { StoreShell } from "@/components/store-shell";

export const metadata: Metadata = {
  title: "Отзиви · Фермерски пазари",
  description: "Какво казват клиентите за фермерите и техните продукти.",
};

const fmtDate = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat("bg-BG", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso))
    : null;

function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${rating} от 5 звезди`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn("size-4", i <= Math.round(rating) ? "fill-honey text-honey" : "text-border")}
        />
      ))}
    </span>
  );
}

export default async function ReviewsPage() {
  const { average, count, reviews } = await getReviews();

  return (
    <StoreShell>
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <div className="text-[12.5px] font-extrabold uppercase tracking-[0.15em] text-sage">От клиентите</div>
        <h1 className="mt-2 font-heading text-4xl font-bold tracking-tight">Отзиви</h1>

        {count > 0 ? (
          <div className="mt-4 flex items-center gap-3">
            <Stars rating={average} />
            <span className="text-[15px] text-muted-foreground">
              <span className="font-bold text-foreground">{average.toFixed(1)}</span> от 5 · {count}{" "}
              {count === 1 ? "отзив" : "отзива"}
            </span>
          </div>
        ) : (
          <p className="mt-6 rounded-2xl border border-dashed border-line-strong bg-card p-12 text-center text-muted-foreground">
            Скоро тук ще виждаш какво казват клиентите за фермерите и техните продукти.
          </p>
        )}

        {reviews.length > 0 && (
          <div className="mt-8 grid gap-4">
            {reviews.map((r) => (
              <figure key={r.id} className="rounded-2xl border border-border bg-card p-6">
                <Stars rating={r.rating} />
                <blockquote className="mt-3 text-[15.5px] leading-relaxed text-foreground/90">
                  „{r.body}“
                </blockquote>
                <figcaption className="mt-3 text-[13.5px] text-muted-foreground">
                  <span className="font-bold text-foreground">{r.authorName}</span>
                  {[r.authorLocation, fmtDate(r.createdAt)].filter(Boolean).map((x) => ` · ${x}`).join("")}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </StoreShell>
  );
}
