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
    const { city = "London", units = "metric" } = await req.json();
    const apiKey = Deno.env.get("OPENWEATHER_API_KEY");
    if (!apiKey) {
      // Return mock data if key not available yet
      const mock = {
        city,
        temperature: 8.5,
        feels_like: 6.2,
        humidity: 72,
        wind_speed: 4.1,
        description: "overcast clouds",
        rain_1h: 0,
      };
      const hash = await sha256(JSON.stringify(mock));
      return new Response(JSON.stringify({
        source: "openweather",
        fetched_at: new Date().toISOString(),
        data: mock,
        data_hash: hash,
        mock: true,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=${units}&appid=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OpenWeather error: ${res.status}`);
    const data = await res.json();

    const normalized = {
      city: data.name || city,
      temperature: data.main?.temp ?? 0,
      feels_like: data.main?.feels_like ?? 0,
      humidity: data.main?.humidity ?? 0,
      wind_speed: data.wind?.speed ?? 0,
      description: data.weather?.[0]?.description || "",
      rain_1h: data.rain?.["1h"] ?? 0,
    };

    const canonicalJson = JSON.stringify(normalized);
    const hash = await sha256(canonicalJson);

    return new Response(JSON.stringify({
      source: "openweather",
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
