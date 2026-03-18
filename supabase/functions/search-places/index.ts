import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const textQuery = url.searchParams.get("textQuery");

    if (!textQuery) {
      return new Response(
        JSON.stringify({ error: "textQuery parameter is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("LITEAPI_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "LITEAPI_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const params = new URLSearchParams({ textQuery });

    const language = url.searchParams.get("language");
    if (language) params.append("language", language);

    const type = url.searchParams.get("type");
    if (type) params.append("type", type);

    const response = await fetch(
      `https://api.liteapi.travel/v1/data/places?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "X-API-Key": apiKey,
          "Accept": "application/json",
        },
      }
    );

    const body = await response.json();

    return new Response(JSON.stringify(body), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
