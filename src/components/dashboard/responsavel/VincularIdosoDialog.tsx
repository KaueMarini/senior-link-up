import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Link2,
  Pill,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { differenceInYears, parseISO } from "date-fns";

type Dependente = Tables<"dependentes">;
type Profile    = Tables<"profiles">;

interface VincularIdosoDialogProps {
  cuidador: Profile | null;
  open: boolean;
  onClose: () => void;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const NIVEL_LABEL: Record<string, string> = {
  leve: "Leve",
  moderado: "Moderado",
  severo: "Severo",
};

function buildPropostaPadrao(d: Dependente, cuidador: Profile): string {
  const age = d.data_nascimento
    ? differenceInYears(new Date(), parseISO(d.data_nascimento))
    : null;

  const lines: string[] = [
    `Olá, ${cuidador.nome}! Gostaria de apresentar um familiar que precisa de cuidados.`,
    "",
    `👤 Idoso(a): ${d.nome}${age !== null ? `, ${age} anos` : ""}`,
  ];

  if (d.nivel_dependencia) {
    lines.push(
      `📊 Nível de dependência: ${NIVEL_LABEL[d.nivel_dependencia] ?? d.nivel_dependencia}`
    );
  }
  if (d.diagnosticos && d.diagnosticos.length > 0) {
    lines.push(`🏥 Diagnósticos: ${d.diagnosticos.join(", ")}`);
  }
  if (d.medicamentos_ativos) {
    lines.push(`💊 Medicamentos: ${d.medicamentos_ativos}`);
  }
  if (d.observacoes) {
    lines.push(`📝 Observações: ${d.observacoes}`);
  }

  lines.push("", "Podemos conversar sobre disponibilidade e condições?");
  return lines.join("\n");
}

// ─────────────────────────────────────────────
// Step indicator
// ─────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${
            i === current
              ? "w-6 bg-primary"
              : i < current
              ? "w-3 bg-primary/40"
              : "w-3 bg-border"
          }`}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">
        {current + 1}/{total}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

const VincularIdosoDialog = ({
  cuidador,
  open,
  onClose,
}: VincularIdosoDialogProps) => {
  const { user } = useAuth();

  // steps: 0 = choose idoso | 1 = review proposal | 2 = success
  const [step, setStep]             = useState(0);
  const [dependentes, setDependentes] = useState<Dependente[]>([]);
  const [selected, setSelected]     = useState<Dependente | null>(null);
  const [proposta, setProposta]     = useState("");
  const [saving, setSaving]         = useState(false);
  const [loading, setLoading]       = useState(false);

  // Reset on open
  useEffect(() => {
    if (!open || !user) return;
    setStep(0);
    setSelected(null);
    setProposta("");
    setLoading(true);
    (supabase as any)
      .from("dependentes")
      .select("*")
      .eq("responsavel_id", user.id)
      .order("nome")
      .then(({ data }: { data: Dependente[] | null }) => {
        setDependentes(data ?? []);
        setLoading(false);
      });
  }, [open, user]);

  const pickDependente = (d: Dependente) => {
    setSelected(d);
    if (cuidador) setProposta(buildPropostaPadrao(d, cuidador));
    setStep(1);
  };

  const sendProposta = async () => {
    if (!user || !cuidador || !selected) return;
    setSaving(true);

    const { data: existing } = await (supabase as any)
      .from("vinculos")
      .select("id, status")
      .eq("responsavel_id", user.id)
      .eq("dependente_id", selected.id)
      .eq("cuidador_profile_id", cuidador.id)
      .maybeSingle();

    if (existing?.status === "ativo") {
      toast.info("Este cuidador já está ativo para este idoso.");
      setSaving(false);
      return;
    }
    if (existing?.status === "pendente") {
      toast.info("Já existe uma proposta pendente para este vínculo.");
      setSaving(false);
      return;
    }

    const { error } = await (supabase as any).from("vinculos").insert({
      responsavel_id:      user.id,
      dependente_id:       selected.id,
      cuidador_profile_id: cuidador.id,
      status:              "pendente",
      proposta_texto:      proposta.trim() || null,
    });

    setSaving(false);

    if (error) {
      toast.error("Erro ao criar vínculo: " + error.message);
      return;
    }

    setStep(2);
  };

  if (!cuidador) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Link2 className="h-4 w-4 text-primary" />
              Vincular a um idoso
            </DialogTitle>
            <StepDots current={step} total={3} />
          </div>
          <p className="text-sm text-muted-foreground">
            Cuidador:{" "}
            <span className="font-medium text-foreground">{cuidador.nome}</span>
          </p>
        </DialogHeader>

        {/* ── Step 0 — Selecionar idoso ────────────────── */}
        {step === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Selecione qual idoso será atendido:
            </p>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : dependentes.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-border/60 rounded-xl">
                <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm font-medium text-muted-foreground">
                  Nenhum idoso cadastrado
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Acesse a aba "Dependentes" para cadastrar
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {dependentes.map((d) => {
                  const age = d.data_nascimento
                    ? differenceInYears(new Date(), parseISO(d.data_nascimento))
                    : null;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => pickDependente(d)}
                      className="w-full flex items-start gap-3 p-3.5 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
                    >
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground">
                          {d.nome}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {age !== null ? `${age} anos` : "Idade não informada"}
                          {d.nivel_dependencia
                            ? ` · ${NIVEL_LABEL[d.nivel_dependencia]}`
                            : ""}
                        </p>
                        {d.diagnosticos && d.diagnosticos.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {d.diagnosticos.slice(0, 3).map((diag) => (
                              <Badge
                                key={diag}
                                variant="secondary"
                                className="text-[10px] py-0 px-1.5"
                              >
                                {diag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1 group-hover:text-primary transition-colors" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Step 1 — Revisar proposta ─────────────────── */}
        {step === 1 && selected && (
          <div className="space-y-4">
            {/* Resumo clínico read-only */}
            <div className="rounded-xl bg-muted/30 border border-border/40 p-4 space-y-2">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Resumo clínico — {selected.nome}
              </p>
              {selected.diagnosticos && selected.diagnosticos.length > 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <Activity className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">
                    {selected.diagnosticos.join(", ")}
                  </span>
                </div>
              )}
              {selected.medicamentos_ativos && (
                <div className="flex items-start gap-2 text-sm">
                  <Pill className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">
                    {selected.medicamentos_ativos}
                  </span>
                </div>
              )}
            </div>

            {/* Mensagem editável */}
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-foreground">
                Mensagem para o cuidador
              </p>
              <p className="text-xs text-muted-foreground">
                Pré-preenchida com o quadro clínico. Edite à vontade.
              </p>
              <Textarea
                value={proposta}
                onChange={(e) => setProposta(e.target.value)}
                rows={8}
                className="text-sm resize-none"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => setStep(0)}
              >
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
              <Button
                className="flex-1 gap-2 shadow-sm"
                onClick={sendProposta}
                disabled={saving}
              >
                {saving ? (
                  "Enviando…"
                ) : (
                  <>
                    Enviar proposta <CheckCircle2 className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2 — Sucesso ─────────────────────────── */}
        {step === 2 && (
          <div className="text-center space-y-4 py-4">
            <div className="flex flex-col items-center gap-3">
              <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-9 w-9 text-green-600" />
              </div>
              <div>
                <p className="font-heading text-lg font-bold text-foreground">
                  Vínculo criado!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  A proposta foi enviada ao cuidador e aguarda confirmação.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-muted/30 border border-border/40 p-4 text-left space-y-2">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Resumo do vínculo
              </p>
              <div className="grid grid-cols-2 gap-y-1 text-sm">
                <span className="text-muted-foreground">Idoso(a)</span>
                <span className="font-medium text-right">{selected?.nome}</span>
                <span className="text-muted-foreground">Cuidador</span>
                <span className="font-medium text-right">{cuidador.nome}</span>
                <span className="text-muted-foreground">Status</span>
                <span className="text-right">
                  <Badge
                    variant="secondary"
                    className="text-[11px] bg-yellow-500/10 text-yellow-600 border border-yellow-500/20"
                  >
                    Pendente
                  </Badge>
                </span>
              </div>
            </div>

            <Button className="w-full" onClick={onClose}>
              Concluir
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VincularIdosoDialog;
