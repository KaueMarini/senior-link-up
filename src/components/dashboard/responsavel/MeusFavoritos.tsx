import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MapPin, Briefcase, BadgeCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

const MeusFavoritos = () => {
  const { user } = useAuth();
  const [favoritos, setFavoritos] = useState<(Tables<"favorites"> & { profiles: Profile })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavoritos = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("favorites")
      .select("*, profiles(*)")
      .eq("user_id", user.id);
    setFavoritos((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchFavoritos();
  }, [user]);

  const removeFavorite = async (cuidadorId: string) => {
    if (!user) return;
    await supabase.from("favorites").delete().eq("user_id", user.id).eq("cuidador_id", cuidadorId);
    setFavoritos((prev) => prev.filter((f) => f.cuidador_id !== cuidadorId));
    toast.success("Removido dos favoritos");
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  if (favoritos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <Heart className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Você ainda não favoritou nenhum cuidador.</p>
        <p className="text-sm text-muted-foreground">Vá até a aba "Cuidadores" para encontrar profissionais.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {favoritos.map((fav) => {
        const c = fav.profiles;
        if (!c) return null;
        return (
          <Card key={fav.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <Avatar className="h-14 w-14 border-2 border-primary/20">
                  <AvatarImage src={c.avatar_url || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {(c.nome || "C").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-bold text-foreground truncate">{c.nome}</h3>
                    {c.verificado && <BadgeCheck className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{c.especialidade || "Cuidador(a)"}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                {c.cidade && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {c.cidade}</span>}
                {c.experiencia && <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {c.experiencia}</span>}
              </div>
              {c.preco_diaria && <p className="mt-2 font-heading font-bold text-foreground">{c.preco_diaria}</p>}
              <Button variant="outline" size="sm" className="mt-3 w-full gap-2 text-destructive hover:text-destructive" onClick={() => removeFavorite(c.id)}>
                <Trash2 className="h-4 w-4" /> Remover dos favoritos
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MeusFavoritos;
