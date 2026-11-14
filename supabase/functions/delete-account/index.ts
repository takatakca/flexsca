import { createClient } from "npm:@supabase/supabase-js@2.95.3";

// Deletes the signed-in user's own account. The user id always comes from the verified session, never from the request body.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const url = Deno.env.get("SUPABASE_URL")!;
    const asUser = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    // getUser asks the Auth server, so a revoked or expired session cannot delete an account.
    const { data: userData, error: userError } = await asUser.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const body = await req.json().catch(() => null);
    if (body?.confirm !== "DELETE") return json({ error: "Confirmation required" }, 400);

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const { data: blocker, error: blockerError } = await admin.rpc("account_deletion_blocker", { p_user_id: userId });
    if (blockerError) throw new Error("blocker check failed");
    if (blocker) return json({ error: "Account cannot be deleted here", reason: blocker }, 409);

    const { data: files, error: filesError } = await admin.rpc("account_storage_objects", { p_user_id: userId });
    if (filesError) throw new Error("file listing failed");
    const byBucket = new Map<string, string[]>();
    for (const file of (files ?? []) as { bucket_id: string; name: string }[]) {
      byBucket.set(file.bucket_id, [...(byBucket.get(file.bucket_id) ?? []), file.name]);
    }
    for (const [bucket, names] of byBucket) {
      const { error } = await admin.storage.from(bucket).remove(names);
      if (error) throw new Error("file removal failed");
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) throw new Error("account removal failed");
    return json({ deleted: true }, 200);
  } catch (error) {
    console.error("[delete-account]", error instanceof Error ? error.message : "failed");
    return json({ error: "Unable to delete the account right now" }, 500);
  }
});
