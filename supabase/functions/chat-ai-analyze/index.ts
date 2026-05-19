import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

const analysisTool = {
  type: "function",
  function: {
    name: "analyze_chat",
    description: "Analisa conversa entre responsavel e cuidador",
    parameters: {
      type: "object",
      properties: {
        contractDraft: {
          type: "object",
          properties: {
            valorAcordado: { type: "string" },
            horarios: { type: "string" },
            periodo: { type: "string" },
            tarefas: { type: "array", items: { type: "string" } },
            regras: { type: "array", items: { type: "string" } },
          },
          required: ["tarefas", "regras"],
        },
        smartReplies: { type: "array", items: { type: "string" } },
        discussedTopics: { type: "array", items: { type: "string" } },
        missingTopics: { type: "array", items: { type: "string" } },
        compatibilitySignals: { type: "array", items: { type: "string" } },
        consultationReadiness: { type: "number" },
        recommendedNextStep: { type: "string" },
        matchmakingSummary: { type: "string" },
        conversationStage: { type: "string", enum: ["inicio", "negociacao", "acordo", "finalizado"] },
        sentiment: { type: "string", enum: ["positivo", "neutro", "tenso"] },
      },
      required: [
        "contractDraft", "smartReplies", "discussedTopics", "missingTopics",
        "compatibilitySignals", "consultationReadiness", "recommendedNextStep",
        "matchmakingSummary", "conversationStage", "sentiment",
      ],
    },
  },
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { messages, currentUserId, userRole } = await req.json() as {
      messages: Message[]; currentUserId: string; userRole: "cuidador" | "responsavel";
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY nao configurada");

    const roleLabel = userRole === "responsavel" ? "Responsavel pelo idoso" : "Cuidador profissional";
    const otherRole = userRole === "responsavel" ? "Cuidador profissional" : "Responsavel pelo idoso";
    const conversation = (messages ?? [])
      .map((m) => `${m.sender_id === currentUserId ? roleLabel : otherRole}: ${m.content}`)
      .join("\n") || "(conversa ainda nao iniciada)";

    const systemPrompt = `Voce e um assistente especializado em analisar conversas entre responsaveis por idosos e cuidadores profissionais na plataforma Fly Care. Sempre responda chamando a funcao analyze_chat com a estrutura completa. Para smartReplies gere exatamente 3 sugestoes curtas para a proxima mensagem do PAPEL ATUAL (${roleLabel}).`;

    const userPrompt = `PAPEL DO USUARIO ATUAL: ${roleLabel}\n\nCONVERSA:\n${conversation}\n\nAnalise e retorne contractDraft (valor, horarios, periodo, tarefas, regras), 3 smartReplies, topicos discutidos/faltantes, sinais de compatibilidade, consultationReadiness 0-100, recommendedNextStep, matchmakingSummary (<=140 chars), conversationStage e sentiment.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [analysisTool],
        tool_choice: { type: "function", function: { name: "analyze_chat" } },
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("AI gateway error:", resp.status, errText);
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Limite de uso atingido, tente novamente em instantes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "Creditos de IA esgotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "Erro na IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("Resposta sem tool_call");
    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat-ai-analyze error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
