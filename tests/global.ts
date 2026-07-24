import { config } from "dotenv";
import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { promisify } from "node:util";

config({ path: ".env.local" });

const executer = promisify(execFile);

/**
 * Nettoyage global, avant ET après la campagne de tests.
 *
 * Le nettoyage par test ne suffit pas : un test qui échoue laisse
 * ses fixtures derrière lui et le jeu de démonstration dérive.
 *
 * Pourquoi psql plutôt que l'API Supabase : le trigger
 * `movements_immuables` interdit la suppression des mouvements,
 * y compris en cascade. Un compte ayant déposé une clé est donc
 * indestructible via l'API. `session_replication_role = replica`
 * neutralise les triggers le temps du nettoyage — réservé aux
 * tests, le journal reste inaltérable pour l'application.
 */

/** Nom du conteneur Postgres, dérivé du project_id de config.toml */
function conteneurDb(): string {
  try {
    const toml = readFileSync("supabase/config.toml", "utf8");
    const id = toml.match(/^project_id\s*=\s*"([^"]+)"/m)?.[1];
    if (id) return `supabase_db_${id}`;
  } catch {
    // config illisible : on retombe sur la convention
  }
  return "supabase_db_keywi";
}

/**
 * Suppression explicite, des enfants vers les parents.
 *
 * On ne peut pas compter sur les ON DELETE CASCADE :
 * `session_replication_role = replica`, nécessaire pour contourner
 * l'immuabilité des mouvements, désactive aussi les triggers de
 * clé étrangère — donc les cascades. Chaque table est donc traitée
 * explicitement.
 *
 * « Donnée de test » = rattachée à un compte @test.keywi, ou
 * orpheline (clé dont le profil n'existe plus, séquelle d'une
 * campagne interrompue).
 */
const PURGE = `
begin;
set local session_replication_role = replica;

create temporary table _profils_test on commit drop as
  select id from public.profiles where email like '%@test.keywi';

create temporary table _cles_test on commit drop as
  select k.id from public.keys k
  where k.hote_id in (select id from _profils_test)
     or not exists (select 1 from public.profiles p where p.id = k.hote_id);

delete from public.movements
 where key_id in (select id from _cles_test)
    or relay_point_id in (select id from public.relay_points where nom like 'Point test%');
delete from public.access_codes     where key_id in (select id from _cles_test);
delete from public.acces_recurrents where key_id in (select id from _cles_test);
delete from public.paiements        where key_id in (select id from _cles_test);
delete from public.keys             where id     in (select id from _cles_test);
delete from public.notifications    where user_id in (select id from _profils_test);

delete from public.slots        where relay_point_id in (select id from public.relay_points where nom like 'Point test%');
delete from public.relay_points where nom like 'Point test%';

delete from public.profiles     where id in (select id from _profils_test);
delete from auth.identities     where user_id in (select id from _profils_test);
delete from auth.users          where email like '%@test.keywi';
commit;
`;

async function psql(sql: string): Promise<string> {
  const { stdout } = await executer(
    "docker",
    ["exec", "-i", conteneurDb(), "psql", "-U", "postgres", "-t", "-A", "-c", sql],
    {
      env: {
        ...process.env,
        // Colima/Lima expose le démon sur un socket non standard
        DOCKER_HOST:
          process.env.DOCKER_HOST ??
          `unix://${process.env.HOME}/.lima/docker/sock/docker.sock`,
      },
    }
  );
  return stdout.trim();
}

async function purger(): Promise<number> {
  const avant = Number(
    await psql("select count(*) from auth.users where email like '%@test.keywi'")
  );
  await psql(PURGE);
  return avant;
}

export async function setup() {
  const n = await purger();
  if (n > 0) {
    console.log(`[tests] ${n} compte(s) résiduel(s) purgé(s) avant la campagne`);
  }
  // Vitest appelle la fonction retournée en fin de campagne
  return async () => {
    const restants = await purger();
    console.log(`[tests] ${restants} compte(s) de test nettoyé(s) après la campagne`);
  };
}
