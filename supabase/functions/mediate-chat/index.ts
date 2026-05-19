// Lovable AI mediated chat between Responsável and Cuidador
// Returns structured mediation result via tool calling
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface TranscriptMessage {
  author_role: "responsavel" | "cuidador" | "ai";
  visible_to_role: "responsavel" | "cuidador" | "both";
  content: string;
  message_kind: string;
}

const SYSTEM_PROMPT = `Você é a IA mediadora da Fly Care, plataforma brasileira que conecta responsáveis por idosos a cuidadores profissionais.

MISSÃO: Entrevistar cada lado SEPARADAMENTE, coletar todas as informações necessárias e, quando ambos tiverem fornecido dados suficientes e compatíveis, gerar um contrato inicial visível para os dois.

━━━ INFORMAÇÕES A COLETAR ━━━

DO RESPONSÁVEL:
1. Paciente: idade, diagnósticos, nível de mobilidade
2. Tarefas: higiene, medicamentos, alimentação, companhia, fraldas, fisioterapia
3. Horário: dias da semana, turno (manhã/tarde/noite/integral/plantão)
4. Localização: bairro e cidade
5. Orçamento: valor por hora/dia/mês
6. Regras: não fumante, animais, restrições

DO CUIDADOR:
1. Experiência: anos, especializações (Alzheimer, AVC, acamados, demência)
2. Disponibilidade: dias, horários, tipo de serviço (diarista, fixo, plantão)
3. Localização: região de atendimento
4. Valores cobrados
5. Formação: certificações

━━━ REGRAS ━━━
- UMA pergunta por mensagem
- Confirme antes de avançar
- Tom acolhedor, português brasileiro informal
- NUNCA revele a fala bruta do outro lado
- Quando este lado completar, diga: "Perfeito! Já tenho o que preciso. Estou finalizando com o outro lado."

━━━ contractReady = true ━━━
Apenas quando AMBOS os lados completaram E os dados são compatíveis.
readinessScore ≥ 85.

━━━ smartReplies (CRÍTICO) ━━━
Sempre gere 3 a 4 sugestões CURTAS e ESPECÍFICAS que o usuário atual poderia clicar para responder à sua última pergunta. Devem ser respostas plausíveis e contextuais (ex: se você perguntou "qual a idade?", sugira "78 anos", "82 anos, com Alzheimer", "65, totalmente independente"). Máximo 6 palavras cada.`;

const mediationTool = {
  type: "function",
  function: {
    name: "mediation_result",
    description: "Resultado estruturado da mediação da conversa.",
    parameters: {
      type: "object",
      properties: {
        replyToSender: { type: "string", description: "Resposta natural ao usuário atual (máx 3 frases)." },
        bridgeForOtherSide: { type: "string", description: "Mensagem para o outro lado, sem expor fala bruta (máx 2 frases)." },
        matchSummary: { type: "string" },
        nextStep: { type: "string" },
        readinessScore: { type: "number" },
        missingTopics: { type: "array", items: { type: "string" } },
        compatibilitySignals: { type: "array", items: { type: "string" } },
        contractReady: { type: "boolean" },
        smartReplies: {
          type: "array",
          items: { type: "string" },
          description: "3 a 4 sugestões curtas que o usuário atual pode clicar para responder."
        },
        contract: {
          type: "object",
          properties: {
            valorAcordado: { type: "string" },
            horarios: { type: "string" },
            periodo: { type: "string" },
            tarefas: { type: "array", items: { type: "string" } },
            regras: { type: "array", items: { type: "string" } },
            resumoFinal: { type: "string" },
          },
          required: ["tarefas", "regras", "resumoFinal"],
          additionalProperties: false,
        },
      },
      required: [
        "replyToSender", "bridgeForOtherSide", "matchSummary", "nextStep",
        "readinessScore", "missingTopics", "compatibilitySignals",
        "contractReady", "smartReplies", "contract",
      ],
      additionalProperties: false,
    },
  },
};

function buildUserPrompt(transcript: TranscriptMessage[], senderRole: string): string {
  const roleLabel = senderRole === "responsavel" ? "Responsável pelo idoso" : "Cuidador profissional";
  const otherLabel = senderRole === "responsavel" ? "Cuidador" : "Responsável";

  const transcriptText = transcript
    .filter((m) => m.message_kind !== "contract")
    .map((m) => {
      const author = m.author_role === "ai" ? "IA Fly Care" : m.author_role === "responsavel" ? "Responsável" : "Cuidador";
      return `[${author} → visível para: ${m.visible_to_role}] ${m.content}`;
    })
    .join("\n");

  return `QUEM ESTÁ FALANDO AGORA: ${roleLabel}
OUTRO LADO: ${otherLabel}

━━━ TRANSCRIÇÃO COMPLETA ━━━
${transcriptText || "(primeira mensagem — sem histórico)"}

Gere a próxima mediação. Lembre-se de incluir 3-4 smartReplies curtas e específicas que o ${roleLabel} pode clicar para responder à sua pergunta.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const { transcript, senderRole } = await req.json();
    if (!Array.isArray(transcript) || !["responsavel", "cuidador"].includes(senderRole)) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(transcript, senderRole) },
        ],
        tools: [mediationTool],
        tool_choice: { type: "function", function: { name: "mediation_result" } },
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("AI gateway error", resp.status, errText);
      const status = resp.status === 429 || resp.status === 402 ? resp.status : 500;
      const msg =
        resp.status === 429 ? "Muitas requisições. Tente em instantes."
        : resp.status === 402 ? "Créditos de IA esgotados. Recarregue em Configurações > Workspace > Uso."
        : "Erro na IA mediadora.";
      return new Response(JSON.stringify({ error: msg }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    const argsRaw = toolCall?.function?.arguments;
    if (!argsRaw) {
      console.error("No tool call returned", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "Resposta inválida da IA" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(argsRaw);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("mediate-chat error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
