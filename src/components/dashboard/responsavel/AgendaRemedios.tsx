import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { sendNotification } from "@/lib/notifications";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Pill, Plus, Trash2, Power, PowerOff, Clock } from "lucide-react";
import { toast } from "sonner";

interface Medication {
  id: string;
  user_id: string;
  nome: string;
  dosagem: string | null;
  frequencia: string;
  dias_semana: string[];
  horarios: string[];
  observacoes: string | null;
  ativo: boolean;
  data_inicio: string | null;
  data_fim: string | null;
  created_at: string;
  updated_at: string;
}

const frequenciaLabels: Record<string, string> = {
  diario: "Diário",
  semanal: "Semanal",
  "a-cada-12h": "A cada 12h",
  "a-cada-8h": "A cada 8h",
  "a-cada-6h": "A cada 6h",
  mensal: "Mensal",
  "sob-demanda": "Sob demanda",
};

const diasSemana = [
  { value: "seg", label: "Seg" },
  { value: "ter", label: "Ter" },
  { value: "qua", label: "Qua" },
  { value: "qui", label: "Qui" },
  { value: "sex", label: "Sex" },
  { value: "sab", label: "Sáb" },
  { value: "dom", label: "Dom" },
];

const AgendaRemedios = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    dosagem: "",
    frequencia: "diario",
    dias_semana: [] as string[],
    horarios: ["08:00"],
    observacoes: "",
    data_inicio: "",
    data_fim: "",
  });

  const fetchMedications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("medications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setMedications((data as Medication[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMedications();
  }, [user]);

  const handleCreate = async () => {
    if (!user || !form.nome) {
      toast.error("Preencha o nome do remédio");
      return;
    }
    const { error } = await supabase.from("medications").insert({
      user_id: user.id,
      nome: form.nome,
      dosagem: form.dosagem || null,
      frequencia: form.frequencia,
      dias_semana: form.dias_semana,
      horarios: form.horarios.filter(Boolean),
      observacoes: form.observacoes || null,
      data_inicio: form.data_inicio || null,
      data_fim: form.data_fim || null,
    } as any);
    if (error) {
      toast.error("Erro ao criar agendamento de remédio");
      return;
    }
    toast.success("Remédio agendado com sucesso!");
    setShowDialog(false);
    setForm({ nome: "", dosagem: "", frequencia: "diario", dias_semana: [], horarios: ["08:00"], observacoes: "", data_inicio: "", data_fim: "" });
    fetchMedications();
  };

  const toggleAtivo = async (med: Medication) => {
    await supabase.from("medications").update({ ativo: !med.ativo } as any).eq("id", med.id);
    fetchMedications();
    toast.success(med.ativo ? "Remédio desativado" : "Remédio reativado");
  };

  const deleteMedication = async (id: string) => {
    await supabase.from("medications").delete().eq("id", id);
    setMedications((prev) => prev.filter((m) => m.id !== id));
    toast.success("Remédio removido");
  };

  const toggleDia = (dia: string) => {
    setForm((prev) => ({
      ...prev,
      dias_semana: prev.dias_semana.includes(dia)
        ? prev.dias_semana.filter((d) => d !== dia)
        : [...prev.dias_semana, dia],
    }));
  };

  const addHorario = () => setForm((prev) => ({ ...prev, horarios: [...prev.horarios, ""] }));
  const removeHorario = (i: number) => setForm((prev) => ({ ...prev, horarios: prev.horarios.filter((_, idx) => idx !== i) }));
  const updateHorario = (i: number, val: string) =>
    setForm((prev) => ({ ...prev, horarios: prev.horarios.map((h, idx) => (idx === i ? val : h)) }));

  const ativos = medications.filter((m) => m.ativo);
  const inativos = medications.filter((m) => !m.ativo);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Pill className="h-6 w-6 text-primary" />
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground">Agenda de Remédios</h2>
            <p className="text-sm text-muted-foreground">Gerencie medicamentos, dosagens e horários</p>
          </div>
        </div>
        <Button className="gap-2" onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4" /> Novo remédio
        </Button>
      </div>

      {ativos.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-heading font-bold text-foreground">Ativos</h3>
          {ativos.map((m) => (
            <MedicationCard key={m.id} med={m} onToggle={toggleAtivo} onDelete={deleteMedication} />
          ))}
        </div>
      )}

      {inativos.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-heading font-bold text-muted-foreground">Inativos</h3>
          {inativos.map((m) => (
            <MedicationCard key={m.id} med={m} onToggle={toggleAtivo} onDelete={deleteMedication} />
          ))}
        </div>
      )}

      {medications.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-16">
          <Pill className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhum remédio cadastrado ainda.</p>
          <Button onClick={() => setShowDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Cadastrar primeiro remédio
          </Button>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Novo Remédio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Nome do remédio *</label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Losartana 50mg" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Dosagem</label>
              <Input value={form.dosagem} onChange={(e) => setForm({ ...form, dosagem: e.target.value })} placeholder="Ex: 1 comprimido, 10ml, 2 gotas" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Frequência</label>
              <Select value={form.frequencia} onValueChange={(v) => setForm({ ...form, frequencia: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(frequenciaLabels).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Dias da semana</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {diasSemana.map((dia) => (
                  <label key={dia.value} className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox
                      checked={form.dias_semana.includes(dia.value)}
                      onCheckedChange={() => toggleDia(dia.value)}
                    />
                    <span className="text-sm text-foreground">{dia.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Horários</label>
              <div className="space-y-2 mt-1">
                {form.horarios.map((h, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input type="time" value={h} onChange={(e) => updateHorario(i, e.target.value)} className="w-32" />
                    {form.horarios.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeHorario(i)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addHorario} className="gap-1">
                  <Plus className="h-3 w-3" /> Adicionar horário
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Data início</label>
                <Input type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Data fim (opcional)</label>
                <Input type="date" value={form.data_fim} onChange={(e) => setForm({ ...form, data_fim: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Observações</label>
              <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Ex: Tomar em jejum, antes das refeições..." />
            </div>
            <Button className="w-full" onClick={handleCreate}>Cadastrar remédio</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const MedicationCard = ({
  med,
  onToggle,
  onDelete,
}: {
  med: Medication;
  onToggle: (m: Medication) => void;
  onDelete: (id: string) => void;
}) => (
  <Card className={!med.ativo ? "opacity-60" : ""}>
    <CardContent className="flex items-center gap-4 py-4">
      <div className={`rounded-lg p-3 ${med.ativo ? "bg-primary/10" : "bg-muted"}`}>
        <Pill className={`h-5 w-5 ${med.ativo ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-heading font-bold text-foreground">{med.nome}</h4>
          {med.dosagem && <Badge variant="secondary" className="text-xs">{med.dosagem}</Badge>}
          <Badge variant="outline" className={med.ativo ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground border-border"}>
            {frequenciaLabels[med.frequencia] || med.frequencia}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {med.horarios && med.horarios.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {med.horarios.join(", ")}
            </span>
          )}
          {med.dias_semana && med.dias_semana.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {med.dias_semana.map((d) => diasSemana.find((ds) => ds.value === d)?.label || d).join(", ")}
            </span>
          )}
        </div>
        {med.observacoes && <p className="text-xs text-muted-foreground mt-1">{med.observacoes}</p>}
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" onClick={() => onToggle(med)} title={med.ativo ? "Desativar" : "Reativar"}>
          {med.ativo ? <PowerOff className="h-4 w-4 text-muted-foreground" /> : <Power className="h-4 w-4 text-primary" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(med.id)} title="Excluir">
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    </CardContent>
  </Card>
);

export default AgendaRemedios;
