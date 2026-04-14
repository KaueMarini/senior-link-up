import { useMemo } from "react";

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

// ─────────────────────────────────────────────
// Extraction helpers (pattern-based, zero-cost)
// Swap extractContractData for an LLM call later
// by replacing the body and keeping the signature.
// ─────────────────────────────────────────────

function extractContractData(messages: Message[]): ContractDraft {
  const text = messages.map((m) => m.content).join("\n");

  // Monetary value  —  R$ 80, 80/hora, cobro 80 reais, valor de 80
  const valorPatterns = [
    /R\$\s*([\d.,]+)(?:\s*(?:\/h(?:ora)?|por hora|a hora))?/i,
    /([\d.,]+)\s*(?:reais\s+por\s+hora|por\s+hora|\/hora|\/h\b)/i,
    /(?:cobro|cobre|valor\s+(?:é|de|por))\s+R?\$?\s*([\d.,]+)/i,
  ];
  let valorAcordado: string | undefined;
  for (const p of valorPatterns) {
    const m = text.match(p);
    if (m) { valorAcordado = `R$ ${m[1]}/hora`; break; }
  }

  // Work schedule  —  das 07h às 13h, 8h às 16h, turno da manhã
  const horarioPatterns = [
    /(?:das?\s+)?(\d{1,2}h?\d{0,2})\s+(?:às?|ao?|até|-)\s+(\d{1,2}h?\d{0,2})/i,
    /(\d{1,2}:\d{2})\s+(?:às?|ao?|-)\s+(\d{1,2}:\d{2})/i,
    /turno\s+(?:da\s+)?(manhã|tarde|noite)/i,
  ];
  let horarios: string | undefined;
  for (const p of horarioPatterns) {
    const m = text.match(p);
    if (m) {
      horarios = m[3] ? `Turno da ${m[3]}` : `${m[1]} às ${m[2]}`;
      break;
    }
  }

  // Work period  —  segunda a sexta, 3 dias por semana
  const periodoPatterns = [
    /(segunda(?:\s+a\s+|\s+ao?\s+)\w+)/i,
    /(\d+)\s*dias?\s*por\s*semana/i,
    /(dias?\s+úteis|fins?\s+de\s+semana|seg\s+a\s+sex)/i,
  ];
  let periodo: string | undefined;
  for (const p of periodoPatterns) {
    const m = text.match(p);
    if (m) { periodo = m[1]; break; }
  }

  // Tasks
  const tarefasMap = [
    { re: /banho|higiene pessoal/i,                    label: "Higiene pessoal e banho" },
    { re: /medicament/i,                               label: "Administração de medicamentos" },
    { re: /fisioterapia|exerc[ií]cio/i,                label: "Exercícios e fisioterapia" },
    { re: /aliment|refeição|refeicao|cozinhar|alimentar/i, label: "Alimentação e refeições" },
    { re: /companhia|companh/i,                        label: "Companhia e apoio emocional" },
    { re: /consulta|médico|medico|hospital/i,           label: "Acompanhamento a consultas" },
    { re: /limpeza|arrum|organização/i,                label: "Organização do ambiente" },
    { re: /fralda/i,                                   label: "Troca de fraldas" },
  ];
  const tarefas = tarefasMap.filter((k) => k.re.test(text)).map((k) => k.label);

  // House rules / restrictions
  const regrasMap = [
    { re: /não fum|nao fum|sem fumant/i,              label: "Não fumante" },
    { re: /sem pet|não tem animal|alergi[ac] a/i,     label: "Sem animais de estimação" },
    { re: /pontualidade|pontual|horário fixo/i,        label: "Pontualidade exigida" },
    { re: /sigilo|privacidade|confidencial/i,          label: "Sigilo e privacidade" },
  ];
  const regras = regrasMap.filter((k) => k.re.test(text)).map((k) => k.label);

  return { valorAcordado, horarios, periodo, tarefas, regras };
}

// ─────────────────────────────────────────────
// Topic detection
// ─────────────────────────────────────────────

function getDiscussedTopics(messages: Message[]): Set<string> {
  const text = messages.map((m) => m.content).join(" ");
  const add = (key: string, re: RegExp) => re.test(text) && topics.add(key);
  const topics = new Set<string>();
  add("valor",         /R\$|valor|preço|preco|cobro|cobrar|honorário/i);
  add("disponibilidade", /disponív|horário|horario|dias|semana|turno|manhã|tarde|noite/i);
  add("referencias",   /referên|referencia|experiên|trabalhou|emprego anterior/i);
  add("medicamentos",  /medicament/i);
  add("especialidade", /especiali|formação|formacao|curso|certificad/i);
  add("necessidades",  /necessid|cuidado especial|doença|diagnóstico|alzheimer|parkinson/i);
  add("localizacao",   /local|endereço|endereco|bairro|cidade|CEP/i);
  add("contrato",      /contrato|acordo|fechamos|combinado|topo/i);
  return topics;
}

// ─────────────────────────────────────────────
// Smart replies
// ─────────────────────────────────────────────

export function generateSmartReplies(
  messages: Message[],
  currentUserId: string,
  userRole: "cuidador" | "responsavel"
): string[] {
  // Greeting state — no messages yet
  if (messages.length === 0) {
    return userRole === "responsavel"
      ? ["Olá! Qual é o seu valor por hora?", "Olá! Você tem disponibilidade imediata?"]
      : ["Olá! Me conte sobre o perfil do paciente.", "Olá! Qual é a necessidade principal do familiar?"];
  }

  const lastMessage = messages[messages.length - 1];
  // Don't suggest right after my own message
  if (lastMessage.sender_id === currentUserId) return [];

  const topics = getDiscussedTopics(messages);
  const s: string[] = [];

  if (userRole === "responsavel") {
    if (!topics.has("valor"))           s.push("Qual é o seu valor por hora?");
    if (topics.has("valor") && !topics.has("disponibilidade"))
                                        s.push("Quais dias e horários você tem disponível?");
    if (topics.has("disponibilidade") && !topics.has("referencias"))
                                        s.push("Você tem referências de trabalhos anteriores?");
    if (!topics.has("medicamentos"))    s.push("Você tem experiência com medicamentos controlados?");
    if (!topics.has("especialidade"))   s.push("Quais são suas especializações?");
    if (!topics.has("localizacao"))     s.push("Você atende na nossa região?");
    if (topics.has("valor") && topics.has("disponibilidade"))
                                        s.push("Podemos fechar o contrato? 🤝");
  } else {
    if (!topics.has("necessidades"))    s.push("Quais são as necessidades do paciente?");
    if (topics.has("necessidades") && !topics.has("medicamentos"))
                                        s.push("O paciente usa medicamentos controlados?");
    if (!topics.has("disponibilidade")) s.push("Qual período você necessita de cuidado?");
    if (!topics.has("localizacao"))     s.push("Qual é o endereço para o atendimento?");
    if (topics.has("valor") && topics.has("disponibilidade"))
                                        s.push("Podemos agendar uma visita prévia?");
  }

  return s.slice(0, 3);
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function useChatAI(
  messages: Message[],
  currentUserId: string,
  userRole: "cuidador" | "responsavel"
) {
  const contractDraft = useMemo(() => extractContractData(messages), [messages]);
  const smartReplies = useMemo(
    () => generateSmartReplies(messages, currentUserId, userRole),
    [messages, currentUserId, userRole]
  );

  const completionScore = useMemo(() => {
    const fields = [
      contractDraft.valorAcordado,
      contractDraft.horarios,
      contractDraft.periodo,
      contractDraft.tarefas.length > 0 ? "ok" : undefined,
    ];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [contractDraft]);

  return { contractDraft, smartReplies, completionScore };
}
