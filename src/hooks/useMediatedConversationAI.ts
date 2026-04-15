import { GoogleGenerativeAI } from "@google/generative-ai";

export type MediatedRole = "responsavel" | "cuidador";

export interface MediatedMessageRecord {
  id: string;
  author_role: "responsavel" | "cuidador" | "ai";
  visible_to_role: "responsavel" | "cuidador" | "both";
  content: string;
  message_kind: "message" | "summary" | "question" | "system";
  created_at: string;
}

interface MediatedAIResult {
  replyToSender: string;
  bridgeForOtherSide: string;
  matchSummary: string;
  nextStep: string;
  readinessScore: number;
  missingTopics: string[];
  compatibilitySignals: string[];
}

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

function fallbackMediation(
  transcript: MediatedMessageRecord[],
  senderRole: MediatedRole,
): MediatedAIResult {
  const text = transcript.map((message) => message.content).join("\n");
  const hasPrice = /(r\$|reais|valor|hora|diaria|mensal)/i.test(text);
  const hasSchedule = /(manha|tarde|noite|segunda|terca|quarta|quinta|sexta|sabado|domingo|turno|horario)/i.test(text);
  const hasLocation = /(bairro|cidade|regiao|zona|sao paulo|rio)/i.test(text);
  const hasCareNeed = /(banho|medicament|companhia|aliment|alzheimer|demencia|acamad|consulta|fralda)/i.test(text);

  const missingTopics = [
    !hasCareNeed ? "detalhar necessidades do cuidado" : null,
    !hasSchedule ? "alinhar horarios e disponibilidade" : null,
    !hasPrice ? "alinhar faixa de valor" : null,
    !hasLocation ? "confirmar localizacao" : null,
  ].filter(Boolean) as string[];

  const compatibilitySignals = [
    hasCareNeed ? "As necessidades do cuidado ja estao mais claras" : null,
    hasSchedule ? "Ja existe alguma nocao de disponibilidade" : null,
    hasPrice ? "Ja ha abertura para falar de investimento" : null,
    hasLocation ? "A localizacao ja entrou na conversa" : null,
  ].filter(Boolean) as string[];

  const readinessScore = [hasCareNeed, hasSchedule, hasPrice, hasLocation].filter(Boolean).length * 25;

  return {
    replyToSender:
      missingTopics.length > 0
        ? `Entendi. Vou usar isso para aproximar voces melhor. Agora preciso de mais um ponto: ${missingTopics[0]}.`
        : "Entendi. Ja existe base suficiente para eu conduzir voces rumo a uma consulta inicial.",
    bridgeForOtherSide:
      senderRole === "responsavel"
        ? "A familia compartilhou novos detalhes do caso. Vou confirmar disponibilidade, encaixe e proximos passos com voce."
        : "O cuidador compartilhou novos detalhes de experiencia e disponibilidade. Vou validar encaixe e proximos passos com a familia.",
    matchSummary:
      readinessScore >= 75
        ? "Os dois lados ja mostram boa base para avancar para uma consulta inicial."
        : "O match esta em construcao e ainda precisa de mais alinhamento antes da consulta.",
    nextStep:
      readinessScore >= 75
        ? "Confirmar formato e horario de uma consulta inicial."
        : missingTopics.length > 0
          ? `Coletar: ${missingTopics[0]}.`
          : "Continuar refinando o encaixe entre expectativas e disponibilidade.",
    readinessScore,
    missingTopics,
    compatibilitySignals,
  };
}

export async function mediateConversation(
  transcript: MediatedMessageRecord[],
  senderRole: MediatedRole,
): Promise<MediatedAIResult> {
  if (!genAI) return fallbackMediation(transcript, senderRole);

  try {
    const transcriptText = transcript
      .map((message) => `[${message.author_role}/${message.visible_to_role}] ${message.content}`)
      .join("\n");

    const prompt = `
Voce e a IA mediadora da Fly Care.
O responsavel e o cuidador nao conversam diretamente entre si.
Cada um fala apenas com voce, e voce faz a ponte.

REGRAS:
- Nunca revele a mensagem bruta de um lado para o outro.
- Fale com linguagem humana, profissional e acolhedora.
- Sua funcao e aproximar, alinhar expectativas e conduzir para consulta inicial.
- Responda apenas com JSON valido.

CONTEXTO:
- Lado que acabou de falar: ${senderRole}
- Outro lado: ${senderRole === "responsavel" ? "cuidador" : "responsavel"}

TRANSCRICAO:
${transcriptText || "(sem historico)"}

RETORNE JSON COM:
- replyToSender: resposta curta para quem acabou de falar
- bridgeForOtherSide: mensagem curta que voce enviaria para o outro lado sem expor a fala bruta
- matchSummary: resumo curto do estado atual do match
- nextStep: proximo passo recomendado
- readinessScore: numero de 0 a 100
- missingTopics: lista de pendencias
- compatibilitySignals: lista de sinais de compatibilidade
`.trim();

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text()) as MediatedAIResult;

    return {
      replyToSender: parsed.replyToSender ?? "Entendi. Vou continuar intermediando isso para voce.",
      bridgeForOtherSide: parsed.bridgeForOtherSide ?? "Recebi novas informacoes e vou validar isso com o outro lado.",
      matchSummary: parsed.matchSummary ?? "O match esta sendo construido pela IA.",
      nextStep: parsed.nextStep ?? "Continuar a coleta de informacoes relevantes.",
      readinessScore: Math.max(0, Math.min(100, parsed.readinessScore ?? 0)),
      missingTopics: parsed.missingTopics ?? [],
      compatibilitySignals: parsed.compatibilitySignals ?? [],
    };
  } catch (error) {
    console.error("[mediateConversation] fallback after Gemini error", error);
    return fallbackMediation(transcript, senderRole);
  }
}
