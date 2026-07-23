"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Révocation d'un certificat : on régénère le jeton, ce qui
 * invalide instantanément tous les liens déjà partagés. Utile
 * si un certificat a circulé plus loin que prévu.
 */
export async function actionRevoquerCertificat(formData: FormData) {
  const keyId = String(formData.get("key_id") ?? "");

  const supabase = await createClient();
  await supabase
    .from("keys")
    .update({ certificat_token: crypto.randomUUID() })
    .eq("id", keyId);

  revalidatePath(`/espace/cles/${keyId}`);
}
