import { Client } from "pg";
const c = new Client({ connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres", connectionTimeoutMillis: 5000, query_timeout: 8000 });
try {
  await c.connect(); console.log("✅ connecté");
  const r = await c.query("select count(*)::int n from auth.users where email like '%@test.keywi'");
  console.log("comptes de test:", r.rows[0].n);
  await c.end();
} catch (e) { console.log("❌", e.message); }
process.exit(0);
