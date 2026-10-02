import { createClient } from "@supabase/supabase-js";

export function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase server configuration is missing.");
  }
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

export function createRequestSupabaseClient(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Use the anon key so Supabase evaluates RLS against the user's JWT.
  // The service role key bypasses RLS entirely and must NOT be mixed with a user JWT.
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Supabase configuration is missing.");
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

export async function requireEditorialUser(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    const accessToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!accessToken) return { error: "Authentication required.", status: 401 as const };

    const supabase = createRequestSupabaseClient(accessToken);
    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !userData.user) return { error: "Authentication required.", status: 401 as const };

    const { data: role, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .in("role", ["EDITOR", "ADMIN", "SUPER_ADMIN"])
      .maybeSingle();

    if (roleError) return { error: `Editorial role lookup failed: ${roleError.message}`, status: 500 as const };
    if (!role) return { error: `Editorial permission required for ${userData.user.email ?? "this account"}. Add an ADMIN, EDITOR, or SUPER_ADMIN row for this user's UUID.`, status: 403 as const };
    return { supabase, user: userData.user, role: role.role };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return { error: message, status: 500 as const };
  }
}