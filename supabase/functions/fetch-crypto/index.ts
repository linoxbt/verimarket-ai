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
    const { coinId = "bitcoin", currency = "usd" } = await req.json();

    // CoinGecko free tier — no key required
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(coinId)}&vs_currencies=${currency}&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);
    const data = await res.json();

    const coinData = data[coinId];
    if (!coinData) throw new Error(`No data for ${coinId}`);

    const normalized = {
      coin_id: coinId,
      currency,
      price: coinData[currency],
      market_cap: coinData[`${currency}_market_cap`],
      volume_24h: coinData[`${currency}_24h_vol`],
      change_24h: coinData[`${currency}_24h_change`],
    };

    const canonicalJson = JSON.stringify(normalized);
    const hash = await sha256(canonicalJson);

    return new Response(JSON.stringify({
      source: "coingecko",
      fetched_at: new Date().toISOString(),
      data: normalized,
      data_hash: hash,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
