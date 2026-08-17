import { NextResponse } from "next/server";

/**
 * Rédige une réponse à partir des extraits trouvés côté client.
 *
 * C'est le **seul** point serveur du site, et il est facultatif : la recherche
 * fonctionne entièrement dans le navigateur, cette route ne fait qu'habiller
 * le résultat. Si elle est absente, en panne ou sans clé, le client garde ses
 * extraits et n'affiche rien de moins.
 *
 * Le modèle ne reçoit que les extraits transmis, et pour seule consigne de ne
 * rien ajouter : la recherche a déjà eu lieu, il ne reste qu'à mettre en
 * forme. Le laisser compléter de mémoire produirait des affirmations
 * invérifiables sur une personne réelle — le contraire exact de ce qu'un
 * portfolio doit faire.
 */

const MODELE = "claude-haiku-4-5-20251001";
const MAX_EXTRAITS = 6;
const MAX_LONGUEUR_QUESTION = 400;

/*
 * Limitation de débit, en mémoire.
 *
 * Honnêtement partielle : sur un hébergement sans état, le compteur est propre
 * à chaque instance et se réinitialise à froid. Elle arrête un visiteur qui
 * s'emballe, pas une attaque distribuée. Pour ce dernier cas, la vraie réponse
 * est le plafond de dépense configuré côté fournisseur.
 */
const FENETRE_MS = 60_000;
const MAX_PAR_FENETRE = 8;
const compteurs = new Map<string, { n: number; debut: number }>();

function debitDepasse(cle: string): boolean {
  const maintenant = Date.now();
  const entree = compteurs.get(cle);

  if (!entree || maintenant - entree.debut > FENETRE_MS) {
    compteurs.set(cle, { n: 1, debut: maintenant });
    // Purge opportuniste : sans elle, la Map grossit indéfiniment sur une
    // instance longue durée.
    if (compteurs.size > 500) {
      for (const [k, v] of compteurs) {
        if (maintenant - v.debut > FENETRE_MS) compteurs.delete(k);
      }
    }
    return false;
  }

  entree.n++;
  return entree.n > MAX_PAR_FENETRE;
}

export async function POST(requete: Request) {
  const cle = process.env.ANTHROPIC_API_KEY;
  // Pas de clé configurée : ce n'est pas une erreur, c'est le mode par défaut.
  if (!cle) return NextResponse.json({ texte: null }, { status: 200 });

  const ip = requete.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "inconnue";
  if (debitDepasse(ip)) {
    return NextResponse.json({ texte: null, motif: "débit" }, { status: 429 });
  }

  let question: unknown;
  let extraits: unknown;
  try {
    ({ question, extraits } = await requete.json());
  } catch {
    return NextResponse.json({ texte: null, motif: "corps illisible" }, { status: 400 });
  }

  if (typeof question !== "string" || !Array.isArray(extraits) || extraits.length === 0) {
    return NextResponse.json({ texte: null, motif: "requête invalide" }, { status: 400 });
  }

  const contexte = extraits
    .filter((e): e is string => typeof e === "string")
    .slice(0, MAX_EXTRAITS)
    .map((e, i) => `[${i + 1}] ${e}`)
    .join("\n\n");

  if (!contexte) {
    return NextResponse.json({ texte: null, motif: "aucun extrait" }, { status: 400 });
  }

  try {
    const reponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": cle,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELE,
        max_tokens: 320,
        system:
          "Tu réponds à une question sur le parcours d'Esteban Beretti-Prenant, à partir des seuls extraits fournis de son portfolio. " +
          "Règles strictes : n'utilise aucune connaissance extérieure ; n'invente aucun fait, chiffre, date, employeur ni technologie ; " +
          "si les extraits ne permettent pas de répondre, dis-le en une phrase. " +
          "Réponds en français, à la troisième personne, en deux ou trois phrases maximum, sans formule d'introduction ni liste.",
        messages: [
          {
            role: "user",
            content: `Extraits du portfolio :\n\n${contexte}\n\nQuestion : ${String(question).slice(0, MAX_LONGUEUR_QUESTION)}`,
          },
        ],
      }),
    });

    if (!reponse.ok) {
      return NextResponse.json({ texte: null, motif: "amont indisponible" }, { status: 502 });
    }

    const donnees = (await reponse.json()) as { content?: { type: string; text?: string }[] };
    const texte = donnees.content?.find((b) => b.type === "text")?.text ?? null;

    return NextResponse.json({ texte });
  } catch {
    return NextResponse.json({ texte: null, motif: "amont injoignable" }, { status: 502 });
  }
}
