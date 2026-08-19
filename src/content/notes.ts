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
    slug: "le-cosinus-n-est-pas-une-note",
    titre: {
      fr: "Le cosinus n'est pas une note",
      en: "A cosine is not a grade",
    },
    chapeau: {
      fr: "J'ai construit un banc d'évaluation pour mon propre moteur de recherche, en pensant confirmer qu'il marchait. Il marche : 71 % de rappel. Ce sont les 29 % restants qui m'ont appris quelque chose, et une bonne réponse qui marque moins qu'un contresens.",
      en: "I built an evaluation bench for my own search engine, expecting to confirm it worked. It does: 71% recall. It is the remaining 29% that taught me something, and one right answer scoring lower than one piece of nonsense.",
    },
    date: "2026-08-19",
    minutes: 11,
    sujets: [
      { fr: "Recherche augmentée", en: "Retrieval-augmented search" },
      { fr: "Évaluation", en: "Evaluation" },
      { fr: "Similarité cosinus", en: "Cosine similarity" },
    ],
    blocs: [
      {
        type: "paragraphe",
        texte: {
          fr: "La console de ce site répond aux questions en comparant votre phrase à cinquante-cinq passages vectorisés. Elle marchait, au sens où je lui posais des questions et où les réponses avaient l'air bonnes. C'est le mode d'échec propre à cette famille d'outils : on ne distingue pas à l'œil un système qui trouve d'un système qui devine, parce que les deux produisent le même objet à l'écran. Un extrait, une source, un score.",
          en: "This site's console answers questions by comparing your sentence to fifty-five embedded passages. It worked, in the sense that I asked it questions and the answers looked right. That is the failure mode peculiar to this family of tools: you cannot tell by eye a system that finds from a system that guesses, because both produce the same object on screen. A passage, a source, a score.",
        },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "J'ai donc fixé d'avance ce qui répond. Dix-huit questions, dont quatre qui n'ont volontairement aucune réponse dans le corpus, et pour chacune la liste des passages qui y répondent vraiment, établie en lisant les passages. Puis j'ai mesuré. Le résultat tient en quatre nombres : 71 % de rappel, 0,52 de rang réciproque moyen, 30 % de précision, 75 % de silence sur les questions hors sujet.",
          en: "So I fixed in advance what counts as an answer. Eighteen questions, four of which deliberately have no answer in the corpus, and for each the list of passages that genuinely answer it, drawn up by reading the passages. Then I measured. The result fits in four numbers: 71% recall, 0.52 mean reciprocal rank, 30% precision, 75% silence on the off-topic questions.",
        },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "Le banc est en ligne, chaque cas y est montré, et un bouton rejoue l'évaluation entière dans votre navigateur. Ce qui suit n'est pas le compte rendu de ces chiffres. C'est ce que les cinq échecs m'ont dit, et qui n'était dans aucun des quatre nombres.",
          en: "The bench is online, every case is shown, and a button replays the whole evaluation in your browser. What follows is not a report of those figures. It is what the five failures told me, and none of it was in the four numbers.",
        },
      },

      {
        type: "titre",
        texte: {
          fr: "Deux erreurs opposées, le même seuil, la même page",
          en: "Two opposite errors, the same threshold, the same page",
        },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "Le moteur écarte les passages dont le score tombe sous un seuil, pour pouvoir répondre « je n'ai rien là-dessus » plutôt que d'exhiber le passage le moins mauvais. Le seuil valait 0,22, posé au jugé. Deux cas du banc l'ont mis en pièces, et ils vont dans des directions opposées.",
          en: "The engine discards passages whose score falls below a threshold, so it can say «I have nothing on that» instead of parading the least bad passage. The threshold was 0.22, set by feel. Two cases in the bench took it apart, and they point in opposite directions.",
        },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "« Comment configure-t-il un cluster Kubernetes ? » n'a aucune réponse ici : je n'ai jamais touché à Kubernetes, et rien du corpus n'en parle. Le moteur cite pourtant quatre passages, dont le premier marque 0,465. C'est le résultat de mon projet de plateforme, qui parle de socle de composants, d'intégration continue et de déploiement à chaque fusion. Du vocabulaire d'infrastructure, pas le bon, mais du bon champ lexical.",
          en: "«How does he configure a Kubernetes cluster?» has no answer here: I have never touched Kubernetes, and nothing in the corpus mentions it. Yet the engine cites four passages, the first scoring 0.465. That is my platform project's results, which talk about a shared component base, continuous integration and deployment on every merge. Infrastructure vocabulary. The wrong one, but the right lexical field.",
        },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "« Où travaille-t-il en ce moment ? » a une réponse, une seule, et le moteur ne la trouve pas. Il ne rend qu'un passage, à 0,228, soit huit millièmes au-dessus du seuil, et ce n'est pas le bon. La bonne réponse est passée dessous. Sur la même page, avec le même seuil, il a laissé passer un contresens et coupé une réponse juste.",
          en: "«Where is he working right now?» has an answer, exactly one, and the engine does not find it. It returns a single passage, at 0.228, eight thousandths above the threshold, and it is the wrong one. The right answer fell below. On the same page, with the same threshold, it let nonsense through and cut a correct answer.",
        },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "Le chiffre qui achève l'affaire est ailleurs. « Comment vérifie-t-il que son code est juste ? » réussit parfaitement : le bon passage sort en première position. Son score est de 0,392. Autrement dit, la meilleure réponse à une vraie question marque moins que le bruit renvoyé sur Kubernetes.",
          en: "The number that settles it is elsewhere. «How does he check that his code is correct?» succeeds perfectly: the right passage comes out first. Its score is 0.392. Which is to say the best answer to a real question scores lower than the noise returned for Kubernetes.",
        },
      },
      {
        type: "citation",
        texte: {
          fr: "Aucun seuil global ne peut séparer 0,392 quand c'est juste de 0,465 quand c'est faux.",
          en: "No global threshold can separate 0.392 when it is right from 0.465 when it is wrong.",
        },
      },

      {
        type: "titre",
        texte: {
          fr: "Le score n'est comparable qu'à l'intérieur d'une question",
          en: "The score only compares within one question",
        },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "Ce n'est pas un accident, c'est ce que mesure un cosinus. Il donne l'angle entre deux vecteurs, et cet angle dépend d'où la question tombe dans l'espace du modèle autant que de la pertinence des passages. Les espaces d'embedding ne sont pas isotropes : les vecteurs s'entassent dans un cône étroit, et une question dont la direction pointe vers le cœur de ce cône obtient des scores élevés avec à peu près tout.",
          en: "This is not an accident, it is what a cosine measures. It gives the angle between two vectors, and that angle depends on where the question lands in the model's space as much as on how relevant the passages are. Embedding spaces are not isotropic: the vectors bunch into a narrow cone, and a question whose direction points at the heart of that cone scores high against nearly everything.",
        },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "Le classement à l'intérieur d'une question reste donc valable : comparer 0,465 à 0,395 pour la même question a un sens, et c'est exactement ce que le moteur fait quand il trie. Comparer 0,392 pour une question à 0,465 pour une autre n'en a aucun. Or c'est précisément ce qu'un seuil global suppose. Il traite un nombre non calibré comme s'il l'était.",
          en: "So ranking within one question stays valid: comparing 0.465 to 0.395 for the same question means something, and that is exactly what the engine does when it sorts. Comparing 0.392 for one question to 0.465 for another means nothing at all. Which is precisely what a global threshold assumes. It treats an uncalibrated number as if it were calibrated.",
        },
      },

      {
        type: "titre",
        texte: {
          fr: "J'ai cherché une meilleure statistique, et je ne l'ai pas trouvée",
          en: "I looked for a better statistic, and did not find one",
        },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "Si le score absolu ne dit rien, une quantité relative à la question devrait mieux marcher. L'idée est simple : un passage vraiment pertinent devrait se détacher du reste du corpus pour cette question-là. J'en ai essayé trois, sur les mêmes dix-huit questions, et j'ai regardé si l'une séparait les quatorze questions qui ont une réponse des quatre qui n'en ont pas.",
          en: "If the absolute score says nothing, a quantity relative to the question ought to work better. The idea is simple: a genuinely relevant passage should stand out from the rest of the corpus for that particular question. I tried three of them, on the same eighteen questions, and looked at whether any separated the fourteen questions that have an answer from the four that do not.",
        },
      },
      {
        type: "liste",
        items: [
          {
            fr: "L'écart entre le premier et le deuxième. Minimum sur les questions avec réponse : 0,003. Maximum sur les questions sans réponse : 0,078. Les intervalles se chevauchent, et dans le mauvais sens.",
            en: "The gap between first and second. Minimum on questions with an answer: 0.003. Maximum on questions without one: 0.078. The intervals overlap, and the wrong way round.",
          },
          {
            fr: "Le rapport du premier à la médiane du corpus. Minimum avec réponse : 1,778. Maximum sans réponse : 1,797. Dix-neuf millièmes d'écart, du mauvais côté. C'est la plus prometteuse des trois, et elle échoue de peu, ce qui est la façon la plus agaçante d'échouer.",
            en: "The ratio of the top score to the corpus median. Minimum with an answer: 1.778. Maximum without: 1.797. Nineteen thousandths apart, on the wrong side. It is the most promising of the three, and it fails narrowly, which is the most annoying way to fail.",
          },
          {
            fr: "Le nombre d'écarts-types entre le premier et la moyenne du corpus. Minimum avec réponse : 1,95. Maximum sans réponse : 3,09. Non seulement ça ne sépare pas, mais la question sur la météo de demain obtient le troisième meilleur score de tout le jeu.",
            en: "The number of standard deviations between the top score and the corpus mean. Minimum with an answer: 1.95. Maximum without: 3.09. Not only does it fail to separate, but the question about tomorrow's weather gets the third-best score in the whole set.",
          },
        ],
      },
      {
        type: "paragraphe",
        texte: {
          fr: "Ce dernier point mérite qu'on s'y arrête, parce qu'il est contre-intuitif. La question sur la météo est totalement étrangère au corpus, donc tous les passages y marquent bas, et la médiane devient négative. Le meilleur passage, même médiocre, se détache alors énormément d'un fond uniformément nul. Se détacher du corpus et être pertinent sont deux choses différentes, et cette statistique confond les deux. Au passage, un rapport dont le dénominateur peut devenir négatif n'est pas une statistique.",
          en: "That last point deserves a pause, because it is counter-intuitive. The weather question is entirely foreign to the corpus, so every passage scores low against it, and the median goes negative. The best passage, mediocre as it is, then stands out enormously from a uniformly flat background. Standing out from the corpus and being relevant are two different things, and this statistic confuses them. Incidentally, a ratio whose denominator can go negative is not a statistic.",
        },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "Il y a tout de même un résultat utile là-dedans. Trois des quatre questions hors corpus se séparent trivialement : leur meilleur score est de 0,127, 0,125 et 0,204, très en dessous de tout le reste. Une seule résiste, celle sur Kubernetes, et elle résiste à toutes les statistiques essayées. Le problème n'est donc pas « le seuil ne marche pas », il est « le seuil marche sauf quand la question emprunte le champ lexical du corpus sans en emprunter le sujet ». C'est un énoncé plus étroit, et donc plus utile.",
          en: "There is a useful result in there all the same. Three of the four out-of-corpus questions separate trivially: their top scores are 0.127, 0.125 and 0.204, far below everything else. Only one resists, the Kubernetes one, and it resists every statistic I tried. So the problem is not «the threshold does not work», it is «the threshold works except when a question borrows the corpus's lexical field without borrowing its subject». That is a narrower statement, and therefore a more useful one.",
        },
      },

      {
        type: "titre",
        texte: {
          fr: "Trois échecs, trois causes, une seule dans le modèle",
          en: "Three failures, three causes, only one of them in the model",
        },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "Les trois autres échecs n'ont rien à voir entre eux, ce qui est déjà une information : il n'y a pas un défaut, il y en a plusieurs, et deux ne sont pas là où on les cherche.",
          en: "The other three failures have nothing in common, which is itself information: there is not one defect, there are several, and two of them are not where you would look.",
        },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "« Quel projet fonctionne sans serveur, entièrement dans le navigateur ? » remonte quatre passages qui parlent tous de tourner sans serveur, venant de trois projets différents. Le modèle a parfaitement compris le thème. Ce qu'il n'a pas fait, c'est discriminer : trois de mes projets disent « moi », et un seul a raison. La similarité thématique n'est pas la pertinence, et aucun réglage de seuil ne corrige ça.",
          en: "«Which project runs without a server, entirely in the browser?» brings back four passages that all talk about running without a server, from three different projects. The model understood the topic perfectly. What it did not do is discriminate: three of my projects say «me», and only one is right. Topical similarity is not relevance, and no threshold tuning fixes that.",
        },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "« Avec quels outils écrit-il ses tests ? » est le cas le plus instructif, parce que la réponse est écrite noir sur blanc dans le corpus. Le passage attendu contient littéralement « Tests (Vitest, Playwright) ». Il n'est pas rendu. Ce qui remonte à sa place, c'est ma phrase de présentation, à 0,545.",
          en: "«Which tools does he write his tests with?» is the most instructive case, because the answer is written in black and white in the corpus. The expected passage literally contains «Tests (Vitest, Playwright)». It is not returned. What comes back instead is my introduction sentence, at 0.545.",
        },
      },
      {
        type: "code",
        langage: "text",
        code: {
          fr: "competences-Pratiques :\n« Compétences en pratiques : Vérification numérique de portage,\n  Tests (Vitest, Playwright), Intégration continue, Accessibilité,\n  Documentation. »",
          en: "competences-Pratiques:\n«Skills in practices: numerical porting verification,\n  Tests (Vitest, Playwright), continuous integration, accessibility,\n  documentation.»",
        },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "Cinq sujets sans rapport dans une seule énumération. Le vecteur d'un passage est la moyenne des vecteurs de ses mots : la moyenne de cinq directions différentes ne pointe vers aucune des cinq. Le passage est proche de « quelles sont ses compétences ? » et loin de chacune de ses cinq compétences prise séparément. La cause n'est pas le modèle, c'est mon découpage du corpus : j'ai fabriqué un passage qui répond mal à toute question précise.",
          en: "Five unrelated subjects in a single enumeration. A passage's vector is the mean of its words' vectors: the mean of five different directions points at none of the five. The passage is close to «what are his skills?» and far from each of its five skills taken separately. The cause is not the model, it is my chunking of the corpus: I built a passage that answers any precise question badly.",
        },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "« Que fait son pipeline quand l'extraction est interrompue ? » échoue de la même famille. Les deux premiers passages rendus sont le contexte et le résumé du bon projet ; celui qui décrit réellement le point de reprise sur disque n'y est pas. Le moteur trouve le bon projet et le mauvais passage. Là encore, une question de granularité plutôt que de modèle.",
          en: "«What does his pipeline do when the extraction is interrupted?» fails in the same family. The top two passages returned are the right project's context and summary; the one that actually describes the on-disk checkpoint is missing. The engine finds the right project and the wrong passage. Again, a granularity problem rather than a model one.",
        },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "Sur cinq échecs, deux viennent du modèle et trois de la façon dont j'ai découpé mon propre corpus. Je serais parti chercher un meilleur modèle d'embedding.",
          en: "Of five failures, two come from the model and three from how I chunked my own corpus. I would have gone looking for a better embedding model.",
        },
      },

      {
        type: "titre",
        texte: {
          fr: "La vérité terrain est un jugement, et le mien est discutable",
          en: "The ground truth is a judgement, and mine is arguable",
        },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "Un banc d'évaluation n'est pas un instrument neutre : c'est quelqu'un qui a décidé de ce qui compte comme bonne réponse. Ici, c'est moi, sur un corpus que j'ai écrit. Un exemple précis de ce que ça coûte.",
          en: "An evaluation bench is not a neutral instrument: it is someone who decided what counts as a right answer. Here that someone is me, on a corpus I wrote. One precise example of what that costs.",
        },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "À la question « a-t-il déjà travaillé sur de l'intelligence artificielle ? », le passage qui sort premier, à 0,618, est la ligne de mon master en ingénierie de l'IA. Je ne l'ai pas étiqueté comme une bonne réponse : un diplôme en cours n'est pas du travail, et la question dit « travaillé ». Cette décision fait baisser le rang réciproque moyen. Quelqu'un d'autre l'aurait comptée juste, et le chiffre publié serait meilleur sans que le moteur ait changé d'un octet.",
          en: "For the question «has he already worked on artificial intelligence?», the passage that comes out first, at 0.618, is the line about my AI engineering master's. I did not label it a right answer: a degree in progress is not work, and the question says «worked». That decision lowers the mean reciprocal rank. Someone else would have counted it correct, and the published figure would be better without the engine having changed by a single byte.",
        },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "Le piège plus grave est l'ordre des opérations. Étiqueter après avoir vu ce que le moteur renvoie garantit un bon score et ne mesure que sa propre complaisance. J'ai donc étiqueté en lisant les passages, avant de lancer quoi que ce soit. C'est une règle qu'on ne peut pas vérifier de l'extérieur : vous devez me croire sur parole, ou contester une étiquette. Le jeu est versionné et lisible pour que la seconde option existe.",
          en: "The graver trap is the order of operations. Labelling after seeing what the engine returns guarantees a good score and measures nothing but your own indulgence. So I labelled by reading the passages, before running anything. That is a rule nobody can verify from the outside: you have to take my word for it, or contest a label. The set is versioned and readable so that the second option exists.",
        },
      },

      {
        type: "titre",
        texte: { fr: "Ce que je ne change pas", en: "What I am not changing" },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "Le réflexe, une fois qu'on a un banc, est de régler jusqu'à ce que le chiffre monte. J'ai balayé le seuil de 0,14 à 0,42 et j'ai obtenu ceci : le rappel reste à 71 % de 0,14 à 0,34, puis s'effondre. Le silence, lui, passe de 50 % à 75 % entre 0,18 et 0,22, et n'évolue plus ensuite. La précision gagne deux points entre 0,22 et 0,30.",
          en: "The reflex, once you have a bench, is to tune until the number goes up. I swept the threshold from 0.14 to 0.42 and got this: recall stays at 71% from 0.14 to 0.34, then collapses. Silence goes from 50% to 75% between 0.18 and 0.22, and does not move after that. Precision gains two points between 0.22 and 0.30.",
        },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "Deux points de précision sur quatorze questions, c'est un passage qui change de place. Déplacer le seuil pour ça, ce serait optimiser sur un jeu trop petit pour trancher, et se retrouver avec une valeur qui décrit ces dix-huit questions plutôt que le moteur. Le seuil reste donc à 0,22, qui est le plus petit à atteindre le silence maximal : le bord gauche du plateau, choisi du côté du rappel. La différence, c'est qu'il est maintenant justifié au lieu d'être posé.",
          en: "Two precision points on fourteen questions is one passage moving. Shifting the threshold for that would mean optimising on a set too small to decide, and ending up with a value that describes these eighteen questions rather than the engine. So the threshold stays at 0.22, the smallest one that reaches maximum silence: the left edge of the plateau, chosen on the recall side. The difference is that it is now justified instead of merely set.",
        },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "Ce que je changerai, en revanche, c'est le découpage du corpus, puisque c'est là que sont trois échecs sur cinq. Découper les énumérations de compétences en passages d'un sujet chacun devrait suffire pour deux d'entre eux. Je le mesurerai avant de l'affirmer.",
          en: "What I will change, on the other hand, is the chunking of the corpus, since that is where three failures out of five live. Splitting the skill enumerations into one-subject passages should be enough for two of them. I will measure it before claiming it.",
        },
      },

      {
        type: "titre",
        texte: {
          fr: "Cette note fait partie du corpus qu'elle décrit",
          en: "This note is part of the corpus it describes",
        },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "Elle est entrée dans le corpus qu'elle décrit, et j'ai rejoué le banc après l'avoir écrite. Les quatre chiffres n'ont pas bougé d'un point : 71 %, 0,52, 30 %, 75 %, et les cinq mêmes échecs. Deux choses ont changé quand même, et les deux redisent ce qui précède.",
          en: "It entered the corpus it describes, and I replayed the bench after writing it. The four figures did not move by a point: 71%, 0.52, 30%, 75%, and the same five failures. Two things did change, and both restate what came before.",
        },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "La première m'a fait rire. Cette note contient le mot Kubernetes six fois, et c'est le seul passage du corpus à le contenir une seule fois. Pour la question « comment configure-t-il un cluster Kubernetes ? », elle arrive quarante-huitième sur cinquante-six, à 0,160, loin derrière un passage sur le déploiement continu de ma plateforme qui ne contient pas le mot et qui marque 0,465. Onze mille caractères sur l'évaluation d'un moteur de recherche : six occurrences d'un terme n'y pèsent rien. C'est exactement la dilution que je reprochais à mon passage de compétences, appliquée cette fois à ce texte-ci.",
          en: "The first one made me laugh. This note contains the word Kubernetes six times, and it is the only passage in the corpus to contain it even once. For the question «how does he configure a Kubernetes cluster?», it comes forty-eighth out of fifty-six, at 0.160, far behind a passage about my platform's continuous deployment that does not contain the word at all and scores 0.465. Eleven thousand characters about evaluating a search engine: six occurrences of a term weigh nothing in there. That is exactly the dilution I held against my skills passage, applied this time to this very text.",
        },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "La seconde est moins drôle. Sur deux des quatre questions hors corpus, « quel est son plat préféré ? » et « combien gagne-t-il par mois ? », cette note est désormais le premier résultat, à 0,148 et 0,126. Elle reste sous le seuil, donc le silence publié ne bouge pas ; mais au seuil permissif de 0,14, une question hors corpus reçoit maintenant une réponse qu'elle ne recevait pas, et le silence y tombe de 50 % à 25 %. Un passage long et général ne devient pas le bon résultat de quelque chose : il devient le moins mauvais résultat de tout. C'est la même dilution, vue de l'autre côté.",
          en: "The second is less funny. On two of the four out-of-corpus questions, «what is his favourite dish?» and «how much does he earn per month?», this note is now the top result, at 0.148 and 0.126. It stays below the threshold, so the published silence does not move; but at the permissive 0.14 threshold, an out-of-corpus question now gets an answer it did not get before, and silence there drops from 50% to 25%. A long, general passage does not become the right result for something: it becomes the least wrong result for everything. Same dilution, seen from the other side.",
        },
      },
      {
        type: "paragraphe",
        texte: {
          fr: "Le banc est consultable, chaque cas y est détaillé avec les passages rendus et leurs scores, et un bouton rejoue l'évaluation entière dans votre navigateur, sur les mêmes vecteurs. Si vos chiffres diffèrent des miens, c'est moi qui ai un problème.",
          en: "The bench is public, every case is detailed there with the passages returned and their scores, and a button replays the whole evaluation in your browser, on the same vectors. If your figures differ from mine, the problem is mine.",
        },
      },
    ],
  },
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
