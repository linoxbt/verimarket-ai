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
    const { teamName, league = "" } = await req.json();
    if (!teamName) throw new Error("teamName required");

    // TheSportsDB free tier (key = 3 for testing, or use stored key)
    const apiKey = Deno.env.get("SPORTS_API_KEY") || "3";
    const url = `https://www.thesportsdb.com/api/v1/json/${apiKey}/searchteams.php?t=${encodeURIComponent(teamName)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TheSportsDB error: ${res.status}`);
    const data = await res.json();

    const teams = (data.teams || []).slice(0, 3).map((t: any) => ({
      team_id: t.idTeam || "",
      name: t.strTeam || "",
      league: t.strLeague || "",
      country: t.strCountry || "",
      stadium: t.strStadium || "",
    }));

    // Also fetch recent events if we got a team
    let events: any[] = [];
    if (teams.length > 0) {
      const evUrl = `https://www.thesportsdb.com/api/v1/json/${apiKey}/eventslast.php?id=${teams[0].team_id}`;
      const evRes = await fetch(evUrl);
      if (evRes.ok) {
        const evData = await evRes.json();
        events = (evData.results || []).slice(0, 5).map((e: any) => ({
          event_id: e.idEvent || "",
          event: e.strEvent || "",
          date: e.dateEvent || "",
          home_team: e.strHomeTeam || "",
          away_team: e.strAwayTeam || "",
          home_score: e.intHomeScore ?? null,
          away_score: e.intAwayScore ?? null,
          status: e.strStatus || "",
        })).sort((a: any, b: any) => (a.date || "").localeCompare(b.date || ""));
      }
    }

    const normalized = { teams, events };
    const canonicalJson = JSON.stringify(normalized);
    const hash = await sha256(canonicalJson);

    return new Response(JSON.stringify({
      source: "thesportsdb",
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
