import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sha256(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, pageSize = 5 } = await req.json();
    const apiKey = Deno.env.get("NEWS_API_KEY");
    if (!apiKey) throw new Error("NEWS_API_KEY not configured");
    if (!query) throw new Error("query parameter required");

    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&pageSize=${pageSize}&sortBy=publishedAt&language=en&apiKey=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`NewsAPI error: ${res.status}`);
    const data = await res.json();

    // Deterministic normalization
    const normalized = (data.articles || [])
      .map((a: any) => ({
        title: a.title || "",
        source: a.source?.name || "",
        publishedAt: a.publishedAt || "",
        description: (a.description || "").slice(0, 200),
        url: a.url || "",
      }))
      .sort((a: any, b: any) => a.publishedAt.localeCompare(b.publishedAt))
      .slice(0, pageSize);

    const canonicalJson = JSON.stringify(normalized);
    const hash = await sha256(canonicalJson);

    return new Response(JSON.stringify({
      source: "newsapi",
      query,
      fetched_at: new Date().toISOString(),
      count: normalized.length,
      data: normalized,
      data_hash: hash,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
