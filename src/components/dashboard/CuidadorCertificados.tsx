import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Upload, FileText, CheckCircle2, Trash2, Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Certificate {
  id: string;
  nome: string;
  instituicao: string | null;
  data_conclusao: string | null;
  arquivo_url: string | null;
  verificado: boolean;
  created_at: string;
}

const CuidadorCertificados = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState("");
  const [instituicao, setInstituicao] = useState("");
  const [dataConclusao, setDataConclusao] = useState("");
  const [uploading, setUploading] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);

  const fetchCertificates = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("certificates")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setCertificates((data as Certificate[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchCertificates(); }, [user]);

  const handleSubmit = async () => {
    if (!user || !nome.trim()) return;
    setUploading(true);

    let arquivo_url: string | null = null;
    if (arquivo) {
      const ext = arquivo.name.split(".").pop();
      const path = `${user.id}/cert_${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, arquivo, { upsert: true });
      if (!error) {
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        arquivo_url = urlData.publicUrl;
      }
    }

    const { error } = await supabase.from("certificates").insert({
      user_id: user.id,
      nome: nome.trim(),
      instituicao: instituicao.trim() || null,
      data_conclusao: dataConclusao || null,
      arquivo_url,
    } as any);

    if (error) {
      toast.error("Erro ao salvar certificado");
    } else {
      toast.success("Certificado adicionado!");
      setNome(""); setInstituicao(""); setDataConclusao(""); setArquivo(null); setShowForm(false);
      fetchCertificates();
    }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("certificates").delete().eq("id", id);
    toast.success("Certificado removido");
    fetchCertificates();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Award className="h-6 w-6 text-primary" />
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground">Certificados e Qualificações</h2>
            <p className="text-sm text-muted-foreground">Gerencie seus certificados profissionais</p>
          </div>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" /> Novo certificado
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do certificado *</Label>
                <Input placeholder="Ex: Curso de Primeiros Socorros" value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Instituição</Label>
                <Input placeholder="Ex: Cruz Vermelha" value={instituicao} onChange={(e) => setInstituicao(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ano de conclusão</Label>
                <Input placeholder="Ex: 2024" value={dataConclusao} onChange={(e) => setDataConclusao(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Arquivo (PDF ou imagem)</Label>
                <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setArquivo(e.target.files?.[0] || null)} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={!nome.trim() || uploading} className="gap-2">
                <Upload className="h-4 w-4" /> {uploading ? "Enviando..." : "Salvar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : certificates.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {certificates.map((cert) => (
            <Card key={cert.id} className="group">
              <CardContent className="flex items-start gap-4 pt-6">
                <div className="rounded-lg bg-primary/10 p-3">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-foreground truncate">{cert.nome}</h3>
                  <p className="text-sm text-muted-foreground">
                    {cert.instituicao || "—"} • {cert.data_conclusao || "—"}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    {cert.verificado ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Verificado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" /> Pendente
                      </span>
                    )}
                    {cert.arquivo_url && (
                      <a href={cert.arquivo_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                        Ver arquivo
                      </a>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 text-destructive" onClick={() => handleDelete(cert.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Award className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum certificado enviado ainda.</p>
            <Button className="gap-2" onClick={() => setShowForm(true)}>
              <Upload className="h-4 w-4" /> Enviar primeiro certificado
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CuidadorCertificados;
