import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Action = Database["public"]["Enums"]["activity_action"];

export async function logActivity(
  entityType: string,
  entityId: string | null,
  action: Action,
  meta: Record<string, unknown> = {},
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("activity_logs").insert({
    user_id: user.id,
    entity_type: entityType,
    entity_id: entityId,
    action,
    meta: meta as never,
  });
}
