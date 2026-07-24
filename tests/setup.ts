import { config } from "dotenv";

// Les tests visent la stack Supabase locale : mêmes variables que l'app
config({ path: ".env.local" });

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Variables Supabase absentes. Lancez `supabase start` puis vérifiez .env.local."
  );
}
