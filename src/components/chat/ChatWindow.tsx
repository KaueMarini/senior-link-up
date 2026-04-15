import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, ExternalLink, Send, Sparkles } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { mediateConversation, type MediatedMessageRecord, type MediatedRole } from "@/hooks/useMediatedConversationAI";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

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
}

const createEmptyInsight = (): ConversationInsight => ({
  matchSummary: "A IA ainda esta estruturando o match entre as partes.",
  nextStep: "Iniciar a conversa com a IA para ela comecar a mediar.",
  readinessScore: 0,
  missingTopics: [],
  compatibilitySignals: [],
});

const insightTone = (score: number) => {
  if (score >= 75) return "bg-emerald-100 text-emerald-700";
  if (score >= 45) return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
};

const ChatWindow = ({ conversationId, otherUser, onBack }: ChatWindowProps) => {
  const { user, userPerfil } = useAuth();
  const myRole: MediatedRole = userPerfil === "cuidador" ? "cuidador" : "responsavel";

  const [messages, setMessages] = useState<MediatedMessageRecord[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [insight, setInsight] = useState<ConversationInsight>(createEmptyInsight());
  const bottomRef = useRef<HTMLDivElement>(null);

  const visibleMessages = useMemo(
    () => messages.filter((message) => message.visible_to_role === myRole || message.visible_to_role === "both"),
    [messages, myRole],
  );

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`mediated-chat-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mediated_chat_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const next = payload.new as MediatedMessageRecord;
          setMessages((current) => [...current, next]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

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

    const latestInsight = [...rows]
      .reverse()
      .find((message) => message.author_role === "ai" && message.message_kind === "summary");

    if (latestInsight) {
      try {
        const parsed = JSON.parse(latestInsight.content) as ConversationInsight;
        setInsight(parsed);
      } catch {
        setInsight(createEmptyInsight());
      }
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user || sending) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    await (supabase as any).from("mediated_chat_messages").insert({
      conversation_id: conversationId,
      author_role: myRole,
      owner_user_id: user.id,
      visible_to_role: myRole,
      message_kind: "message",
      content,
    });

    const transcript = [
      ...messages,
      {
        id: crypto.randomUUID(),
        author_role: myRole,
        visible_to_role: myRole,
        message_kind: "message",
        content,
        created_at: new Date().toISOString(),
      } satisfies MediatedMessageRecord,
    ];

    const aiResult = await mediateConversation(transcript, myRole);

    const summaryPayload = {
      matchSummary: aiResult.matchSummary,
      nextStep: aiResult.nextStep,
      readinessScore: aiResult.readinessScore,
      missingTopics: aiResult.missingTopics,
      compatibilitySignals: aiResult.compatibilitySignals,
    };

    await (supabase as any).from("mediated_chat_messages").insert([
      {
        conversation_id: conversationId,
        author_role: "ai",
        visible_to_role: myRole,
        message_kind: "question",
        content: aiResult.replyToSender,
      },
      {
        conversation_id: conversationId,
        author_role: "ai",
        visible_to_role: myRole === "responsavel" ? "cuidador" : "responsavel",
        message_kind: "question",
        content: aiResult.bridgeForOtherSide,
      },
      {
        conversation_id: conversationId,
        author_role: "ai",
        visible_to_role: "both",
        message_kind: "summary",
        content: JSON.stringify(summaryPayload),
      },
    ]);

    setInsight(summaryPayload);

    await supabase
      .from("chat_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    setSending(false);
  };

  const handleWhatsApp = () => {
    const phone = otherUser.telefone?.replace(/\D/g, "");
    if (!phone) return;
    window.open(`https://wa.me/55${phone}?text=Ola ${otherUser.nome}, estou entrando em contato pelo FlyCare!`, "_blank");
  };

  return (
    <div className="grid gap-3 xl:grid-cols-[1.4fr_0.8fr]">
      <Card className="flex h-[720px] min-w-0 flex-col">
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
              <Badge variant="secondary" className="text-[10px]">
                IA mediando
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                Voce fala com a IA, e ela conduz o match com o outro lado.
              </span>
            </div>
          </div>

          {otherUser.telefone && (
            <Button variant="outline" size="sm" onClick={handleWhatsApp} className="gap-2 shrink-0">
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {visibleMessages.length === 0 && (
              <div className="flex h-full min-h-[280px] items-center justify-center">
                <p className="max-w-sm text-center text-sm text-muted-foreground">
                  Aqui voce nao fala direto com o outro lado. A IA da Fly Care entende sua mensagem,
                  aproxima expectativas e conduz a conversa para um match melhor.
                </p>
              </div>
            )}

            {visibleMessages.map((message) => {
              const isMine = message.author_role === myRole;
              const isAI = message.author_role === "ai";

              if (message.message_kind === "summary") return null;

              return (
                <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-3 ${
                      isMine
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide opacity-80">
                      {isAI ? <Sparkles className="h-3.5 w-3.5" /> : null}
                      {isMine ? "Voce" : "IA Fly Care"}
                    </div>
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    <p className={`mt-1 text-[10px] ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {format(new Date(message.created_at), "HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              );
            })}

            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        <div className="border-t p-3 flex gap-2 shrink-0">
          <Input
            value={newMessage}
            onChange={(event) => setNewMessage(event.target.value)}
            placeholder="Conte para a IA o que voce precisa, espera ou pode oferecer..."
            className="flex-1"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) handleSend();
            }}
          />
          <Button onClick={handleSend} disabled={!newMessage.trim() || sending} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      <div className="space-y-3">
        <Card className="shadow-none border-primary/15">
          <div className="border-b px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Estado do match</h4>
                <p className="text-xs text-muted-foreground">
                  A IA acompanha o quanto a conversa ja esta pronta para consulta.
                </p>
              </div>
              <Badge className={insightTone(insight.readinessScore)}>{insight.readinessScore}%</Badge>
            </div>
          </div>
          <div className="space-y-4 p-4 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resumo atual</p>
              <p className="mt-1 text-foreground">{insight.matchSummary}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Proximo passo</p>
              <p className="mt-1 text-foreground">{insight.nextStep}</p>
            </div>
          </div>
        </Card>

        <Card className="shadow-none">
          <div className="border-b px-4 py-3">
            <h4 className="text-sm font-semibold text-foreground">Pendencias e sinais</h4>
            <p className="text-xs text-muted-foreground">
              A IA mostra o que ainda falta e o que ja indica compatibilidade.
            </p>
          </div>
          <div className="space-y-4 p-4 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ainda falta alinhar</p>
              <ul className="mt-2 space-y-2 text-foreground">
                {insight.missingTopics.length > 0 ? (
                  insight.missingTopics.map((topic) => <li key={topic}>- {topic}</li>)
                ) : (
                  <li>- A conversa ja cobre os principais pontos para avancar.</li>
                )}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sinais de compatibilidade</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {insight.compatibilitySignals.length > 0 ? (
                  insight.compatibilitySignals.map((signal) => (
                    <Badge key={signal} variant="outline">
                      {signal}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground">A IA ainda esta coletando sinais do match.</span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ChatWindow;
