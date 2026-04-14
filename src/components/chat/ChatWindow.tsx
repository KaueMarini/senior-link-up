import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useChatAI } from "@/hooks/useChatAI";
import type { Message } from "@/hooks/useChatAI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, ArrowLeft, ExternalLink, ClipboardList, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ContractDraftPanel from "./ContractDraftPanel";
import SmartReplies from "./SmartReplies";
import ProfileInfoCards from "./ProfileInfoCards";

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

// ─────────────────────────────────────────────
// Stage badge helpers
// ─────────────────────────────────────────────

const STAGE_LABEL: Record<string, string> = {
  inicio:     "Início",
  negociacao: "Negociação",
  acordo:     "Acordo",
  finalizado: "Fechado",
};

const STAGE_VARIANT: Record<string, string> = {
  inicio:     "bg-slate-100 text-slate-600",
  negociacao: "bg-blue-100 text-blue-700",
  acordo:     "bg-amber-100 text-amber-700",
  finalizado: "bg-green-100 text-green-700",
};

const SENTIMENT_DOT: Record<string, string> = {
  positivo: "bg-green-500",
  neutro:   "bg-slate-400",
  tenso:    "bg-red-500",
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

const ChatWindow = ({ conversationId, otherUser, onBack }: ChatWindowProps) => {
  const { user, userName, userPerfil } = useAuth();
  const myRole: "cuidador" | "responsavel" =
    userPerfil === "cuidador" ? "cuidador" : "responsavel";

  // ── Core chat state ──
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── UI panel state ──
  const [showPanel, setShowPanel] = useState(true);
  const [showCards, setShowCards] = useState(false);

  // ── AI layer — all fields ──
  const {
    contractDraft,
    smartReplies,
    completionScore,
    loading: aiLoading,
    conversationStage,
    sentiment,
    discussedTopics,
  } = useChatAI(messages, user?.id ?? "", myRole);

  // ─────────────────────────────────────────────
  // Realtime subscription
  // ─────────────────────────────────────────────

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!user || messages.length === 0) return;
    const unread = messages.filter((m) => m.sender_id !== user.id && !m.read);
    if (unread.length > 0) {
      supabase
        .from("chat_messages")
        .update({ read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user.id)
        .eq("read", false)
        .then();
    }
  }, [messages, user, conversationId]);

  // ─────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    setMessages((data as Message[]) || []);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user || sending) return;
    setSending(true);
    await supabase.from("chat_messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: newMessage.trim(),
    });
    setNewMessage("");
    setSending(false);
  };

  const handleWhatsApp = () => {
    const phone = otherUser.telefone?.replace(/\D/g, "");
    if (phone) {
      window.open(
        `https://wa.me/55${phone}?text=Olá ${otherUser.nome}, estou entrando em contato pelo FlyCare!`,
        "_blank"
      );
    }
  };

  const handleSmartReplySelect = (text: string) => {
    setNewMessage(text);
    inputRef.current?.focus();
  };

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-3">
      {/* ── Top row: Chat card + Contract panel ── */}
      <div className="flex gap-3 items-start">
        {/* ── Main chat card ── */}
        <Card className="flex flex-col flex-1 min-w-0 h-[600px]">
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

            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-bold text-foreground truncate">
                {otherUser.nome}
              </h3>
              {/* Stage + sentiment inline */}
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none ${STAGE_VARIANT[conversationStage] ?? STAGE_VARIANT.inicio}`}
                >
                  {STAGE_LABEL[conversationStage] ?? conversationStage}
                </span>
                <span
                  className={`h-1.5 w-1.5 rounded-full shrink-0 ${SENTIMENT_DOT[sentiment] ?? SENTIMENT_DOT.neutro}`}
                />
                <span className="text-[10px] text-muted-foreground capitalize">
                  {sentiment}
                </span>
              </div>
            </div>

            {/* Draft progress pill (visible when panel is hidden) */}
            {!showPanel && completionScore > 0 && (
              <Badge
                variant="secondary"
                className="shrink-0 text-xs cursor-pointer hover:bg-primary/20 transition-colors"
                onClick={() => setShowPanel(true)}
              >
                Draft {completionScore}%
              </Badge>
            )}

            {/* Panel toggle */}
            <Button
              variant={showPanel ? "secondary" : "outline"}
              size="sm"
              className="gap-1.5 shrink-0"
              onClick={() => setShowPanel((v) => !v)}
              title="Abrir/fechar draft de contrato"
            >
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Contrato</span>
            </Button>

            {/* WhatsApp */}
            {otherUser.telefone && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleWhatsApp}
                className="gap-2 shrink-0"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="hidden sm:inline">WhatsApp</span>
              </Button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground text-sm text-center max-w-xs">
                  Inicie a conversa para negociar valores e disponibilidade.
                  <br />
                  O draft de contrato será preenchido automaticamente conforme vocês combinam os detalhes.
                </p>
              </div>
            )}

            {messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      isMe
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p
                      className={`text-[10px] mt-1 ${
                        isMe
                          ? "text-primary-foreground/60"
                          : "text-muted-foreground"
                      }`}
                    >
                      {format(new Date(msg.created_at), "HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Smart Replies — passes loading state */}
          <SmartReplies
            suggestions={smartReplies}
            onSelect={handleSmartReplySelect}
            loading={aiLoading}
          />

          {/* Input area */}
          <div className="border-t p-3 flex gap-2 shrink-0">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1"
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && handleSend()
              }
            />
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        {/* ── Contract draft panel — receives all AI fields ── */}
        {showPanel && (
          <ContractDraftPanel
            draft={contractDraft}
            completionScore={completionScore}
            otherUserName={otherUser.nome}
            myName={userName}
            conversationStage={conversationStage}
            sentiment={sentiment}
            discussedTopics={discussedTopics}
            className="h-[600px]"
          />
        )}
      </div>

      {/* ── Profile info cards (collapsible) ── */}
      <div>
        <button
          type="button"
          onClick={() => setShowCards((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          {showCards ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
          {showCards ? "Ocultar informações do perfil" : "Ver informações do perfil e dicas de negociação"}
        </button>

        {showCards && (
          <ProfileInfoCards
            otherUserId={otherUser.id}
            otherUserName={otherUser.nome}
            myRole={myRole}
          />
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
