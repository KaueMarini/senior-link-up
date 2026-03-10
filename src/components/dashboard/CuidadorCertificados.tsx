import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Upload, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const certificados = [
  { nome: "Curso de Primeiros Socorros", instituicao: "Cruz Vermelha", status: "verificado", data: "2024" },
  { nome: "Cuidador de Idosos Nível Avançado", instituicao: "SENAC", status: "pendente", data: "2023" },
];

const CuidadorCertificados = () => {
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
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" /> Enviar certificado
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {certificados.map((cert, i) => (
          <Card key={i}>
            <CardContent className="flex items-start gap-4 pt-6">
              <div className="rounded-lg bg-primary/10 p-3">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-heading font-bold text-foreground">{cert.nome}</h3>
                <p className="text-sm text-muted-foreground">{cert.instituicao} • {cert.data}</p>
                <div className="mt-2">
                  {cert.status === "verificado" ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Verificado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
                      Pendente de verificação
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {certificados.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Award className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum certificado enviado ainda.</p>
            <Button className="gap-2">
              <Upload className="h-4 w-4" /> Enviar primeiro certificado
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CuidadorCertificados;
