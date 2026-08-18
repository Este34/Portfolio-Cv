// Import relatif volontaire : voir la note dans `travaux.ts`.
import type { Bilingue, Langue } from "../lib/langue.ts";

/**
 * Notes techniques.
 *
 * ## Pourquoi ce format et pas du MDX
 *
 * Une note est une suite de blocs typés, pas du texte libre. Le bilinguisme y
 * est pour beaucoup : avec du MDX, il faudrait deux fichiers par note, qui
 * divergeraient à la première correction. Ici le type impose la paire, et un
 * bloc de code est partagé — un identifiant de variable ne se traduit pas.
 *
 * Le coût est réel : pas de mise en forme riche dans un paragraphe. C'est
 * accepté. Une note technique se lit sur du texte suivi, des titres, des listes
 * et du code ; le reste est de la décoration qui complique la relecture.
 */

export type Bloc =
  | { type: "paragraphe"; texte: Bilingue }
  | { type: "titre"; texte: Bilingue }
  | { type: "liste"; items: readonly Bilingue[] }
  | { type: "citation"; texte: Bilingue }
  /** Le code n'est pas traduit : seuls les commentaires le sont, s'il y en a. */
  | { type: "code"; langage: string; code: Bilingue };

export type Note = {
  slug: string;
  titre: Bilingue;
  chapeau: Bilingue;
  /** Format ISO, affiché selon la langue. */
  date: string;
  minutes: number;
  sujets: readonly Bilingue[];
  blocs: readonly Bloc[];
};

export const NOTES: readonly Note[] = [
  {
    slug: "un-champ-vide-ne-vaut-pas-zero",
    titre: {
      fr: "Un champ vide ne vaut pas zéro",
      en: "An empty field is not a zero",
    },
    chapeau: {
      fr: "Porter un modèle d'un tableur vers du code, ce n'est pas traduire des formules. C'est retrouver les conventions que le tableur applique sans les écrire nulle part. En voici une, et ce qu'elle a failli coûter.",
      en: "Porting a model out of a spreadsheet is not translating formulas. It is recovering the conventions the spreadsheet applies without writing them down anywhere. Here is one, and what it nearly cost.",
    },
    date: "2026-08-18",
    minutes: 9,
    sujets: [
      { fr: "Portage de modèle", en: "Model porting" },
      { fr: "Sémantique des données", en: "Data semantics" },
      { fr: "Vérification", en: "Verification" },
    ],
    blocs: [
      {
        type: "paragraphe",
        texte: {
          fr: "Le simulateur agricole que j'ai porté propose un mode libre : le visiteur y règle lui-même les paramètres au lieu de choisir une trajectoire toute faite. L'écran affiche quatre-vingt-treize cultures, chacune avec sa surface, son rendement et ses pratiques. Quatre-vingt-treize lignes, et donc plusieurs centaines de champs de saisie.",
          en: "The agriculture simulator I ported offers a free mode: instead of picking a ready-made trajectory, the visitor sets the parameters themselves. The screen lists ninety-three crops, each with its acreage, its yield and its practices. Ninety-three rows, and therefore several hundred input fields.",
        },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "Personne ne les remplit tous. C'est même le contraire : on vient renseigner deux ou trois cultures qu'on connaît, et on laisse le reste tranquille. La question qui décide de tout est donc celle-ci : que vaut un champ qu'on n'a pas touché ?",
          en: "Nobody fills them all in. Quite the opposite: you come to set two or three crops you know about, and you leave the rest alone. So the question that decides everything is this one: what is an untouched field worth?",
        },
      },

      {
        type: "titre",
        texte: { fr: "Trois façons d'écrire la même erreur", en: "Three ways to write the same bug" },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "En JavaScript, un champ vide vous tend trois pièges, et les trois se ressemblent assez pour qu'aucune relecture ne les distingue d'un traitement correct.",
          en: "In JavaScript an empty field lays three traps, and all three look enough like correct handling that no code review will tell them apart.",
        },
      },
      {
        type: "code",
        langage: "javascript",
        code: {
          fr: `const brut = champ.value; // "" quand personne n'a rien saisi

Number(brut)          // 0        — la coercition la plus discrète
parseFloat(brut)      // NaN      — qui contaminera toute la chaîne
Number(brut) || 0     // 0        — et qui avale aussi le vrai zéro
brut === "" ? 0 : …   // 0        — cette fois on l'a écrit exprès`,
          en: `const raw = field.value; // "" when nobody typed anything

Number(raw)           // 0        — the quietest coercion of them all
parseFloat(raw)       // NaN      — which then poisons the whole chain
Number(raw) || 0      // 0        — and this one swallows real zeros too
raw === "" ? 0 : …    // 0        — at least this one is deliberate`,
        },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "La troisième ligne est la plus intéressante, parce qu'elle est la plus fréquente et qu'elle contient deux fautes au lieu d'une. Elle transforme le vide en zéro, ce qui est le sujet de cette note ; et elle transforme aussi le zéro saisi volontairement en zéro par défaut, ce qui revient à effacer une intention. Un agriculteur qui écrit 0 dit quelque chose. Un champ vide ne dit rien.",
          en: "The third line is the interesting one, because it is the most common and it contains two mistakes rather than one. It turns emptiness into zero, which is the subject of this note; and it also turns a deliberately typed zero into a default zero, which is to erase an intention. Someone who types 0 is saying something. An empty field says nothing.",
        },
      },

      {
        type: "titre",
        texte: { fr: "Ce que le classeur voulait dire", en: "What the workbook meant" },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "Le classeur d'origine n'appliquait aucune de ces trois règles. Chez lui, une cellule laissée vide signifie « je ne me prononce pas sur cette culture », et la formule en aval va chercher la valeur tendancielle — celle que la culture aurait si rien ne changeait. Vide ne veut pas dire zéro : vide veut dire par défaut, et le défaut n'est pas nul, il est calculé.",
          en: "The original workbook applied none of those three rules. In it, a cell left empty means «I am not taking a position on this crop», and the formula downstream reaches for the baseline value, the one the crop would have if nothing changed. Empty does not mean zero: empty means default, and the default is not null, it is computed.",
        },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "Cette convention n'est écrite nulle part. Elle n'apparaît ni dans la documentation, ni dans un commentaire, ni dans un nom de colonne. Elle existe uniquement dans la forme d'une formule, quelque part au milieu d'une feuille de calcul, et dans la tête des trois personnes qui s'en servent tous les jours.",
          en: "That convention is written nowhere. It appears in no documentation, no comment, no column name. It exists only in the shape of a formula, somewhere in the middle of a worksheet, and in the heads of the three people who use it every day.",
        },
      },

      {
        type: "titre",
        texte: {
          fr: "Un logiciel qui marche parfaitement et répond faux",
          en: "Software that works perfectly and answers wrongly",
        },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "Voici ce que ma première version produisait. On ouvre le mode libre, on modifie une culture, on regarde la courbe : les quatre-vingt-douze autres viennent de tomber à zéro. Pas d'erreur, pas d'avertissement, pas de valeur aberrante. Un graphique parfaitement dessiné, avec des axes justes, qui décrit un pays où l'on aurait cessé de produire quatre-vingt-douze cultures sur quatre-vingt-treize.",
          en: "Here is what my first version produced. You open free mode, you change one crop, you look at the curve: the other ninety-two have just dropped to zero. No error, no warning, no absurd value. A perfectly drawn chart, with correct axes, describing a country that had stopped producing ninety-two crops out of ninety-three.",
        },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "Le défaut le plus grave n'était pas là. Il était dans ce que cette règle rendait impossible : depuis le mode libre, la trajectoire tendancielle devenait inatteignable. Il aurait fallu ressaisir à la main les quatre-vingt-treize valeurs de référence pour retrouver la courbe que l'écran est précisément censé permettre de prolonger. L'outil interdisait son cas d'usage principal, et il l'interdisait en silence.",
          en: "The worst defect was not that. It was in what the rule made impossible: from free mode, the baseline trajectory became unreachable. You would have had to retype all ninety-three reference values by hand to get back the curve that the screen exists to let you extend. The tool forbade its own primary use case, and it forbade it silently.",
        },
      },
      {
        type: "citation",
        texte: {
          fr: "Se tromper sur une convention produit un logiciel qui fonctionne parfaitement et répond faux. C'est la seule catégorie de défaut qu'aucun utilisateur ne signalera, parce que rien ne lui indique qu'il y a quelque chose à signaler.",
          en: "Getting a convention wrong produces software that works perfectly and answers wrongly. It is the one category of defect no user will ever report, because nothing tells them there is anything to report.",
        },
      },

      {
        type: "titre",
        texte: { fr: "Pourquoi les tests ne l'attrapent pas", en: "Why tests do not catch it" },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "J'avais des tests. Ils passaient. Ils vérifiaient que la chaîne de calcul rendait les bons nombres pour les entrées que je lui donnais, et c'était le cas : le portage était juste. Le défaut n'était pas dans le code, il était entre le modèle et le code, dans la traduction d'une intention en type de données.",
          en: "I had tests. They passed. They checked that the calculation chain returned the right numbers for the inputs I gave it, and it did: the port was correct. The defect was not in the code, it was between the model and the code, in the translation of an intention into a data type.",
        },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "Un test unitaire ne vérifie que ce qu'on a pensé à vérifier. Or on ne pense jamais à écrire un test sur une convention qu'on ignore : c'est précisément la définition d'un angle mort. Ce qui rattrape ce genre de défaut, ce n'est pas un test, c'est un oracle — quelque chose qui connaît la bonne réponse sans que je la lui aie apprise.",
          en: "A unit test only checks what you thought to check. And you never think to write a test for a convention you do not know about: that is the definition of a blind spot. What catches this kind of defect is not a test, it is an oracle — something that knows the right answer without my having taught it.",
        },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "Sur ce projet, l'oracle est le classeur lui-même. Le générateur de données rejoue les trajectoires de référence avec le modèle porté en JavaScript, les compare feuille à feuille aux sorties du tableur, et refuse d'écrire le jeu de données au-delà de 0,1 % d'écart. C'est ce garde-fou, et lui seul, qui a fait remonter l'affaire : la trajectoire tendancielle ne tombait plus au bon endroit, et la génération s'est arrêtée.",
          en: "On this project the oracle is the workbook itself. The data generator replays the reference trajectories through the JavaScript port, compares them sheet by sheet against the spreadsheet's outputs, and refuses to write the dataset past 0.1% drift. That guardrail, and nothing else, is what surfaced the problem: the baseline trajectory stopped landing where it should, and generation halted.",
        },
      },

      {
        type: "titre",
        texte: {
          fr: "Comment on trouve ces conventions",
          en: "How to find these conventions",
        },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "Il n'existe pas de méthode complète, mais il existe des endroits où regarder. Les quatre qui m'ont le plus servi :",
          en: "There is no complete method, but there are places to look. The four that have served me best:",
        },
      },
      {
        type: "liste",
        items: [
          {
            fr: "Chercher les cellules vides du classeur, et lire la formule qui les consomme. Une cellule vide dans une feuille de référence n'est presque jamais un oubli — c'est une valeur, exprimée par son absence.",
            en: "Look for the empty cells in the workbook, then read the formula that consumes them. An empty cell in a reference sheet is almost never an oversight; it is a value expressed by its absence.",
          },
          {
            fr: "Chercher les fonctions de test de vide. Un SI(ESTVIDE(...)) est une convention écrite noir sur blanc, la seule fois où l'auteur a pris la peine de la rendre explicite.",
            en: "Look for the emptiness tests. An IF(ISBLANK(...)) is a convention spelled out in the open, the one time the author bothered to make it explicit.",
          },
          {
            fr: "Comparer deux scénarios de référence sur une même grandeur. Là où l'un est vide et l'autre non, la différence de résultat dit ce que le vide signifie.",
            en: "Compare two reference scenarios on the same quantity. Where one is empty and the other is not, the difference in results tells you what emptiness means.",
          },
          {
            fr: "Demander, mais pas en ces termes. « Que se passe-t-il si je laisse cette case vide ? » obtient une réponse vague. « Voici ce que produit mon portage quand la case est vide, est-ce que ça vous paraît juste ? » obtient une correction immédiate.",
            en: "Ask, but not in those words. «What happens if I leave this cell empty?» gets a vague answer. «Here is what my port produces when the cell is empty, does that look right to you?» gets an immediate correction.",
          },
        ],
      },
      {
        type: "paragraphe",
        texte: {
          fr: "La quatrième est de loin la plus efficace, et c'est la moins spontanée. Montrer un résultat faux appelle une réaction ; poser une question abstraite appelle une réponse abstraite.",
          en: "The fourth is by far the most effective, and the least instinctive. Showing a wrong result invites a reaction; asking an abstract question invites an abstract answer.",
        },
      },

      {
        type: "titre",
        texte: { fr: "Comment on les fixe", en: "How to pin them down" },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "Une convention retrouvée doit devenir impossible à reperdre. Deux gestes suffisent, et le premier est purement lexical.",
          en: "A recovered convention has to become impossible to lose again. Two moves are enough, and the first is purely lexical.",
        },
      },
      {
        type: "code",
        langage: "javascript",
        code: {
          fr: `// Avant : la convention n'existe nulle part, elle est dans « ?? 0 »
const surface = Number(saisie.surface) || 0;

// Après : elle porte un nom, elle est testable, et le prochain
// lecteur du fichier ne peut plus la confondre avec un repli technique.
const SUIVRE_LE_TENDANCIEL = Symbol("champ laissé vide");

function lireSurface(saisie, culture) {
  if (saisie.surface.trim() === "") return SUIVRE_LE_TENDANCIEL;
  const valeur = Number(saisie.surface);
  return Number.isFinite(valeur) ? valeur : SUIVRE_LE_TENDANCIEL;
}`,
          en: `// Before: the convention exists nowhere, it hides inside "?? 0"
const acreage = Number(input.acreage) || 0;

// After: it has a name, it is testable, and the next person to read
// the file can no longer mistake it for a technical fallback.
const FOLLOW_THE_BASELINE = Symbol("field left empty");

function readAcreage(input, crop) {
  if (input.acreage.trim() === "") return FOLLOW_THE_BASELINE;
  const value = Number(input.acreage);
  return Number.isFinite(value) ? value : FOLLOW_THE_BASELINE;
}`,
        },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "Le symbole n'est pas un raffinement gratuit. Il ne peut être confondu ni avec 0, ni avec null, ni avec undefined, et surtout il ne peut pas traverser silencieusement une opération arithmétique : toute tentative de l'additionner lève une erreur au lieu de produire un nombre plausible. C'est exactement ce qu'on veut d'une valeur qui n'est pas une valeur.",
          en: "The symbol is not gratuitous polish. It cannot be confused with 0, with null, or with undefined, and above all it cannot slip silently through an arithmetic operation: any attempt to add it throws instead of producing a plausible number. That is precisely what you want from a value that is not a value.",
        },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "Le second geste est l'oracle décrit plus haut. Nommer la convention empêche de la perdre en lisant le code ; l'oracle empêche de la perdre en le modifiant.",
          en: "The second move is the oracle described above. Naming the convention stops you losing it while reading the code; the oracle stops you losing it while changing the code.",
        },
      },

      {
        type: "titre",
        texte: { fr: "Ce n'était pas la seule", en: "It was not the only one" },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "Une fois qu'on a vu la première, on cherche les autres, et on en trouve. Trois figures reviennent d'un classeur à l'autre :",
          en: "Once you have seen the first one, you go looking for the others, and you find them. Three shapes recur from one workbook to the next:",
        },
      },
      {
        type: "liste",
        items: [
          {
            fr: "Le zéro qui veut dire « non renseigné ». L'exact symétrique de notre cas, et il se lit dans les moyennes : si un zéro entre dans le dénominateur, il n'était pas une absence.",
            en: "The zero that means «not recorded». The exact mirror of our case, and it shows up in the averages: if a zero enters the denominator, it was not an absence.",
          },
          {
            fr: "La ligne de total glissée au milieu des données. Elle se somme avec le reste et double tous les agrégats, sans jamais rien casser.",
            en: "The total row slipped in among the data. It sums along with everything else and doubles every aggregate, without ever breaking anything.",
          },
          {
            fr: "L'année de base implicite. Un pourcentage d'évolution suppose un point de départ ; quand ce point n'est écrit nulle part, chaque feuille peut avoir choisi le sien.",
            en: "The implicit base year. A percentage change presupposes a starting point; when that point is written nowhere, each sheet may have picked its own.",
          },
        ],
      },

      {
        type: "titre",
        texte: { fr: "Ce que j'en retiens", en: "What I take from it" },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "Porter un modèle, ce n'est pas traduire des formules. Les formules sont la partie facile : elles sont écrites, elles sont vérifiables, et une comparaison automatique suffit à prouver qu'on ne s'est pas trompé. Le travail réel consiste à retrouver ce que le classeur fait sans le dire, parce que c'est là, et nulle part ailleurs, que se cachent les erreurs qui ne ressemblent pas à des erreurs.",
          en: "Porting a model is not translating formulas. The formulas are the easy part: they are written down, they are checkable, and an automated comparison is enough to prove you did not get them wrong. The real work is recovering what the workbook does without saying so, because that is where — and nowhere else — the mistakes that do not look like mistakes are hiding.",
        },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "C'est aussi pour ça que je n'ai jamais délégué cette partie-là. Un agent écrit très bien le code qui lit un champ ; il ne peut pas deviner qu'un vide n'est pas un zéro, parce que l'information n'est écrite dans aucun fichier qu'on pourrait lui donner à lire.",
          en: "It is also why I have never handed that part over. An agent writes the code that reads a field perfectly well; it cannot guess that an empty field is not a zero, because the information is written in no file you could hand it to read.",
        },
      },
    ],
  },
];

export function noteParSlug(slug: string): Note | undefined {
  return NOTES.find((n) => n.slug === slug);
}

/** Les notes, de la plus récente à la plus ancienne. */
export const NOTES_TRIEES = [...NOTES].sort((a, b) => b.date.localeCompare(a.date));

/** Texte brut d'une note, pour le corpus du moteur de recherche. */
export function texteDeNote(note: Note, langue: Langue): string {
  const morceaux: string[] = [note.titre[langue], note.chapeau[langue]];
  for (const bloc of note.blocs) {
    if (bloc.type === "code") continue; // le code n'aide pas la recherche sémantique
    if (bloc.type === "liste") morceaux.push(bloc.items.map((i) => i[langue]).join(" "));
    else morceaux.push(bloc.texte[langue]);
  }
  return morceaux.join(" ");
}
