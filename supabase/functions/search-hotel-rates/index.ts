import { corsHeaders } from "jsr:@supabase/supabase-js@2/cors";

const BASE_URL = Deno.env.get("LITEAPI_BASE_URL") ?? "https://api.liteapi.travel/v1";
const API_KEY = Deno.env.get("LITEAPI_KEY");

if (!API_KEY) throw new Error("LITEAPI_KEY is not set");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    const res = await fetch(`${BASE_URL}/hotels/rates`, {
      method: "POST",
      headers: {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();

    if (!res.ok) {
      return new Response(
        JSON.stringify({ liteapi_status: res.status, liteapi_response: text }),
        {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(text, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
