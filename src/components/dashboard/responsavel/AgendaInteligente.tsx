import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { sendNotification } from "@/lib/notifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Clock, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Appointment = Tables<"appointments">;

const statusColors: Record<string, string> = {
  agendado: "bg-primary/10 text-primary border-primary/20",
  confirmado: "bg-accent/10 text-accent border-accent/20",
  cancelado: "bg-destructive/10 text-destructive border-destructive/20",
  concluido: "bg-muted text-muted-foreground border-border",
};

const statusLabels: Record<string, string> = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  cancelado: "Cancelado",
  concluido: "Concluído",
};

const tipoLabels: Record<string, string> = {
  consulta: "Consulta",
  exame: "Exame",
  retorno: "Retorno",
  outro: "Outro",
};

const AgendaInteligente = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ titulo: "", descricao: "", data_hora: "", tipo: "consulta" });

  const fetchAppointments = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("appointments")
      .select("*")
      .eq("user_id", user.id)
      .order("data_hora", { ascending: true });
    setAppointments(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAppointments(); }, [user]);

  const handleCreate = async () => {
    if (!user || !form.titulo || !form.data_hora) {
      toast.error("Preencha título e data/hora");
      return;
    }
    const { error } = await supabase.from("appointments").insert({
      user_id: user.id,
      titulo: form.titulo,
      descricao: form.descricao || null,
      data_hora: new Date(form.data_hora).toISOString(),
      tipo: form.tipo,
    });
    if (error) { toast.error("Erro ao criar agendamento"); return; }
    toast.success("Agendamento criado!");

    // Send webhook notification
    if (profile?.telefone) {
      const tipoLabel = tipoLabels[form.tipo] || form.tipo;
      sendNotification("agendamento", {
        titulo: form.titulo,
        tipo: tipoLabel,
        data_hora: new Date(form.data_hora).toLocaleString("pt-BR"),
        descricao: form.descricao || "",
      }, profile.telefone);
    }

    setShowDialog(false);
    setForm({ titulo: "", descricao: "", data_hora: "", tipo: "consulta" });
    fetchAppointments();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("appointments").update({ status }).eq("id", id);
    fetchAppointments();
    toast.success(`Status atualizado para "${statusLabels[status]}"`);
  };

  const deleteAppointment = async (id: string) => {
    await supabase.from("appointments").delete().eq("id", id);
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    toast.success("Agendamento removido");
  };

  const upcoming = appointments.filter((a) => a.status !== "cancelado" && new Date(a.data_hora) >= new Date());
  const past = appointments.filter((a) => a.status === "cancelado" || new Date(a.data_hora) < new Date());

  if (loading) {
    return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-primary" />
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground">Agenda Inteligente</h2>
            <p className="text-sm text-muted-foreground">Consultas, exames e retornos do idoso</p>
          </div>
        </div>
        <Button className="gap-2" onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4" /> Novo agendamento
        </Button>
      </div>

      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-heading font-bold text-foreground">Próximos</h3>
          {upcoming.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-heading font-bold text-foreground">{a.titulo}</h4>
                    <Badge variant="outline" className={statusColors[a.status]}>{statusLabels[a.status]}</Badge>
                    <Badge variant="secondary" className="text-xs">{tipoLabels[a.tipo]}</Badge>
                  </div>
                  {a.descricao && <p className="text-sm text-muted-foreground">{a.descricao}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(a.data_hora).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="flex gap-1">
                  {a.status === "agendado" && (
                    <Button variant="ghost" size="icon" onClick={() => updateStatus(a.id, "confirmado")} title="Confirmar">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => updateStatus(a.id, "cancelado")} title="Cancelar">
                    <XCircle className="h-4 w-4 text-destructive" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteAppointment(a.id)} title="Excluir">
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-heading font-bold text-muted-foreground">Anteriores / Cancelados</h3>
          {past.map((a) => (
            <Card key={a.id} className="opacity-60">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="rounded-lg bg-muted p-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-heading font-bold text-foreground">{a.titulo}</h4>
                    <Badge variant="outline" className={statusColors[a.status]}>{statusLabels[a.status]}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(a.data_hora).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteAppointment(a.id)}>
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {appointments.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-16">
          <Calendar className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhum agendamento criado ainda.</p>
          <Button onClick={() => setShowDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Criar primeiro agendamento
          </Button>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Novo Agendamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Título</label>
              <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ex: Consulta com Dr. Silva" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Tipo</label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="consulta">Consulta</SelectItem>
                  <SelectItem value="exame">Exame</SelectItem>
                  <SelectItem value="retorno">Retorno</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Data e hora</label>
              <Input type="datetime-local" value={form.data_hora} onChange={(e) => setForm({ ...form, data_hora: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Descrição (opcional)</label>
              <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Detalhes do agendamento..." />
            </div>
            <Button className="w-full" onClick={handleCreate}>Criar agendamento</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgendaInteligente;
