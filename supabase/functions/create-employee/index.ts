import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    // Verify the caller is authenticated
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: callerData, error: callerError } = await callerClient.auth.getUser();

    if (callerError || !callerData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if caller is an owner of a shop
    const { data: callerMember, error: memberError } = await callerClient
      .from("shop_members")
      .select("*")
      .eq("user_id", callerData.user.id)
      .maybeSingle();

    if (memberError || !callerMember || callerMember.role !== "owner") {
      return new Response(JSON.stringify({ error: "Only shop owners can add employees" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { email, full_name, role } = body;

    if (!email || !full_name || !role) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role client to create the auth user (doesn't affect caller's session)
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check if user already exists
    const { data: existingUsers, error: listError } = await adminClient.auth.admin.listUsers();
    const existingUser = (existingUsers?.users ?? []).find((u) => u.email === email);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const tempPassword = Math.random().toString(36).slice(2) + "A1!" + Math.random().toString(36).slice(0, 4);
      const { data: newUserData, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
      });

      if (createError || !newUserData.user) {
        return new Response(JSON.stringify({ error: createError?.message || "Failed to create user" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = newUserData.user.id;
    }

    // Insert the shop_members record using service role (bypasses RLS)
    const { error: insertError } = await adminClient.from("shop_members").upsert({
      shop_id: callerMember.shop_id,
      user_id: userId,
      role,
      full_name,
      email,
    }, { onConflict: "shop_id,user_id" });

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
