import type { Metadata } from "next";
import { StoreShell } from "@/components/store-shell";

export const metadata: Metadata = { title: "Бисквитки" };

const SECTIONS = [
  {
    t: "Какви бисквитки използваме",
    d: "Само технически необходими — нужни са, за да работи сайтът: съдържанието на количката, избрания град/пазар и дали си потвърдил съгласие за нюзлетър. Пазят се локално в браузъра ти (localStorage), не изтичат данни към трети страни.",
  },
  {
    t: "Няма рекламни или проследяващи бисквитки",
    d: "Не поставяме бисквитки за реклама, ремаркетинг или проследяване на поведението ти между сайтове.",
  },
  {
    t: "Анализ на посещенията",
    d: "Статистиката за трафика се събира на ниво сървър, обобщено и без лични данни — не се обвързва с теб като личност чрез бисквитки в браузъра.",
  },
  {
    t: "Управление",
    d: "Тъй като бисквитките са технически необходими за количката и поръчката, изключването им през настройките на браузъра може да попречи на пазаруването.",
  },
];

export default function CookiesPage() {
  return (
    <StoreShell>
      <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        <div className="text-[12.5px] font-extrabold uppercase tracking-[0.15em] text-sage-text">Прозрачност</div>
        <h1 className="mt-2 font-heading text-4xl font-bold tracking-tight">Бисквитки</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Кратко и честно за това какво пазим в браузъра ти и защо.
        </p>

        <div className="mt-8 space-y-3">
          {SECTIONS.map((s) => (
            <div key={s.t} className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-[15.5px] font-extrabold">{s.t}</h2>
              <p className="mt-1.5 text-[14.5px] leading-relaxed text-foreground/80">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </StoreShell>
  );
}
