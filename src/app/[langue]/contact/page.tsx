import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FondAnime } from "@/components/fond/fond-anime";
import { UI } from "@/content/interface";
import { PAGE_CONTACT } from "@/content/pages";
import { estLangue, t } from "@/lib/langue";
import { metadonnees } from "@/lib/metadonnees";
import { CONTACT } from "@/lib/site";

export async function generateMetadata({
  params,
}: PageProps<"/[langue]/contact">): Promise<Metadata> {
  const { langue } = await params;
  if (!estLangue(langue)) return {};
  return metadonnees({
    langue,
    chemin: "/contact",
    titre: t(PAGE_CONTACT.meta.titre, langue),
    description: t(PAGE_CONTACT.meta.description, langue),
  });
}

export default async function Page({ params }: PageProps<"/[langue]/contact">) {
  const { langue } = await params;
  if (!estLangue(langue)) notFound();

  return (
    <div className="relative isolate min-h-[70vh] overflow-hidden">
      {/* Page courte : le fond y a la place de respirer, donc un peu plus dense. */}
      <FondAnime intensite={0.5} lignes={19} />

      <div className="relative mx-auto max-w-6xl px-5">
        <div className="grid gap-12 py-16 lg:grid-cols-[1.3fr_1fr] lg:gap-20 lg:py-24">
          <div>
            <h1 className="font-display text-titre text-texte uppercase">
              {t(PAGE_CONTACT.titre, langue)}
            </h1>
            <p className="text-texte-attenue mt-6 max-w-xl text-lg leading-relaxed">
              {t(PAGE_CONTACT.chapeau, langue)}
            </p>

            <div className="mt-10">
              <a
                href={`mailto:${CONTACT.email}`}
                className="bloc-corail inline-block px-6 py-3 text-sm font-bold uppercase transition-transform duration-200 ease-(--ease-signal) hover:-translate-y-0.5"
              >
                {t(UI.ecrireUnCourriel, langue)}
              </a>
            </div>
          </div>

          <dl className="border-trait divide-trait bg-fond/70 h-fit divide-y border-y">
            <div className="py-4">
              <dt className="annotation">{t(UI.courriel, langue)}</dt>
              <dd className="mt-1.5">
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="text-texte hover:text-signal font-mono text-sm break-all transition-colors"
                >
                  {CONTACT.email}
                </a>
              </dd>
            </div>

            <div className="py-4">
              <dt className="annotation">GitHub</dt>
              <dd className="mt-1.5">
                <a
                  href={CONTACT.github}
                  target="_blank"
                  rel="me noreferrer"
                  className="text-texte hover:text-signal font-mono text-sm transition-colors"
                >
                  @Este34 ↗
                </a>
              </dd>
            </div>

            {/* LinkedIn n'est rendu que si l'URL est renseignée dans lib/site.ts. */}
            {CONTACT.linkedin && (
              <div className="py-4">
                <dt className="annotation">LinkedIn</dt>
                <dd className="mt-1.5">
                  <a
                    href={CONTACT.linkedin}
                    target="_blank"
                    rel="me noreferrer"
                    className="text-texte hover:text-signal font-mono text-sm transition-colors"
                  >
                    LinkedIn ↗
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}
