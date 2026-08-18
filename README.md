# Portfolio — Esteban Beretti-Prenant

Portfolio personnel, en français et en anglais. Le contenu est du HTML généré au
build ; les moteurs lourds (base analytique, modèle de vectorisation) ne se
chargent qu'à la demande explicite du visiteur.

## Stack

|              |                                                            |
| ------------ | ---------------------------------------------------------- |
| Framework    | Next.js 16 (App Router) + TypeScript strict                |
| Styles       | Tailwind CSS v4, jetons de design maison                    |
| Typographie  | Archivo (titres), Inter (texte), JetBrains Mono (données)   |
| Fonds animés | WebGL 2, shaders GLSL écrits à la main, sans bibliothèque   |
| Console SQL  | DuckDB-WASM, chargé à l'ouverture de la console             |
| Recherche    | transformers.js, vecteurs pré-calculés au build par langue  |
| Simulations  | Canvas 2D, sans bibliothèque                                |
| Tests        | Vitest, et Playwright pour la régression visuelle           |
| Déploiement  | Vercel                                                      |

Langue des commentaires du code : **français**. Langue du site : **française et
anglaise**, voir plus bas.

## Démarrer

```bash
npm install
npm run dev        # http://localhost:3000 — redirige vers /fr
```

Le premier lancement génère les données et télécharge le modèle de
vectorisation (quelques dizaines de méga-octets, une seule fois).

| Commande                            | Rôle                                                     |
| ----------------------------------- | -------------------------------------------------------- |
| `npm run dev`                       | serveur de développement                                  |
| `npm run build`                     | build de production (génère et vérifie d'abord)           |
| `npm test`                          | tests Vitest                                              |
| `npm run test:visuel`               | régression visuelle (construit le site et le sert)        |
| `npm run test:visuel:references`    | régénère les images de référence de la plateforme courante |
| `npm run typecheck`                 | `tsc --noEmit`                                            |
| `npm run lint`                      | ESLint                                                    |
| `npm run generer:donnees`           | régénère `public/data/portfolio-{fr,en}.json`             |
| `npm run generer:embeddings`        | régénère `public/data/embeddings-{fr,en}.{bin,json}`      |
| `npm run verifier:anonymat`         | vérifie qu'aucun terme sous anonymat n'a fuité            |
| `npm run capturer`                  | captures d'inspection, pour juger un rendu                |

## Bilinguisme

Toutes les pages vivent sous `/fr/…` ou `/en/…`, et la racine redirige vers le
français en 307. Le gabarit racine est `src/app/[langue]/layout.tsx` : c'est la
seule forme qui permette de rendre `<html lang>` correctement, ce dont dépend la
prononciation par un lecteur d'écran.

Chaque chaîne traduisible est un objet `{ fr, en }`. C'est plus verbeux que deux
fichiers de traduction séparés, et c'est le but : **le type rend impossible
d'ajouter du contenu français sans sa traduction**, et les deux versions se
relisent côte à côte. Un test échoue si une traduction est vide ou recopiée du
français, avec une courte liste d'exceptions pour les noms propres.

Le corpus du moteur de recherche est vectorisé séparément dans chaque langue :
le modèle est multilingue, mais rendre des extraits français à une question
anglaise n'est pas une réponse.

## Structure

```
src/
  app/
    [langue]/       routes, une arborescence pour les deux langues
    api/rediger/    seul point serveur, facultatif
  components/
    console/        palette Ctrl+K : navigation, SQL, questions
    corpus/         projection du corpus vectorisé, en plan et en volume
    fond/           champ de niveaux en GLSL, fond des bandeaux
    labo/           simulations canvas (réseau, nuée, k-moyennes, agar)
    layout/         en-tête, pied de page
  content/          SOURCE DE VÉRITÉ — travaux, parcours, pages, corpus
  lib/
    langue.ts       types du bilinguisme, résolution des liens
    site.ts         identité du site, anonymisation
    duckdb.ts       chargement paresseux de la base analytique
    rag.ts          recherche augmentée côté navigateur
scripts/            génération des artefacts et vérifications
tests/              Vitest
tests-visuels/      Playwright, et les images de référence versionnées
public/data/        artefacts générés — ne pas éditer à la main
```

## Règles du dépôt

**Le contenu ne s'écrit qu'à un seul endroit.** `src/content/` alimente les
pages, les tables SQL et le corpus de recherche, dans les deux langues. Modifier
un artefact généré de `public/data/` à la main les désynchronise silencieusement
— la CI le détecte, mais autant ne pas le faire.

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

**Les liens internes passent par `lien()`.** Écrire `/travaux` en dur dans un
gabarit produit une URL sans langue ; écrire `/fr/travaux` en produit une qui
ignore la langue de la page. Un test vérifie qu'aucune entrée de navigation ne
porte de préfixe.

## Régression visuelle

`npm run test:visuel` construit le site, le sert, et compare vingt et une
captures à des images de référence versionnées dans
`tests-visuels/apparence.spec.ts-snapshots/`. C'est le seul filet qui attrape ce
qu'aucun test unitaire ne voit : une couleur qui change, un titre qui déborde,
une grille qui s'effondre.

Les canvas des trois simulations à état initial aléatoire sont masqués. Le fond
en shader et la projection du corpus ne le sont pas : ils sont reproductibles,
le premier parce qu'il calcule une image unique à temps fixe en mouvement
réduit, la seconde parce qu'elle n'a pas de boucle d'animation.

**Les références dépendent de la plateforme.** Windows et Linux ne rastérisent
pas le texte de la même façon, et Playwright suffixe donc les images par
système. Le jeu Windows se régénère avec `npm run test:visuel:references` ; le
jeu Linux se régénère depuis l'onglet *Actions* du dépôt, workflow *Régression
visuelle*, bouton *Run workflow*, en cochant « Régénérer les références Linux et
les committer ». Ce job a besoin du droit d'écriture : si le push échoue en 403,
c'est *Settings → Actions → General → Workflow permissions* qui est réglé en
lecture seule.

Une assertion s'ajoute aux images : l'en-tête ne doit jamais passer à la ligne,
à quatre largeurs et dans les deux langues. Elle mesure des hauteurs plutôt que
des pixels, donc elle vaut sur toutes les plateformes — c'est précisément un
écart entre le rendu Windows et le rendu Linux qui a révélé le défaut.

Le jeu complet pèse une dizaine de méga-octets. C'est la raison pour laquelle la
matrice n'est pas complète : l'anglais n'est photographié que sur les pages à
gros titres, le mobile que sur celles dont la mise en page change vraiment, et
le thème clair que sur l'accueil.

## Variables d'environnement

| Variable               | Rôle                                                        |
| ---------------------- | ----------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL` | domaine de production (canonical, Open Graph, hreflang)      |
| `ANTHROPIC_API_KEY`    | facultative — active le bouton « réponse rédigée » du RAG    |

Sans `ANTHROPIC_API_KEY`, la recherche fonctionne intégralement : seule la
reformulation par un modèle est indisponible, et l'interface n'en montre rien.

## Déploiement

`vercel.json` porte deux réglages, et **aucun commentaire** : le schéma de
Vercel rejette toute propriété inconnue, y compris la convention `"//"`. Un
commentaire y fait échouer le déploiement avec `should NOT have additional
property`. Les explications vivent donc ici.

**`installCommand`** désactive le téléchargement du navigateur de Playwright.
Celui-ci ne sert qu'aux captures et à la régression visuelle, exécutées en local
et en intégration ; sans cette variable son installation tire environ 150 Mo à
chaque déploiement, pour un outil que l'environnement de build n'utilise jamais.

**Les en-têtes de cache** couvrent `/data/` et `/demos/` : vecteurs du moteur de
recherche, tables de la console SQL et données du simulateur de démonstration.
Leur contenu est figé pour un déploiement donné, et un nouveau déploiement les
sert sous une nouvelle URL.

Un build échoué se lit dans l'onglet *Deployments* du projet, jamais dans
*Logs* — ce dernier ne montre que le trafic HTTP de la version déjà en ligne.
