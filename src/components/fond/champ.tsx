"use client";

import { useEffect, useRef } from "react";

/**
 * Fond animé : un champ scalaire, lu de quatre façons.
 *
 * ## Le principe, et pourquoi il tient
 *
 * Il n'y a **qu'un seul champ** et **qu'un seul programme**. Les quatre motifs
 * ne changent pas le calcul, seulement la manière d'en faire de l'encre :
 * courbes de niveau, trame de points, bandes d'interférence, lignes de flux.
 * C'est ce qui permet d'en poser sur toutes les pages sans que le site parte
 * dans quatre directions : les fonds sont visiblement parents, comme quatre
 * représentations d'une même donnée.
 *
 * Un portfolio dont le sujet est la prospective chiffrée peut difficilement
 * poser derrière ses titres un dégradé décoratif choisi au hasard. Ces motifs
 * dessinent ce que font les quatre simulateurs : un champ continu qui évolue,
 * lu par ses iso-valeurs, sa densité, ses battements ou ses gradients.
 *
 * ## D'où vient la profondeur
 *
 * Deux couches, pas une. La lointaine est plus large, plus pâle, et se déplace
 * au tiers de la vitesse ; la proche est plus fine et suit le défilement. C'est
 * de la parallaxe, le seul procédé qui donne une vraie sensation de plan sans
 * rien simuler en trois dimensions.
 *
 * Le curseur déforme légèrement le domaine autour de lui. L'effet est faible
 * par construction : il doit se remarquer en bougeant la souris, jamais en
 * lisant.
 *
 * ## Ce qui est prévu pour que ça ne nuise jamais
 *
 *  - Sans WebGL 2, le composant ne rend rien et la page reste identique : le
 *    fond n'est jamais porteur d'information.
 *  - `prefers-reduced-motion` calcule une image, puis arrête tout, y compris
 *    l'écoute du défilement et du curseur.
 *  - La boucle s'arrête hors champ et en onglet masqué.
 *  - Densité de pixels plafonnée : le motif ne fait qu'un pixel d'épaisseur, il
 *    y a deux couches par pixel, et le coût de remplissage croît avec le carré
 *    de la densité.
 */

export type Motif = "niveaux" | "trame" | "interference" | "flux";

/** L'ordre fait foi : il est repris tel quel par l'uniforme `uMotif`. */
const MOTIFS: Motif[] = ["niveaux", "trame", "interference", "flux"];

const FRAGMENT = /* glsl */ `#version 300 es
precision highp float;

uniform vec2  uTaille;
uniform float uTemps;
uniform vec3  uEncre;
uniform vec3  uAccent;
uniform float uIntensite;
uniform float uLignes;
uniform int   uMotif;
uniform float uDefilement;
uniform vec2  uSouris;

out vec4 sortie;

/*
 * Hachage entier plutot que la recette classique a base de sin(dot(p, k)).
 * Le sin() en haute precision ne donne pas le meme resultat d'un pilote
 * graphique a l'autre : le motif change entre deux machines, et une capture de
 * reference ne vaut plus rien. Sur des entiers, le resultat est identique
 * partout.
 */
float hachage(vec2 p) {
  uvec2 q = uvec2(ivec2(p)) * uvec2(1597334673u, 3812015801u);
  uint n = (q.x ^ q.y) * 1597334673u;
  return float(n) * (1.0 / float(0xffffffffu));
}

float bruit(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hachage(i), hachage(i + vec2(1.0, 0.0)), u.x),
             mix(hachage(i + vec2(0.0, 1.0)), hachage(i + vec2(1.0, 1.0)), u.x), u.y);
}

/* Quatre octaves, chacune tournee pour eviter les alignements en grille. */
float octaves(vec2 p) {
  const mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
  float somme = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    somme += amplitude * bruit(p);
    p = rot * p * 2.02;
    amplitude *= 0.5;
  }
  return somme;
}

/* Deformation du domaine : le champ est evalue en p deplace par un autre champ. */
float champ(vec2 p, float t) {
  vec2 q = vec2(octaves(p + vec2(0.0, t * 0.06)), octaves(p + vec2(5.2, 1.3)));
  return octaves(p + 2.8 * q + vec2(t * 0.03, 0.0));
}

/* Distance a un trait, exprimee en pixels d'ecran. */
float traitDe(float bandes) {
  float d = abs(fract(bandes) - 0.5);
  return d / max(fwidth(bandes), 1e-5);
}

/*
 * Les quatre lectures d'un meme champ.
 *
 * Aucune ne recalcule le champ : c'est la condition pour que les motifs
 * restent parents entre eux, et pour que le cout soit le meme quel que soit
 * celui qu'on affiche.
 */
float encre(int motif, float v, vec2 p, float lignes) {
  if (motif == 0) {
    /* Courbes de niveau : les iso-valeurs du champ. */
    return 1.0 - smoothstep(0.55, 1.55, traitDe(v * lignes));
  }
  if (motif == 1) {
    /* Trame : une grille de points dont le rayon suit la valeur du champ. */
    float pas = lignes * 0.55;
    vec2 cellule = fract(p * pas) - 0.5;
    float rayon = 0.08 + smoothstep(0.25, 0.75, v) * 0.30;
    float bord = fwidth(length(cellule)) * 1.5;
    return 1.0 - smoothstep(rayon - bord, rayon + bord, length(cellule));
  }
  if (motif == 2) {
    /* Interference : le champ bat contre un reseau regulier, d'ou un moire. */
    float a = traitDe(v * lignes * 0.7);
    float b = traitDe(p.x * lignes * 0.22 + v * 2.0);
    return max(1.0 - smoothstep(0.6, 1.8, a), 1.0 - smoothstep(0.6, 1.8, b)) * 0.75;
  }
  /*
   * Flux : les memes iso-valeurs, eteintes la ou le champ est plat.
   *
   * Les bornes sont calibrees sur la derivee reelle du champ, mesuree sur la
   * page composee, pas choisies a vue. La premiere version montait de 0,004 a
   * 0,030 ; or fwidth(v) vaut ici quelques dix-milliemes, si bien que la pente
   * restait a zero presque partout : 0,7 % de couverture contre 14 a 16 % pour
   * les trois autres motifs, soit seize fois trop faible. Le motif etait
   * invisible sur la page des travaux.
   *
   * La densite de traits suit : 1,05 fois celle des courbes de niveau et non
   * 1,4, sans quoi la correction des bornes faisait passer la couverture a
   * 19 %. Etat final mesure : 14,8 % en sombre, 13,1 % en clair, contre 14,1 et
   * 12,9 pour les courbes de niveau.
   */
  float pente = smoothstep(0.0005, 0.0032, fwidth(v));
  return (1.0 - smoothstep(0.55, 1.70, traitDe(v * lignes * 1.05))) * pente;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uTaille;
  /* Repere isotrope : sans cette correction, le motif s'etire sur un ecran large. */
  vec2 p = (gl_FragCoord.xy - 0.5 * uTaille) / uTaille.y;

  /* Poussee radiale autour du curseur, faible et a decroissance rapide. */
  vec2 versSouris = p - uSouris;
  p += normalize(versSouris + 1e-6) * 0.045 * exp(-4.0 * dot(versSouris, versSouris));

  /* Deux couches : la lointaine defile au tiers de la vitesse de la proche. */
  vec2 loin = p * 1.55 + vec2(0.0, uDefilement * 0.30);
  vec2 pres = p * 2.90 + vec2(0.0, uDefilement * 0.95);

  float vLoin = champ(loin, uTemps * 0.6);
  float vPres = champ(pres, uTemps);

  float aLoin = encre(uMotif, vLoin, loin, uLignes * 0.7) * 0.45;
  float aPres = encre(uMotif, vPres, pres, uLignes);

  /*
   * Attenuation par le defilement.
   *
   * Le fond est fixe a la fenetre : il n'y a plus de bande dont on estomperait
   * le bas. Ce qui le calme, c'est la descente dans la page. Pleine force sur
   * le premier ecran, ou il n'y a qu'un titre ; un peu plus du tiers des la
   * deuxieme hauteur de fenetre, la ou commence le texte suivi.
   */
  float profondeur = mix(1.0, 0.38, smoothstep(0.0, 1.4, uDefilement));

  /* Legere asymetrie horizontale : plus vivant qu'un aplat uniforme. */
  float colonne = mix(0.62, 1.0, smoothstep(0.05, 0.60, uv.x));

  float a = clamp(aLoin + aPres, 0.0, 1.0) * profondeur * colonne * uIntensite;

  /*
   * La couche lointaine tire vers l'encre, la proche vers l'accent : c'est ce
   * decalage de teinte qui separe les deux plans a l'oeil.
   */
  float part = aPres / max(aLoin + aPres, 1e-3);
  vec3 couleur = mix(uEncre, uAccent, smoothstep(0.30, 0.75, vPres) * part);

  sortie = vec4(couleur, a);
}
`;

const SOMMET = /* glsl */ `#version 300 es
/* Un seul triangle couvrant l'ecran : trois sommets, aucun tampon. */
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;

/** `#rrggbb` vers un triplet 0-1. Renvoie `repli` sur toute autre écriture. */
function versRvb(valeur: string, repli: [number, number, number]): [number, number, number] {
  const m = /^#([0-9a-f]{6})$/i.exec(valeur.trim());
  if (!m) return repli;
  const n = parseInt(m[1], 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function compiler(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    // Un fond décoratif ne doit pas faire tomber la page : on trace et on renonce.
    console.warn("Shader du fond :", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function Champ({
  motif = "niveaux",
  className = "",
  /** Opacité maximale de l'encre. Volontairement basse : c'est un fond. */
  intensite = 0.32,
  /** Densité du motif sur l'amplitude du champ. */
  lignes = 15,
}: {
  motif?: Motif;
  className?: string;
  intensite?: number;
  lignes?: number;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canevas = canvas.current;
    if (!canevas) return;

    const contexte = canevas.getContext("webgl2", {
      alpha: true,
      antialias: false,
      // Alpha droit : la composition avec le fond de page est faite par le
      // navigateur, on n'a donc pas à pré-multiplier nous-mêmes.
      premultipliedAlpha: false,
      powerPreference: "low-power",
    });
    if (!contexte) return;

    /*
     * Alias non nuls. TypeScript ne conserve pas l'affinage d'un `if (!x)
     * return` à l'intérieur d'une fonction *déclarée* : celle-ci étant hoistée,
     * le compilateur doit supposer qu'elle peut être appelée avant le garde.
     */
    const toile: HTMLCanvasElement = canevas;
    const gl: WebGL2RenderingContext = contexte;

    const vs = compiler(gl, gl.VERTEX_SHADER, SOMMET);
    const fs = compiler(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    if (!vs || !fs) return;

    const programme = gl.createProgram();
    gl.attachShader(programme, vs);
    gl.attachShader(programme, fs);
    gl.linkProgram(programme);
    if (!gl.getProgramParameter(programme, gl.LINK_STATUS)) {
      console.warn("Programme du fond :", gl.getProgramInfoLog(programme));
      return;
    }
    gl.useProgram(programme);

    const uTaille = gl.getUniformLocation(programme, "uTaille");
    const uTemps = gl.getUniformLocation(programme, "uTemps");
    const uEncre = gl.getUniformLocation(programme, "uEncre");
    const uAccent = gl.getUniformLocation(programme, "uAccent");
    const uIntensite = gl.getUniformLocation(programme, "uIntensite");
    const uDefilement = gl.getUniformLocation(programme, "uDefilement");
    const uSouris = gl.getUniformLocation(programme, "uSouris");
    gl.uniform1f(gl.getUniformLocation(programme, "uLignes"), lignes);
    gl.uniform1i(gl.getUniformLocation(programme, "uMotif"), Math.max(0, MOTIFS.indexOf(motif)));

    /* Les couleurs viennent des jetons CSS : le fond suit le thème sans le connaître. */
    function relireCouleurs() {
      const style = getComputedStyle(document.documentElement);
      const bleu = versRvb(style.getPropertyValue("--bleu"), [0.17, 0.3, 0.95]);
      const corail = versRvb(style.getPropertyValue("--corail"), [1, 0.35, 0.24]);
      gl.uniform3f(uEncre, bleu[0], bleu[1], bleu[2]);
      gl.uniform3f(uAccent, corail[0], corail[1], corail[2]);

      /*
       * Le thème clair reçoit environ 40 % de l'intensité du sombre.
       *
       * Ce n'est pas une préférence : à opacité égale, un trait bleu ou corail
       * sur crème produit bien plus de contraste que le même trait sur presque
       * noir. En capture, la version claire virait au papier peint et le texte
       * en petit corps devenait pénible à lire, alors que la sombre était
       * juste. Une seule valeur ne peut pas convenir aux deux fonds.
       */
      const clair = !document.documentElement.classList.contains("dark");
      gl.uniform1f(uIntensite, intensite * (clair ? 0.42 : 1));
    }
    relireCouleurs();

    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let brut = 0;
    let actif = false;
    /* Temps propre au composant : il ne s'écoule pas pendant les pauses, sinon
       le motif saute d'un bond au retour dans le champ. */
    let horloge = 0;
    let precedent = performance.now();
    let defilement = 0;
    let souris: [number, number] = [0, 0];

    function peindre() {
      gl.uniform1f(uTemps, horloge);
      gl.uniform1f(uDefilement, defilement);
      gl.uniform2f(uSouris, souris[0], souris[1]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function dessiner(maintenant: number) {
      horloge += Math.min((maintenant - precedent) / 1000, 0.1);
      precedent = maintenant;
      peindre();
      if (actif && !reduit) brut = requestAnimationFrame(dessiner);
    }

    function demarrer() {
      if (actif || reduit) return;
      actif = true;
      precedent = performance.now();
      brut = requestAnimationFrame(dessiner);
    }
    function arreter() {
      actif = false;
      cancelAnimationFrame(brut);
    }

    function redimensionner() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      const l = Math.max(1, Math.round(toile.clientWidth * dpr));
      const h = Math.max(1, Math.round(toile.clientHeight * dpr));
      if (toile.width === l && toile.height === h) return;
      toile.width = l;
      toile.height = h;
      gl.viewport(0, 0, l, h);
      gl.uniform2f(uTaille, l, h);
      // Redessiner tout de suite : en mouvement réduit, aucune frame ne viendra.
      peindre();
    }

    const observateurTaille = new ResizeObserver(redimensionner);
    observateurTaille.observe(toile);

    const observateurVue = new IntersectionObserver(
      ([e]) => (e.isIntersecting ? demarrer() : arreter()),
      { threshold: 0 },
    );
    observateurVue.observe(toile);

    /*
     * Défilement et curseur ne sont écoutés qu'en mouvement autorisé.
     *
     * Deux raisons, et la seconde compte autant que la première. D'abord, une
     * personne qui demande à réduire les animations ne veut pas d'un fond qui
     * suit sa souris. Ensuite, les captures de référence sont prises dans ce
     * mode : sans ce garde, elles dépendraient de la position de défilement au
     * moment du déclenchement, et ne seraient plus comparables.
     */
    function surDefilement() {
      // Normalisé par la hauteur de fenêtre : le fond parallaxe à la même
      // vitesse apparente quel que soit l'écran.
      defilement = window.scrollY / Math.max(window.innerHeight, 1);
    }
    function surSouris(e: PointerEvent) {
      const r = toile.getBoundingClientRect();
      if (r.height <= 0) return;
      souris = [
        (e.clientX - r.left - r.width / 2) / r.height,
        (r.height / 2 - (e.clientY - r.top)) / r.height,
      ];
    }

    if (!reduit) {
      window.addEventListener("scroll", surDefilement, { passive: true });
      window.addEventListener("pointermove", surSouris, { passive: true });
      surDefilement();
    }

    function surVisibilite() {
      if (document.hidden) arreter();
      else demarrer();
    }
    document.addEventListener("visibilitychange", surVisibilite);

    /* Le thème bascule par une classe sur <html> : on relit et on redessine. */
    const observateurTheme = new MutationObserver(() => {
      relireCouleurs();
      if (reduit || !actif) peindre();
    });
    observateurTheme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    redimensionner();
    if (reduit) {
      horloge = 4.2; // une image figée, mais pas la moins intéressante
      peindre();
    }

    return () => {
      arreter();
      observateurTaille.disconnect();
      observateurVue.disconnect();
      observateurTheme.disconnect();
      document.removeEventListener("visibilitychange", surVisibilite);
      window.removeEventListener("scroll", surDefilement);
      window.removeEventListener("pointermove", surSouris);
      gl.deleteProgram(programme);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      // Libère le contexte tout de suite plutôt qu'au prochain ramasse-miettes :
      // un navigateur n'accorde qu'une quinzaine de contextes WebGL par onglet.
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [intensite, lignes, motif]);

  return (
    <canvas
      ref={canvas}
      aria-hidden="true"
      className={`pointer-events-none block h-full w-full ${className}`}
    />
  );
}
