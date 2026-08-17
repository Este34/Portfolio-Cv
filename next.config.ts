import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Toutes les pages vivent sous `/fr` ou `/en`. La racine renvoie vers le
   * français.
   *
   * Redirection temporaire (307) et non permanente : une 308 est mise en cache
   * par le navigateur, souvent sans date d'expiration. Le jour où la racine
   * devrait faire autre chose — une page de choix, une détection, un domaine
   * par langue — les visiteurs déjà venus resteraient coincés sur l'ancienne
   * destination, et il n'existerait aucun moyen de les en sortir.
   */
  async redirects() {
    return [{ source: "/", destination: "/fr", permanent: false }];
  },
};

export default nextConfig;
