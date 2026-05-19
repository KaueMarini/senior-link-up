import { supabase } from "@/integrations/supabase/client";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type MediatedRole = "responsavel" | "cuidador";

export interface MediatedMessageRecord {
  id: string;
  author_role: "responsavel" | "cuidador" | "ai";
  visible_to_role: "responsavel" | "cuidador" | "both";
  content: string;
  message_kind: "message" | "summary" | "question" | "system" | "contract";
  created_at: string;
}

export interface MediatedContract {
  valorAcordado?: string;
  horarios?: string;
  periodo?: string;
  tarefas: string[];
  regras: string[];
  resumoFinal: string;
}

export interface MediatedAIResult {
  replyToSender: string;
  bridgeForOtherSide: string;
  matchSummary: string;
  nextStep: string;
  readinessScore: number;
  missingTopics: string[];
  compatibilitySignals: string[];
  smartReplies: string[];
  contractReady: boolean;
  contract: MediatedContract;
}

// ─────────────────────────────────────────────
// Fallback (regex-based when AI is unavailable)
// ─────────────────────────────────────────────

function fallbackMediation(
  transcript: MediatedMessageRecord[],
  senderRole: MediatedRole,
): MediatedAIResult {
  const text = transcript.map((m) => m.content).join("\n");
  const has = (re: RegExp) => re.test(text);
  const hasPaciente = has(/(idade|anos|diagnos|alzheimer|avc|acamad|demenci|depende)/i);
  const hasTarefa   = has(/(banho|higiene|medicament|aliment|companhia|consulta|fralda)/i);
  const hasHorario  = has(/(manha|tarde|noite|segunda|terca|quarta|quinta|sexta|horario|turno|integral|plantao)/i);
  const hasLocal    = has(/(bairro|cidade|regiao|zona|sao paulo|rio|endereco)/i);
  const hasValor    = has(/(r\$|reais|valor|hora|diaria|mensal|cobr|pag)/i);
  const hasExp      = has(/(anos|experiencia|especializ|trabalhei|cuidei|formac|certif)/i);
  const hasDisp     = has(/(disponiv|trabalho|atendo|fixo|diarista|plantao)/i);

  const responsavelOk = hasPaciente && hasTarefa && hasHorario && hasLocal && hasValor;
  const cuidadorOk    = hasExp && hasDisp && hasLocal && hasValor;

  const missingTopics: string[] = [];
  const smartRepliesMap: Record<string, string[]> = {};

  if (senderRole === "responsavel") {
    if (!hasPaciente) { missingTopics.push("dados do paciente (idade e diagnóstico)"); smartRepliesMap.paciente = ["78 anos, Alzheimer", "82 anos, acamada", "70 anos, AVC recente"]; }
    if (!hasTarefa)   { missingTopics.push("tarefas necessárias"); smartRepliesMap.tarefa = ["Higiene e remédios", "Companhia e alimentação", "Cuidado integral"]; }
    if (!hasHorario)  { missingTopics.push("horário e dias"); smartRepliesMap.horario = ["Segunda a sexta, dia", "Plantão 12h noturno", "Período integral"]; }
    if (!hasLocal)    { missingTopics.push("localização"); smartRepliesMap.local = ["Zona Sul SP", "Centro RJ", "Bairro Jardins"]; }
    if (!hasValor)    { missingTopics.push("orçamento"); smartRepliesMap.valor = ["R$ 30/hora", "R$ 150/diária", "R$ 3000/mês"]; }
  } else {
    if (!hasExp)   { missingTopics.push("experiência e especializações"); smartRepliesMap.exp = ["5 anos, Alzheimer", "10 anos, acamados", "Técnica em enfermagem"]; }
    if (!hasDisp)  { missingTopics.push("disponibilidade"); smartRepliesMap.disp = ["Plantão 12h", "Diarista 3x semana", "Período integral fixo"]; }
    if (!hasLocal) { missingTopics.push("região"); smartRepliesMap.local = ["Atendo Zona Sul", "Centro e adjacências", "Toda região metropolitana"]; }
    if (!hasValor) { missingTopics.push("valores"); smartRepliesMap.valor = ["R$ 35/hora", "R$ 180/diária", "R$ 3500/mês"]; }
  }

  const compatibilitySignals = [
    hasPaciente && "Perfil do paciente mapeado",
    hasTarefa   && "Tarefas identificadas",
    hasHorario  && "Horário discutido",
    hasLocal    && "Localização alinhada",
    hasValor    && "Valores em discussão",
    hasExp      && "Experiência apresentada",
  ].filter(Boolean) as string[];

  const totalFields = 5;
  const filledSide = senderRole === "responsavel"
    ? [hasPaciente, hasTarefa, hasHorario, hasLocal, hasValor].filter(Boolean).length
    : [hasExp, hasDisp, hasLocal, hasValor, hasTarefa].filter(Boolean).length;

  const readinessScore = responsavelOk && cuidadorOk ? 90 : Math.round((filledSide / totalFields) * 50);
  const contractReady = responsavelOk && cuidadorOk;

  const firstMissing = missingTopics[0];
  const firstKey = Object.keys(smartRepliesMap)[0];
  const smartReplies = firstKey ? smartRepliesMap[firstKey] : ["Sim", "Pode confirmar", "Tenho dúvida"];

  const replyToSender = contractReady
    ? "Ótimo! Tenho todas as informações. Gerando o contrato agora."
    : transcript.filter((m) => m.author_role === senderRole).length === 0
    ? (senderRole === "responsavel"
        ? "Olá! Sou a IA da Fly Care. Para começar, qual a idade do seu familiar e quais cuidados ele precisa?"
        : "Olá! Sou a IA da Fly Care. Para começar, há quantos anos você atua e quais suas especializações?")
    : firstMissing
    ? `Entendi. Agora preciso de mais um ponto: ${firstMissing}.`
    : "Entendi. Finalizando o alinhamento com o outro lado.";

  return {
    replyToSender,
    bridgeForOtherSide: senderRole === "responsavel"
      ? "A família trouxe novos detalhes. Preciso de mais informações da sua parte."
      : "O cuidador trouxe novos detalhes. Preciso de mais informações da sua parte.",
    matchSummary: contractReady ? "Ambos completaram. Contrato gerado!" : `Coletando dados. ${filledSide} de ${totalFields} pontos.`,
    nextStep: firstMissing ?? "Gerar contrato.",
    readinessScore,
    missingTopics,
    compatibilitySignals,
    smartReplies,
    contractReady,
    contract: contractReady
      ? { tarefas: [], regras: [], resumoFinal: "Acordo identificado. Confirme os detalhes." }
      : { tarefas: [], regras: [], resumoFinal: "" },
  };
}

// ─────────────────────────────────────────────
// Main edge-function call
// ─────────────────────────────────────────────

export async function mediateConversation(
  transcript: MediatedMessageRecord[],
  senderRole: MediatedRole,
): Promise<MediatedAIResult> {
  try {
    const { data, error } = await supabase.functions.invoke("mediate-chat", {
      body: {
        transcript: transcript.map((m) => ({
          author_role: m.author_role,
          visible_to_role: m.visible_to_role,
          content: m.content,
          message_kind: m.message_kind,
        })),
        senderRole,
      },
    });

    if (error || !data || (data as any).error) {
      console.warn("[mediateConversation] AI fallback:", error || (data as any)?.error);
      return fallbackMediation(transcript, senderRole);
    }

    const parsed = data as MediatedAIResult;
    return {
      replyToSender:        parsed.replyToSender        ?? "Entendi. Vou continuar mediando.",
      bridgeForOtherSide:   parsed.bridgeForOtherSide   ?? "Recebi novas informações. Vou confirmar com o outro lado.",
      matchSummary:         parsed.matchSummary         ?? "Match em construção.",
      nextStep:             parsed.nextStep             ?? "Continuar coletando informações.",
      readinessScore:       Math.max(0, Math.min(100, parsed.readinessScore ?? 0)),
      missingTopics:        parsed.missingTopics        ?? [],
      compatibilitySignals: parsed.compatibilitySignals ?? [],
      smartReplies:         (parsed.smartReplies ?? []).slice(0, 4),
      contractReady:        parsed.contractReady        ?? false,
      contract: {
        valorAcordado: parsed.contract?.valorAcordado || undefined,
        horarios:      parsed.contract?.horarios      || undefined,
        periodo:       parsed.contract?.periodo       || undefined,
        tarefas:       parsed.contract?.tarefas       ?? [],
        regras:        parsed.contract?.regras        ?? [],
        resumoFinal:   parsed.contract?.resumoFinal   ?? "",
      },
    };
  } catch (err) {
    console.error("[mediateConversation] error → fallback", err);
    return fallbackMediation(transcript, senderRole);
  }
}
