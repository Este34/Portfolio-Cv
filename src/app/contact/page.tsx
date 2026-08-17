import type { Metadata } from "next";

import { CONTACT } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Pour échanger sur la donnée, les modèles ou un projet.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-6xl px-5">
      <div className="border-trait flex items-center justify-between border-b py-3">
        <span className="annotation">Index / 005</span>
        <span className="annotation">Contact</span>
      </div>

      <div className="grid gap-12 py-16 lg:grid-cols-[1.3fr_1fr] lg:gap-20 lg:py-24">
        <div>
          <h1 className="font-display text-titre text-texte font-semibold">Parlons-en.</h1>
          <p className="text-texte-attenue mt-6 max-w-xl text-lg leading-relaxed">
            Je ne cherche pas de poste — je suis en alternance et j&apos;y reste. Mais si vous
            travaillez sur de la prospective, de la donnée lourde à rendre lisible, ou sur ce qu&apos;on
            peut faire tenir dans un navigateur sans serveur, j&apos;ai probablement des choses à
            apprendre de vous, et peut-être une ou deux à raconter.
          </p>

          <div className="mt-10">
            <a
              href={`mailto:${CONTACT.email}`}
              className="bg-signal text-fond rounded-instrument hover:bg-signal-vif inline-block px-5 py-2.5 text-sm font-medium transition-colors"
            >
              Écrire un courriel
            </a>
          </div>
        </div>

        <dl className="border-trait divide-trait h-fit divide-y border-y">
          <div className="py-4">
            <dt className="annotation">Courriel</dt>
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
                  Profil ↗
                </a>
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
