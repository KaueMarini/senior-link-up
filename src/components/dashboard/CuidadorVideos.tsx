import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, BookOpen } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type VideoTip = Tables<"video_tips">;

const categoriaLabels: Record<string, string> = {
  alzheimer: "Alzheimer",
  mobilidade: "Mobilidade",
  nutricao: "Nutrição",
  emergencia: "Emergência",
  higiene: "Higiene",
  saude_mental: "Saúde Mental",
  geral: "Geral",
};

const CuidadorVideos = () => {
  const [videos, setVideos] = useState<VideoTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("todos");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("video_tips")
        .select("*")
        .order("ordem", { ascending: true });
      setVideos(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const categorias = ["todos", ...new Set(videos.map((v) => v.categoria))];
  const filtrados = filtro === "todos" ? videos : videos.filter((v) => v.categoria === filtro);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-primary" />
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">Dicas e Treinamentos</h2>
          <p className="text-sm text-muted-foreground">Vídeos educativos para aprimorar seus cuidados</p>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {categorias.map((cat) => (
          <Badge
            key={cat}
            variant={filtro === cat ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFiltro(cat)}
          >
            {cat === "todos" ? "Todos" : categoriaLabels[cat] || cat}
          </Badge>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtrados.map((video) => (
          <Card key={video.id} className="overflow-hidden group cursor-pointer hover:shadow-md transition-shadow">
            <div className="relative aspect-video bg-muted">
              {video.thumbnail_url ? (
                <img
                  src={video.thumbnail_url}
                  alt={video.titulo}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Play className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 group-hover:bg-foreground/20 transition-colors">
                <div className="rounded-full bg-primary p-3 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                  <Play className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <Badge variant="secondary" className="mb-2 text-xs">
                {categoriaLabels[video.categoria] || video.categoria}
              </Badge>
              <h3 className="font-heading font-bold text-foreground line-clamp-2">{video.titulo}</h3>
              {video.descricao && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{video.descricao}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filtrados.length === 0 && (
        <p className="text-center text-muted-foreground py-8">Nenhum vídeo encontrado nesta categoria.</p>
      )}
    </div>
  );
};

export default CuidadorVideos;
