import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, Briefcase, Heart, ThumbsUp, ThumbsDown,
  BadgeCheck, MessageCircle, Clock, GraduationCap, DollarSign, Star, MessageSquare,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles"> & { banner_url?: string | null };

export interface CuidadorComment {
  id: string;
  user_id: string;
  nome: string;
  mensagem: string;
  created_at: string;
}

interface CuidadorCardProps {
  cuidador: Profile;
  isFavorite: boolean;
  reviewTipo?: string;
  likeCount: number;
  comments: CuidadorComment[];
  onToggleFavorite: () => void;
  onLike: () => void;
  onDislike: () => void;
  onStartChat: () => void;
  onViewProfile: () => void;
}

const disponibilidadeLabel: Record<string, string> = {
  integral: "Integral",
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noturno",
  fins_semana: "Fins de semana",
};

const CuidadorCard = ({
  cuidador: c,
  isFavorite,
  reviewTipo,
  likeCount,
  comments,
  onToggleFavorite,
  onLike,
  onDislike,
  onStartChat,
  onViewProfile,
}: CuidadorCardProps) => {
  const initials = (c.nome || "C").slice(0, 2).toUpperCase();

  return (
    <Card className="group overflow-hidden border-border/60 hover:border-primary/30 hover:shadow-xl transition-all duration-300 relative">
      {/* Hero photo section */}
      <div className="relative h-44 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 overflow-hidden">
        {/* Banner or avatar as background */}
        {(c as any).banner_url ? (
          <img
            src={(c as any).banner_url}
            alt="Banner"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : c.avatar_url ? (
          <img
            src={c.avatar_url}
            alt={c.nome}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl font-bold text-primary/30">{initials}</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Favorite button */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          className="absolute top-3 right-3 p-2 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card transition-colors z-10 shadow-md"
        >
          <Heart className={`h-5 w-5 transition-all ${isFavorite ? "fill-accent text-accent scale-110" : "text-muted-foreground hover:text-accent"}`} />
        </button>

        {/* Verified badge */}
        {c.verificado && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-primary/90 text-primary-foreground border-0 gap-1 shadow-md backdrop-blur-sm">
              <BadgeCheck className="h-3.5 w-3.5" /> Verificado
            </Badge>
          </div>
        )}

        {/* Avatar overlay when banner exists */}
        {(c as any).banner_url && (
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <Avatar className="h-10 w-10 border-2 border-card shadow-md">
              <AvatarImage src={c.avatar_url || ""} className="object-cover" />
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-1 bg-card/85 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-sm">
              <ThumbsUp className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-bold text-foreground">{likeCount}</span>
              <span className="text-[10px] text-muted-foreground">curtida{likeCount !== 1 ? "s" : ""}</span>
            </div>
          </div>
        )}

        {/* Like count when no banner */}
        {!(c as any).banner_url && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
            <div className="flex items-center gap-1 bg-card/85 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-sm">
              <ThumbsUp className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-bold text-foreground">{likeCount}</span>
              <span className="text-[10px] text-muted-foreground">curtida{likeCount !== 1 ? "s" : ""}</span>
            </div>
          </div>
        )}

        {/* Price overlay */}
        {c.preco_diaria && (
          <div className="absolute bottom-3 right-3 bg-card/85 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm">
            <div className="flex items-baseline gap-0.5">
              <span className="font-heading text-base font-bold text-foreground">{c.preco_diaria}</span>
              <span className="text-[10px] text-muted-foreground">/dia</span>
            </div>
          </div>
        )}
      </div>

      <CardContent className="p-0">
        {/* Name & specialty */}
        <div className="px-4 pt-4 pb-2">
          <h3 className="font-heading text-lg font-bold text-foreground truncate leading-tight">
            {c.nome}
          </h3>
          <p className="text-sm font-medium text-primary/80 mt-0.5">
            {c.especialidade || "Cuidador(a) de Idosos"}
          </p>
        </div>

        {/* Bio */}
        {c.bio && (
          <div className="px-4 pb-2">
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {c.bio}
            </p>
          </div>
        )}

        {/* Info chips */}
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {c.cidade && (
            <Badge variant="secondary" className="gap-1 text-[11px] font-normal py-0.5 px-2">
              <MapPin className="h-3 w-3" /> {c.cidade}{c.estado ? `, ${c.estado}` : ""}
            </Badge>
          )}
          {c.experiencia && (
            <Badge variant="secondary" className="gap-1 text-[11px] font-normal py-0.5 px-2">
              <Briefcase className="h-3 w-3" /> {c.experiencia}
            </Badge>
          )}
          {c.formacao && (
            <Badge variant="secondary" className="gap-1 text-[11px] font-normal py-0.5 px-2">
              <GraduationCap className="h-3 w-3" /> {c.formacao}
            </Badge>
          )}
          {c.disponibilidade && (
            <Badge variant="secondary" className="gap-1 text-[11px] font-normal py-0.5 px-2">
              <Clock className="h-3 w-3" /> {disponibilidadeLabel[c.disponibilidade] || c.disponibilidade}
            </Badge>
          )}
        </div>

        {/* Recent comments preview */}
        {comments.length > 0 && (
          <div className="px-4 pb-3">
            <div className="bg-muted/30 rounded-lg p-3 border border-border/30 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                <MessageSquare className="h-3.5 w-3.5 text-primary" />
                Comentários ({comments.length})
              </div>
              {comments.slice(0, 2).map((comment) => (
                <div key={comment.id} className="text-xs">
                  <span className="font-semibold text-foreground">{comment.nome}: </span>
                  <span className="text-muted-foreground line-clamp-1">{comment.mensagem}</span>
                </div>
              ))}
              {comments.length > 2 && (
                <p className="text-[11px] text-primary cursor-pointer hover:underline" onClick={onViewProfile}>
                  Ver todos os {comments.length} comentários
                </p>
              )}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-border/50" />

        {/* Actions */}
        <div className="p-3 flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLike}
            className={`h-9 w-9 p-0 rounded-full ${reviewTipo === "like" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-primary"}`}
          >
            <ThumbsUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDislike}
            className={`h-9 w-9 p-0 rounded-full ${reviewTipo === "dislike" ? "bg-destructive/10 text-destructive" : "text-muted-foreground hover:text-destructive"}`}
          >
            <ThumbsDown className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onStartChat}
            className="h-9 gap-1.5 rounded-full text-primary hover:bg-primary/10 ml-auto"
          >
            <MessageCircle className="h-4 w-4" /> Chat
          </Button>
          <Button
            size="sm"
            onClick={onViewProfile}
            className="h-9 rounded-full px-4 shadow-sm"
          >
            Ver perfil
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CuidadorCard;
