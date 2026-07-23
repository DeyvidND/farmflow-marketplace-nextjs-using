"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCcw } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Next.js App Router error boundary — catches render/data errors below the
 *  root layout so header fonts + CartProvider stay mounted; only this segment
 *  swaps to the friendly fallback below. */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-background px-4 py-20 text-center text-foreground">
      <div className="flex size-20 items-center justify-center rounded-full bg-accent text-4xl">🍂</div>
      <h1 className="mt-6 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Нещо се обърка</h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground">
        Извиняваме се — страницата срещна временен проблем. Опитай отново или се върни в началото, кошницата ти остава запазена.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={() => reset()} className={cn(buttonVariants({ size: "lg" }))}>
          <RefreshCcw className="size-4" /> Опитай отново
        </button>
        <Link href="/" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Начало
        </Link>
      </div>
    </div>
  );
}
