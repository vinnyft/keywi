import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CentreNotifications } from "@/components/client/CentreNotifications";

export const metadata: Metadata = { title: "Notifications" };

/** Centre de notifications in-app (temps réel) */
export default async function PageNotifications() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <CentreNotifications
      userId={user!.id}
      notificationsInitiales={JSON.parse(JSON.stringify(notifications ?? []))}
    />
  );
}
