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
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Briefcase, MapPin } from "lucide-react";
import WhatsAppVerification from "@/components/WhatsAppVerification";

export interface CuidadorData {
  cpf: string;
  telefone: string;
  cidade: string;
  estado: string;
  especialidade: string;
  anosExperiencia: string;
  formacao: string;
  sobre: string;
  disponibilidade: string;
  aceitaTermos: boolean;
}

interface CuidadorFieldsProps {
  data: CuidadorData;
  onChange: (data: CuidadorData) => void;
}

const especialidades = [
  "Cuidados gerais",
  "Alzheimer / Demência",
  "Pós-operatório",
  "Fisioterapia",
  "Acompanhamento hospitalar",
  "Cuidados paliativos",
  "Parkinson",
  "Diabetes / Hipertensão",
];

const estados = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const CuidadorFields = ({ data, onChange }: CuidadorFieldsProps) => {
  const update = (field: keyof CuidadorData, value: string | boolean) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-5 rounded-lg border border-primary/20 bg-primary/5 p-5">
      <div className="flex items-center gap-2 text-primary">
        <Briefcase className="h-5 w-5" />
        <h3 className="font-heading text-lg font-semibold">Perfil profissional</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Preencha seus dados profissionais para que famílias possam encontrar você.
      </p>

      {/* Documentos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cpf" className="flex items-center gap-1.5 text-base">
            <FileText className="h-4 w-4" /> CPF
          </Label>
          <Input
            id="cpf"
            placeholder="000.000.000-00"
            value={data.cpf}
            onChange={(e) => update("cpf", e.target.value)}
            required
            className="h-12 text-base"
            maxLength={14}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="telefone" className="text-base">Telefone / WhatsApp</Label>
          <Input
            id="telefone"
            placeholder="(00) 00000-0000"
            value={data.telefone}
            onChange={(e) => update("telefone", e.target.value)}
            required
            className="h-12 text-base"
            maxLength={15}
          />
        </div>
      </div>

      {/* Localização */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cidade" className="flex items-center gap-1.5 text-base">
            <MapPin className="h-4 w-4" /> Cidade
          </Label>
          <Input
            id="cidade"
            placeholder="Sua cidade"
            value={data.cidade}
            onChange={(e) => update("cidade", e.target.value)}
            required
            className="h-12 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="estado" className="text-base">Estado</Label>
          <Select value={data.estado} onValueChange={(v) => update("estado", v)} required>
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="UF" />
            </SelectTrigger>
            <SelectContent>
              {estados.map((uf) => (
                <SelectItem key={uf} value={uf}>{uf}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Experiência */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="especialidade" className="text-base">Especialidade</Label>
          <Select value={data.especialidade} onValueChange={(v) => update("especialidade", v)} required>
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Área de atuação" />
            </SelectTrigger>
            <SelectContent>
              {especialidades.map((esp) => (
                <SelectItem key={esp} value={esp}>{esp}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="anos" className="text-base">Anos de experiência</Label>
          <Select value={data.anosExperiencia} onValueChange={(v) => update("anosExperiencia", v)} required>
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Tempo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="menos-1">Menos de 1 ano</SelectItem>
              <SelectItem value="1-3">1 a 3 anos</SelectItem>
              <SelectItem value="3-5">3 a 5 anos</SelectItem>
              <SelectItem value="5-10">5 a 10 anos</SelectItem>
              <SelectItem value="10+">Mais de 10 anos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Formação */}
      <div className="space-y-2">
        <Label htmlFor="formacao" className="text-base">Formação / Certificações</Label>
        <Input
          id="formacao"
          placeholder="Ex: Técnico em Enfermagem, Curso de Cuidador"
          value={data.formacao}
          onChange={(e) => update("formacao", e.target.value)}
          className="h-12 text-base"
        />
      </div>

      {/* Disponibilidade */}
      <div className="space-y-2">
        <Label htmlFor="disponibilidade" className="text-base">Disponibilidade</Label>
        <Select value={data.disponibilidade} onValueChange={(v) => update("disponibilidade", v)} required>
          <SelectTrigger className="h-12 text-base">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="integral">Integral (24h)</SelectItem>
            <SelectItem value="diurno">Diurno (manhã e tarde)</SelectItem>
            <SelectItem value="noturno">Noturno</SelectItem>
            <SelectItem value="meio-periodo">Meio período</SelectItem>
            <SelectItem value="fins-de-semana">Fins de semana</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sobre */}
      <div className="space-y-2">
        <Label htmlFor="sobre" className="text-base">Sobre você</Label>
        <Textarea
          id="sobre"
          placeholder="Conte um pouco sobre sua experiência, motivação e como você cuida dos seus pacientes..."
          value={data.sobre}
          onChange={(e) => update("sobre", e.target.value)}
          className="min-h-[100px] text-base"
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground">{data.sobre.length}/500 caracteres</p>
      </div>

      {/* Termos */}
      <div className="flex items-start gap-3">
        <Checkbox
          id="termos"
          checked={data.aceitaTermos}
          onCheckedChange={(checked) => update("aceitaTermos", !!checked)}
        />
        <Label htmlFor="termos" className="text-sm leading-relaxed text-muted-foreground">
          Declaro que as informações são verdadeiras e autorizo a verificação dos meus documentos (CPF/RG) para validação do perfil.
        </Label>
      </div>
    </div>
  );
};

export default CuidadorFields;
