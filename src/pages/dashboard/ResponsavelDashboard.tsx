import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Heart, Calendar, FileText, Pill } from "lucide-react";
import BuscarCuidadores from "@/components/dashboard/responsavel/BuscarCuidadores";
import MeusFavoritos from "@/components/dashboard/responsavel/MeusFavoritos";
import AgendaInteligente from "@/components/dashboard/responsavel/AgendaInteligente";
import ExamesMedicos from "@/components/dashboard/responsavel/ExamesMedicos";
import AgendaRemedios from "@/components/dashboard/responsavel/AgendaRemedios";

const ResponsavelDashboard = () => {
  const { userName } = useAuth();

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

        <Tabs defaultValue="cuidadores" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="cuidadores" className="gap-2">
              <Users className="h-4 w-4" /> Cuidadores
            </TabsTrigger>
            <TabsTrigger value="favoritos" className="gap-2">
              <Heart className="h-4 w-4" /> Favoritos
            </TabsTrigger>
            <TabsTrigger value="agenda" className="gap-2">
              <Calendar className="h-4 w-4" /> Agenda
            </TabsTrigger>
            <TabsTrigger value="exames" className="gap-2">
              <FileText className="h-4 w-4" /> Exames
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cuidadores">
            <BuscarCuidadores />
          </TabsContent>
          <TabsContent value="favoritos">
            <MeusFavoritos />
          </TabsContent>
          <TabsContent value="agenda">
            <AgendaInteligente />
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
