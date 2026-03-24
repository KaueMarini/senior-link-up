import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Conversation {
  id: string;
  responsavel_id: string;
  cuidador_id: string;
  updated_at: string;
  other_user: { id: string; nome: string; avatar_url: string | null; telefone: string | null };
  last_message?: string;
  unread_count: number;
}

interface ChatListProps {
  onSelectConversation: (conv: Conversation) => void;
}

const ChatList = ({ onSelectConversation }: ChatListProps) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchConversations();
  }, [user]);

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

    // Get other user profiles
    const otherIds = convs.map((c) =>
      c.responsavel_id === user.id ? c.cuidador_id : c.responsavel_id
    );
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, nome, avatar_url, telefone")
      .in("user_id", otherIds);

    const profileMap = new Map(
      (profiles || []).map((p) => [p.user_id, p])
    );

    // Get last messages and unread counts
    const enriched: Conversation[] = await Promise.all(
      convs.map(async (c) => {
        const otherId = c.responsavel_id === user.id ? c.cuidador_id : c.responsavel_id;
        const profile = profileMap.get(otherId);

        const { data: lastMsg } = await supabase
          .from("chat_messages")
          .select("content")
          .eq("conversation_id", c.id)
          .order("created_at", { ascending: false })
          .limit(1);

        const { count } = await supabase
          .from("chat_messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", c.id)
          .neq("sender_id", user.id)
          .eq("read", false);

        return {
          id: c.id,
          responsavel_id: c.responsavel_id,
          cuidador_id: c.cuidador_id,
          updated_at: c.updated_at,
          other_user: {
            id: otherId,
            nome: profile?.nome || "Usuário",
            avatar_url: profile?.avatar_url || null,
            telefone: profile?.telefone || null,
          },
          last_message: lastMsg?.[0]?.content,
          unread_count: count || 0,
        };
      })
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
          <MessageSquare className="h-5 w-5" /> Conversas
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {conversations.length === 0 ? (
          <p className="text-center text-muted-foreground py-12 px-4">
            Nenhuma conversa ainda. Inicie uma conversa com um cuidador na aba "Cuidadores".
          </p>
        ) : (
          <div className="divide-y">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv)}
                className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
              >
                <Avatar className="h-12 w-12 border-2 border-primary/20 shrink-0">
                  <AvatarImage src={conv.other_user.avatar_url || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {(conv.other_user.nome || "U").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-foreground truncate">
                      {conv.other_user.nome}
                    </span>
                    {conv.unread_count > 0 && (
                      <Badge className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5">
                        {conv.unread_count}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {conv.last_message || "Nenhuma mensagem ainda"}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
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
export type { Conversation };
