import { useEffect, useRef, useState } from "react";
import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";

export interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

export interface ContractDraft {
  valorAcordado?: string;
  horarios?: string;
  periodo?: string;
  tarefas: string[];
  regras: string[];
}

interface GeminiAnalysis {
  contractDraft: ContractDraft;
  smartReplies: string[];
  discussedTopics: string[];
  missingTopics: string[];
  compatibilitySignals: string[];
  consultationReadiness: number;
  recommendedNextStep: string;
  matchmakingSummary: string;
  conversationStage: "inicio" | "negociacao" | "acordo" | "finalizado";
  sentiment: "positivo" | "neutro" | "tenso";
}

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const analysisSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    contractDraft: {
      type: SchemaType.OBJECT,
      properties: {
        valorAcordado: { type: SchemaType.STRING, nullable: true },
        horarios: { type: SchemaType.STRING, nullable: true },
        periodo: { type: SchemaType.STRING, nullable: true },
        tarefas: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        regras: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      },
      required: ["tarefas", "regras"],
    },
    smartReplies: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    discussedTopics: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    missingTopics: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    compatibilitySignals: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    consultationReadiness: { type: SchemaType.NUMBER },
    recommendedNextStep: { type: SchemaType.STRING },
    matchmakingSummary: { type: SchemaType.STRING },
    conversationStage: {
      type: SchemaType.STRING,
      format: "enum",
      enum: ["inicio", "negociacao", "acordo", "finalizado"],
    },
    sentiment: {
      type: SchemaType.STRING,
      format: "enum",
      enum: ["positivo", "neutro", "tenso"],
    },
  },
  required: [
    "contractDraft",
    "smartReplies",
    "discussedTopics",
    "missingTopics",
    "compatibilitySignals",
    "consultationReadiness",
    "recommendedNextStep",
    "matchmakingSummary",
    "conversationStage",
    "sentiment",
  ],
};

function buildPrompt(messages: Message[], currentUserId: string, userRole: "cuidador" | "responsavel"): string {
  const roleLabel = userRole === "responsavel" ? "Responsavel pelo idoso" : "Cuidador profissional";
  const otherRole = userRole === "responsavel" ? "Cuidador profissional" : "Responsavel pelo idoso";

  const conversation = messages
    .map((message) => {
      const speaker = message.sender_id === currentUserId ? roleLabel : otherRole;
      return `${speaker}: ${message.content}`;
    })
    .join("\n");

  return `
Voce e um assistente especializado em analise de conversas entre responsaveis por idosos e cuidadores profissionais na plataforma Fly Care.

PAPEL DO USUARIO ATUAL: ${roleLabel}

CONVERSA:
${conversation || "(conversa ainda nao iniciada)"}

INSTRUCOES:
1. contractDraft: extraia valor, horarios, periodo, tarefas e regras mencionadas. Se faltarem dados, use null ou lista vazia.
2. smartReplies: gere exatamente 3 sugestoes curtas, naturais e uteis para a proxima mensagem do usuario atual.
3. discussedTopics: liste os topicos ja abordados.
4. missingTopics: liste o que ainda falta alinhar para aumentar a chance de fechamento.
5. compatibilitySignals: liste sinais concretos de compatibilidade entre as partes.
6. consultationReadiness: de uma nota de 0 a 100 para o quanto a conversa ja esta pronta para marcar uma consulta inicial.
7. recommendedNextStep: diga em uma frase curta qual deve ser o proximo passo ideal.
8. matchmakingSummary: resuma em ate 140 caracteres o estado atual do match.
9. conversationStage: classifique como inicio, negociacao, acordo ou finalizado.
10. sentiment: classifique como positivo, neutro ou tenso.
`.trim();
}

function fallbackAnalysis(
  messages: Message[],
  currentUserId: string,
  userRole: "cuidador" | "responsavel",
): GeminiAnalysis {
  const text = messages.map((message) => message.content).join("\n");
  const discussedTopics: string[] = [];

  const valorMatch =
    text.match(/R\$\s*([\d.,]+)(?:\s*\/h(?:ora)?)?/i) ||
    text.match(/([\d.,]+)\s*(?:reais\s+por\s+hora|por\s+hora|\/hora)/i);
  const valorAcordado = valorMatch ? `R$ ${valorMatch[1]}/hora` : undefined;
  if (valorAcordado) discussedTopics.push("valor");

  const horarioMatch =
    text.match(/(?:das?\s+)?(\d{1,2}h?\d{0,2})\s+(?:as?|-)\s+(\d{1,2}h?\d{0,2})/i) ||
    text.match(/turno\s+(?:da\s+)?(manha|tarde|noite)/i);
  const horarios = horarioMatch
    ? horarioMatch[3]
      ? `Turno da ${horarioMatch[3]}`
      : `${horarioMatch[1]} as ${horarioMatch[2]}`
    : undefined;
  if (horarios) discussedTopics.push("disponibilidade");

  const tarefasMap = [
    { re: /banho|higiene pessoal/i, label: "Higiene pessoal e banho" },
    { re: /medicament/i, label: "Administracao de medicamentos" },
    { re: /aliment|refeic|cozinhar/i, label: "Alimentacao e refeicoes" },
    { re: /companhia/i, label: "Companhia e apoio emocional" },
    { re: /consulta|medic|hospital/i, label: "Acompanhamento a consultas" },
    { re: /fralda/i, label: "Troca de fraldas" },
  ];
  const tarefas = tarefasMap.filter((item) => item.re.test(text)).map((item) => item.label);
  if (tarefas.length > 0) discussedTopics.push("necessidades");

  const regrasMap = [
    { re: /nao fum/i, label: "Nao fumante" },
    { re: /pontual/i, label: "Pontualidade exigida" },
    { re: /sigilo/i, label: "Sigilo e privacidade" },
  ];
  const regras = regrasMap.filter((item) => item.re.test(text)).map((item) => item.label);

  const smartReplies: string[] = [];
  if (messages.length === 0) {
    smartReplies.push(
      userRole === "responsavel" ? "Ola! Qual e o seu valor por hora?" : "Ola! Me conte sobre o paciente.",
      userRole === "responsavel" ? "Voce tem disponibilidade imediata?" : "Qual e a necessidade principal?",
      userRole === "responsavel" ? "Qual experiencia voce tem com esse tipo de caso?" : "Quais horarios sao esperados?",
    );
  } else {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.sender_id !== currentUserId) {
      if (!valorAcordado) smartReplies.push("Qual e o seu valor por hora?");
      if (!horarios) smartReplies.push("Quais horarios voce tem disponiveis?");
      if (tarefas.length === 0) smartReplies.push("Quais cuidados voce precisa/oferece?");
    }
  }

  const missingTopics = [
    !valorAcordado ? "alinhar valor" : null,
    !horarios ? "confirmar disponibilidade" : null,
    tarefas.length === 0 ? "detalhar cuidados e tarefas" : null,
    !/bairro|cidade|localiza/i.test(text) ? "validar localizacao" : null,
  ].filter(Boolean) as string[];

  const compatibilitySignals = [
    horarios ? "Ha indicios de agenda compativel" : null,
    tarefas.length > 0 ? "As necessidades do cuidado ja apareceram" : null,
    valorAcordado ? "Ja houve abertura para falar de investimento" : null,
    /alzheimer|demencia|parkinson|medicament/i.test(text) ? "Existe contexto clinico relevante para o match" : null,
  ].filter(Boolean) as string[];

  const consultationReadiness = [
    valorAcordado ? 25 : 0,
    horarios ? 25 : 0,
    tarefas.length > 0 ? 25 : 0,
    /bairro|cidade|localiza|consulta|presencial|videochamada/i.test(text) ? 25 : 0,
  ].reduce((sum, value) => sum + value, 0);

  return {
    contractDraft: { valorAcordado, horarios, tarefas, regras },
    smartReplies: smartReplies.slice(0, 3),
    discussedTopics,
    missingTopics,
    compatibilitySignals,
    consultationReadiness,
    recommendedNextStep:
      consultationReadiness >= 75
        ? "Ja vale propor uma consulta inicial para validar o encaixe."
        : missingTopics[0]
          ? `Antes de avancar, vale ${missingTopics[0]}.`
          : "Continue aprofundando a conversa para validar compatibilidade.",
    matchmakingSummary:
      consultationReadiness >= 75
        ? "Match aquecido e com boa base para consulta inicial."
        : "Conversa em andamento, mas ainda precisa de mais alinhamento.",
    conversationStage: messages.length === 0 ? "inicio" : consultationReadiness >= 75 ? "acordo" : "negociacao",
    sentiment: "neutro",
  };
}

async function analyzeWithGemini(
  messages: Message[],
  currentUserId: string,
  userRole: "cuidador" | "responsavel",
): Promise<GeminiAnalysis> {
  if (!genAI) {
    return fallbackAnalysis(messages, currentUserId, userRole);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.3,
      },
    });

    const result = await model.generateContent(buildPrompt(messages, currentUserId, userRole));
    const parsed = JSON.parse(result.response.text()) as GeminiAnalysis;

    parsed.contractDraft.tarefas = parsed.contractDraft.tarefas ?? [];
    parsed.contractDraft.regras = parsed.contractDraft.regras ?? [];
    parsed.smartReplies = parsed.smartReplies ?? [];
    parsed.discussedTopics = parsed.discussedTopics ?? [];
    parsed.missingTopics = parsed.missingTopics ?? [];
    parsed.compatibilitySignals = parsed.compatibilitySignals ?? [];
    parsed.consultationReadiness = Math.max(0, Math.min(100, parsed.consultationReadiness ?? 0));
    parsed.recommendedNextStep = parsed.recommendedNextStep ?? "";
    parsed.matchmakingSummary = parsed.matchmakingSummary ?? "";

    return parsed;
  } catch (error) {
    console.error("[useChatAI] Gemini error, using fallback:", error);
    return fallbackAnalysis(messages, currentUserId, userRole);
  }
}

export function useChatAI(messages: Message[], currentUserId: string, userRole: "cuidador" | "responsavel") {
  const [contractDraft, setContractDraft] = useState<ContractDraft>({ tarefas: [], regras: [] });
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [completionScore, setCompletionScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [conversationStage, setConversationStage] = useState<GeminiAnalysis["conversationStage"]>("inicio");
  const [sentiment, setSentiment] = useState<GeminiAnalysis["sentiment"]>("neutro");
  const [discussedTopics, setDiscussedTopics] = useState<string[]>([]);
  const [missingTopics, setMissingTopics] = useState<string[]>([]);
  const [compatibilitySignals, setCompatibilitySignals] = useState<string[]>([]);
  const [consultationReadiness, setConsultationReadiness] = useState(0);
  const [recommendedNextStep, setRecommendedNextStep] = useState("");
  const [matchmakingSummary, setMatchmakingSummary] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevLengthRef = useRef(0);

  useEffect(() => {
    if (messages.length === prevLengthRef.current && messages.length > 0) return;
    prevLengthRef.current = messages.length;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const analysis = await analyzeWithGemini(messages, currentUserId, userRole);

        setContractDraft(analysis.contractDraft);
        setSmartReplies(analysis.smartReplies);
        setConversationStage(analysis.conversationStage);
        setSentiment(analysis.sentiment);
        setDiscussedTopics(analysis.discussedTopics);
        setMissingTopics(analysis.missingTopics);
        setCompatibilitySignals(analysis.compatibilitySignals);
        setConsultationReadiness(analysis.consultationReadiness);
        setRecommendedNextStep(analysis.recommendedNextStep);
        setMatchmakingSummary(analysis.matchmakingSummary);

        const fields = [
          analysis.contractDraft.valorAcordado,
          analysis.contractDraft.horarios,
          analysis.contractDraft.periodo,
          analysis.contractDraft.tarefas.length > 0 ? "ok" : undefined,
        ];
        setCompletionScore(Math.round((fields.filter(Boolean).length / fields.length) * 100));
      } finally {
        setLoading(false);
      }
    }, 1500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [messages, currentUserId, userRole]);

  return {
    contractDraft,
    smartReplies,
    completionScore,
    loading,
    conversationStage,
    sentiment,
    discussedTopics,
    missingTopics,
    compatibilitySignals,
    consultationReadiness,
    recommendedNextStep,
    matchmakingSummary,
  };
}

export function generateSmartReplies(
  messages: Message[],
  currentUserId: string,
  userRole: "cuidador" | "responsavel",
): string[] {
  return fallbackAnalysis(messages, currentUserId, userRole).smartReplies;
}
