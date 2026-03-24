import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  MapPin, Briefcase, Heart, BadgeCheck, MessageCircle,
  Clock, GraduationCap, DollarSign, Phone, User, FileText,
  ThumbsUp, MessageSquare, Send,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import type { CuidadorComment } from "./CuidadorCard";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Profile = Tables<"profiles">;

interface CuidadorProfileDialogProps {
  cuidador: Profile | null;
  open: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onStartChat: () => void;
  likeCount: number;
  comments: CuidadorComment[];
  onAddComment: (msg: string) => void;
}

const disponibilidadeLabel: Record<string, string> = {
  integral: "Período Integral",
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noturno",
  fins_semana: "Fins de Semana",
};

const CuidadorProfileDialog = ({
  cuidador,
  open,
  onClose,
  isFavorite,
  onToggleFavorite,
  onStartChat,
  likeCount,
  comments,
  onAddComment,
}: CuidadorProfileDialogProps) => {
  const [newComment, setNewComment] = useState("");

  if (!cuidador) return null;
  const initials = (cuidador.nome || "C").slice(0, 2).toUpperCase();

  const infoItems = [
    { icon: MapPin, label: "Localização", value: cuidador.cidade ? `${cuidador.cidade}${cuidador.estado ? `, ${cuidador.estado}` : ""}` : null },
    { icon: Briefcase, label: "Experiência", value: cuidador.experiencia },
    { icon: GraduationCap, label: "Formação / Certificações", value: cuidador.formacao },
    { icon: Clock, label: "Disponibilidade", value: cuidador.disponibilidade ? (disponibilidadeLabel[cuidador.disponibilidade] || cuidador.disponibilidade) : null },
    { icon: Phone, label: "Telefone", value: cuidador.telefone },
    { icon: DollarSign, label: "Valor diária", value: cuidador.preco_diaria },
  ].filter((item) => item.value);

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    onAddComment(newComment.trim());
    setNewComment("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden gap-0">
        {/* Hero header with large photo */}
        <div className="relative h-48 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 overflow-hidden">
          {cuidador.avatar_url ? (
            <img
              src={cuidador.avatar_url}
              alt={cuidador.nome}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl font-bold text-primary/20">{initials}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Info overlay on photo */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="flex items-end gap-4">
              <Avatar className="h-16 w-16 border-3 border-card shadow-lg shrink-0">
                <AvatarImage src={cuidador.avatar_url || ""} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="font-heading text-xl font-bold text-white leading-tight truncate">
                  {cuidador.nome}
                </h2>
                <p className="text-sm font-medium text-white/80">
                  {cuidador.especialidade || "Cuidador(a) de Idosos"}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {cuidador.verificado && (
                  <Badge className="bg-primary/90 text-primary-foreground border-0 gap-1">
                    <BadgeCheck className="h-3.5 w-3.5" /> Verificado
                  </Badge>
                )}
                <div className="flex items-center gap-1 bg-card/85 backdrop-blur-sm rounded-full px-2.5 py-1">
                  <ThumbsUp className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-bold text-foreground">{likeCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5 max-h-[50vh] overflow-y-auto">
          {/* Price highlight */}
          {cuidador.preco_diaria && (
            <div className="inline-flex items-baseline gap-1 bg-primary/5 border border-primary/15 rounded-lg px-4 py-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="font-heading text-xl font-bold text-foreground">{cuidador.preco_diaria}</span>
              <span className="text-xs text-muted-foreground font-medium">/diária</span>
            </div>
          )}

          {/* Sobre mim */}
          {cuidador.bio && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-primary" />
                <h4 className="font-heading font-bold text-sm text-foreground uppercase tracking-wide">
                  Sobre mim
                </h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 rounded-lg p-4 border border-border/30">
                {cuidador.bio}
              </p>
            </div>
          )}

          {/* Info grid */}
          {infoItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-primary" />
                <h4 className="font-heading font-bold text-sm text-foreground uppercase tracking-wide">
                  Informações Profissionais
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {infoItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 bg-muted/20 rounded-xl p-3.5 border border-border/30 hover:border-primary/20 transition-colors"
                  >
                    <div className="shrink-0 mt-0.5 h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {item.label}
                      </p>
                      <p className="text-sm font-medium text-foreground mt-0.5 break-words">
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h4 className="font-heading font-bold text-sm text-foreground uppercase tracking-wide">
                Comentários ({comments.length})
              </h4>
            </div>

            {/* Add comment */}
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="Deixe seu comentário sobre este cuidador..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
                className="flex-1 h-10 rounded-lg"
              />
              <Button
                size="sm"
                onClick={handleSubmitComment}
                disabled={!newComment.trim()}
                className="h-10 px-3 rounded-lg"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Comments list */}
            {comments.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {comments.map((c) => (
                  <div key={c.id} className="bg-muted/20 rounded-lg p-3 border border-border/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-foreground">{c.nome}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(c.created_at), "dd MMM yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{c.mensagem}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-3">
                Nenhum comentário ainda. Seja o primeiro!
              </p>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t px-6 py-4 flex gap-3 bg-muted/10">
          <Button
            variant="outline"
            className="flex-1 gap-2 h-11 rounded-xl"
            onClick={onToggleFavorite}
          >
            <Heart className={`h-4 w-4 transition-all ${isFavorite ? "fill-accent text-accent" : ""}`} />
            {isFavorite ? "Favoritado" : "Favoritar"}
          </Button>
          <Button
            className="flex-1 gap-2 h-11 rounded-xl shadow-md"
            onClick={() => { onStartChat(); onClose(); }}
          >
            <MessageCircle className="h-4 w-4" /> Iniciar Negociação
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CuidadorProfileDialog;
