import Link from "next/link";

import { CONTACT, NAV_DISCRETE, NAV_ITEMS, SITE } from "@/lib/site";

export function Pied() {
  return (
    <footer className="border-trait mt-auto border-t">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-2">
          <p className="font-display text-texte text-lg font-semibold tracking-tight">{SITE.nom}</p>
          <p className="text-texte-attenue mt-2 max-w-sm text-sm">{SITE.accroche}</p>
        </div>

        <nav aria-label="Pied de page">
          <p className="annotation mb-3">Sections</p>
          <ul className="space-y-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-texte-attenue hover:text-signal text-sm transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="annotation mb-3">Ailleurs</p>
          <ul className="space-y-2">
            <li>
              <a
                href={`mailto:${CONTACT.email}`}
                className="text-texte-attenue hover:text-signal text-sm transition-colors"
              >
                Courriel
              </a>
            </li>
            <li>
              <a
                href={CONTACT.github}
                className="text-texte-attenue hover:text-signal text-sm transition-colors"
                rel="me noreferrer"
                target="_blank"
              >
                GitHub
              </a>
            </li>
            {NAV_DISCRETE.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-texte-faible hover:text-signal text-sm transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-trait border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <p className="annotation">
            © {new Date().getFullYear()} {SITE.nom}
          </p>
          <p className="annotation">Aucun traceur · Aucun cookie</p>
        </div>
      </div>
    </footer>
  );
}
