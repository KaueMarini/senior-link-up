import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  User,
  Pencil,
  Trash2,
  Link2,
  Activity,
  Pill,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { format, differenceInYears, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

type Dependente = Tables<"dependentes">;
type Vinculo = Tables<"vinculos"> & { cuidador_nome?: string };

const DIAGNOSTICOS_SUGERIDOS = [
  "Alzheimer",
  "Parkinson",
  "Diabetes",
  "AVC",
  "Demência",
  "Pós-operatório",
  "Hipertensão",
  "Insuficiência Cardíaca",
];

const NIVEL_LABEL: Record<string, string> = {
  leve:     "Leve",
  moderado: "Moderado",
  severo:   "Severo",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; className: string }
> = {
  pendente:   { label: "Pendente",   icon: Clock,         className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  ativo:      { label: "Ativo",      icon: CheckCircle2,  className: "bg-green-500/10  text-green-600  border-green-500/20"  },
  finalizado: { label: "Finalizado", icon: XCircle,       className: "bg-muted         text-muted-foreground border-border/50" },
  recusado:   { label: "Recusado",   icon: XCircle,       className: "bg-red-500/10    text-red-600    border-red-500/20"    },
};

// ─────────────────────────────────────────────
// Form dialog
// ─────────────────────────────────────────────

interface DependenteFormProps {
  open: boolean;
  onClose: () => void;
  initial?: Dependente | null;
  onSaved: (d: Dependente) => void;
  responsavelId: string;
}

function DependenteForm({
  open,
  onClose,
  initial,
  onSaved,
  responsavelId,
}: DependenteFormProps) {
  const [nome, setNome]           = useState(initial?.nome ?? "");
  const [nascimento, setNascimento] = useState(initial?.data_nascimento ?? "");
  const [nivel, setNivel]         = useState(initial?.nivel_dependencia ?? "");
  const [medicamentos, setMedicamentos] = useState(
    initial?.medicamentos_ativos ?? ""
  );
  const [observacoes, setObservacoes] = useState(initial?.observacoes ?? "");
  const [diagnosticos, setDiagnosticos] = useState<string[]>(
    initial?.diagnosticos ?? []
  );
  const [saving, setSaving] = useState(false);

  // Reset when reopened for a new record
  useEffect(() => {
    if (open) {
      setNome(initial?.nome ?? "");
      setNascimento(initial?.data_nascimento ?? "");
      setNivel(initial?.nivel_dependencia ?? "");
      setMedicamentos(initial?.medicamentos_ativos ?? "");
      setObservacoes(initial?.observacoes ?? "");
      setDiagnosticos(initial?.diagnosticos ?? []);
    }
  }, [open, initial]);

  const toggleDiag = (d: string) =>
    setDiagnosticos((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );

  const handleSave = async () => {
    if (!nome.trim()) {
      toast.error("Informe o nome do idoso.");
      return;
    }
    setSaving(true);

    const payload = {
      responsavel_id:    responsavelId,
      nome:              nome.trim(),
      data_nascimento:   nascimento || null,
      diagnosticos:      diagnosticos.length ? diagnosticos : null,
      nivel_dependencia: nivel || null,
      medicamentos_ativos: medicamentos.trim() || null,
      observacoes:       observacoes.trim() || null,
    };

    let result;
    if (initial) {
      result = await (supabase as any)
        .from("dependentes")
        .update(payload)
        .eq("id", initial.id)
        .select()
        .single();
    } else {
      result = await (supabase as any)
        .from("dependentes")
        .insert(payload)
        .select()
        .single();
    }

    setSaving(false);
    if (result.error) {
      toast.error("Erro ao salvar: " + result.error.message);
      return;
    }
    toast.success(initial ? "Perfil atualizado!" : "Idoso cadastrado!");
    onSaved(result.data as Dependente);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Editar perfil do idoso" : "Cadastrar idoso"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Nome */}
          <div className="space-y-1.5">
            <Label>Nome completo *</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Maria Aparecida"
            />
          </div>

          {/* Data de nascimento + Nível */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Data de nascimento</Label>
              <Input
                type="date"
                value={nascimento}
                onChange={(e) => setNascimento(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nível de dependência</Label>
              <Select value={nivel} onValueChange={setNivel}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leve">Leve</SelectItem>
                  <SelectItem value="moderado">Moderado</SelectItem>
                  <SelectItem value="severo">Severo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Diagnósticos */}
          <div className="space-y-2">
            <Label>Diagnósticos / Condições</Label>
            <div className="flex flex-wrap gap-2">
              {DIAGNOSTICOS_SUGERIDOS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDiag(d)}
                  className={`h-7 px-3 rounded-full text-xs font-medium border transition-all ${
                    diagnosticos.includes(d)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-transparent text-foreground border-border/60 hover:border-primary/40"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Medicamentos */}
          <div className="space-y-1.5">
            <Label>Medicamentos em uso</Label>
            <Input
              value={medicamentos}
              onChange={(e) => setMedicamentos(e.target.value)}
              placeholder="Ex.: Donepezila 10mg, Losartana 50mg"
            />
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <Label>Observações clínicas</Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Comportamentos, rotinas, restrições alimentares, etc."
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={saving}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

const GerenciarDependentes = () => {
  const { user } = useAuth();
  const [dependentes, setDependentes] = useState<Dependente[]>([]);
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Dependente | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Dependente | null>(null);

  useEffect(() => {
    if (user) {
      fetchAll();
    }
  }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchDependentes(), fetchVinculos()]);
    setLoading(false);
  };

  const fetchDependentes = async () => {
    const { data } = await (supabase as any)
      .from("dependentes")
      .select("*")
      .eq("responsavel_id", user!.id)
      .order("nome");
    setDependentes(data ?? []);
  };

  const fetchVinculos = async () => {
    const { data: vinculosData } = await (supabase as any)
      .from("vinculos")
      .select("*")
      .eq("responsavel_id", user!.id)
      .order("created_at", { ascending: false });

    if (!vinculosData || vinculosData.length === 0) {
      setVinculos([]);
      return;
    }

    // Resolve cuidador names
    const profileIds: string[] = [
      ...new Set(vinculosData.map((v: Vinculo) => v.cuidador_profile_id)),
    ];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, nome")
      .in("id", profileIds);
    const nameMap: Record<string, string> = {};
    (profiles ?? []).forEach((p) => {
      nameMap[p.id] = p.nome;
    });

    setVinculos(
      vinculosData.map((v: Vinculo) => ({
        ...v,
        cuidador_nome: nameMap[v.cuidador_profile_id] ?? "Cuidador",
      }))
    );
  };

  const handleSaved = (saved: Dependente) => {
    setDependentes((prev) => {
      const idx = prev.findIndex((d) => d.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await (supabase as any)
      .from("dependentes")
      .delete()
      .eq("id", deleteTarget.id);
    if (error) {
      toast.error("Erro ao remover: " + error.message);
    } else {
      setDependentes((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      toast.success("Perfil removido.");
    }
    setDeleteTarget(null);
  };

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (d: Dependente) => {
    setEditing(d);
    setFormOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">
            Meus Dependentes
          </h2>
          <p className="text-sm text-muted-foreground">
            Gerencie os perfis dos idosos sob seus cuidados
          </p>
        </div>
        <Button className="gap-2 rounded-xl shadow-sm" onClick={openNew}>
          <Plus className="h-4 w-4" /> Cadastrar idoso
        </Button>
      </div>

      {/* Empty state */}
      {dependentes.length === 0 && (
        <div className="text-center py-16 border border-dashed border-border/60 rounded-2xl">
          <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-medium text-muted-foreground mb-1">
            Nenhum idoso cadastrado ainda
          </p>
          <p className="text-sm text-muted-foreground/70 mb-4">
            Cadastre o perfil do idoso para vincular a cuidadores
          </p>
          <Button variant="outline" className="gap-2" onClick={openNew}>
            <Plus className="h-4 w-4" /> Cadastrar primeiro idoso
          </Button>
        </div>
      )}

      {/* List */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {dependentes.map((d) => {
          const age = d.data_nascimento
            ? differenceInYears(new Date(), parseISO(d.data_nascimento))
            : null;

          const myVinculos = vinculos.filter((v) => v.dependente_id === d.id);

          return (
            <Card
              key={d.id}
              className="overflow-hidden border-border/60 hover:shadow-md transition-shadow"
            >
              <CardContent className="p-0">
                {/* Color strip by level */}
                <div
                  className={`h-1.5 w-full ${
                    d.nivel_dependencia === "severo"
                      ? "bg-red-400"
                      : d.nivel_dependencia === "moderado"
                      ? "bg-yellow-400"
                      : "bg-green-400"
                  }`}
                />

                <div className="p-4 space-y-3">
                  {/* Name + actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-base text-foreground leading-tight">
                          {d.nome}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {age !== null ? `${age} anos` : "Idade não informada"}
                          {d.nivel_dependencia
                            ? ` · ${NIVEL_LABEL[d.nivel_dependencia]}`
                            : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full"
                        onClick={() => openEdit(d)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteTarget(d)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Diagnósticos */}
                  {d.diagnosticos && d.diagnosticos.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Activity className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="flex flex-wrap gap-1">
                        {d.diagnosticos.map((diag) => (
                          <Badge
                            key={diag}
                            variant="secondary"
                            className="text-[11px] py-0 px-2"
                          >
                            {diag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Medicamentos */}
                  {d.medicamentos_ativos && (
                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Pill className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{d.medicamentos_ativos}</span>
                    </div>
                  )}

                  {/* Vínculos deste dependente */}
                  {myVinculos.length > 0 && (
                    <div className="border-t border-border/40 pt-3 space-y-1.5">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Link2 className="h-3 w-3" /> Vínculos ({myVinculos.length})
                      </p>
                      {myVinculos.slice(0, 2).map((v) => {
                        const cfg = STATUS_CONFIG[v.status] ?? STATUS_CONFIG.pendente;
                        const Icon = cfg.icon;
                        return (
                          <div
                            key={v.id}
                            className="flex items-center justify-between"
                          >
                            <span className="text-xs text-foreground truncate">
                              {v.cuidador_nome}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-medium border rounded-full px-2 py-0.5 ${cfg.className}`}
                            >
                              <Icon className="h-3 w-3" />
                              {cfg.label}
                            </span>
                          </div>
                        );
                      })}
                      {myVinculos.length > 2 && (
                        <p className="text-[11px] text-primary">
                          +{myVinculos.length - 2} vínculo(s)
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Form dialog */}
      {user && (
        <DependenteForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          initial={editing}
          onSaved={handleSaved}
          responsavelId={user.id}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover perfil?</AlertDialogTitle>
            <AlertDialogDescription>
              O perfil de <strong>{deleteTarget?.nome}</strong> e todos os seus
              vínculos serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GerenciarDependentes;
