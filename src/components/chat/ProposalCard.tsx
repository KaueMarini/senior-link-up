import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileSignature,
  CheckCircle2,
  Clock,
  DollarSign,
  Calendar,
  ListTodo,
  Shield,
  XCircle,
  Phone,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export interface ProposalRecord {
  id: string;
  conversation_id: string;
  responsavel_id: string;
  cuidador_id: string;
  valor: string | null;
  horarios: string | null;
  periodo: string | null;
  tarefas: string[];
  regras: string[];
  mensagem: string | null;
  responsavel_accepted: boolean;
  cuidador_accepted: boolean;
  status: string;
  created_at: string;
}

interface Props {
  proposal: ProposalRecord;
  myRole: "responsavel" | "cuidador";
  responsavelPhone?: string | null;
  cuidadorPhone?: string | null;
  responsavelNome?: string;
  cuidadorNome?: string;
  onUpdated: () => void;
}

const ProposalCard = ({
  proposal,
  myRole,
  responsavelPhone,
  cuidadorPhone,
  responsavelNome,
  cuidadorNome,
  onUpdated,
}: Props) => {
  const [loading, setLoading] = useState(false);
  const fullyAccepted =
    proposal.status === "aceita" ||
    (proposal.responsavel_accepted && proposal.cuidador_accepted);
  const refused = proposal.status === "recusada";

  const handleAccept = async () => {
    setLoading(true);
    const updates: Record<string, unknown> = {};
    if (myRole === "cuidador") updates.cuidador_accepted = true;
    else updates.responsavel_accepted = true;

    const willBeAccepted =
      (myRole === "cuidador" ? true : proposal.responsavel_accepted) &&
      (myRole === "cuidador" ? true : proposal.cuidador_accepted) ||
      (myRole === "cuidador" && proposal.responsavel_accepted) ||
      (myRole === "responsavel" && proposal.cuidador_accepted);

    if (willBeAccepted) updates.status = "aceita";

    const { error } = await (supabase as any)
      .from("proposals")
      .update(updates)
      .eq("id", proposal.id);
    setLoading(false);
    if (error) {
      toast.error("Erro: " + error.message);
      return;
    }
    toast.success(willBeAccepted ? "Proposta aceita! WhatsApp liberado." : "Aceite registrado.");
    onUpdated();
  };

  const handleRefuse = async () => {
    setLoading(true);
    const { error } = await (supabase as any)
      .from("proposals")
      .update({ status: "recusada" })
      .eq("id", proposal.id);
    setLoading(false);
    if (error) {
      toast.error("Erro: " + error.message);
      return;
    }
    toast.info("Proposta recusada.");
    onUpdated();
  };

  const openWhatsApp = (phone: string, name: string) => {
    const clean = phone.replace(/\D/g, "");
    const number = clean.startsWith("55") ? clean : `55${clean}`;
    window.open(
      `https://wa.me/${number}?text=${encodeURIComponent(`Olá ${name}, fechamos pela Fly Care!`)}`,
      "_blank"
    );
  };

  const headerTone = fullyAccepted
    ? "border-green-300 bg-green-50"
    : refused
    ? "border-red-200 bg-red-50"
    : "border-primary/30 bg-primary/5";

  return (
    <div className={`my-2 w-full rounded-2xl border-2 p-4 shadow-sm ${headerTone}`}>
      <div className="mb-3 flex items-center gap-2">
        <FileSignature className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">
            {fullyAccepted
              ? "Proposta aceita pelos dois lados"
              : refused
              ? "Proposta recusada"
              : "Proposta formal"}
          </p>
          <p className="text-xs text-muted-foreground">
            {fullyAccepted
              ? "WhatsApp liberado para combinar os detalhes finais."
              : refused
              ? "Continuem a conversa ou envie uma nova proposta."
              : myRole === "cuidador"
              ? "O responsável enviou uma proposta. Revise e responda."
              : "Aguardando o cuidador aceitar a proposta."}
          </p>
        </div>
        {fullyAccepted ? (
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
        ) : refused ? (
          <XCircle className="h-5 w-5 text-red-500 shrink-0" />
        ) : null}
      </div>

      {proposal.mensagem && (
        <p className="mb-3 rounded-lg bg-white/70 px-3 py-2 text-xs text-foreground italic leading-relaxed whitespace-pre-wrap">
          {proposal.mensagem}
        </p>
      )}

      <Separator className="my-2" />

      <div className="grid gap-2 text-xs sm:grid-cols-2">
        {proposal.valor && (
          <Field icon={<DollarSign className="h-3.5 w-3.5" />} label="Valor" value={proposal.valor} />
        )}
        {proposal.horarios && (
          <Field icon={<Clock className="h-3.5 w-3.5" />} label="Horários" value={proposal.horarios} />
        )}
        {proposal.periodo && (
          <Field icon={<Calendar className="h-3.5 w-3.5" />} label="Período" value={proposal.periodo} />
        )}
      </div>

      {proposal.tarefas.length > 0 && (
        <div className="mt-2">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <ListTodo className="h-3.5 w-3.5" /> Tarefas
          </div>
          <div className="flex flex-wrap gap-1">
            {proposal.tarefas.map((t) => (
              <Badge key={t} variant="secondary" className="text-[10px]">
                {t}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {proposal.regras.length > 0 && (
        <div className="mt-2">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <Shield className="h-3.5 w-3.5" /> Regras
          </div>
          <div className="flex flex-wrap gap-1">
            {proposal.regras.map((r) => (
              <Badge key={r} variant="outline" className="text-[10px]">
                {r}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Acceptance status */}
      <div className="mt-3 flex items-center gap-3 text-xs">
        <span className="flex items-center gap-1">
          {proposal.responsavel_accepted ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
          ) : (
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          Responsável
        </span>
        <span className="flex items-center gap-1">
          {proposal.cuidador_accepted ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
          ) : (
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          Cuidador
        </span>
      </div>

      {/* Actions */}
      {!fullyAccepted && !refused && (
        <div className="mt-3 flex gap-2">
          {((myRole === "cuidador" && !proposal.cuidador_accepted) ||
            (myRole === "responsavel" && !proposal.responsavel_accepted)) && (
            <>
              <Button
                size="sm"
                className="flex-1 gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                onClick={handleAccept}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Aceitar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1.5"
                onClick={handleRefuse}
                disabled={loading}
              >
                <XCircle className="h-3.5 w-3.5" />
                Recusar
              </Button>
            </>
          )}
        </div>
      )}

      {/* WhatsApp reveal */}
      {fullyAccepted && (
        <div className="mt-3 space-y-2 rounded-xl bg-white/80 border border-green-200 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-green-700 flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" /> Contatos liberados
          </p>
          {responsavelPhone && (
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs">
                <p className="font-semibold text-foreground">{responsavelNome ?? "Responsável"}</p>
                <p className="text-muted-foreground">{responsavelPhone}</p>
              </div>
              {myRole === "cuidador" && (
                <Button
                  size="sm"
                  className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => openWhatsApp(responsavelPhone, responsavelNome ?? "")}
                >
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </Button>
              )}
            </div>
          )}
          {cuidadorPhone && (
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs">
                <p className="font-semibold text-foreground">{cuidadorNome ?? "Cuidador"}</p>
                <p className="text-muted-foreground">{cuidadorPhone}</p>
              </div>
              {myRole === "responsavel" && (
                <Button
                  size="sm"
                  className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => openWhatsApp(cuidadorPhone, cuidadorNome ?? "")}
                >
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md bg-white/60 px-2 py-1.5">
      <span className="text-primary shrink-0">{icon}</span>
      <div>
        <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">{label}</p>
        <p className="font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

export default ProposalCard;
