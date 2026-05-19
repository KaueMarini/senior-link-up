import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft,
  Send,
  Sparkles,
  PartyPopper,
  Download,
  CheckCircle,
  Clock,
  DollarSign,
  ListTodo,
  Shield,
  Calendar,
  FileSignature,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  mediateConversation,
  type MediatedMessageRecord,
  type MediatedRole,
  type MediatedContract,
} from "@/hooks/useMediatedConversationAI";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import ProposalCard, { type ProposalRecord } from "./ProposalCard";
import SendProposalDialog from "./SendProposalDialog";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface ChatWindowProps {
  conversationId: string;
  otherUser: {
    id: string;
    nome: string;
    avatar_url?: string | null;
    telefone?: string | null;
  };
  onBack: () => void;
}

interface ConversationInsight {
  matchSummary: string;
  nextStep: string;
  readinessScore: number;
  missingTopics: string[];
  compatibilitySignals: string[];
  smartReplies: string[];
}

const createEmptyInsight = (): ConversationInsight => ({
  matchSummary: "A IA ainda está estruturando o match entre as partes.",
  nextStep: "Inicie a conversa — a IA vai começar a mediar.",
  readinessScore: 0,
  missingTopics: [],
  compatibilitySignals: [],
  smartReplies: [],
});

// ─────────────────────────────────────────────
// Contract PDF helper
// ─────────────────────────────────────────────

function openContractPDF(contract: MediatedContract, otherUserName: string, myName: string) {
  const today = new Date().toLocaleDateString("pt-BR");
  const tagList = (items: string[]) =>
    items.length > 0
      ? items.map((i) => `<span class="tag">${i}</span>`).join(" ")
      : '<span class="empty">A definir</span>';

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Contrato FlyCare — ${today}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 760px; margin: 40px auto; padding: 0 24px; color: #1a1a1a; font-size: 14px; line-height: 1.6; }
    h1  { color: #2d7d5e; font-size: 22px; border-bottom: 2px solid #2d7d5e; padding-bottom: 8px; margin-bottom: 4px; }
    .subtitle { color: #666; font-size: 12px; margin-bottom: 24px; }
    h2  { color: #444; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; margin: 20px 0 6px; }
    .field { background: #f7faf9; border: 1px solid #d4e8df; border-radius: 6px; padding: 10px 14px; min-height: 36px; }
    .field.filled { background: #edf7f3; border-color: #56b68e; font-weight: 600; color: #1b5e42; }
    .summary { background: #f0faf6; border-left: 4px solid #2d7d5e; padding: 12px 16px; border-radius: 4px; margin: 20px 0; font-style: italic; }
    .tag { display: inline-block; background: #e0f2eb; color: #1b5e42; padding: 2px 10px; border-radius: 99px; margin: 2px; font-size: 12px; }
    .empty { color: #999; font-style: italic; font-size: 12px; }
    .signatures { display: flex; justify-content: space-between; margin-top: 64px; }
    .sig { text-align: center; width: 220px; }
    .sig-line { border-top: 1px solid #555; margin-bottom: 6px; }
    .footer { margin-top: 40px; font-size: 11px; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 12px; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>Contrato de Prestação de Serviços — Fly Care</h1>
  <p class="subtitle">Gerado pela IA da Fly Care em ${today} · Partes: <strong>${myName}</strong> e <strong>${otherUserName}</strong></p>
  ${contract.resumoFinal ? `<div class="summary">${contract.resumoFinal}</div>` : ""}
  <h2>💰 Remuneração</h2>
  <div class="field ${contract.valorAcordado ? "filled" : ""}">${contract.valorAcordado ?? '<span class="empty">A definir</span>'}</div>
  <h2>🕐 Horários</h2>
  <div class="field ${contract.horarios ? "filled" : ""}">${contract.horarios ?? '<span class="empty">A definir</span>'}</div>
  <h2>📅 Período</h2>
  <div class="field ${contract.periodo ? "filled" : ""}">${contract.periodo ?? '<span class="empty">A definir</span>'}</div>
  <h2>✅ Tarefas inclusas</h2>
  <div class="field">${tagList(contract.tarefas)}</div>
  <h2>📌 Regras</h2>
  <div class="field">${tagList(contract.regras)}</div>
  <div class="signatures">
    <div class="sig"><div class="sig-line"></div><strong>${myName}</strong><br/><span style="font-size:11px;color:#888">Assinatura</span></div>
    <div class="sig"><div class="sig-line"></div><strong>${otherUserName}</strong><br/><span style="font-size:11px;color:#888">Assinatura</span></div>
  </div>
  <p class="footer">Pré-contrato gerado pela IA da Fly Care para alinhamento entre as partes. Formalize com contrato profissional assinado.</p>
  <script>window.addEventListener('load', () => window.print());</script>
</body></html>`;

  const win = window.open("", "_blank", "width=900,height=700");
  if (win) { win.document.write(html); win.document.close(); }
}

// ─────────────────────────────────────────────
// Contract reveal card (visible to both sides)
// ─────────────────────────────────────────────

function ContractRevealCard({
  contract,
  otherUserName,
  myName,
}: {
  contract: MediatedContract;
  otherUserName: string;
  myName: string;
}) {
  return (
    <div className="my-2 w-full rounded-2xl border-2 border-green-300 bg-green-50 p-4 shadow-sm">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <PartyPopper className="h-5 w-5 text-green-600 shrink-0" />
        <div>
          <p className="text-sm font-bold text-green-800">Acordo gerado pela IA Fly Care</p>
          <p className="text-xs text-green-700">
            Ambos os lados completaram a entrevista. Revise e baixe o contrato.
          </p>
        </div>
        <CheckCircle className="ml-auto h-5 w-5 text-green-500 shrink-0" />
      </div>

      {/* Summary */}
      {contract.resumoFinal && (
        <p className="mb-3 rounded-lg bg-white/70 px-3 py-2 text-xs text-green-900 italic leading-relaxed">
          {contract.resumoFinal}
        </p>
      )}

      <Separator className="my-2 bg-green-200" />

      {/* Fields grid */}
      <div className="grid gap-2 text-xs sm:grid-cols-2">
        {contract.valorAcordado && (
          <div className="flex items-center gap-1.5 rounded-md bg-white/60 px-2 py-1.5">
            <DollarSign className="h-3.5 w-3.5 text-green-600 shrink-0" />
            <div>
              <p className="text-[10px] text-green-700 uppercase tracking-wide font-semibold">Valor</p>
              <p className="font-semibold text-green-900">{contract.valorAcordado}</p>
            </div>
          </div>
        )}
        {contract.horarios && (
          <div className="flex items-center gap-1.5 rounded-md bg-white/60 px-2 py-1.5">
            <Clock className="h-3.5 w-3.5 text-green-600 shrink-0" />
            <div>
              <p className="text-[10px] text-green-700 uppercase tracking-wide font-semibold">Horário</p>
              <p className="font-semibold text-green-900">{contract.horarios}</p>
            </div>
          </div>
        )}
        {contract.periodo && (
          <div className="flex items-center gap-1.5 rounded-md bg-white/60 px-2 py-1.5">
            <Calendar className="h-3.5 w-3.5 text-green-600 shrink-0" />
            <div>
              <p className="text-[10px] text-green-700 uppercase tracking-wide font-semibold">Período</p>
              <p className="font-semibold text-green-900">{contract.periodo}</p>
            </div>
          </div>
        )}
      </div>

      {/* Tarefas */}
      {contract.tarefas.length > 0 && (
        <div className="mt-2">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-green-700">
            <ListTodo className="h-3.5 w-3.5" /> Tarefas
          </div>
          <div className="flex flex-wrap gap-1">
            {contract.tarefas.map((t) => (
              <Badge key={t} className="text-[10px] bg-green-100 text-green-800 border-green-300 hover:bg-green-200">
                {t}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Regras */}
      {contract.regras.length > 0 && (
        <div className="mt-2">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-green-700">
            <Shield className="h-3.5 w-3.5" /> Regras
          </div>
          <div className="flex flex-wrap gap-1">
            {contract.regras.map((r) => (
              <Badge key={r} variant="outline" className="text-[10px] border-green-300 text-green-800">
                {r}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Action */}
      <div className="mt-3">
        <Button
          size="sm"
          className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
          onClick={() => openContractPDF(contract, otherUserName, myName)}
        >
          <Download className="h-3.5 w-3.5" />
          Baixar contrato em PDF
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Insight panel helpers
// ─────────────────────────────────────────────

const insightTone = (score: number) => {
  if (score >= 85) return "bg-emerald-100 text-emerald-700";
  if (score >= 45) return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
};

const progressLabel = (score: number) => {
  if (score >= 85) return "Pronto para contrato";
  if (score >= 60) return "Quase alinhado";
  if (score >= 30) return "Coletando dados";
  return "Iniciando";
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

const ChatWindow = ({ conversationId, otherUser, onBack }: ChatWindowProps) => {
  const { user, userName, userPerfil } = useAuth();
  const myRole: MediatedRole = userPerfil === "cuidador" ? "cuidador" : "responsavel";

  const [messages, setMessages]     = useState<MediatedMessageRecord[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending]       = useState(false);
  const [insight, setInsight]       = useState<ConversationInsight>(createEmptyInsight());
  const [proposal, setProposal]     = useState<ProposalRecord | null>(null);
  const [myPhone, setMyPhone]       = useState<string | null>(null);
  const [proposalDialogOpen, setProposalDialogOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const responsavelId = myRole === "responsavel" ? user?.id ?? "" : otherUser.id;
  const cuidadorId    = myRole === "cuidador"    ? user?.id ?? "" : otherUser.id;

  // Messages visible to this user (my role or "both"), excluding internal summaries
  const visibleMessages = useMemo(
    () =>
      messages.filter(
        (m) =>
          (m.visible_to_role === myRole || m.visible_to_role === "both") &&
          m.message_kind !== "summary",
      ),
    [messages, myRole],
  );

  // Has a contract been generated?
  const contractMessage = useMemo(
    () => messages.find((m) => m.message_kind === "contract" && (m.visible_to_role === "both" || m.visible_to_role === myRole)),
    [messages, myRole],
  );

  const contract: MediatedContract | null = useMemo(() => {
    if (!contractMessage) return null;
    try { return JSON.parse(contractMessage.content) as MediatedContract; } catch { return null; }
  }, [contractMessage]);

  // ─────────────────────────────────────────────
  // Realtime subscription
  // ─────────────────────────────────────────────

  useEffect(() => {
    fetchMessages();
    fetchProposal();
    fetchMyPhone();

    const channel = supabase
      .channel(`mediated-chat-${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mediated_chat_messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const next = payload.new as MediatedMessageRecord;
          setMessages((prev) => [...prev, next]);
          if (next.message_kind === "summary") {
            try { setInsight(JSON.parse(next.content) as ConversationInsight); } catch { /* ignore */ }
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "proposals", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          if (payload.eventType === "DELETE") setProposal(null);
          else setProposal(payload.new as ProposalRecord);
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
     
  }, [conversationId]);

  const fetchProposal = async () => {
    const { data } = await (supabase as any)
      .from("proposals")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) setProposal(data as ProposalRecord);
  };

  const fetchMyPhone = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("telefone")
      .eq("user_id", user.id)
      .maybeSingle();
    setMyPhone(data?.telefone ?? null);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleMessages]);

  const fetchMessages = async () => {
    const { data } = await (supabase as any)
      .from("mediated_chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    const rows = (data as MediatedMessageRecord[]) || [];
    setMessages(rows);

    const latestSummary = [...rows].reverse().find(
      (m) => m.author_role === "ai" && m.message_kind === "summary",
    );
    if (latestSummary) {
      try { setInsight(JSON.parse(latestSummary.content) as ConversationInsight); } catch { /* ignore */ }
    }
  };

  // ─────────────────────────────────────────────
  // Send message → AI mediates
  // ─────────────────────────────────────────────

  const handleSend = async () => {
    if (!newMessage.trim() || !user || sending) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    // 1. Persist user's message
    await (supabase as any).from("mediated_chat_messages").insert({
      conversation_id: conversationId,
      author_role: myRole,
      owner_user_id: user.id,
      visible_to_role: myRole,
      message_kind: "message",
      content,
    });

    // 2. Build transcript for AI (full history + current message)
    const transcript: MediatedMessageRecord[] = [
      ...messages,
      {
        id: crypto.randomUUID(),
        author_role: myRole,
        visible_to_role: myRole,
        message_kind: "message",
        content,
        created_at: new Date().toISOString(),
      },
    ];

    // 3. Call Gemini mediator
    const aiResult = await mediateConversation(transcript, myRole);

    // 4. Build batch of AI messages to insert
    const aiInserts: object[] = [
      // Reply to the sender (only this user sees it)
      {
        conversation_id: conversationId,
        author_role: "ai",
        visible_to_role: myRole,
        message_kind: "question",
        content: aiResult.replyToSender,
      },
      // Bridge message to the OTHER side (proactive AI nudge)
      {
        conversation_id: conversationId,
        author_role: "ai",
        visible_to_role: myRole === "responsavel" ? "cuidador" : "responsavel",
        message_kind: "question",
        content: aiResult.bridgeForOtherSide,
      },
      // Internal summary (visible to both for insight panel, not rendered as message)
      {
        conversation_id: conversationId,
        author_role: "ai",
        visible_to_role: "both",
        message_kind: "summary",
        content: JSON.stringify({
          matchSummary:         aiResult.matchSummary,
          nextStep:             aiResult.nextStep,
          readinessScore:       aiResult.readinessScore,
          missingTopics:        aiResult.missingTopics,
          compatibilitySignals: aiResult.compatibilitySignals,
        }),
      },
    ];

    // 5. If both sides are aligned → generate the final contract message
    if (aiResult.contractReady && aiResult.contract.resumoFinal && !contractMessage) {
      aiInserts.push({
        conversation_id: conversationId,
        author_role: "ai",
        visible_to_role: "both",
        message_kind: "contract",
        content: JSON.stringify(aiResult.contract),
      });
    }

    await (supabase as any).from("mediated_chat_messages").insert(aiInserts);

    setInsight({
      matchSummary:         aiResult.matchSummary,
      nextStep:             aiResult.nextStep,
      readinessScore:       aiResult.readinessScore,
      missingTopics:        aiResult.missingTopics,
      compatibilitySignals: aiResult.compatibilitySignals,
    });

    await supabase
      .from("chat_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    setSending(false);
  };




  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <div className="grid gap-3 xl:grid-cols-[1.4fr_0.8fr]">
      {/* ── Chat column ── */}
      <Card className="flex h-[720px] min-w-0 flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 border-b p-4 shrink-0">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <Avatar className="h-10 w-10 border-2 border-primary/20 shrink-0">
            <AvatarImage src={otherUser.avatar_url || ""} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {(otherUser.nome || "U").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h3 className="truncate font-heading font-bold text-foreground">{otherUser.nome}</h3>
            <div className="mt-0.5 flex items-center gap-2">
              {contract ? (
                <Badge className="text-[10px] bg-green-100 text-green-700 border-green-300">
                  Acordo fechado
                </Badge>
              ) : (
                <>
                  <Badge variant="secondary" className="text-[10px]">
                    IA mediando
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    Você fala com a IA — ela conduz o match com o outro lado.
                  </span>
                </>
              )}
            </div>
          </div>

          {myRole === "responsavel" && (!proposal || proposal.status === "recusada") && (
            <Button
              size="sm"
              onClick={() => setProposalDialogOpen(true)}
              className="gap-2 shrink-0"
            >
              <FileSignature className="h-4 w-4" />
              <span className="hidden sm:inline">Enviar proposta</span>
            </Button>
          )}
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {visibleMessages.length === 0 && (
              <div className="flex min-h-[280px] items-center justify-center">
                <p className="max-w-sm text-center text-sm text-muted-foreground">
                  Aqui você não fala diretamente com o outro lado. A IA da Fly Care entende sua mensagem,
                  aproxima expectativas e conduz a conversa para um match real.
                </p>
              </div>
            )}

            {visibleMessages.map((message) => {
              // Contract reveal card (full-width, not a bubble)
              if (message.message_kind === "contract") {
                const c = (() => { try { return JSON.parse(message.content) as MediatedContract; } catch { return null; } })();
                if (!c) return null;
                return (
                  <ContractRevealCard
                    key={message.id}
                    contract={c}
                    otherUserName={otherUser.nome}
                    myName={userName ?? "Você"}
                  />
                );
              }

              const isMine = message.author_role === myRole;
              const isAI   = message.author_role === "ai";

              return (
                <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-3 ${
                      isMine
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : isAI
                        ? "bg-primary/10 border border-primary/20 text-foreground rounded-bl-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide opacity-70">
                      {isAI && <Sparkles className="h-3.5 w-3.5" />}
                      {isMine ? "Você" : "IA Fly Care"}
                    </div>
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    <p className={`mt-1 text-[10px] ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {format(new Date(message.created_at), "HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              );
            })}
            {proposal && (
              <ProposalCard
                proposal={proposal}
                myRole={myRole}
                responsavelPhone={myRole === "responsavel" ? myPhone : otherUser.telefone ?? null}
                cuidadorPhone={myRole === "cuidador" ? myPhone : otherUser.telefone ?? null}
                responsavelNome={myRole === "responsavel" ? (userName ?? "Você") : otherUser.nome}
                cuidadorNome={myRole === "cuidador" ? (userName ?? "Você") : otherUser.nome}
                onUpdated={fetchProposal}
              />
            )}

            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {/* Input — disabled once contract is generated */}
        <div className="border-t p-3 flex gap-2 shrink-0">
          {contract ? (
            <p className="flex-1 text-center text-sm text-muted-foreground py-2">
              Acordo finalizado. Baixe o contrato acima.
            </p>
          ) : (
            <>
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Conte para a IA o que você precisa, espera ou pode oferecer..."
                className="flex-1"
                disabled={sending}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) handleSend(); }}
              />
              <Button onClick={handleSend} disabled={!newMessage.trim() || sending} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* ── Insight panel ── */}
      <div className="space-y-3">
        {/* Match readiness card */}
        <Card className="shadow-none border-primary/15">
          <div className="border-b px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Estado do match</h4>
                <p className="text-xs text-muted-foreground">
                  A IA acompanha o quanto a conversa está pronta.
                </p>
              </div>
              <div className="text-right">
                <Badge className={insightTone(insight.readinessScore)}>
                  {insight.readinessScore}%
                </Badge>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {progressLabel(insight.readinessScore)}
                </p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{ width: `${insight.readinessScore}%` }}
              />
            </div>
          </div>
          <div className="space-y-4 p-4 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Resumo atual</p>
              <p className="text-foreground">{insight.matchSummary}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Próximo passo</p>
              <p className="text-foreground">{insight.nextStep}</p>
            </div>
          </div>
        </Card>

        {/* Pending + signals card */}
        <Card className="shadow-none">
          <div className="border-b px-4 py-3">
            <h4 className="text-sm font-semibold text-foreground">Pendências e sinais</h4>
            <p className="text-xs text-muted-foreground">
              O que ainda falta e o que já indica compatibilidade.
            </p>
          </div>
          <div className="space-y-4 p-4 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Ainda falta alinhar
              </p>
              <ul className="space-y-1.5 text-foreground">
                {insight.missingTopics.length > 0 ? (
                  insight.missingTopics.map((t) => (
                    <li key={t} className="flex items-start gap-1.5">
                      <span className="text-amber-500 shrink-0 mt-0.5">•</span>
                      {t}
                    </li>
                  ))
                ) : (
                  <li className="text-muted-foreground italic">
                    A conversa já cobre os pontos principais.
                  </li>
                )}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Sinais de compatibilidade
              </p>
              <div className="flex flex-wrap gap-1.5">
                {insight.compatibilitySignals.length > 0 ? (
                  insight.compatibilitySignals.map((s) => (
                    <Badge key={s} variant="outline" className="text-[11px]">
                      {s}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-xs italic">
                    A IA ainda está coletando sinais do match.
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Contract download shortcut (repeated here for convenience) */}
        {contract && (
          <Card className="shadow-none border-green-200 bg-green-50/40">
            <div className="p-4">
              <p className="text-sm font-semibold text-green-800 mb-2">Acordo gerado com sucesso</p>
              <Button
                size="sm"
                className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => openContractPDF(contract, otherUser.nome, userName ?? "Você")}
              >
                <Download className="h-3.5 w-3.5" />
                Baixar contrato em PDF
              </Button>
            </div>
          </Card>
        )}
      </div>

      <SendProposalDialog
        open={proposalDialogOpen}
        onClose={() => setProposalDialogOpen(false)}
        conversationId={conversationId}
        responsavelId={responsavelId}
        cuidadorId={cuidadorId}
        cuidadorNome={otherUser.nome}
        prefill={contract}
        onSent={fetchProposal}
      />
    </div>
  );
};

export default ChatWindow;
