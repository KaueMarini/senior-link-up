import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MapPin, Briefcase, Heart, BadgeCheck, MessageCircle,
  Clock, GraduationCap, DollarSign, Phone, User, FileText,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

interface CuidadorProfileDialogProps {
  cuidador: Profile | null;
  open: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onStartChat: () => void;
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
}: CuidadorProfileDialogProps) => {
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden gap-0">
        {/* Hero header with gradient */}
        <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-accent/5 px-6 pt-8 pb-6">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-accent/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative flex items-start gap-5">
            <div className="relative shrink-0">
              <Avatar className="h-24 w-24 border-4 border-card shadow-lg">
                <AvatarImage src={cuidador.avatar_url || ""} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {cuidador.verificado && (
                <div className="absolute -bottom-1 -right-1 bg-card rounded-full p-1 shadow-md">
                  <BadgeCheck className="h-6 w-6 text-primary fill-primary/10" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-heading text-2xl font-bold text-foreground leading-tight">
                    {cuidador.nome}
                  </h2>
                  <p className="text-base font-medium text-primary mt-0.5">
                    {cuidador.especialidade || "Cuidador(a) de Idosos"}
                  </p>
                </div>
              </div>

              {cuidador.verificado && (
                <Badge className="mt-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
                  <BadgeCheck className="h-3.5 w-3.5 mr-1" /> Profissional Verificado
                </Badge>
              )}

              {cuidador.preco_diaria && (
                <div className="mt-3 inline-flex items-baseline gap-1 bg-card/80 backdrop-blur rounded-lg px-3 py-1.5 shadow-sm border border-border/50">
                  <span className="font-heading text-xl font-bold text-foreground">{cuidador.preco_diaria}</span>
                  <span className="text-xs text-muted-foreground font-medium">/diária</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5 max-h-[50vh] overflow-y-auto">
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
