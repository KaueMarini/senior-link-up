import { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

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
  conversationStage: "inicio" | "negociacao" | "acordo" | "finalizado";
  sentiment: "positivo" | "neutro" | "tenso";
}

// ─────────────────────────────────────────────
// Gemini client (singleton)
// ─────────────────────────────────────────────

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// ─────────────────────────────────────────────
// Structured output schema for Gemini
// ─────────────────────────────────────────────

const analysisSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    contractDraft: {
      type: SchemaType.OBJECT,
      properties: {
        valorAcordado:  { type: SchemaType.STRING, nullable: true },
        horarios:       { type: SchemaType.STRING, nullable: true },
        periodo:        { type: SchemaType.STRING, nullable: true },
        tarefas:        { type: SchemaType.ARRAY,  items: { type: SchemaType.STRING } },
        regras:         { type: SchemaType.ARRAY,  items: { type: SchemaType.STRING } },
      },
      required: ["tarefas", "regras"],
    },
    smartReplies:      { type: SchemaType.ARRAY,  items: { type: SchemaType.STRING } },
    discussedTopics:   { type: SchemaType.ARRAY,  items: { type: SchemaType.STRING } },
    conversationStage: { type: SchemaType.STRING, format: "enum", enum: ["inicio", "negociacao", "acordo", "finalizado"] },
    sentiment:         { type: SchemaType.STRING, format: "enum", enum: ["positivo", "neutro", "tenso"] },
  },
  required: ["contractDraft", "smartReplies", "discussedTopics", "conversationStage", "sentiment"],
};

// ─────────────────────────────────────────────
// Prompt builder
// ─────────────────────────────────────────────

function buildPrompt(
  messages: Message[],
  currentUserId: string,
  userRole: "cuidador" | "responsavel"
): string {
  const roleLabel = userRole === "responsavel" ? "Responsável pelo idoso" : "Cuidador profissional";
  const otherRole = userRole === "responsavel" ? "Cuidador profissional" : "Responsável pelo idoso";

  const conversation = messages
    .map((m) => {
      const speaker = m.sender_id === currentUserId ? roleLabel : otherRole;
      return `${speaker}: ${m.content}`;
    })
    .join("\n");

  return `
Você é um assistente especializado em análise de conversas entre responsáveis por idosos e cuidadores profissionais na plataforma Fly Care (Brasil).

PAPEL DO USUÁRIO ATUAL: ${roleLabel}

CONVERSA:
${conversation || "(conversa ainda não iniciada)"}

INSTRUÇÕES:

1. **contractDraft** — Extraia da conversa os seguintes dados do contrato:
   - valorAcordado: valor monetário (formato "R$ X/hora" ou "R$ X/dia")
   - horarios: horário de trabalho (ex: "08h às 16h" ou "Turno da manhã")
   - periodo: período semanal (ex: "Segunda a sexta" ou "3 dias por semana")
   - tarefas: lista de tarefas mencionadas (higiene, medicamentos, alimentação, etc.)
   - regras: regras/restrições mencionadas (não fumante, pontualidade, etc.)
   Se algum campo não foi discutido ainda, use null ou array vazio.

2. **smartReplies** — Gere EXATAMENTE 3 sugestões de próxima mensagem para o ${roleLabel}.
   - Sejam naturais, em português brasileiro informal
   - Baseadas no contexto real da conversa e no que ainda NÃO foi discutido
   - Se a conversa está vazia, sugira uma abertura adequada ao papel
   - Se estiver próximo de um acordo, sugira encerrar o negócio
   - Máximo 60 caracteres cada

3. **discussedTopics** — Liste os tópicos já abordados (valor, disponibilidade, referências, medicamentos, especialidade, localização, contrato, necessidades)

4. **conversationStage** — Classifique o estágio:
   - "inicio": conversa começando ou vazia
   - "negociacao": discutindo termos
   - "acordo": chegando em consenso
   - "finalizado": acordo fechado

5. **sentiment** — Classifique o tom geral: positivo, neutro ou tenso
`.trim();
}

// ─────────────────────────────────────────────
// Fallback (regex) para quando não há API key
// ─────────────────────────────────────────────

function fallbackAnalysis(
  messages: Message[],
  currentUserId: string,
  userRole: "cuidador" | "responsavel"
): GeminiAnalysis {
  const text = messages.map((m) => m.content).join("\n");

  // Valor
  const valorMatch =
    text.match(/R\$\s*([\d.,]+)(?:\s*\/h(?:ora)?)?/i) ||
    text.match(/([\d.,]+)\s*(?:reais\s+por\s+hora|por\s+hora|\/hora)/i);
  const valorAcordado = valorMatch ? `R$ ${valorMatch[1]}/hora` : undefined;

  // Horário
  const horarioMatch =
    text.match(/(?:das?\s+)?(\d{1,2}h?\d{0,2})\s+(?:às?|-)\s+(\d{1,2}h?\d{0,2})/i) ||
    text.match(/turno\s+(?:da\s+)?(manhã|tarde|noite)/i);
  const horarios = horarioMatch
    ? horarioMatch[3] ? `Turno da ${horarioMatch[3]}` : `${horarioMatch[1]} às ${horarioMatch[2]}`
    : undefined;

  const tarefasMap = [
    { re: /banho|higiene pessoal/i,       label: "Higiene pessoal e banho" },
    { re: /medicament/i,                   label: "Administração de medicamentos" },
    { re: /aliment|refeição|cozinhar/i,   label: "Alimentação e refeições" },
    { re: /companhia/i,                    label: "Companhia e apoio emocional" },
    { re: /consulta|médico|hospital/i,    label: "Acompanhamento a consultas" },
    { re: /fralda/i,                       label: "Troca de fraldas" },
  ];
  const tarefas = tarefasMap.filter((k) => k.re.test(text)).map((k) => k.label);

  const regrasMap = [
    { re: /não fum|nao fum/i, label: "Não fumante" },
    { re: /pontual/i,         label: "Pontualidade exigida" },
    { re: /sigilo/i,          label: "Sigilo e privacidade" },
  ];
  const regras = regrasMap.filter((k) => k.re.test(text)).map((k) => k.label);

  // Smart replies fallback
  const smartReplies: string[] = [];
  if (messages.length === 0) {
    smartReplies.push(
      userRole === "responsavel"
        ? "Olá! Qual é o seu valor por hora?"
        : "Olá! Me conte sobre o paciente.",
      userRole === "responsavel"
        ? "Olá! Você tem disponibilidade imediata?"
        : "Olá! Qual é a necessidade principal?"
    );
  } else {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.sender_id !== currentUserId) {
      if (!valorAcordado)      smartReplies.push("Qual é o seu valor por hora?");
      if (!horarios)           smartReplies.push("Quais são seus horários disponíveis?");
      if (tarefas.length === 0) smartReplies.push("Quais tarefas você realiza?");
    }
  }

  return {
    contractDraft: { valorAcordado, horarios, tarefas, regras },
    smartReplies: smartReplies.slice(0, 3),
    discussedTopics: [],
    conversationStage: messages.length === 0 ? "inicio" : "negociacao",
    sentiment: "neutro",
  };
}

// ─────────────────────────────────────────────
// Main Gemini call
// ─────────────────────────────────────────────

async function analyzeWithGemini(
  messages: Message[],
  currentUserId: string,
  userRole: "cuidador" | "responsavel"
): Promise<GeminiAnalysis> {
  if (!genAI) {
    return fallbackAnalysis(messages, currentUserId, userRole);
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: analysisSchema,
      temperature: 0.3,
    },
  });

  const prompt = buildPrompt(messages, currentUserId, userRole);
  const result = await model.generateContent(prompt);
  const json = result.response.text();
  const parsed = JSON.parse(json) as GeminiAnalysis;

  // Garante arrays nunca null
  parsed.contractDraft.tarefas = parsed.contractDraft.tarefas ?? [];
  parsed.contractDraft.regras  = parsed.contractDraft.regras  ?? [];
  parsed.smartReplies           = parsed.smartReplies           ?? [];
  parsed.discussedTopics        = parsed.discussedTopics        ?? [];

  return parsed;
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function useChatAI(
  messages: Message[],
  currentUserId: string,
  userRole: "cuidador" | "responsavel"
) {
  const [contractDraft, setContractDraft] = useState<ContractDraft>({ tarefas: [], regras: [] });
  const [smartReplies, setSmartReplies]   = useState<string[]>([]);
  const [completionScore, setCompletionScore] = useState(0);
  const [loading, setLoading]             = useState(false);
  const [conversationStage, setConversationStage] = useState<GeminiAnalysis["conversationStage"]>("inicio");
  const [sentiment, setSentiment]         = useState<GeminiAnalysis["sentiment"]>("neutro");
  const [discussedTopics, setDiscussedTopics] = useState<string[]>([]);

  // Debounce: só chama a IA 1.5s após a última mudança nas mensagens
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevLengthRef = useRef(0);

  useEffect(() => {
    // Não re-analisa se o número de mensagens não mudou (ex: re-render)
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

        // Completion score baseado nos campos do contrato
        const fields = [
          analysis.contractDraft.valorAcordado,
          analysis.contractDraft.horarios,
          analysis.contractDraft.periodo,
          analysis.contractDraft.tarefas.length > 0 ? "ok" : undefined,
        ];
        setCompletionScore(
          Math.round((fields.filter(Boolean).length / fields.length) * 100)
        );
      } catch (err) {
        console.error("[useChatAI] Gemini error, using fallback:", err);
        const fallback = fallbackAnalysis(messages, currentUserId, userRole);
        setContractDraft(fallback.contractDraft);
        setSmartReplies(fallback.smartReplies);
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
  };
}

// ─────────────────────────────────────────────
// Re-export legacy helper (usado em SmartReplies.tsx)
// ─────────────────────────────────────────────
export function generateSmartReplies(
  messages: Message[],
  currentUserId: string,
  userRole: "cuidador" | "responsavel"
): string[] {
  return fallbackAnalysis(messages, currentUserId, userRole).smartReplies;
}
