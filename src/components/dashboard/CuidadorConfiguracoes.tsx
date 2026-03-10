import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { Profile } from "@/hooks/useProfile";

interface Props {
  profile: Profile | null;
  onUpdate: (data: Partial<Profile>) => Promise<any>;
}

const CuidadorConfiguracoes = ({ profile, onUpdate }: Props) => {
  const [disponibilidade, setDisponibilidade] = useState(profile?.disponibilidade || "integral");

  const handleSaveDisp = async () => {
    const { error } = await onUpdate({ disponibilidade });
    if (error) toast.error("Erro ao salvar");
    else toast.success("Disponibilidade atualizada!");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Disponibilidade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Turno preferido</label>
            <Select value={disponibilidade} onValueChange={setDisponibilidade}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="integral">Integral</SelectItem>
                <SelectItem value="manha">Manhã</SelectItem>
                <SelectItem value="tarde">Tarde</SelectItem>
                <SelectItem value="noite">Noturno</SelectItem>
                <SelectItem value="fins_semana">Fins de semana</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSaveDisp}>Salvar disponibilidade</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Notificações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">E-mail de novas oportunidades</p>
              <p className="text-xs text-muted-foreground">Receba avisos sobre famílias buscando cuidadores</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Mensagens de familiares</p>
              <p className="text-xs text-muted-foreground">Notificações quando um familiar enviar mensagem</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Novos vídeos de treinamento</p>
              <p className="text-xs text-muted-foreground">Avise quando novos conteúdos forem adicionados</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CuidadorConfiguracoes;
