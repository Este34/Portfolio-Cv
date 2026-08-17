"use client";

import { useEffect, useRef } from "react";

/**
 * Fond animé : un champ scalaire, dessiné par ses courbes de niveau.
 *
 * ## Pourquoi celui-ci et pas un autre
 *
 * Un portfolio dont le sujet est la prospective chiffrée peut difficilement
 * poser derrière son titre un dégradé décoratif choisi au hasard. Ce fond
 * dessine littéralement ce que font les quatre simulateurs : un champ continu
 * qui évolue, lu par ses lignes d'iso-valeur. C'est la carte topographique d'un
 * modèle, et elle bouge parce que les modèles bougent.
 *
 * ## Pourquoi du GLSL écrit à la main
 *
 * Il n'y a ni scène, ni caméra, ni maillage, ni chargeur : un seul triangle
 * couvrant l'écran et un fragment shader. Importer une bibliothèque 3D pour ça
 * coûterait quelques centaines de kilo-octets afin d'obtenir exactement le même
 * pixel. C'est le raisonnement tenu sur la plateforme de l'institut, et il
 * serait malhonnête de le raconter dans une étude de cas sans l'appliquer ici.
 *
 * ## Ce qui est prévu pour que ça ne nuise jamais
 *
 *  - Sans WebGL 2, le composant ne rend rien et la page reste identique : le
 *    fond n'est jamais porteur d'information.
 *  - `prefers-reduced-motion` calcule une image, puis arrête la boucle.
 *  - La boucle s'arrête aussi hors champ et en onglet masqué.
 *  - Densité de pixels plafonnée à 1,5 : au-delà, on quadruple le coût de
 *    remplissage pour un motif dont les traits font un pixel de large.
 */

/** Trame du champ. Extraite pour être lisible : c'est le cœur du composant. */
const FRAGMENT = /* glsl */ `#version 300 es
precision highp float;

uniform vec2  uTaille;
uniform float uTemps;
uniform vec3  uEncre;
uniform vec3  uAccent;
uniform float uIntensite;
uniform float uLignes;

out vec4 sortie;

/*
 * Hachage entier plutôt que la recette classique à base de sin(dot(p, k)).
 * Le sin() en haute précision ne donne pas le même résultat d'un pilote
 * graphique à l'autre : le motif change entre deux machines, et une capture de
 * référence ne vaut plus rien. Sur des entiers, le résultat est identique
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

/* Somme d'octaves, chaque octave tournée pour éviter les alignements en grille. */
float octaves(vec2 p) {
  const mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
  float somme = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    somme += amplitude * bruit(p);
    p = rot * p * 2.02;
    amplitude *= 0.5;
  }
  return somme;
}

/*
 * Déformation du domaine : le champ n'est pas évalué en p mais en p déplacé
 * par un autre champ de bruit. C'est ce qui produit des lignes qui s'enroulent
 * et se pincent, au lieu des taches molles d'un bruit fractal nu.
 */
float champ(vec2 p, float t) {
  vec2 q = vec2(octaves(p + vec2(0.0, t * 0.06)), octaves(p + vec2(5.2, 1.3)));
  vec2 r = vec2(octaves(p + 3.4 * q + vec2(1.7, 9.2) + t * 0.04),
                octaves(p + 3.4 * q + vec2(8.3, 2.8)));
  return octaves(p + 3.2 * r);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uTaille;
  /* Repère isotrope : sans cette correction, les lignes s'étirent sur un écran large. */
  vec2 p = (gl_FragCoord.xy - 0.5 * uTaille) / uTaille.y;

  float v = champ(p * 2.6, uTemps);
  float bandes = v * uLignes;

  /*
   * Distance au trait, convertie en pixels par la dérivée à l'écran. Sans
   * cette division, les traits s'épaississent en bouillie là où le champ est
   * plat et disparaissent là où il est raide.
   */
  float d = abs(fract(bandes) - 0.5);
  float pixels = d / max(fwidth(bandes), 1e-5);
  float trait = 1.0 - smoothstep(0.55, 1.55, pixels);

  /*
   * Deux atténuations, l'une et l'autre décidées en regardant des captures.
   *
   * Vers le bas : le fond doit avoir disparu là où commencent les aplats de
   * couleur, sinon deux motifs forts se disputent la même bande.
   *
   * Vers la gauche : c'est la colonne du texte. À pleine densité, les courbes
   * passaient derrière le titre et la ligne d'orientation en petit corps, qui
   * devenait pénible à lire en thème clair. Le champ n'y est pas supprimé —
   * il resterait un rectangle vide bien visible — mais réduit de moitié.
   */
  float fondu = smoothstep(0.02, 0.62, uv.y);
  float colonne = mix(0.45, 1.0, smoothstep(0.05, 0.55, uv.x));

  vec3 couleur = mix(uEncre, uAccent, smoothstep(0.34, 0.72, v));
  sortie = vec4(couleur, trait * fondu * colonne * uIntensite);
}
`;

const SOMMET = /* glsl */ `#version 300 es
/* Un seul triangle couvrant l'écran : trois sommets, aucun tampon. */
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

export function ChampDeNiveaux({
  className = "",
  /** Opacité maximale des traits. Volontairement basse : c'est un fond. */
  intensite = 0.42,
  /** Nombre de courbes de niveau sur l'amplitude du champ. */
  lignes = 15,
}: {
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
     * Deux constantes déjà typées non nulles évitent d'avoir à répéter le
     * garde dans chacune des cinq fonctions ci-dessous.
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
    gl.uniform1f(gl.getUniformLocation(programme, "uLignes"), lignes);

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

    function dessiner(maintenant: number) {
      horloge += Math.min((maintenant - precedent) / 1000, 0.1);
      precedent = maintenant;
      gl.uniform1f(uTemps, horloge);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (actif && !reduit) brut = requestAnimationFrame(dessiner);
    }

    function demarrer() {
      if (actif) return;
      actif = true;
      precedent = performance.now();
      brut = requestAnimationFrame(dessiner);
    }
    function arreter() {
      actif = false;
      cancelAnimationFrame(brut);
    }

    function redimensionner() {
      // 1,5 plutôt que 2 ou 3 : le motif ne fait qu'un pixel d'épaisseur, et le
      // coût de remplissage croît avec le carré de la densité.
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const l = Math.max(1, Math.round(toile.clientWidth * dpr));
      const h = Math.max(1, Math.round(toile.clientHeight * dpr));
      if (toile.width === l && toile.height === h) return;
      toile.width = l;
      toile.height = h;
      gl.viewport(0, 0, l, h);
      gl.uniform2f(uTaille, l, h);
      // Redessiner tout de suite : en mouvement réduit, aucune frame ne viendra.
      gl.uniform1f(uTemps, horloge);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    const observateurTaille = new ResizeObserver(redimensionner);
    observateurTaille.observe(toile);

    const observateurVue = new IntersectionObserver(
      ([e]) => (e.isIntersecting ? demarrer() : arreter()),
      { threshold: 0 },
    );
    observateurVue.observe(toile);

    function surVisibilite() {
      if (document.hidden) arreter();
      else if (!document.hidden) demarrer();
    }
    document.addEventListener("visibilitychange", surVisibilite);

    /* Le thème bascule par une classe sur <html> : on relit et on redessine. */
    const observateurTheme = new MutationObserver(() => {
      relireCouleurs();
      if (reduit || !actif) {
        gl.uniform1f(uTemps, horloge);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    });
    observateurTheme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    redimensionner();
    if (reduit) {
      gl.uniform1f(uTemps, 4.2); // une image figée, mais pas la moins intéressante
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    return () => {
      arreter();
      observateurTaille.disconnect();
      observateurVue.disconnect();
      observateurTheme.disconnect();
      document.removeEventListener("visibilitychange", surVisibilite);
      gl.deleteProgram(programme);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      // Libère le contexte tout de suite plutôt qu'au prochain ramasse-miettes :
      // un navigateur n'accorde qu'une quinzaine de contextes WebGL par onglet.
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [intensite, lignes]);

  return (
    <canvas
      ref={canvas}
      aria-hidden="true"
      className={`pointer-events-none block h-full w-full ${className}`}
    />
  );
}
