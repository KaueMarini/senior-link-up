import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Save, MapPin, Phone, Briefcase, BadgeCheck, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import type { Profile } from "@/hooks/useProfile";
import WhatsAppVerification from "@/components/WhatsAppVerification";

interface Props {
  profile: Profile | null;
  onUpdate: (data: Partial<Profile>) => Promise<any>;
  onUploadAvatar: (file: File) => Promise<{ url: string | null; error: string | null }>;
  onUploadBanner: (file: File) => Promise<{ url: string | null; error: string | null }>;
}

const CuidadorPerfil = ({ profile, onUpdate, onUploadAvatar, onUploadBanner }: Props) => {
  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [telefoneVerificado, setTelefoneVerificado] = useState(!!profile?.telefone);
  const [form, setForm] = useState({
    nome: profile?.nome || "",
    telefone: profile?.telefone || "",
    cidade: profile?.cidade || "",
    estado: profile?.estado || "",
    especialidade: profile?.especialidade || "",
    experiencia: profile?.experiencia || "",
    formacao: profile?.formacao || "",
    preco_diaria: profile?.preco_diaria || "",
    bio: profile?.bio || "",
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
    if (error) toast.error("Erro ao salvar perfil");
    else toast.success("Perfil atualizado com sucesso!");
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

  const handleBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast.loading("Enviando banner...");
    const { error } = await onUploadBanner(file);
    toast.dismiss();
    if (error) toast.error(error);
    else toast.success("Banner atualizado!");
  };

  const initials = (profile?.nome || "C").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Banner + Avatar hero */}
      <Card className="overflow-hidden">
        <div className="relative">
          {/* Banner */}
          <div className="relative h-48 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 overflow-hidden group">
            {profile?.banner_url ? (
              <img
                src={profile.banner_url}
                alt="Banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-muted-foreground/40 text-sm font-medium">Adicione um banner ao seu perfil</p>
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            <Button
              size="sm"
              variant="secondary"
              className="absolute top-3 right-3 gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity shadow-md"
              onClick={() => bannerRef.current?.click()}
            >
              <ImagePlus className="h-4 w-4" />
              {profile?.banner_url ? "Trocar banner" : "Adicionar banner"}
            </Button>
            <input
              ref={bannerRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBanner}
            />
          </div>

          {/* Avatar overlapping banner */}
          <div className="absolute -bottom-14 left-6">
            <div className="relative">
              <Avatar className="h-28 w-28 border-4 border-card shadow-lg">
                <AvatarImage src={profile?.avatar_url || ""} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full shadow-md"
                onClick={() => avatarRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
              </Button>
              <input
                ref={avatarRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatar}
              />
            </div>
          </div>
        </div>

        {/* Info below avatar */}
        <CardContent className="pt-16 pb-5 px-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-heading text-xl font-bold text-foreground">
                {profile?.nome || "Cuidador"}
              </h3>
              <p className="text-sm font-medium text-primary/80 mt-0.5">
                {profile?.especialidade || "Especialidade não definida"}
              </p>
              {profile?.verificado && (
                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <BadgeCheck className="h-3.5 w-3.5" /> Verificado
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              {profile?.cidade && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> {profile.cidade}{profile.estado ? `, ${profile.estado}` : ""}
                </span>
              )}
              {profile?.telefone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-4 w-4" /> {profile.telefone}
                </span>
              )}
              {profile?.experiencia && (
                <span className="inline-flex items-center gap-1">
                  <Briefcase className="h-4 w-4" /> {profile.experiencia}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Editar Perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-foreground">Nome completo</label>
              <Input value={form.nome} onChange={(e) => handleChange("nome", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <WhatsAppVerification
                telefone={form.telefone}
                onTelefoneChange={(v) => handleChange("telefone", v)}
                verified={telefoneVerificado}
                onVerified={setTelefoneVerificado}
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
            <div>
              <label className="text-sm font-medium text-foreground">Especialidade</label>
              <Input value={form.especialidade} onChange={(e) => handleChange("especialidade", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Experiência</label>
              <Input value={form.experiencia} onChange={(e) => handleChange("experiencia", e.target.value)} placeholder="Ex: 5 anos" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Formação</label>
              <Input value={form.formacao} onChange={(e) => handleChange("formacao", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Preço diária</label>
              <Input value={form.preco_diaria} onChange={(e) => handleChange("preco_diaria", e.target.value)} placeholder="Ex: R$ 150" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Sobre mim</label>
            <Textarea
              value={form.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              placeholder="Descreva sua experiência, habilidades e como você pode ajudar..."
              rows={4}
            />
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

export default CuidadorPerfil;
