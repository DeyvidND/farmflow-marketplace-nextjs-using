import Link from "next/link";
import { Sprout, Phone, Mail } from "lucide-react";
import type { Storefront } from "@/lib/types";

export function SiteFooter({ storefront }: { storefront: Storefront }) {
  const phone = storefront.contact?.phone ?? storefront.phone;
  const email = storefront.contact?.email ?? storefront.email;
  const tagline =
    storefront.contact?.tagline ??
    "Пазар за местни фермери и истинска храна. Директно от стопанството до твоята маса.";

  return (
    <footer className="mt-auto bg-muted">
      <div className="mx-auto w-full max-w-[1180px] px-4 py-12 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="max-w-80">
            <span className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-[10px] bg-primary text-primary-foreground">
                <Sprout className="size-5" />
              </span>
              <span className="text-[15.5px] font-extrabold text-forest-dark">{storefront.name}</span>
            </span>
            <p className="mt-3.5 text-[13.5px] leading-relaxed text-muted-foreground">{tagline}</p>
          </div>
          <div className="flex flex-wrap gap-x-14 gap-y-8">
            <FooterCol title="Пазарът">
              <FooterLink href="/shop">Магазин</FooterLink>
              {storefront.multiFarmer && <FooterLink href="/farmers">Фермери</FooterLink>}
              <FooterLink href="/orders">Поръчки</FooterLink>
              <FooterLink href="/cart">Количка</FooterLink>
            </FooterCol>
            <FooterCol title="За нас">
              <FooterLink href="/about">Кои сме</FooterLink>
              <FooterLink href="/articles">Статии</FooterLink>
              <FooterLink href="/reviews">Отзиви</FooterLink>
              <FooterLink href="/contact">Контакти</FooterLink>
            </FooterCol>
            <FooterCol title="Свържи се">
              {phone && (
                <a href={`tel:${phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-forest-dark">
                  <Phone className="size-3.5" /> {phone}
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="inline-flex items-center gap-1.5 text-[13.5px] text-muted-foreground">
                  <Mail className="size-3.5" /> {email}
                </a>
              )}
            </FooterCol>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-end gap-4 border-t border-line-strong pt-5 text-[12.5px] text-muted-foreground">
          <Link href="/terms">Общи условия</Link>
          <Link href="/privacy">Поверителност</Link>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground/80">{title}</div>
      {children}
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-[13.5px] text-muted-foreground hover:text-primary">
      {children}
    </Link>
  );
}
