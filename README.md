# Portfolio — Esteban Beretti-Prenant

Portfolio personnel. Le contenu est du HTML généré au build ; les moteurs
lourds (base analytique, modèle de vectorisation) ne se chargent qu'à la
demande explicite du visiteur.

## Stack

|              |                                                            |
| ------------ | ---------------------------------------------------------- |
| Framework    | Next.js 16 (App Router) + TypeScript strict                |
| Styles       | Tailwind CSS v4, jetons de design maison                    |
| Typographie  | Archivo (titres), Inter (texte), JetBrains Mono (données)   |
| Console SQL  | DuckDB-WASM, chargé à l'ouverture de la console             |
| Recherche    | transformers.js, vecteurs pré-calculés au build             |
| Simulations  | Canvas 2D, sans bibliothèque                                |
| Tests        | Vitest                                                      |
| Déploiement  | Vercel                                                      |

Langue de l'interface, des contenus et des commentaires : **français**.

## Démarrer

```bash
npm install
npm run dev        # http://localhost:3000
```

Le premier lancement génère les données et télécharge le modèle de
vectorisation (quelques dizaines de méga-octets, une seule fois).

| Commande                     | Rôle                                              |
| ---------------------------- | ------------------------------------------------- |
| `npm run dev`                | serveur de développement                          |
| `npm run build`              | build de production (génère et vérifie d'abord)   |
| `npm test`                   | tests Vitest                                      |
| `npm run typecheck`          | `tsc --noEmit`                                    |
| `npm run lint`               | ESLint                                            |
| `npm run generer:donnees`    | régénère `public/data/portfolio.json`             |
| `npm run generer:embeddings` | régénère `public/data/embeddings.{bin,json}`      |
| `npm run verifier:anonymat`  | vérifie qu'aucun terme sous anonymat n'a fuité    |

## Structure

```
src/
  app/              routes (App Router), URL françaises
    api/rediger/    seul point serveur, facultatif
  components/
    console/        palette Ctrl+K : navigation, SQL, questions
    labo/           simulations canvas (nuée, k-moyennes, agar)
    layout/         en-tête, pied de page
  content/          SOURCE DE VÉRITÉ — travaux, parcours, corpus
  lib/
    site.ts         identité du site, anonymisation
    duckdb.ts       chargement paresseux de la base analytique
    rag.ts          recherche augmentée côté navigateur
scripts/            génération des artefacts et vérifications
tests/              Vitest
public/data/        artefacts générés — ne pas éditer à la main
```

## Règles du dépôt

**Le contenu ne s'écrit qu'à un seul endroit.** `src/content/` alimente les
pages, les tables SQL et le corpus de recherche. Modifier un artefact généré de
`public/data/` à la main les désynchronise silencieusement — la CI le détecte,
mais autant ne pas le faire.

**L'anonymisation n'est pas négociable.** Les travaux menés en alternance sont
présentés sans nommer l'organisme, ses instituts, ses sites, ses modèles ni ses
territoires. La formulation est décidée dans `lib/site.ts` (`EMPLOYEUR`), et
`npm run verifier:anonymat` échoue si un terme interdit réapparaît. Ce script
tourne avant chaque build.

**Les moteurs lourds restent hors du lot initial.** `lib/duckdb.ts` et
`lib/rag.ts` ne doivent jamais être importés statiquement depuis un composant.
Les types et constantes nécessaires à l'interface vivent dans `duckdb-types.ts`
et `rag-types.ts`, précisément pour éviter qu'un import de type ne tire un
moteur de plusieurs dizaines de méga-octets dans la première page.

## Variables d'environnement

| Variable               | Rôle                                                        |
| ---------------------- | ----------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL` | domaine de production (canonical, Open Graph, sitemap)       |
| `ANTHROPIC_API_KEY`    | facultative — active le bouton « réponse rédigée » du RAG    |

Sans `ANTHROPIC_API_KEY`, la recherche fonctionne intégralement : seule la
reformulation par un modèle est indisponible, et l'interface n'en montre rien.
