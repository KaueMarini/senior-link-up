import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Stethoscope,
  MapPin,
  Clock,
  Star,
  Lightbulb,
} from "lucide-react";

interface OtherUserProfile {
  bio?: string | null;
  especialidade?: string | null;
  experiencia?: string | null;
  formacao?: string | null;
  preco_diaria?: string | null;
  disponibilidade?: string | null;
  cidade?: string | null;
  estado?: string | null;
}

interface ProfileInfoCardsProps {
  /** user_id of the other participant */
  otherUserId: string;
  otherUserName: string;
  /** role of the CURRENT (logged-in) user */
  myRole: "cuidador" | "responsavel";
}

// Contextual tips per role — would be richer with LLM, but
// these cover the highest-value negotiation moments.
const TIPS: Record<"cuidador" | "responsavel", string[]> = {
  responsavel: [
    "Confirme a disponibilidade para finais de semana e feriados.",
    "Pergunte sobre experiência com a condição específica do paciente.",
    "Negocie um período de experiência de 15 dias antes de fechar.",
    "Solicite ao menos duas referências de empregadores anteriores.",
  ],
  cuidador: [
    "Verifique quais medicamentos o paciente utiliza e a frequência.",
    "Confirme a localização exata e disponibilidade de transporte.",
    "Entenda a rotina diária e as necessidades de mobilidade.",
    "Pergunte se há outros familiares que participam dos cuidados.",
  ],
};

const ProfileInfoCards = ({
  otherUserId,
  otherUserName,
  myRole,
}: ProfileInfoCardsProps) => {
  const [profile, setProfile] = useState<OtherUserProfile | null>(null);

  useEffect(() => {
    supabase
      .from("profiles")
      .select(
        "bio, especialidade, experiencia, formacao, preco_diaria, disponibilidade, cidade, estado"
      )
      .eq("user_id", otherUserId)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data as OtherUserProfile);
      });
  }, [otherUserId]);

  const tips = TIPS[myRole];
  const hasProfileData =
    profile &&
    (profile.especialidade ||
      profile.experiencia ||
      profile.bio ||
      profile.cidade);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t mt-1">
      {/* ── Card 1: Other user's profile ── */}
      <Card className="border-primary/20 shadow-none">
        <CardHeader className="pb-1.5 pt-3 px-4">
          <CardTitle className="text-xs font-heading flex items-center gap-2 text-foreground">
            {myRole === "responsavel" ? (
              <>
                <Stethoscope className="h-3.5 w-3.5 text-primary" />
                O que você precisa saber sobre {otherUserName}
              </>
            ) : (
              <>
                <User className="h-3.5 w-3.5 text-primary" />
                O que você precisa saber sobre o paciente
              </>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="px-4 pb-3 space-y-2">
          {!hasProfileData && (
            <p className="text-xs text-muted-foreground italic">
              Perfil ainda não preenchido. Pergunte diretamente no chat.
            </p>
          )}

          {myRole === "responsavel" && profile && (
            <>
              {profile.especialidade && (
                <InfoRow
                  icon={<Stethoscope className="h-3.5 w-3.5" />}
                  label="Especialidade"
                  value={profile.especialidade}
                />
              )}
              {profile.experiencia && (
                <InfoRow
                  icon={<Star className="h-3.5 w-3.5" />}
                  label="Experiência"
                  value={profile.experiencia}
                  clamp
                />
              )}
              {profile.formacao && (
                <InfoRow
                  icon={<Star className="h-3.5 w-3.5" />}
                  label="Formação"
                  value={profile.formacao}
                />
              )}
              {profile.preco_diaria && (
                <div className="flex items-start gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-0.5">
                      Preço de referência
                    </p>
                    <Badge variant="secondary" className="text-xs font-semibold">
                      R$ {profile.preco_diaria}/dia
                    </Badge>
                  </div>
                </div>
              )}
              {profile.disponibilidade && (
                <InfoRow
                  icon={<Clock className="h-3.5 w-3.5" />}
                  label="Disponibilidade declarada"
                  value={profile.disponibilidade}
                />
              )}
              {profile.cidade && (
                <InfoRow
                  icon={<MapPin className="h-3.5 w-3.5" />}
                  label="Localização"
                  value={[profile.cidade, profile.estado]
                    .filter(Boolean)
                    .join(", ")}
                />
              )}
            </>
          )}

          {myRole === "cuidador" && profile && (
            <>
              {profile.bio && (
                <p className="text-xs text-foreground leading-relaxed line-clamp-4">
                  {profile.bio}
                </p>
              )}
              {profile.cidade && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <p className="text-xs font-medium">
                    {[profile.cidade, profile.estado].filter(Boolean).join(", ")}
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Card 2: Negotiation tips ── */}
      <Card className="border-amber-200 bg-amber-50/40 shadow-none">
        <CardHeader className="pb-1.5 pt-3 px-4">
          <CardTitle className="text-xs font-heading flex items-center gap-2 text-amber-800">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
            {myRole === "responsavel"
              ? "Dicas para fechar o contrato"
              : "Pontos importantes a confirmar"}
          </CardTitle>
        </CardHeader>

        <CardContent className="px-4 pb-3">
          <ul className="space-y-2">
            {tips.map((tip) => (
              <li key={tip} className="flex items-start gap-1.5 text-xs text-foreground">
                <span className="text-amber-500 shrink-0 mt-0.5">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Shared sub-component ─────────────────────

function InfoRow({
  icon,
  label,
  value,
  clamp,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  clamp?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
        <p className={`text-xs font-medium ${clamp ? "line-clamp-2" : ""}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default ProfileInfoCards;
