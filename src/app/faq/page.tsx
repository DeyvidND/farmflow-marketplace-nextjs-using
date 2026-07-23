import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { StoreShell } from "@/components/store-shell";

export const metadata: Metadata = { title: "Чести въпроси" };

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "Трябва ли да се регистрирам, за да поръчам?",
    a: "Не. Поръчваш директно от магазина — попълваш име, телефон и адрес при плащане, без създаване на акаунт.",
  },
  {
    q: "Как плащам?",
    a: "В брой при получаване (наложен платеж). Плащаш на фермера или куриера, когато получиш поръчката.",
  },
  {
    q: "Как получавам поръчката — доставка или вземане от място?",
    a: "Избираш при поръчката: вземане от място при фермера (безплатно) или доставка до адрес срещу такса. Доставката е безплатна над определена сума, която пазарът показва на страницата за плащане.",
  },
  {
    q: "Мога ли да избера кога да пристигне поръчката?",
    a: "Да. При плащане избираш ден за доставка или вземане измежду свободните дни, които фермерът е отворил за поръчки.",
  },
  {
    q: "Как разбирам, че поръчката е приета?",
    a: "Фермерът потвърждава поръчката. Веднага след плащане получаваш линк към страницата „Статус на поръчка“, откъдето следиш как се движи — приета, потвърдена, подготвя се, пътува, доставена.",
  },
  {
    q: "Продуктите наистина ли са от местни фермери?",
    a: "Да. Всеки продукт в пазара е добавен директно от стопанството, което го произвежда — виждаш кой фермер стои зад него на страницата на продукта.",
  },
  {
    q: "Как разбирам, че продавачът е истински?",
    a: "Всеки фермер в пазара е проверен и се показва с отличителен знак до името си на страницата с фермери и в собствения си магазин.",
  },
  {
    q: "Мога ли да поръчам продукти от няколко фермера наведнъж?",
    a: "Да. Кошницата може да събира продукти от различни стопанства в една поръчка. При повече от един производител плащането остава едно, а доставката се организира по продавач.",
  },
  {
    q: "Какво стане, ако продукт свърши след поръчката?",
    a: "Фермерът вижда наличността в реално време и потвърждава поръчката спрямо наличните количества. Ако възникне проблем, ще се свърже с теб на посочения телефон.",
  },
  {
    q: "Имам друг въпрос — какво да направя?",
    a: (
      <>
        Пиши ни от страницата за{" "}
        <Link href="/contact" className="font-semibold text-primary underline underline-offset-2">
          контакти
        </Link>{" "}
        — ще се свържем с теб.
      </>
    ),
  },
];

export default function FaqPage() {
  return (
    <StoreShell>
      <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        <div className="text-[12.5px] font-extrabold uppercase tracking-[0.15em] text-sage-text">Помощ</div>
        <h1 className="mt-2 font-heading text-4xl font-bold tracking-tight">Чести въпроси</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Кратки отговори за това как работи поръчването на пазара.
        </p>

        <div className="mt-8 space-y-3">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group rounded-2xl border border-border bg-card [&::-webkit-details-marker]:hidden">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[15.5px] font-bold">
                {q}
                <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-5 text-[14.5px] leading-relaxed text-foreground/80">{a}</div>
            </details>
          ))}
        </div>
      </div>
    </StoreShell>
  );
}
