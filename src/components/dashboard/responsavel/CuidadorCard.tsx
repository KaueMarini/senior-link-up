import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, Briefcase, Heart, ThumbsUp, ThumbsDown,
  BadgeCheck, MessageCircle, Clock, GraduationCap, DollarSign, Star,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

interface CuidadorCardProps {
  cuidador: Profile;
  isFavorite: boolean;
  reviewTipo?: string;
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
  onToggleFavorite,
  onLike,
  onDislike,
  onStartChat,
  onViewProfile,
}: CuidadorCardProps) => {
  const initials = (c.nome || "C").slice(0, 2).toUpperCase();

  return (
    <Card className="group overflow-hidden border-border/60 hover:border-primary/30 hover:shadow-lg transition-all duration-300 relative">
      {/* Top accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-primary via-primary/70 to-accent" />

      <CardContent className="p-0">
        {/* Header section */}
        <div className="relative p-5 pb-3">
          {/* Favorite button */}
          <button
            onClick={onToggleFavorite}
            className="absolute top-3 right-3 p-2 rounded-full hover:bg-muted transition-colors z-10"
          >
            <Heart className={`h-5 w-5 transition-all ${isFavorite ? "fill-accent text-accent scale-110" : "text-muted-foreground hover:text-accent"}`} />
          </button>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16 border-[3px] border-primary/20 shadow-md">
                <AvatarImage src={c.avatar_url || ""} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-lg font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {c.verificado && (
                <div className="absolute -bottom-1 -right-1 bg-card rounded-full p-0.5 shadow-sm">
                  <BadgeCheck className="h-5 w-5 text-primary fill-primary/10" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 pr-6">
              <h3 className="font-heading text-lg font-bold text-foreground truncate leading-tight">
                {c.nome}
              </h3>
              <p className="text-sm font-medium text-primary/80 mt-0.5">
                {c.especialidade || "Cuidador(a) de Idosos"}
              </p>
            </div>
          </div>
        </div>

        {/* Bio */}
        {c.bio && (
          <div className="px-5 pb-3">
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed italic">
              "{c.bio}"
            </p>
          </div>
        )}

        {/* Info chips */}
        <div className="px-5 pb-3 flex flex-wrap gap-1.5">
          {c.cidade && (
            <Badge variant="secondary" className="gap-1 text-xs font-normal py-1 px-2.5">
              <MapPin className="h-3 w-3" /> {c.cidade}{c.estado ? `, ${c.estado}` : ""}
            </Badge>
          )}
          {c.experiencia && (
            <Badge variant="secondary" className="gap-1 text-xs font-normal py-1 px-2.5">
              <Briefcase className="h-3 w-3" /> {c.experiencia}
            </Badge>
          )}
          {c.formacao && (
            <Badge variant="secondary" className="gap-1 text-xs font-normal py-1 px-2.5">
              <GraduationCap className="h-3 w-3" /> {c.formacao}
            </Badge>
          )}
          {c.disponibilidade && (
            <Badge variant="secondary" className="gap-1 text-xs font-normal py-1 px-2.5">
              <Clock className="h-3 w-3" /> {disponibilidadeLabel[c.disponibilidade] || c.disponibilidade}
            </Badge>
          )}
        </div>

        {/* Price */}
        {c.preco_diaria && (
          <div className="px-5 pb-3">
            <div className="inline-flex items-center gap-1.5 bg-primary/5 border border-primary/10 rounded-lg px-3 py-1.5">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="font-heading text-base font-bold text-foreground">{c.preco_diaria}</span>
              <span className="text-xs text-muted-foreground">/diária</span>
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
