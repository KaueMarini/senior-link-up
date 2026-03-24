import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import Header from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Heart, Calendar, FileText, Pill, User, MessageSquare } from "lucide-react";
import BuscarCuidadores from "@/components/dashboard/responsavel/BuscarCuidadores";
import MeusFavoritos from "@/components/dashboard/responsavel/MeusFavoritos";
import ChatTab from "@/components/chat/ChatTab";
import AgendaInteligente from "@/components/dashboard/responsavel/AgendaInteligente";
import ExamesMedicos from "@/components/dashboard/responsavel/ExamesMedicos";
import AgendaRemedios from "@/components/dashboard/responsavel/AgendaRemedios";
import MeuPerfil from "@/components/dashboard/responsavel/MeuPerfil";

const ResponsavelDashboard = () => {
  const { userName, user } = useAuth();
  const { profile, loading, updateProfile, uploadAvatar } = useProfile();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="mb-6">
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Painel do Responsável
          </h1>
          <p className="text-muted-foreground">
            Olá, {userName}! Gerencie os cuidados do seu familiar.
          </p>
        </div>

        <Tabs defaultValue="perfil" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-grid">
            <TabsTrigger value="perfil" className="gap-2">
              <User className="h-4 w-4" /> Perfil
            </TabsTrigger>
            <TabsTrigger value="cuidadores" className="gap-2">
              <Users className="h-4 w-4" /> Cuidadores
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="h-4 w-4" /> Chat
            </TabsTrigger>
            <TabsTrigger value="favoritos" className="gap-2">
              <Heart className="h-4 w-4" /> Favoritos
            </TabsTrigger>
            <TabsTrigger value="agenda" className="gap-2">
              <Calendar className="h-4 w-4" /> Agenda
            </TabsTrigger>
            <TabsTrigger value="remedios" className="gap-2">
              <Pill className="h-4 w-4" /> Remédios
            </TabsTrigger>
            <TabsTrigger value="exames" className="gap-2">
              <FileText className="h-4 w-4" /> Exames
            </TabsTrigger>
          </TabsList>

          <TabsContent value="perfil">
            <MeuPerfil
              profile={profile}
              onUpdate={updateProfile}
              onUploadAvatar={uploadAvatar}
              userEmail={user?.email || ""}
            />
          </TabsContent>
          <TabsContent value="cuidadores">
            <BuscarCuidadores />
          </TabsContent>
          <TabsContent value="chat">
            <ChatTab />
          </TabsContent>
          <TabsContent value="favoritos">
            <MeusFavoritos />
          </TabsContent>
          <TabsContent value="agenda">
            <AgendaInteligente />
          </TabsContent>
          <TabsContent value="remedios">
            <AgendaRemedios />
          </TabsContent>
          <TabsContent value="exames">
            <ExamesMedicos />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ResponsavelDashboard;
