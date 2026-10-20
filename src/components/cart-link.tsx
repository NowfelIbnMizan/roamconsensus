"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart, useCartHydrated } from "@/lib/cart-store";

export function CartLink() {
  const hydrated = useCartHydrated();
  const count = useCart((s) => s.items.length);

  return (
    <Link href="/cart" className="relative flex items-center gap-1 hover:text-foreground">
      <ShoppingBag className="size-4" aria-hidden />
      Trip cart
      {hydrated && count > 0 && (
        <span className="ml-0.5 rounded-full bg-accent px-1.5 text-xs font-medium text-background">{count}</span>
      )}
    </Link>
  );
}
