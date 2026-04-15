import { useEffect, useMemo, useState } from "react";
import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";

type UserRole = "cuidador" | "responsavel";

export interface AssistantMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  createdAt: string;
}

interface AssistantSummary {
  objective: string;
  profileSnapshot: string[];
  priorities: string[];
  missingData: string[];
  idealMatch: string[];
  nextSteps: string[];
  recommendedAction: string;
  readinessScore: number;
}

interface AssistantResponse {
  reply: string;
  summary: AssistantSummary;
}

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const responseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    reply: { type: SchemaType.STRING },
    summary: {
      type: SchemaType.OBJECT,
      properties: {
        objective: { type: SchemaType.STRING },
        profileSnapshot: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        priorities: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        missingData: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        idealMatch: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        nextSteps: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        recommendedAction: { type: SchemaType.STRING },
        readinessScore: { type: SchemaType.NUMBER },
      },
      required: [
        "objective",
        "profileSnapshot",
        "priorities",
        "missingData",
        "idealMatch",
        "nextSteps",
        "recommendedAction",
        "readinessScore",
      ],
    },
  },
  required: ["reply", "summary"],
};

function createInitialSummary(role: UserRole): AssistantSummary {
  return {
    objective:
      role === "responsavel"
        ? "Entender o caso, organizar a necessidade e preparar um match mais preciso."
        : "Entender seu perfil profissional e te posicionar para receber matches melhores.",
    profileSnapshot: [],
    priorities: [],
    missingData:
      role === "responsavel"
        ? ["Rotina do idoso", "Cidade/bairro", "Urgencia", "Disponibilidade esperada", "Faixa de valor"]
        : ["Experiencia principal", "Disponibilidade", "Regiao de atendimento", "Especialidades", "Faixa de valor"],
    idealMatch: [],
    nextSteps: [
      role === "responsavel"
        ? "Conte sobre o idoso e a principal necessidade de cuidado."
        : "Conte sua experiencia e o tipo de cuidado em que voce e mais forte.",
    ],
    recommendedAction:
      role === "responsavel"
        ? "Iniciar a triagem do caso com a IA."
        : "Iniciar a apresentacao do perfil profissional com a IA.",
    readinessScore: 10,
  };
}

function createInitialMessage(role: UserRole, userName: string): AssistantMessage {
  const content =
    role === "responsavel"
      ? `Oi, ${userName}. Sou a IA de triagem da Fly Care. Vou te ajudar a organizar o caso do seu familiar para encontrar um cuidador mais compativel. Me conte quem precisa do cuidado e qual e a principal necessidade agora.`
      : `Oi, ${userName}. Sou a IA de posicionamento da Fly Care. Vou te ajudar a estruturar seu perfil profissional para aumentar suas chances de match qualificado. Me conte sua experiencia, especialidades e disponibilidade atual.`;

  return {
    id: "assistant-initial",
    role: "assistant",
    content,
    createdAt: new Date().toISOString(),
  };
}

function buildPrompt(messages: AssistantMessage[], role: UserRole, userName: string) {
  const roleContext =
    role === "responsavel"
      ? "Responsavel familiar buscando o cuidador ideal para um idoso."
      : "Cuidador profissional buscando casos mais compativeis.";

  const guidance =
    role === "responsavel"
      ? [
          "Levante: grau de dependencia, rotina, diagnosticos, medicacoes, urgencia, regiao, horario, formato do cuidado, orcamento, preferencias humanas e restricoes.",
          "O tom deve ser acolhedor, claro e objetivo.",
          "Ajude a transformar a conversa em um briefing para matchmaking.",
          "Em idealMatch, descreva o perfil de cuidador ideal para este caso.",
          "Em recommendedAction, oriente o que fazer dentro da Fly Care agora.",
        ]
      : [
          "Levante: experiencia, especialidades, turnos, regiao de atendimento, limites, preferencias de caso, diferencial humano, faixa de valor e disponibilidade imediata.",
          "O tom deve ser profissional, humano e direto.",
          "Ajude a transformar a conversa em um perfil operacional forte para matchmaking.",
          "Em idealMatch, descreva o tipo de familia/caso mais aderente ao cuidador.",
          "Em recommendedAction, oriente o que fazer dentro da Fly Care agora.",
        ];

  const history = messages
    .map((message) => `${message.role === "assistant" ? "IA" : userName}: ${message.content}`)
    .join("\n");

  return `
Voce e a IA concierge da Fly Care, uma plataforma que conecta cuidadores e responsaveis familiares.

CONTEXTO DO USUARIO:
- Nome: ${userName}
- Papel: ${roleContext}

OBJETIVO:
- Conduzir uma entrevista curta, natural e progressiva.
- Responder apenas com JSON valido.
- Fazer uma unica pergunta por vez quando ainda faltarem dados importantes.
- Se houver informacao suficiente, comecar a orientar o proximo passo com clareza.

REGRAS:
- Nunca seja um chatbot generico.
- Pense como assistente de triagem, compatibilidade e aproximacao comercial.
- Seja simples para pessoas com baixa familiaridade com tecnologia.
- Nao invente fatos ausentes; liste-os em missingData.
- readinessScore deve ir de 0 a 100.
- Cada item de lista deve ser curto e pratico.
- A resposta reply deve ter no maximo 500 caracteres.

INSTRUCOES ESPECIFICAS:
${guidance.map((item) => `- ${item}`).join("\n")}

HISTORICO:
${history}
`.trim();
}

function inferSummary(messages: AssistantMessage[], role: UserRole): AssistantSummary {
  const userTexts = messages
    .filter((message) => message.role === "user")
    .map((message) => message.content)
    .join(" ");

  const hasLocation = /(sao paulo|sp|rio|rj|bairro|cidade|zona|centro|regiao)/i.test(userTexts);
  const hasSchedule = /(manha|tarde|noite|integral|segunda|terca|quarta|quinta|sexta|sabado|domingo|turno|horario)/i.test(userTexts);
  const hasBudget = /(r\$|reais|valor|diaria|hora|mensal)/i.test(userTexts);
  const hasUrgency = /(urgente|urgencia|imediat|quanto antes|hoje|amanha)/i.test(userTexts);
  const hasHealthContext = /(alzheimer|demencia|parkinson|acamad|medic|hospital|banho|higiene|consulta|fralda)/i.test(userTexts);
  const hasExperience = /(anos|experiencia|curso|certific|formacao|idoso|paciente)/i.test(userTexts);

  const missingData: string[] = [];
  if (!hasLocation) missingData.push("Localizacao de atendimento");
  if (!hasSchedule) missingData.push("Disponibilidade e horario");
  if (!hasBudget) missingData.push("Faixa de valor");
  if (role === "responsavel" && !hasHealthContext) missingData.push("Rotina e quadro de cuidado");
  if (role === "responsavel" && !hasUrgency) missingData.push("Urgencia da contratacao");
  if (role === "cuidador" && !hasExperience) missingData.push("Experiencia e especialidades");

  const profileSnapshot =
    role === "responsavel"
      ? [
          hasHealthContext ? "Ja compartilhou aspectos do cuidado." : "Ainda precisa detalhar o cuidado diario.",
          hasSchedule ? "Existe alguma pista de disponibilidade ou turnos." : "Horario ainda nao esta claro.",
          hasBudget ? "Ja existe nocao de investimento." : "Faixa de valor ainda nao foi alinhada.",
        ]
      : [
          hasExperience ? "Ja informou experiencia ou formacao." : "Ainda falta consolidar experiencia profissional.",
          hasSchedule ? "Ja sinalizou disponibilidade de agenda." : "Disponibilidade ainda nao esta clara.",
          hasLocation ? "Ja informou regiao de atendimento." : "Regiao de atendimento ainda nao esta clara.",
        ];

  const priorities =
    role === "responsavel"
      ? ["Estruturar o caso", "Definir criterios de compatibilidade", "Avancar para match e consulta"]
      : ["Fortalecer seu perfil", "Deixar disponibilidade clara", "Receber oportunidades mais aderentes"];

  const idealMatch =
    role === "responsavel"
      ? [
          hasHealthContext ? "Cuidador com experiencia no quadro citado" : "Cuidador com perfil generalista e escuta ativa",
          hasSchedule ? "Disponibilidade alinhada com a rotina informada" : "Flexibilidade de horario",
          hasLocation ? "Atendimento na mesma regiao" : "Cobertura geografica compativel",
        ]
      : [
          hasExperience ? "Familia que precisa exatamente da sua especialidade" : "Caso com escopo compatvel com seu nivel atual",
          hasSchedule ? "Demanda alinhada aos seus turnos disponiveis" : "Caso com flexibilidade de agenda",
          hasBudget ? "Familia com faixa de valor proxima do que voce espera" : "Familia aberta a negociar formato e valor",
        ];

  const nextSteps =
    missingData.length > 0
      ? missingData.slice(0, 3).map((item) => `Coletar: ${item}`)
      : role === "responsavel"
        ? ["Revisar resumo do caso", "Ir para Cuidadores", "Iniciar conversa com os mais aderentes"]
        : ["Revisar perfil profissional", "Ir para Chat", "Priorizar casos mais aderentes"];

  const readinessScore = Math.max(15, Math.min(95, 100 - missingData.length * 18));

  return {
    objective:
      role === "responsavel"
        ? "Preparar um briefing claro para encontrar o cuidador ideal."
        : "Transformar sua experiencia em um perfil forte para receber melhores matches.",
    profileSnapshot,
    priorities,
    missingData,
    idealMatch,
    nextSteps,
    recommendedAction:
      missingData.length > 0
        ? "Continuar a entrevista para melhorar a precisao do match."
        : role === "responsavel"
          ? "Usar a aba Cuidadores para falar com os perfis mais aderentes."
          : "Usar a aba Chat para avancar com conversas mais qualificadas.",
    readinessScore,
  };
}

function fallbackResponse(messages: AssistantMessage[], role: UserRole): AssistantResponse {
  const summary = inferSummary(messages, role);
  const firstMissing = summary.missingData[0];

  const reply = firstMissing
    ? role === "responsavel"
      ? `Perfeito. Ja comecei a montar o briefing do caso. Para deixar o match mais preciso, me conte agora sobre ${firstMissing.toLowerCase()}.`
      : `Perfeito. Ja comecei a estruturar seu perfil profissional. Para melhorar seus matches, me conte agora sobre ${firstMissing.toLowerCase()}.`
    : role === "responsavel"
      ? "Seu caso ja esta bem encaminhado para match. O proximo passo ideal e revisar os pontos principais e falar com os cuidadores mais aderentes."
      : "Seu perfil ja esta bem encaminhado para match. O proximo passo ideal e usar esse resumo para conduzir conversas com familias mais compativeis.";

  return { reply, summary };
}

async function generateAssistantResponse(
  messages: AssistantMessage[],
  role: UserRole,
  userName: string,
): Promise<AssistantResponse> {
  if (!genAI) {
    return fallbackResponse(messages, role);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.4,
      },
    });

    const result = await model.generateContent(buildPrompt(messages, role, userName));
    const parsed = JSON.parse(result.response.text()) as AssistantResponse;

    parsed.summary.profileSnapshot = parsed.summary.profileSnapshot ?? [];
    parsed.summary.priorities = parsed.summary.priorities ?? [];
    parsed.summary.missingData = parsed.summary.missingData ?? [];
    parsed.summary.idealMatch = parsed.summary.idealMatch ?? [];
    parsed.summary.nextSteps = parsed.summary.nextSteps ?? [];
    parsed.summary.readinessScore = Math.max(0, Math.min(100, parsed.summary.readinessScore ?? 0));

    return parsed;
  } catch (error) {
    console.error("[useCareMatchAI] falling back after Gemini error", error);
    return fallbackResponse(messages, role);
  }
}

export function useCareMatchAI(userId: string | undefined, userName: string, role: UserRole) {
  const storageKey = useMemo(
    () => `flycare-ai-assistant:${role}:${userId ?? "guest"}`,
    [role, userId],
  );

  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [summary, setSummary] = useState<AssistantSummary>(createInitialSummary(role));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initialMessage = createInitialMessage(role, userName);
    const stored = localStorage.getItem(storageKey);

    if (!stored) {
      setMessages([initialMessage]);
      setSummary(createInitialSummary(role));
      return;
    }

    try {
      const parsed = JSON.parse(stored) as {
        messages?: AssistantMessage[];
        summary?: AssistantSummary;
      };
      setMessages(parsed.messages && parsed.messages.length > 0 ? parsed.messages : [initialMessage]);
      setSummary(parsed.summary ?? createInitialSummary(role));
    } catch {
      setMessages([initialMessage]);
      setSummary(createInitialSummary(role));
    }
  }, [role, storageKey, userName]);

  useEffect(() => {
    if (messages.length === 0) return;
    localStorage.setItem(storageKey, JSON.stringify({ messages, summary }));
  }, [messages, storageKey, summary]);

  const sendMessage = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || loading) return;

    const userMessage: AssistantMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const response = await generateAssistantResponse(nextMessages, role, userName);
      const assistantMessage: AssistantMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.reply,
        createdAt: new Date().toISOString(),
      };

      setMessages((current) => [...current, assistantMessage]);
      setSummary(response.summary);
    } finally {
      setLoading(false);
    }
  };

  const resetConversation = () => {
    const initialMessage = createInitialMessage(role, userName);
    setMessages([initialMessage]);
    setSummary(createInitialSummary(role));
    localStorage.removeItem(storageKey);
  };

  return {
    loading,
    messages,
    resetConversation,
    sendMessage,
    summary,
  };
}
