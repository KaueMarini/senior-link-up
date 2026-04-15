import { useEffect, useRef, useState } from "react";
import { Bot, RotateCcw, Send, Sparkles, Target, UserRoundSearch } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useCareMatchAI } from "@/hooks/useCareMatchAI";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

type UserRole = "cuidador" | "responsavel";

interface AIAssistantTabProps {
  userRole: UserRole;
}

const quickPrompts: Record<UserRole, string[]> = {
  responsavel: [
    "Meu familiar precisa de ajuda com banho, remedios e companhia.",
    "Preciso de alguem para periodo noturno e finais de semana.",
    "Quero encontrar um cuidador compativel com Alzheimer.",
  ],
  cuidador: [
    "Tenho experiencia com idosos acamados e administracao de medicamentos.",
    "Atendo plantao noturno e finais de semana em Sao Paulo.",
    "Quero me posicionar melhor para familias com casos de Alzheimer.",
  ],
};

const readinessTone = (score: number) => {
  if (score >= 80) return "bg-emerald-100 text-emerald-700";
  if (score >= 50) return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
};

const AIAssistantTab = ({ userRole }: AIAssistantTabProps) => {
  const { user, userName } = useAuth();
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const { loading, messages, resetConversation, sendMessage, summary } = useCareMatchAI(
    user?.id,
    userName,
    userRole,
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!draft.trim()) return;
    const value = draft;
    setDraft("");
    await sendMessage(value);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
      <Card className="min-h-[680px]">
        <CardHeader className="border-b">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Bot className="h-5 w-5 text-primary" />
                Assistente IA Fly Care
              </CardTitle>
              <CardDescription className="mt-2 max-w-2xl">
                {userRole === "responsavel"
                  ? "Use esta conversa para estruturar o caso do seu familiar, esclarecer prioridades e chegar mais rapido nos cuidadores ideais."
                  : "Use esta conversa para estruturar seu perfil profissional, destacar seus diferenciais e aumentar a qualidade dos seus matches."}
              </CardDescription>
            </div>

            <Button variant="outline" size="sm" className="gap-2" onClick={resetConversation}>
              <RotateCcw className="h-4 w-4" />
              Reiniciar
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex h-[560px] flex-col gap-4 p-0">
          <div className="border-b px-6 py-4">
            <div className="flex flex-wrap gap-2">
              {quickPrompts[userRole].map((prompt) => (
                <Button
                  key={prompt}
                  variant="secondary"
                  size="sm"
                  className="h-auto whitespace-normal text-left"
                  onClick={() => setDraft(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>

          <ScrollArea className="flex-1 px-6">
            <div className="space-y-4 py-5">
              {messages.map((message) => {
                const isAssistant = message.role === "assistant";

                return (
                  <div key={message.id} className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                        isAssistant
                          ? "bg-muted text-foreground rounded-bl-md"
                          : "bg-primary text-primary-foreground rounded-br-md"
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide opacity-80">
                        {isAssistant ? <Sparkles className="h-3.5 w-3.5" /> : <UserRoundSearch className="h-3.5 w-3.5" />}
                        {isAssistant ? "IA Fly Care" : "Voce"}
                      </div>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-3 text-sm text-muted-foreground">
                    A IA esta organizando seu contexto...
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          <div className="border-t px-6 py-4">
            <div className="flex gap-3">
              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={
                  userRole === "responsavel"
                    ? "Descreva o idoso, a rotina, a urgencia e o tipo de ajuda que precisa..."
                    : "Descreva sua experiencia, especialidades, disponibilidade e a regiao onde atende..."
                }
                className="min-h-[88px] resize-none"
              />
              <Button onClick={handleSend} disabled={!draft.trim() || loading} className="h-auto px-5">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2 text-lg">
              <span className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Prontidao para Match
              </span>
              <Badge className={readinessTone(summary.readinessScore)}>{summary.readinessScore}%</Badge>
            </CardTitle>
            <CardDescription>{summary.objective}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="font-semibold text-foreground">Acao recomendada</p>
              <p className="mt-1 text-muted-foreground">{summary.recommendedAction}</p>
            </div>

            <div>
                <p className="font-semibold text-foreground">Proximos passos</p>
              <ul className="mt-2 space-y-2 text-muted-foreground">
                {summary.nextSteps.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumo operacional</CardTitle>
            <CardDescription>
              {userRole === "responsavel"
                ? "O que a Fly Care ja entendeu sobre o caso e o cuidador ideal."
                : "O que a Fly Care ja entendeu sobre seu perfil e os casos mais aderentes."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 text-sm">
            <div>
              <p className="font-semibold text-foreground">Retrato atual</p>
              <ul className="mt-2 space-y-2 text-muted-foreground">
                {summary.profileSnapshot.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-semibold text-foreground">Prioridades</p>
              <ul className="mt-2 space-y-2 text-muted-foreground">
                {summary.priorities.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-semibold text-foreground">Perfil ideal do outro lado</p>
              <ul className="mt-2 space-y-2 text-muted-foreground">
                {summary.idealMatch.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-semibold text-foreground">Dados ainda faltando</p>
              <ul className="mt-2 space-y-2 text-muted-foreground">
                {summary.missingData.length > 0 ? (
                  summary.missingData.map((item) => <li key={item}>- {item}</li>)
                ) : (
                  <li>- Contexto suficiente para avancar para match e conversa.</li>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIAssistantTab;
