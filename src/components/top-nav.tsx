"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Analytics" },
  { href: "/posts", label: "Posts" },
] as const;

export function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="max-w-[920px] mx-auto px-4 pt-4 pb-0 flex items-center gap-4">
      <span className="text-[10px] text-neon font-mono tracking-[2px] uppercase mr-2">
        BT
      </span>
      <div className="flex gap-1">
        {TABS.map(({ href, label }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`text-[11px] font-mono px-2.5 py-1 rounded-md transition-colors ${
                active
                  ? "text-neon bg-white/[0.06]"
                  : "text-muted-foreground/50 hover:text-foreground/70"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
