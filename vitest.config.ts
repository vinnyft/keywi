import { defineConfig } from "vitest/config";

/**
 * Tests d'intégration : ils s'exécutent contre la stack Supabase
 * locale (`supabase start`), pas contre des simulacres. La logique
 * critique de Keywi vit dans des fonctions Postgres — la tester
 * ailleurs qu'en base ne prouverait rien.
 */
export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["tests/setup.ts"],
    // Filet de sécurité : purge les fixtures avant et après la
    // campagne, y compris celles laissées par un test en échec
    globalSetup: ["tests/global.ts"],
    // Les tests partagent une base : on évite les courses entre fichiers
    fileParallelism: false,
    testTimeout: 20_000,
    include: ["tests/**/*.test.ts"],
  },
});
