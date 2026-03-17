import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { sendNotification } from "@/lib/notifications";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Upload, Trash2, Download, Plus, Calendar } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type MedicalExam = Tables<"medical_exams">;

const ExamesMedicos = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [exames, setExames] = useState<MedicalExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ nome: "", descricao: "", data_exame: "" });
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchExames = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("medical_exams")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setExames(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchExames(); }, [user]);

  const handleUpload = async () => {
    if (!user || !form.nome) { toast.error("Preencha o nome do exame"); return; }
    setUploading(true);

    let arquivo_url: string | null = null;
    if (selectedFile) {
      const ext = selectedFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("medical-exams").upload(path, selectedFile);
      if (error) { toast.error("Erro ao enviar arquivo"); setUploading(false); return; }
      // For private bucket, use createSignedUrl or just store the path
      arquivo_url = path;
    }

    const { error } = await supabase.from("medical_exams").insert({
      user_id: user.id,
      nome: form.nome,
      descricao: form.descricao || null,
      data_exame: form.data_exame || null,
      arquivo_url,
    });

    setUploading(false);
    if (error) { toast.error("Erro ao salvar exame"); return; }
    toast.success("Exame salvo com sucesso!");

    // Send webhook notification
    if (profile?.telefone) {
      sendNotification("exame", {
        nome: form.nome,
        data: form.data_exame ? new Date(form.data_exame).toLocaleDateString("pt-BR") : "",
        descricao: form.descricao || "",
      }, profile.telefone);
    }

    setShowDialog(false);
    setForm({ nome: "", descricao: "", data_exame: "" });
    setSelectedFile(null);
    fetchExames();
  };

  const downloadExame = async (path: string) => {
    const { data, error } = await supabase.storage.from("medical-exams").createSignedUrl(path, 300);
    if (error || !data) { toast.error("Erro ao gerar link"); return; }
    window.open(data.signedUrl, "_blank");
  };

  const deleteExame = async (exame: MedicalExam) => {
    if (exame.arquivo_url) {
      await supabase.storage.from("medical-exams").remove([exame.arquivo_url]);
    }
    await supabase.from("medical_exams").delete().eq("id", exame.id);
    setExames((prev) => prev.filter((e) => e.id !== exame.id));
    toast.success("Exame removido");
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-primary" />
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground">Exames Médicos</h2>
            <p className="text-sm text-muted-foreground">Anexe e gerencie exames do idoso</p>
          </div>
        </div>
        <Button className="gap-2" onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4" /> Novo exame
        </Button>
      </div>

      {exames.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {exames.map((exame) => (
            <Card key={exame.id}>
              <CardContent className="flex items-start gap-4 pt-6">
                <div className="rounded-lg bg-primary/10 p-3">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-foreground">{exame.nome}</h3>
                  {exame.descricao && <p className="text-sm text-muted-foreground">{exame.descricao}</p>}
                  {exame.data_exame && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(exame.data_exame).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  {exame.arquivo_url && (
                    <Button variant="ghost" size="icon" onClick={() => downloadExame(exame.arquivo_url!)} title="Baixar">
                      <Download className="h-4 w-4 text-primary" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => deleteExame(exame)} title="Excluir">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-16">
          <FileText className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhum exame cadastrado ainda.</p>
          <Button onClick={() => setShowDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Adicionar primeiro exame
          </Button>
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Novo Exame Médico</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Nome do exame</label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Hemograma completo" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Data do exame</label>
              <Input type="date" value={form.data_exame} onChange={(e) => setForm({ ...form, data_exame: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Descrição (opcional)</label>
              <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Observações sobre o exame" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Arquivo (PDF, imagem)</label>
              <div className="mt-1">
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                <Button variant="outline" className="w-full gap-2" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4" />
                  {selectedFile ? selectedFile.name : "Selecionar arquivo"}
                </Button>
              </div>
            </div>
            <Button className="w-full" onClick={handleUpload} disabled={uploading}>
              {uploading ? "Enviando..." : "Salvar exame"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExamesMedicos;
