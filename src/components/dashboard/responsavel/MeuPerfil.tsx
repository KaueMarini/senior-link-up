import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Save, User, Phone, MapPin, Mail } from "lucide-react";
import { toast } from "sonner";
import { useRef } from "react";
import type { Profile } from "@/hooks/useProfile";
import WhatsAppVerification from "@/components/WhatsAppVerification";

interface Props {
  profile: Profile | null;
  onUpdate: (data: Partial<Profile>) => Promise<any>;
  onUploadAvatar: (file: File) => Promise<{ url: string | null; error: string | null }>;
  userEmail: string;
}

const MeuPerfil = ({ profile, onUpdate, onUploadAvatar, userEmail }: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [telefoneVerificado, setTelefoneVerificado] = useState(!!profile?.telefone);
  const [form, setForm] = useState({
    nome: profile?.nome || "",
    telefone: profile?.telefone || "",
    cidade: profile?.cidade || "",
    estado: profile?.estado || "",
  });

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (form.telefone && !telefoneVerificado) {
      toast.error("Verifique seu WhatsApp antes de salvar");
      return;
    }
    setSaving(true);
    const { error } = await onUpdate(form);
    setSaving(false);
    if (error) toast.error("Erro ao salvar dados");
    else toast.success("Dados atualizados com sucesso!");
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast.loading("Enviando foto...");
    const { error } = await onUploadAvatar(file);
    toast.dismiss();
    if (error) toast.error(error);
    else toast.success("Foto atualizada!");
  };

  const initials = (profile?.nome || "U").slice(0, 2).toUpperCase();

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardContent className="flex flex-col items-center gap-4 pt-6">
          <div className="relative">
            <Avatar className="h-28 w-28 border-4 border-primary/20">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              variant="secondary"
              className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full shadow"
              onClick={() => fileRef.current?.click()}
            >
              <Camera className="h-4 w-4" />
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatar}
            />
          </div>
          <div className="text-center">
            <h3 className="font-heading text-lg font-bold text-foreground">
              {profile?.nome || "Responsável"}
            </h3>
            <p className="text-sm text-muted-foreground">Responsável / Familiar</p>
          </div>

          <div className="w-full space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> {userEmail}
            </div>
            {profile?.telefone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> {profile.telefone}
              </div>
            )}
            {profile?.cidade && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> {profile.cidade}, {profile.estado}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="font-heading">Meus Dados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-foreground">Nome completo</label>
              <Input value={form.nome} onChange={(e) => handleChange("nome", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                Telefone / WhatsApp
                {!profile?.telefone && (
                  <span className="ml-1 text-xs text-destructive">(obrigatório para notificações)</span>
                )}
              </label>
              <Input
                value={form.telefone}
                onChange={(e) => handleChange("telefone", e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Cidade</label>
              <Input value={form.cidade} onChange={(e) => handleChange("cidade", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Estado</label>
              <Input value={form.estado} onChange={(e) => handleChange("estado", e.target.value)} />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default MeuPerfil;
