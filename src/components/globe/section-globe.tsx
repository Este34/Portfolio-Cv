"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

/**
 * Enveloppe du globe.
 *
 * Trois précautions, et chacune répond à un défaut précis :
 *
 *  1. **Chargement différé.** Three.js pèse plusieurs centaines de
 *     kilo-octets. Il n'entre dans la page que si la section entre dans le
 *     champ — un visiteur qui ne descend jamais jusque-là ne le paie pas.
 *  2. **Pas de rendu serveur.** WebGL n'existe pas côté serveur.
 *  3. **Un repli qui tient tout seul.** Si WebGL manque, échoue, ou si la
 *     section n'a jamais été atteinte, le cadre reste habité par sa légende.
 *     Rien ne casse, rien ne clignote.
 */

const Globe = dynamic(() => import("./globe"), {
  ssr: false,
  loading: () => <Repli etat="chargement" />,
});

function Repli({ etat }: { etat: "attente" | "chargement" }) {
  return (
    <div className="text-texte-faible absolute inset-0 grid place-items-center">
      <span className="annotation">
        {etat === "chargement" ? "Initialisation de l'affichage…" : "Affichage en veille"}
      </span>
    </div>
  );
}

export function SectionGlobe() {
  const hote = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [couleurs, setCouleurs] = useState<{ signal: string; attenue: string } | null>(null);

  useEffect(() => {
    const el = hote.current;
    if (!el) return;

    const observateur = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        const styles = getComputedStyle(document.documentElement);
        setCouleurs({
          signal: styles.getPropertyValue("--signal").trim() || "#ff8a3d",
          attenue: styles.getPropertyValue("--texte-faible").trim() || "#666e76",
        });
        setVisible(true);
        observateur.disconnect(); // Une fois chargé, on ne décharge pas.
      },
      { rootMargin: "200px" },
    );

    observateur.observe(el);
    return () => observateur.disconnect();
  }, []);

  return (
    <section className="border-trait border-y">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:gap-16">
        <div>
          <span className="annotation">Figure / 01</span>
          <h2 className="font-display text-texte mt-2 text-2xl font-semibold tracking-tight">
            Un réseau, pas une carte
          </h2>
          <p className="text-texte-attenue mt-4 leading-relaxed">
            Six cent vingt points répartis par la spirale d&apos;or sur une sphère, et vingt-deux
            arcs reliant des paires tirées au sort. Une distribution uniforme en latitude et
            longitude aurait entassé les points aux pôles ; celle-ci les espace régulièrement.
          </p>
          <p className="text-texte-attenue mt-4 leading-relaxed">
            <strong className="text-texte font-semibold">
              Aucune géographie, aucun flux réel n&apos;est représenté ici.
            </strong>{" "}
            C&apos;est une figure décorative, et le reste de ce site s&apos;interdisant les
            visualisations qui n&apos;en sont pas, autant le dire plutôt que de laisser croire à
            une carte du commerce mondial. Les vraies données de flux, elles, sont dans{" "}
            <a
              href="https://recherchecomtrade.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="text-signal hover:underline"
            >
              l&apos;application qui les analyse ↗
            </a>
            .
          </p>
        </div>

        <div
          ref={hote}
          className="border-trait bg-fond-eleve rounded-panneau relative aspect-square w-full overflow-hidden border"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-3 py-2">
            <span className="annotation">Canal 01</span>
            <span className="annotation text-signal">{visible ? "actif" : "en veille"}</span>
          </div>

          {visible && couleurs ? (
            <Globe signal={couleurs.signal} attenue={couleurs.attenue} />
          ) : (
            <Repli etat="attente" />
          )}
        </div>
      </div>
    </section>
  );
}
