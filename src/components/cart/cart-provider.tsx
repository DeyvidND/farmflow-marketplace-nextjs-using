"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface CartItem {
  id: string;
  name: string;
  /** unit price in euro (float), for display + totals */
  price: number;
  weight?: string | null;
  qty: number;
}

interface CartCtx {
  items: CartItem[];
  count: number;
  total: number;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const Ctx = createContext<CartCtx | null>(null);
const KEY = "mk-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Hydrate from localStorage once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  // Persist on every change.
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const add = useCallback((item: Omit<CartItem, "qty">, qty = 1) => {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.id === item.id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], qty: next[i].qty + qty };
        return next;
      }
      return [...prev, { ...item, qty }];
    });
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setItems((prev) =>
      qty <= 0 ? prev.filter((x) => x.id !== id) : prev.map((x) => (x.id === id ? { ...x, qty } : x)),
    );
  }, []);

  const remove = useCallback((id: string) => setItems((prev) => prev.filter((x) => x.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((a, b) => a + b.qty, 0);
  const total = items.reduce((a, b) => a + b.qty * b.price, 0);

  return <Ctx.Provider value={{ items, count, total, add, setQty, remove, clear }}>{children}</Ctx.Provider>;
}

export function useCart(): CartCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
