import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { market_id } = await req.json();
    if (!market_id) throw new Error("market_id required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch market
    const { data: market, error: mErr } = await supabase
      .from("markets")
      .select("*")
      .eq("id", market_id)
      .single();
    if (mErr || !market) throw new Error("Market not found");
    if (market.status !== "open") throw new Error("Market is not open");

    // Fetch evidence from relevant API edge function
    const apiMap: Record<string, string> = {
      newsapi: "fetch-news",
      coingecko: "fetch-crypto",
      thesportsdb: "fetch-sports",
      openweather: "fetch-weather",
    };
    const fnName = apiMap[market.api_source];
    if (!fnName) throw new Error(`Unknown API source: ${market.api_source}`);

    // Build params for each API
    let apiParams: Record<string, any> = {};
    if (market.api_source === "newsapi") {
      apiParams = { query: market.question, pageSize: 5 };
    } else if (market.api_source === "coingecko") {
      const coinMatch = market.question.match(/\b(BTC|ETH|SOL|bitcoin|ethereum|solana)\b/i);
      const coinMap: Record<string, string> = { btc: "bitcoin", eth: "ethereum", sol: "solana", bitcoin: "bitcoin", ethereum: "ethereum", solana: "solana" };
      apiParams = { coinId: coinMap[coinMatch?.[1]?.toLowerCase() || ""] || "bitcoin" };
    } else if (market.api_source === "thesportsdb") {
      const teamMatch = market.question.match(/Will (.+?) (win|lose|draw)/i);
      apiParams = { teamName: teamMatch?.[1] || "Manchester City" };
    } else if (market.api_source === "openweather") {
      const cityMatch = market.question.match(/in (.+?) /i);
      apiParams = { city: cityMatch?.[1] || "London" };
    }

    // Call edge function
    const evidenceRes = await fetch(`${supabaseUrl}/functions/v1/${fnName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify(apiParams),
    });
    const evidencePackage = await evidenceRes.json();
    if (evidencePackage.error) throw new Error(`Evidence fetch failed: ${evidencePackage.error}`);

    // Build AI prompt
    const systemPrompt = `You are a deterministic prediction market resolution engine. You MUST resolve markets based ONLY on the structured evidence dataset provided. Do NOT use any external knowledge.

Rules:
1. Analyze ONLY the provided dataset
2. Determine if the resolution criteria is met based on the data
3. Return your analysis using the resolve_market tool`;

    const userPrompt = `Market Question: ${market.question}
Resolution Criteria: ${market.resolution_criteria}
API Source: ${market.api_source}
Expiry: ${market.expiry}
Current Date: ${new Date().toISOString()}

Evidence Dataset (SHA-256: ${evidencePackage.data_hash}):
${JSON.stringify(evidencePackage.data, null, 2)}

Based ONLY on this dataset, resolve the market.`;

    // Call Lovable AI with tool calling for structured output
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "resolve_market",
            description: "Submit the market resolution with outcome, confidence, and reasoning",
            parameters: {
              type: "object",
              properties: {
                outcome: { type: "string", enum: ["YES", "NO"] },
                confidence: { type: "number", minimum: 0, maximum: 1 },
                reasoning_steps: {
                  type: "array",
                  items: { type: "string" },
                  description: "Step-by-step reasoning based only on the evidence",
                },
              },
              required: ["outcome", "confidence", "reasoning_steps"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "resolve_market" } },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI error:", aiRes.status, errText);
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI resolution failed");
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const resolution = JSON.parse(toolCall.function.arguments);

    // Store resolution
    const { error: rErr } = await supabase.from("resolutions").insert({
      market_id,
      outcome: resolution.outcome,
      confidence: resolution.confidence,
      reasoning_steps: resolution.reasoning_steps,
      data_hash: evidencePackage.data_hash,
      prompt_version: "v1",
      model_id: "google/gemini-3-flash-preview",
      evidence_package: evidencePackage,
    });
    if (rErr) throw new Error(`Failed to store resolution: ${rErr.message}`);

    // Update market status
    await supabase.from("markets").update({
      status: "resolving",
      yes_probability: resolution.outcome === "YES" ? resolution.confidence : 1 - resolution.confidence,
    }).eq("id", market_id);

    return new Response(JSON.stringify({
      success: true,
      resolution: {
        outcome: resolution.outcome,
        confidence: resolution.confidence,
        reasoning_steps: resolution.reasoning_steps,
        data_hash: evidencePackage.data_hash,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("resolve-market error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
