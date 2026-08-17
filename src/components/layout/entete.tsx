import Link from "next/link";

import { BasculeTheme } from "@/components/bascule-theme";
import { Palette } from "@/components/console/palette";
import { NAV_ITEMS, SITE } from "@/lib/site";

export function Entete() {
  return (
    <header className="border-trait bg-fond/85 sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-5">
        <Link
          href="/"
          className="group flex items-baseline gap-2.5 whitespace-nowrap"
          aria-label={`${SITE.nom} — accueil`}
        >
          <span className="border-signal text-signal rounded-instrument border px-1.5 py-0.5 font-mono text-[0.6875rem] leading-none font-bold tracking-widest">
            EB
          </span>
          <span className="font-display text-texte hidden text-sm font-semibold tracking-tight sm:inline">
            {SITE.nom}
          </span>
        </Link>

        <nav aria-label="Navigation principale" className="ml-auto hidden sm:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="annotation text-texte-attenue hover:text-signal rounded-instrument px-2.5 py-2 transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sur mobile, la console remplace la navigation : elle la contient. */}
        <div className="ml-auto flex items-center gap-2 sm:ml-0">
          <Palette />
          <BasculeTheme />
        </div>
      </div>
    </header>
  );
}
