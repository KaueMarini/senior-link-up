import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import CuidadorCard, { type CuidadorComment } from "./CuidadorCard";
import CuidadorProfileDialog from "./CuidadorProfileDialog";

type Profile = Tables<"profiles">;

const BuscarCuidadores = () => {
  const { user } = useAuth();
  const [cuidadores, setCuidadores] = useState<Profile[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCuidador, setSelectedCuidador] = useState<Profile | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [reviews, setReviews] = useState<Record<string, { tipo: string }>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, CuidadorComment[]>>({});

  useEffect(() => {
    fetchCuidadores();
    if (user) {
      fetchFavorites();
      fetchReviews();
    }
  }, [user]);

  const fetchCuidadores = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("perfil", "cuidador");
    setCuidadores(data || []);
    setLoading(false);

    // Fetch like counts and comments for all cuidadores
    if (data && data.length > 0) {
      fetchLikeCounts(data.map((c) => c.id));
      fetchComments(data.map((c) => c.id));
    }
  };

  const fetchLikeCounts = async (ids: string[]) => {
    const { data } = await supabase
      .from("caregiver_reviews")
      .select("cuidador_id, tipo")
      .in("cuidador_id", ids)
      .eq("tipo", "like");
    const counts: Record<string, number> = {};
    (data || []).forEach((r) => {
      counts[r.cuidador_id] = (counts[r.cuidador_id] || 0) + 1;
    });
    setLikeCounts(counts);
  };

  const fetchComments = async (ids: string[]) => {
    const { data } = await supabase
      .from("caregiver_reviews")
      .select("id, cuidador_id, user_id, mensagem, created_at")
      .in("cuidador_id", ids)
      .not("mensagem", "is", null)
      .order("created_at", { ascending: false });

    // We need user names for comments - fetch from profiles
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((d) => d.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, nome")
        .in("user_id", userIds);
      const nameMap: Record<string, string> = {};
      (profiles || []).forEach((p) => { nameMap[p.user_id] = p.nome; });

      const commentsMap: Record<string, CuidadorComment[]> = {};
      data.forEach((r) => {
        if (!r.mensagem) return;
        if (!commentsMap[r.cuidador_id]) commentsMap[r.cuidador_id] = [];
        commentsMap[r.cuidador_id].push({
          id: r.id,
          user_id: r.user_id,
          nome: nameMap[r.user_id] || "Anônimo",
          mensagem: r.mensagem,
          created_at: r.created_at,
        });
      });
      setComments(commentsMap);
    }
  };

  const fetchFavorites = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("favorites")
      .select("cuidador_id")
      .eq("user_id", user.id);
    setFavorites(new Set((data || []).map((f) => f.cuidador_id)));
  };

  const fetchReviews = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("caregiver_reviews")
      .select("cuidador_id, tipo")
      .eq("user_id", user.id);
    const map: Record<string, { tipo: string }> = {};
    (data || []).forEach((r) => { map[r.cuidador_id] = { tipo: r.tipo }; });
    setReviews(map);
  };

  const toggleFavorite = async (cuidadorId: string) => {
    if (!user) return;
    if (favorites.has(cuidadorId)) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("cuidador_id", cuidadorId);
      setFavorites((prev) => { const n = new Set(prev); n.delete(cuidadorId); return n; });
      toast.success("Removido dos favoritos");
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, cuidador_id: cuidadorId });
      setFavorites((prev) => new Set(prev).add(cuidadorId));
      toast.success("Adicionado aos favoritos!");
    }
  };

  const handleReview = async (cuidadorId: string, tipo: "like" | "dislike") => {
    if (!user) return;
    const existing = reviews[cuidadorId];
    if (existing) {
      await supabase.from("caregiver_reviews").update({ tipo }).eq("user_id", user.id).eq("cuidador_id", cuidadorId);
    } else {
      await supabase.from("caregiver_reviews").insert({ user_id: user.id, cuidador_id: cuidadorId, tipo });
    }
    setReviews((prev) => ({ ...prev, [cuidadorId]: { tipo } }));

    // Update like count locally
    setLikeCounts((prev) => {
      const oldTipo = existing?.tipo;
      const count = prev[cuidadorId] || 0;
      let newCount = count;
      if (tipo === "like" && oldTipo !== "like") newCount++;
      if (tipo === "dislike" && oldTipo === "like") newCount = Math.max(0, newCount - 1);
      return { ...prev, [cuidadorId]: newCount };
    });

    toast.success(tipo === "like" ? "Você curtiu este cuidador!" : "Avaliação registrada");
  };

  const handleAddComment = async (cuidadorId: string, mensagem: string) => {
    if (!user || !mensagem.trim()) return;
    const existing = reviews[cuidadorId];
    if (existing) {
      await supabase.from("caregiver_reviews").update({ mensagem }).eq("user_id", user.id).eq("cuidador_id", cuidadorId);
    } else {
      await supabase.from("caregiver_reviews").insert({ user_id: user.id, cuidador_id: cuidadorId, mensagem, tipo: "like" });
      setReviews((prev) => ({ ...prev, [cuidadorId]: { tipo: "like" } }));
      setLikeCounts((prev) => ({ ...prev, [cuidadorId]: (prev[cuidadorId] || 0) + 1 }));
    }

    // Fetch user profile name
    const { data: prof } = await supabase.from("profiles").select("nome").eq("user_id", user.id).maybeSingle();
    const newComment: CuidadorComment = {
      id: crypto.randomUUID(),
      user_id: user.id,
      nome: prof?.nome || "Você",
      mensagem,
      created_at: new Date().toISOString(),
    };
    setComments((prev) => ({
      ...prev,
      [cuidadorId]: [newComment, ...(prev[cuidadorId] || [])],
    }));
    toast.success("Comentário adicionado!");
  };

  const startChat = async (cuidadorId: string) => {
    if (!user) return;
    const { data: existing } = await supabase
      .from("chat_conversations")
      .select("id")
      .eq("responsavel_id", user.id)
      .eq("cuidador_id", cuidadorId)
      .maybeSingle();

    if (existing) {
      toast.info("Você já tem uma conversa com este cuidador. Veja na aba Chat!");
      return;
    }

    const { error } = await supabase.from("chat_conversations").insert({
      responsavel_id: user.id,
      cuidador_id: cuidadorId,
    });

    if (error) toast.error("Erro ao iniciar chat");
    else toast.success("Chat iniciado! Vá para a aba Chat para conversar.");
  };

  const filtrados = cuidadores.filter(
    (c) =>
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (c.especialidade || "").toLowerCase().includes(busca.toLowerCase()) ||
      (c.cidade || "").toLowerCase().includes(busca.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="relative max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, especialidade ou cidade..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="h-12 pl-12 text-base rounded-xl border-border/60 focus:border-primary/40 shadow-sm"
        />
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {filtrados.length} cuidador{filtrados.length !== 1 ? "es" : ""} encontrado{filtrados.length !== 1 ? "s" : ""}
      </p>

      {/* Grid */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {filtrados.map((c) => (
          <CuidadorCard
            key={c.id}
            cuidador={c}
            isFavorite={favorites.has(c.id)}
            reviewTipo={reviews[c.id]?.tipo}
            likeCount={likeCounts[c.id] || 0}
            comments={comments[c.id] || []}
            onToggleFavorite={() => toggleFavorite(c.id)}
            onLike={() => handleReview(c.id, "like")}
            onDislike={() => handleReview(c.id, "dislike")}
            onStartChat={() => startChat(c.user_id)}
            onViewProfile={() => setSelectedCuidador(c)}
          />
        ))}
      </div>

      {filtrados.length === 0 && (
        <div className="text-center py-16">
          <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">
            {cuidadores.length === 0
              ? "Nenhum cuidador cadastrado ainda."
              : `Nenhum resultado para "${busca}".`}
          </p>
        </div>
      )}

      {/* Profile Dialog */}
      <CuidadorProfileDialog
        cuidador={selectedCuidador}
        open={!!selectedCuidador}
        onClose={() => setSelectedCuidador(null)}
        isFavorite={selectedCuidador ? favorites.has(selectedCuidador.id) : false}
        onToggleFavorite={() => selectedCuidador && toggleFavorite(selectedCuidador.id)}
        onStartChat={() => selectedCuidador && startChat(selectedCuidador.user_id)}
        likeCount={selectedCuidador ? (likeCounts[selectedCuidador.id] || 0) : 0}
        comments={selectedCuidador ? (comments[selectedCuidador.id] || []) : []}
        onAddComment={(msg) => selectedCuidador && handleAddComment(selectedCuidador.id, msg)}
      />
    </div>
  );
};

export default BuscarCuidadores;
