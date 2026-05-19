import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageSquare } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface Conversation {
  id: string;
  responsavel_id: string;
  cuidador_id: string;
  updated_at: string;
  other_user: { id: string; nome: string; avatar_url: string | null; telefone: string | null };
  last_message?: string;
}

interface ChatListProps {
  onSelectConversation: (conv: Conversation) => void;
}

const ChatList = ({ onSelectConversation }: ChatListProps) => {
  const { user, userPerfil } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchConversations();
  }, [user, userPerfil]);

  const fetchConversations = async () => {
    if (!user) return;

    const { data: convs } = await supabase
      .from("chat_conversations")
      .select("*")
      .or(`responsavel_id.eq.${user.id},cuidador_id.eq.${user.id}`)
      .order("updated_at", { ascending: false });

    if (!convs || convs.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const otherIds = convs.map((conv) => (conv.responsavel_id === user.id ? conv.cuidador_id : conv.responsavel_id));
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, nome, avatar_url, telefone")
      .in("user_id", otherIds);

    const profileMap = new Map((profiles || []).map((profile) => [profile.user_id, profile]));
    const myRole = userPerfil === "cuidador" ? "cuidador" : "responsavel";

    const enriched = await Promise.all(
      convs.map(async (conv) => {
        const otherId = conv.responsavel_id === user.id ? conv.cuidador_id : conv.responsavel_id;
        const profile = profileMap.get(otherId);

        const { data: lastMessageRows } = await (supabase as any)
          .from("mediated_chat_messages")
          .select("content, message_kind")
          .eq("conversation_id", conv.id)
          .in("visible_to_role", [myRole, "both"])
          .not("message_kind", "in", "(summary,contract)")
          .order("created_at", { ascending: false })
          .limit(1);

        return {
          id: conv.id,
          responsavel_id: conv.responsavel_id,
          cuidador_id: conv.cuidador_id,
          updated_at: conv.updated_at,
          other_user: {
            id: otherId,
            nome: profile?.nome || "Usuario",
            avatar_url: profile?.avatar_url || null,
            telefone: profile?.telefone || null,
          },
          last_message: lastMessageRows?.[0]?.content,
        } satisfies Conversation;
      }),
    );

    setConversations(enriched);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Conversas Mediadas por IA
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {conversations.length === 0 ? (
          <p className="px-4 py-12 text-center text-muted-foreground">
            Nenhuma conversa ainda. Inicie uma conversa com um cuidador na aba "Cuidadores".
          </p>
        ) : (
          <div className="divide-y">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv)}
                className="w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50"
              >
                <Avatar className="h-12 w-12 border-2 border-primary/20 shrink-0">
                  <AvatarImage src={conv.other_user.avatar_url || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {(conv.other_user.nome || "U").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-heading font-bold text-foreground">{conv.other_user.nome}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      IA mediando
                    </Badge>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {conv.last_message || "A IA ainda esta iniciando a mediacao desta conversa."}
                  </p>
                </div>

                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true, locale: ptBR })}
                </span>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChatList;
