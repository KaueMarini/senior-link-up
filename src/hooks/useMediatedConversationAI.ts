import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";

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

interface MediatedAIResult {
  replyToSender: string;
  bridgeForOtherSide: string;
  matchSummary: string;
  nextStep: string;
  readinessScore: number;
  missingTopics: string[];
  compatibilitySignals: string[];
  contractReady: boolean;
  contract: MediatedContract;
}

// ─────────────────────────────────────────────
// Gemini client
// ─────────────────────────────────────────────

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// ─────────────────────────────────────────────
// Structured output schema
// ─────────────────────────────────────────────

const mediationSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    replyToSender:        { type: SchemaType.STRING },
    bridgeForOtherSide:   { type: SchemaType.STRING },
    matchSummary:         { type: SchemaType.STRING },
    nextStep:             { type: SchemaType.STRING },
    readinessScore:       { type: SchemaType.NUMBER },
    missingTopics:        { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    compatibilitySignals: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    contractReady:        { type: SchemaType.BOOLEAN },
    contract: {
      type: SchemaType.OBJECT,
      properties: {
        valorAcordado: { type: SchemaType.STRING, nullable: true },
        horarios:      { type: SchemaType.STRING, nullable: true },
        periodo:       { type: SchemaType.STRING, nullable: true },
        tarefas:       { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        regras:        { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        resumoFinal:   { type: SchemaType.STRING },
      },
      required: ["tarefas", "regras", "resumoFinal"],
    },
  },
  required: [
    "replyToSender", "bridgeForOtherSide", "matchSummary", "nextStep",
    "readinessScore", "missingTopics", "compatibilitySignals", "contractReady", "contract",
  ],
};

// ─────────────────────────────────────────────
// Prompt builder
// ─────────────────────────────────────────────

function buildMediationPrompt(
  transcript: MediatedMessageRecord[],
  senderRole: MediatedRole,
): string {
  const roleLabel  = senderRole === "responsavel" ? "Responsável pelo idoso" : "Cuidador profissional";
  const otherLabel = senderRole === "responsavel" ? "Cuidador" : "Responsável";

  const transcriptText = transcript
    .filter((m) => m.message_kind !== "contract")
    .map((m) => {
      const author =
        m.author_role === "ai"
          ? "IA Fly Care"
          : m.author_role === "responsavel"
          ? "Responsável"
          : "Cuidador";
      return `[${author} → visível para: ${m.visible_to_role}] ${m.content}`;
    })
    .join("\n");

  return `
Você é a IA mediadora da Fly Care, plataforma que conecta responsáveis por idosos a cuidadores profissionais no Brasil.

MISSÃO: Entrevistar cada lado SEPARADAMENTE, coletar todas as informações necessárias e, quando ambos os lados tiverem fornecido dados suficientes e compatíveis, gerar um contrato inicial visível para os dois.

QUEM ESTÁ FALANDO AGORA: ${roleLabel}

━━━ INFORMAÇÕES A COLETAR ━━━

DO RESPONSÁVEL:
1. Paciente: idade, diagnósticos principais, nível de mobilidade/dependência
2. Tarefas necessárias: higiene, medicamentos, alimentação, companhia, consultas, fraldas, fisioterapia
3. Horário: dias da semana, turno (manhã/tarde/noite/integral/plantão 12h/24h)
4. Localização: bairro e cidade
5. Orçamento: valor por hora, diária ou mensalidade
6. Regras: não fumante, animais de estimação, restrições etc.

DO CUIDADOR:
1. Experiência: anos de atuação, especializações (Alzheimer, AVC, acamados, demência)
2. Disponibilidade: dias e horários, tipo de serviço (diarista, fixo, plantão)
3. Localização: bairro/região onde atende
4. Valores: quanto cobra (por hora, diária ou mensalidade)
5. Formação: certificações, cursos relevantes

━━━ REGRAS DE ENTREVISTA ━━━
- Faça UMA pergunta por mensagem — nunca bombardeie o usuário
- Confirme o que entendeu antes de pedir o próximo ponto
- Tom acolhedor, profissional, em português brasileiro informal
- NUNCA revele a mensagem bruta do outro lado
- Quando este lado tiver fornecido todas as informações essenciais, diga:
  "Perfeito! Já tenho o que preciso da sua parte. Estou finalizando o alinhamento com o outro lado."

━━━ QUANDO DEFINIR contractReady: true ━━━
Somente quando AMBAS as condições forem verdadeiras:
✓ Responsável forneceu: dados do paciente + tarefas + horário + localização + orçamento
✓ Cuidador forneceu: experiência + disponibilidade + localização + valores
E os dados são compatíveis (orçamento ≥ 80% do valor pedido, horários sobrepostos, localização viável)
readinessScore deve ser ≥ 85 para contractReady ser true.

━━━ TRANSCRIÇÃO COMPLETA (você vê tudo) ━━━
${transcriptText || "(primeira mensagem — nenhum histórico ainda)"}

━━━ INSTRUÇÕES DE SAÍDA ━━━
- replyToSender: resposta natural para ${roleLabel} (máx 3 frases, direto ao ponto)
  • Se for a PRIMEIRA mensagem, cumprimente e faça a primeira pergunta essencial para o papel
  • Se ainda faltam dados, confirme o que entendeu e pergunte o próximo item
  • Se este lado completou o onboarding, informe que está aguardando o outro lado
- bridgeForOtherSide: mensagem que você enviaria para o ${otherLabel} sem expor a fala bruta
  • Pode ser uma pergunta nova baseada no que aprendeu, confirmação de progresso, aviso de que o outro lado avançou
  • Máx 2 frases
- matchSummary: estado do match em 1 frase objetiva
- nextStep: próximo ponto a coletar ou ação recomendada
- readinessScore: 0 (sem dados) → 85+ (contrato pronto)
- missingTopics: lista de tópicos que ainda faltam ser discutidos
- compatibilitySignals: o que já está alinhado entre os dois lados
- contractReady: true APENAS quando ambos têm dados suficientes E compatíveis
- contract: preencha quando contractReady=true; extraia das informações já coletadas na conversa:
  • valorAcordado: valor acordado no formato "R$ X/hora" ou "R$ X/dia" ou "R$ X/mês"
  • horarios: ex. "08h às 16h" ou "Turno da manhã"
  • periodo: ex. "Segunda a sexta" ou "3 dias por semana"
  • tarefas: lista com as tarefas confirmadas
  • regras: lista com regras/restrições confirmadas
  • resumoFinal: 2-3 frases descrevendo o acordo de forma clara para ambas as partes
  Quando contractReady=false: use strings vazias e arrays vazios no objeto contract.
`.trim();
}

// ─────────────────────────────────────────────
// Fallback
// ─────────────────────────────────────────────

function fallbackMediation(
  transcript: MediatedMessageRecord[],
  senderRole: MediatedRole,
): MediatedAIResult {
  const text = transcript.map((m) => m.content).join("\n");

  const has = (re: RegExp) => re.test(text);
  const hasPaciente   = has(/(idade|anos|diagnos|alzheimer|avc|acamad|demenci|depende)/i);
  const hasTarefa     = has(/(banho|higiene|medicament|aliment|companhia|consulta|fralda)/i);
  const hasHorario    = has(/(manha|tarde|noite|segunda|terca|quarta|quinta|sexta|horario|turno|integral|plantao)/i);
  const hasLocal      = has(/(bairro|cidade|regiao|zona|sao paulo|rio|endereco)/i);
  const hasValor      = has(/(r\$|reais|valor|hora|diaria|mensal|cobr|pag)/i);
  const hasExp        = has(/(anos|experiencia|especializ|trabalhei|cuidei|formac|certif)/i);
  const hasDisp       = has(/(disponiv|trabalho|atendo|fixo|diarista|plantao)/i);

  const responsavelOk = hasPaciente && hasTarefa && hasHorario && hasLocal && hasValor;
  const cuidadorOk    = hasExp && hasDisp && hasLocal && hasValor;

  const missingTopics: string[] = [];
  if (senderRole === "responsavel") {
    if (!hasPaciente)  missingTopics.push("dados do paciente (idade e diagnóstico)");
    if (!hasTarefa)    missingTopics.push("tarefas necessárias");
    if (!hasHorario)   missingTopics.push("horário e dias da semana");
    if (!hasLocal)     missingTopics.push("localização");
    if (!hasValor)     missingTopics.push("orçamento disponível");
  } else {
    if (!hasExp)       missingTopics.push("experiência e especializações");
    if (!hasDisp)      missingTopics.push("disponibilidade e tipo de serviço");
    if (!hasLocal)     missingTopics.push("região de atendimento");
    if (!hasValor)     missingTopics.push("valores cobrados");
  }

  const compatibilitySignals: string[] = [
    hasPaciente && "Perfil do paciente mapeado",
    hasTarefa   && "Tarefas de cuidado identificadas",
    hasHorario  && "Disponibilidade de horário discutida",
    hasLocal    && "Localização alinhada",
    hasValor    && "Valores em discussão",
    hasExp      && "Experiência do cuidador apresentada",
  ].filter(Boolean) as string[];

  const totalFields = 5;
  const filledSide  = senderRole === "responsavel"
    ? [hasPaciente, hasTarefa, hasHorario, hasLocal, hasValor].filter(Boolean).length
    : [hasExp, hasDisp, hasLocal, hasValor, hasTarefa].filter(Boolean).length;

  const baseScore = Math.round((filledSide / totalFields) * 50);
  const readinessScore = responsavelOk && cuidadorOk ? 90 : baseScore;
  const contractReady  = responsavelOk && cuidadorOk;

  const firstMissing = missingTopics[0];
  const replyToSender = contractReady
    ? "Ótimo! Já tenho todas as informações necessárias. Vou gerar o contrato inicial agora."
    : transcript.length === 0 || transcript.filter((m) => m.author_role === senderRole).length === 0
    ? senderRole === "responsavel"
      ? "Olá! Sou a IA da Fly Care e vou mediar esta negociação. Para começar, me conta: qual a idade do seu familiar e quais são os principais cuidados que ele precisa?"
      : "Olá! Sou a IA da Fly Care e vou mediar esta negociação. Para começar, há quantos anos você atua como cuidador e quais são suas especializações?"
    : firstMissing
    ? `Entendi. Agora preciso de mais um ponto: ${firstMissing}.`
    : "Entendi. Já estou finalizando o alinhamento com o outro lado.";

  const bridgeForOtherSide = senderRole === "responsavel"
    ? "A família avançou com mais detalhes. Para ajustar o match, preciso de mais informações da sua parte."
    : "O cuidador compartilhou novos detalhes. Para ajustar o match, preciso de mais informações da sua parte.";

  const emptyContract: MediatedContract = { tarefas: [], regras: [], resumoFinal: "" };

  return {
    replyToSender,
    bridgeForOtherSide,
    matchSummary: contractReady
      ? "Ambos os lados forneceram informações suficientes. Contrato gerado!"
      : `Coletando dados. ${filledSide} de ${totalFields} pontos confirmados.`,
    nextStep: firstMissing ?? "Gerar contrato.",
    readinessScore,
    missingTopics,
    compatibilitySignals,
    contractReady,
    contract: contractReady
      ? {
          valorAcordado: undefined,
          horarios: undefined,
          periodo: undefined,
          tarefas: hasTarefa
            ? ["higiene", "medicamentos", "alimentação"].filter((t) =>
                new RegExp(t.split("").join(".*"), "i").test(text)
              )
            : [],
          regras: [],
          resumoFinal: "Acordo identificado com base nas informações coletadas de ambos os lados. Confirme os detalhes abaixo.",
        }
      : emptyContract,
  };
}

// ─────────────────────────────────────────────
// Main Gemini call
// ─────────────────────────────────────────────

export async function mediateConversation(
  transcript: MediatedMessageRecord[],
  senderRole: MediatedRole,
): Promise<MediatedAIResult> {
  if (!genAI) return fallbackMediation(transcript, senderRole);

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: mediationSchema,
        temperature: 0.4,
      },
    });

    const prompt = buildMediationPrompt(transcript, senderRole);
    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text()) as MediatedAIResult;

    return {
      replyToSender:        parsed.replyToSender        ?? "Entendi. Vou continuar intermediando isso para você.",
      bridgeForOtherSide:   parsed.bridgeForOtherSide   ?? "Recebi novas informações. Vou confirmar isso com o outro lado.",
      matchSummary:         parsed.matchSummary         ?? "Match em construção.",
      nextStep:             parsed.nextStep             ?? "Continuar coletando informações.",
      readinessScore:       Math.max(0, Math.min(100, parsed.readinessScore ?? 0)),
      missingTopics:        parsed.missingTopics        ?? [],
      compatibilitySignals: parsed.compatibilitySignals ?? [],
      contractReady:        parsed.contractReady        ?? false,
      contract: {
        valorAcordado: parsed.contract?.valorAcordado ?? undefined,
        horarios:      parsed.contract?.horarios      ?? undefined,
        periodo:       parsed.contract?.periodo       ?? undefined,
        tarefas:       parsed.contract?.tarefas       ?? [],
        regras:        parsed.contract?.regras        ?? [],
        resumoFinal:   parsed.contract?.resumoFinal   ?? "",
      },
    };
  } catch (error) {
    console.error("[mediateConversation] Gemini error → fallback", error);
    return fallbackMediation(transcript, senderRole);
  }
}
