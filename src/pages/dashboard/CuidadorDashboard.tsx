import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import Header from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Video, BookOpen, Award, Settings, MessageSquare } from "lucide-react";
import CuidadorPerfil from "@/components/dashboard/CuidadorPerfil";
import ChatTab from "@/components/chat/ChatTab";
import CuidadorVideos from "@/components/dashboard/CuidadorVideos";
import CuidadorCertificados from "@/components/dashboard/CuidadorCertificados";
import CuidadorConfiguracoes from "@/components/dashboard/CuidadorConfiguracoes";

const CuidadorDashboard = () => {
  const { userName } = useAuth();
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
            Painel do Cuidador
          </h1>
          <p className="text-muted-foreground">
            Bem-vindo(a), {userName}! Gerencie seu perfil e acompanhe suas atividades.
          </p>
        </div>

        <Tabs defaultValue="perfil" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="perfil" className="gap-2">
              <User className="h-4 w-4" /> Perfil
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="h-4 w-4" /> Chat
            </TabsTrigger>
            <TabsTrigger value="videos" className="gap-2">
              <Video className="h-4 w-4" /> Dicas
            </TabsTrigger>
            <TabsTrigger value="certificados" className="gap-2">
              <Award className="h-4 w-4" /> Certificados
            </TabsTrigger>
            <TabsTrigger value="configuracoes" className="gap-2">
              <Settings className="h-4 w-4" /> Config
            </TabsTrigger>
          </TabsList>

          <TabsContent value="perfil">
            <CuidadorPerfil
              profile={profile}
              onUpdate={updateProfile}
              onUploadAvatar={uploadAvatar}
            />
          </TabsContent>

          <TabsContent value="videos">
            <CuidadorVideos />
          </TabsContent>

          <TabsContent value="certificados">
            <CuidadorCertificados />
          </TabsContent>

          <TabsContent value="configuracoes">
            <CuidadorConfiguracoes profile={profile} onUpdate={updateProfile} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CuidadorDashboard;
