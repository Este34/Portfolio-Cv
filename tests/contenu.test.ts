import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { construireCorpus } from "../src/content/corpus.ts";
import { PAGE_CV } from "../src/content/pages.ts";
import { COMPETENCES, EXPERIENCES, FORMATION } from "../src/content/parcours.ts";
import { NOTES, texteDeNote } from "../src/content/notes.ts";
import { TRAVAUX, stackAgregee, travailParSlug } from "../src/content/travaux.ts";
import { LANGUES, lien, type Langue } from "../src/lib/langue.ts";
import { CONTACT, NAV_ITEMS, SITE } from "../src/lib/site.ts";

/**
 * Tests du contenu et de ses dérivés.
 *
 * Le contenu est la source de vérité de trois artefacts — pages statiques,
 * tables SQL, corpus vectoriel. Une incohérence entre eux ne casse rien
 * bruyamment : elle produit un site qui se contredit lui-même.
 *
 * Tout ce qui porte du texte est vérifié **dans les deux langues**. C'est le
 * seul moyen d'attraper une traduction vide ou oubliée : le type garantit que
 * la clé existe, pas qu'elle contienne quelque chose.
 */

describe("travaux", () => {
  it("les slugs sont uniques", () => {
    const slugs = TRAVAUX.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("les rangs sont uniques et contigus depuis 1", () => {
    const rangs = [...TRAVAUX.map((t) => t.rang)].sort((a, b) => a - b);
    expect(rangs).toEqual(TRAVAUX.map((_, i) => i + 1));
  });

  it("chaque travail est retrouvable par son slug", () => {
    for (const t of TRAVAUX) expect(travailParSlug(t.slug)?.titre.fr).toBe(t.titre.fr);
  });

  it.each(LANGUES)("chaque travail porte un récit complet [%s]", (langue) => {
    for (const t of TRAVAUX) {
      expect(t.contexte[langue].length, t.slug).toBeGreaterThan(80);
      expect(t.contraintes.length, t.slug).toBeGreaterThan(0);
      expect(t.decisions.length, t.slug).toBeGreaterThan(0);
      expect(t.resultats.length, t.slug).toBeGreaterThan(0);
      expect(t.stack.length, t.slug).toBeGreaterThan(0);
    }
  });

  it.each(LANGUES)("chaque décision est justifiée [%s]", (langue) => {
    // Une décision sans raison n'a aucune valeur sur un portfolio : c'est la
    // justification qu'un recruteur lit, pas le choix.
    for (const t of TRAVAUX) {
      for (const d of t.decisions) {
        expect(d.raison[langue].length, `${t.slug} — ${d.choix.fr}`).toBeGreaterThan(60);
      }
    }
  });

  /**
   * Le garde-fou du bilinguisme.
   *
   * Le type impose la présence des deux clés, pas leur contenu : `en: ""`
   * compile parfaitement et produirait une page anglaise trouée. Et une valeur
   * anglaise identique au français est presque toujours un oubli de traduction,
   * sauf pour les noms propres — d'où la liste d'exceptions, courte et
   * explicite.
   */
  it("aucune traduction n'est vide ni recopiée du français", () => {
    const identiquesAdmis = new Set([
      // Le métier s'écrit pareil dans les deux langues : le traduire par
      // « scientifique des données » serait plus faux que de le laisser.
      "Data scientist · AI engineer",
      // Mots identiques dans les deux langues.
      "Contact",
      "Notes",
      "2026",
      "4",
      "0",
      "93",
      "240",
      "97",
      "384",
      "TS",
      "strict",
      "2000-2025",
      "WebGL",
      "Design system",
      "Agar",
    ]);

    const parcourir = (valeur: unknown, chemin: string) => {
      if (valeur === null || typeof valeur !== "object") return;
      const objet = valeur as Record<string, unknown>;

      if (typeof objet.fr === "string" && typeof objet.en === "string") {
        expect(objet.fr.trim().length, `${chemin}.fr est vide`).toBeGreaterThan(0);
        expect(objet.en.trim().length, `${chemin}.en est vide`).toBeGreaterThan(0);
        if (!identiquesAdmis.has(objet.fr)) {
          expect(objet.en, `${chemin} : anglais identique au français`).not.toBe(objet.fr);
        }
        return;
      }

      for (const [cle, v] of Object.entries(objet)) parcourir(v, `${chemin}.${cle}`);
    };

    for (const t of TRAVAUX) parcourir(t, t.slug);
    parcourir(SITE, "SITE");
    for (const n of NAV_ITEMS) parcourir(n, `nav${n.href}`);
  });

  it("un travail sous anonymat n'expose aucun lien sortant", () => {
    /*
     * La règle a été affinée : un travail anonymisé peut renvoyer vers une
     * démonstration **interne** — une version neutralisée hébergée sur ce site,
     * dont le code et l'interface sont d'origine mais dont les données ont été
     * régénérées. Ce qu'il ne peut pas faire, c'est pointer vers un dépôt ou un
     * domaine qui le rattacherait à son commanditaire.
     */
    for (const t of TRAVAUX) {
      if (t.confidentialite !== "anonymise") continue;
      expect(t.liens.depot, `${t.slug} ne doit pas exposer de dépôt`).toBeUndefined();
      if (t.liens.demo) {
        expect(t.liens.demo.startsWith("/"), `${t.slug} : démo interne attendue`).toBe(true);
      }
    }
  });

  it("agrège la stack par fréquence décroissante", () => {
    const agregee = stackAgregee("fr");
    const occurrences = agregee.map((s) => s.occurrences);
    expect(occurrences).toEqual([...occurrences].sort((a, b) => b - a));
    expect(agregee.find((s) => s.nom === "Python")?.occurrences).toBeGreaterThan(1);
  });
});

describe("identité du site", () => {
  it("les chemins de navigation sont uniques", () => {
    const hrefs = NAV_ITEMS.map((n) => n.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("les chemins de navigation n'ont pas de préfixe de langue en dur", () => {
    // Le préfixe est ajouté par `lien()` à l'affichage. En écrire un ici
    // produirait des URL comme « /fr/fr/travaux » sur la moitié du site.
    for (const n of NAV_ITEMS) {
      expect(n.href, n.href).not.toMatch(/^\/(fr|en)\b/);
    }
  });

  it("n'expose ni adresse postale ni numéro de téléphone", () => {
    // Un portfolio est indexé et archivé ; une adresse personnelle y devient
    // permanente. Le courriel suffit et se change.
    /*
     * Le CV est inclus, et c'est le point de ce test depuis qu'il existe :
     * c'est la page où une adresse et un téléphone se glissent naturellement,
     * parce que c'est là qu'un CV les porte d'habitude. Vérifier uniquement
     * l'identite du site et les coordonnees laissait la porte grande ouverte.
     */
    const serialise = JSON.stringify({ SITE, CONTACT, PAGE_CV, EXPERIENCES, FORMATION, COMPETENCES });
    expect(serialise).not.toMatch(/\b0[1-9]([ .-]?\d{2}){4}\b/);
    /*
     * Le groupe de cinq chiffres ne doit pas être bordé d'un séparateur
     * décimal : sans cette précaution, « 0,00002 % » passait pour un code
     * postal et le test échouait sur une donnée parfaitement légitime.
     */
    expect(serialise).not.toMatch(/(?<![\d.,])\d{5}(?![\d.,])/);
  });
});

describe.each(LANGUES)("corpus dérivé [%s]", (langue: Langue) => {
  const corpus = construireCorpus(langue);

  it("les identifiants de passage sont uniques", () => {
    const ids = corpus.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("chaque passage porte une source et un lien préfixé par sa langue", () => {
    for (const p of corpus) {
      expect(p.source.length, p.id).toBeGreaterThan(0);
      expect(p.href.startsWith(`/${langue}`), `${p.id} → ${p.href}`).toBe(true);
      expect(p.texte.length, p.id).toBeGreaterThan(40);
    }
  });

  it("chaque travail est représenté dans le corpus", () => {
    for (const t of TRAVAUX) {
      expect(
        corpus.some((p) => p.href === lien(`/travaux/${t.slug}`, langue)),
        t.slug,
      ).toBe(true);
    }
  });

  it("les deux langues décrivent le même nombre de passages", () => {
    // Un passage présent d'un côté et pas de l'autre signifierait qu'une
    // question trouve une réponse en français et rien en anglais.
    expect(corpus.length).toBe(construireCorpus("fr").length);
  });
});

describe.each(LANGUES)("tables SQL générées [%s]", (langue: Langue) => {
  it("le fichier contient les sept tables attendues", async () => {
    const chemin = join(process.cwd(), "public", "data", `portfolio-${langue}.json`);
    const donnees = JSON.parse(await readFile(chemin, "utf8")) as Record<string, unknown[]>;

    expect(Object.keys(donnees).sort()).toEqual(
      ["chiffres", "competences", "decisions", "domaines", "parcours", "stack", "travaux"].sort(),
    );
    expect(donnees.travaux.length).toBe(TRAVAUX.length);
    for (const [table, lignes] of Object.entries(donnees)) {
      expect(lignes.length, table).toBeGreaterThan(0);
    }
  });

  it("aucune cellule ne contient un objet bilingue non résolu", async () => {
    /*
     * Le défaut que ce test attrape : oublier un `t(...)` dans le générateur
     * écrirait `{"fr":"…","en":"…"}` dans une cellule. La console SQL
     * afficherait alors du JSON à la place d'un titre, et personne ne le verrait
     * avant qu'un visiteur n'ouvre la console.
     */
    const chemin = join(process.cwd(), "public", "data", `portfolio-${langue}.json`);
    const brut = await readFile(chemin, "utf8");
    expect(brut).not.toMatch(/\{"fr":/);
  });
});

describe("notes techniques", () => {
  it("les slugs sont uniques", () => {
    const slugs = NOTES.map((n) => n.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it.each(LANGUES)("chaque note a un titre, un chapeau et des blocs [%s]", (langue) => {
    for (const n of NOTES) {
      expect(n.titre[langue].length, n.slug).toBeGreaterThan(5);
      expect(n.chapeau[langue].length, n.slug).toBeGreaterThan(60);
      expect(n.blocs.length, n.slug).toBeGreaterThan(5);
      expect(n.sujets.length, n.slug).toBeGreaterThan(0);
    }
  });

  it("la date est une date valide, au format ISO", () => {
    for (const n of NOTES) {
      expect(n.date, n.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(new Date(n.date).getTime()), n.slug).toBe(false);
    }
  });

  it.each(LANGUES)("aucun bloc de prose n'est vide [%s]", (langue) => {
    for (const n of NOTES) {
      for (const [i, bloc] of n.blocs.entries()) {
        const reperage = `${n.slug} bloc ${i} (${bloc.type})`;
        if (bloc.type === "liste") {
          expect(bloc.items.length, reperage).toBeGreaterThan(0);
          for (const item of bloc.items) expect(item[langue].trim().length, reperage).toBeGreaterThan(0);
        } else if (bloc.type === "code") {
          expect(bloc.code[langue].trim().length, reperage).toBeGreaterThan(0);
        } else {
          expect(bloc.texte[langue].trim().length, reperage).toBeGreaterThan(0);
        }
      }
    }
  });

  it.each(LANGUES)("le texte extrait pour la recherche exclut le code [%s]", (langue) => {
    /*
     * Le code n'aide pas une recherche sémantique : il apporte des identifiants
     * et de la ponctuation là où le modèle attend des phrases. L'inclure
     * diluerait le passage, exactement comme les domaines dilués dans un résumé
     * l'ont fait sur les projets.
     */
    for (const n of NOTES) {
      const texte = texteDeNote(n, langue);
      expect(texte.length, n.slug).toBeGreaterThan(400);
      for (const bloc of n.blocs) {
        if (bloc.type !== "code") continue;
        const premiereLigne = bloc.code[langue].split("\n")[0];
        expect(texte.includes(premiereLigne), `${n.slug} : du code dans le corpus`).toBe(false);
      }
    }
  });
});
