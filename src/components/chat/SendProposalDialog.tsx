import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FileSignature, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { MediatedContract } from "@/hooks/useMediatedConversationAI";

interface Props {
  open: boolean;
  onClose: () => void;
  conversationId: string;
  responsavelId: string;
  cuidadorId: string;
  cuidadorNome: string;
  prefill?: MediatedContract | null;
  onSent: () => void;
}

const SendProposalDialog = ({
  open,
  onClose,
  conversationId,
  responsavelId,
  cuidadorId,
  cuidadorNome,
  prefill,
  onSent,
}: Props) => {
  const [valor, setValor] = useState("");
  const [horarios, setHorarios] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [tarefas, setTarefas] = useState("");
  const [regras, setRegras] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValor(prefill?.valorAcordado ?? "");
    setHorarios(prefill?.horarios ?? "");
    setPeriodo(prefill?.periodo ?? "");
    setTarefas((prefill?.tarefas ?? []).join(", "));
    setRegras((prefill?.regras ?? []).join(", "));
    setMensagem(
      prefill?.resumoFinal
        ? `Olá ${cuidadorNome}, com base na nossa conversa, segue minha proposta formal:\n\n${prefill.resumoFinal}`
        : `Olá ${cuidadorNome}, gostaria de formalizar uma proposta com você. Por favor, revise os termos abaixo.`
    );
  }, [open, prefill, cuidadorNome]);

  const handleSend = async () => {
    if (!valor.trim() || !horarios.trim()) {
      toast.error("Preencha pelo menos o valor e os horários.");
      return;
    }
    setSaving(true);
    const { error } = await (supabase as any).from("proposals").insert({
      conversation_id: conversationId,
      responsavel_id: responsavelId,
      cuidador_id: cuidadorId,
      valor: valor.trim(),
      horarios: horarios.trim(),
      periodo: periodo.trim() || null,
      tarefas: tarefas.split(",").map((t) => t.trim()).filter(Boolean),
      regras: regras.split(",").map((r) => r.trim()).filter(Boolean),
      mensagem: mensagem.trim() || null,
      responsavel_accepted: true,
      cuidador_accepted: false,
      status: "pendente",
    });
    setSaving(false);
    if (error) {
      toast.error("Erro ao enviar proposta: " + error.message);
      return;
    }
    toast.success("Proposta enviada ao cuidador!");
    onSent();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            Enviar proposta para {cuidadorNome}
          </DialogTitle>
          <DialogDescription>
            Quando o cuidador aceitar, vocês trocam os números de WhatsApp automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <Label htmlFor="valor">Valor *</Label>
            <Input
              id="valor"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="R$ 150/dia"
            />
          </div>
          <div>
            <Label htmlFor="horarios">Horários *</Label>
            <Input
              id="horarios"
              value={horarios}
              onChange={(e) => setHorarios(e.target.value)}
              placeholder="08h às 16h"
            />
          </div>
          <div>
            <Label htmlFor="periodo">Período</Label>
            <Input
              id="periodo"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              placeholder="Segunda a sexta"
            />
          </div>
          <div>
            <Label htmlFor="tarefas">Tarefas (separadas por vírgula)</Label>
            <Input
              id="tarefas"
              value={tarefas}
              onChange={(e) => setTarefas(e.target.value)}
              placeholder="higiene, medicamentos, alimentação"
            />
          </div>
          <div>
            <Label htmlFor="regras">Regras (separadas por vírgula)</Label>
            <Input
              id="regras"
              value={regras}
              onChange={(e) => setRegras(e.target.value)}
              placeholder="não fumante, tem cachorro"
            />
          </div>
          <div>
            <Label htmlFor="mensagem">Mensagem</Label>
            <Textarea
              id="mensagem"
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />}
            Enviar proposta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SendProposalDialog;
