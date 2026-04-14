import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import CuidadorCard, { type CuidadorComment } from "./CuidadorCard";
import CuidadorProfileDialog from "./CuidadorProfileDialog";
import SmartFilter, {
  FILTER_DEFAULTS,
  ESPECIALIDADE_PATTERNS,
  SOFT_SKILL_PATTERNS,
  type FilterState,
} from "./SmartFilter";
import VincularIdosoDialog from "./VincularIdosoDialog";

type Profile    = Tables<"profiles">;
type Dependente = Tables<"dependentes">;

// ─────────────────────────────────────────────
// Pure filter + sort logic
// ─────────────────────────────────────────────

function calcMatchScore(
  c: Profile,
  dep: Dependente | null | undefined,
  likes: number
): number {
  let score = 0;
  const text = `${c.especialidade ?? ""} ${c.bio ?? ""}`.toLowerCase();

  if (dep?.diagnosticos) {
    dep.diagnosticos.forEach((diag) => {
      if (text.includes(diag.toLowerCase())) score += 25;
    });
  }

  if (c.verificado) score += 15;
  score += Math.min(likes * 3, 30);
  if (c.bio)      score += 5;
  if (c.formacao) score += 10;

  return Math.min(score, 100);
}

function applyFilters(
  list: Profile[],
  busca: string,
  filters: FilterState,
  likeCounts: Record<string, number>,
  dep: Dependente | null | undefined
): Profile[] {
  const q = busca.trim().toLowerCase();

  const filtered = list.filter((c) => {
    // Free-text search
    if (q) {
      const hay = `${c.nome} ${c.especialidade ?? ""} ${c.cidade ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }

    // Verified
    if (filters.apenasVerificados && !c.verificado) return false;

    // Disponibilidade (OR within group)
    if (filters.disponibilidade.length > 0) {
      if (!filters.disponibilidade.includes(c.disponibilidade ?? ""))
        return false;
    }

    // Especializações (OR — cuidador matches at least one selected)
    if (filters.especialidades.length > 0) {
      const hay = `${c.especialidade ?? ""} ${c.bio ?? ""}`;
      const matched = filters.especialidades.some((key) =>
        ESPECIALIDADE_PATTERNS[key]?.test(hay)
      );
      if (!matched) return false;
    }

    // Soft skills (AND — cuidador must match all selected)
    if (filters.softSkills.length > 0) {
      const bio = c.bio ?? "";
      const allMatch = filters.softSkills.every((key) =>
        SOFT_SKILL_PATTERNS[key]?.test(bio)
      );
      if (!allMatch) return false;
    }

    return true;
  });

  // Sorting
  filtered.sort((a, b) => {
    if (filters.orderBy === "nome") {
      return (a.nome ?? "").localeCompare(b.nome ?? "");
    }
    if (filters.orderBy === "match") {
      return (
        calcMatchScore(b, dep, likeCounts[b.id] ?? 0) -
        calcMatchScore(a, dep, likeCounts[a.id] ?? 0)
      );
    }
    // default: likes
    return (likeCounts[b.id] ?? 0) - (likeCounts[a.id] ?? 0);
  });

  return filtered;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

const BuscarCuidadores = () => {
  const { user } = useAuth();

  const [cuidadores, setCuidadores]   = useState<Profile[]>([]);
  const [busca, setBusca]             = useState("");
  const [filters, setFilters]         = useState<FilterState>(FILTER_DEFAULTS);
  const [loading, setLoading]         = useState(true);
  const [selectedCuidador, setSelectedCuidador] = useState<Profile | null>(null);
  const [vincularTarget, setVincularTarget]     = useState<Profile | null>(null);
  const [favorites, setFavorites]     = useState<Set<string>>(new Set());
  const [reviews, setReviews]         = useState<Record<string, { tipo: string }>>({});
  const [likeCounts, setLikeCounts]   = useState<Record<string, number>>({});
  const [comments, setComments]       = useState<Record<string, CuidadorComment[]>>({});
  const [dependentes, setDependentes] = useState<{ id: string; nome: string }[]>([]);

  // ── Dependente selected for match scoring ──
  const matchDependente = useMemo<Dependente | null>(() => {
    if (filters.orderBy !== "match" || !filters.dependenteIdMatch) return null;
    // We only hold {id, nome} here; full object needed for score — will be
    // fetched lazily only when actually needed (see below)
    return null;
  }, [filters.orderBy, filters.dependenteIdMatch]);

  // ── Derived list ──
  const filtrados = useMemo(
    () => applyFilters(cuidadores, busca, filters, likeCounts, matchDependente),
    [cuidadores, busca, filters, likeCounts, matchDependente]
  );

  useEffect(() => {
    fetchCuidadores();
    if (user) {
      fetchFavorites();
      fetchReviews();
      fetchDependentes();
    }
  }, [user]);

  // ── Data fetchers ──────────────────────────

  const fetchCuidadores = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("perfil", "cuidador");
    setCuidadores(data ?? []);
    setLoading(false);
    if (data && data.length > 0) {
      const ids = data.map((c) => c.id);
      fetchLikeCounts(ids);
      fetchComments(ids);
    }
  };

  const fetchLikeCounts = async (ids: string[]) => {
    const { data } = await supabase
      .from("caregiver_reviews")
      .select("cuidador_id, tipo")
      .in("cuidador_id", ids)
      .eq("tipo", "like");
    const counts: Record<string, number> = {};
    (data ?? []).forEach((r) => {
      counts[r.cuidador_id] = (counts[r.cuidador_id] ?? 0) + 1;
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

    if (!data || data.length === 0) return;

    const userIds = [...new Set(data.map((d) => d.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, nome")
      .in("user_id", userIds);
    const nameMap: Record<string, string> = {};
    (profiles ?? []).forEach((p) => { nameMap[p.user_id] = p.nome; });

    const map: Record<string, CuidadorComment[]> = {};
    data.forEach((r) => {
      if (!r.mensagem) return;
      if (!map[r.cuidador_id]) map[r.cuidador_id] = [];
      map[r.cuidador_id].push({
        id:         r.id,
        user_id:    r.user_id,
        nome:       nameMap[r.user_id] ?? "Anônimo",
        mensagem:   r.mensagem,
        created_at: r.created_at,
      });
    });
    setComments(map);
  };

  const fetchFavorites = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("favorites")
      .select("cuidador_id")
      .eq("user_id", user.id);
    setFavorites(new Set((data ?? []).map((f) => f.cuidador_id)));
  };

  const fetchReviews = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("caregiver_reviews")
      .select("cuidador_id, tipo")
      .eq("user_id", user.id);
    const map: Record<string, { tipo: string }> = {};
    (data ?? []).forEach((r) => { map[r.cuidador_id] = { tipo: r.tipo }; });
    setReviews(map);
  };

  const fetchDependentes = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from("dependentes")
      .select("id, nome")
      .eq("responsavel_id", user.id)
      .order("nome");
    setDependentes(data ?? []);
  };

  // ── Actions ───────────────────────────────

  const toggleFavorite = async (cuidadorId: string) => {
    if (!user) return;
    if (favorites.has(cuidadorId)) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("cuidador_id", cuidadorId);
      setFavorites((prev) => {
        const n = new Set(prev);
        n.delete(cuidadorId);
        return n;
      });
      toast.success("Removido dos favoritos");
    } else {
      await supabase
        .from("favorites")
        .insert({ user_id: user.id, cuidador_id: cuidadorId });
      setFavorites((prev) => new Set(prev).add(cuidadorId));
      toast.success("Adicionado aos favoritos!");
    }
  };

  const handleReview = async (cuidadorId: string, tipo: "like" | "dislike") => {
    if (!user) return;
    const existing = reviews[cuidadorId];
    if (existing) {
      await supabase
        .from("caregiver_reviews")
        .update({ tipo })
        .eq("user_id", user.id)
        .eq("cuidador_id", cuidadorId);
    } else {
      await supabase
        .from("caregiver_reviews")
        .insert({ user_id: user.id, cuidador_id: cuidadorId, tipo });
    }
    setReviews((prev) => ({ ...prev, [cuidadorId]: { tipo } }));
    setLikeCounts((prev) => {
      const old = existing?.tipo;
      let count = prev[cuidadorId] ?? 0;
      if (tipo === "like" && old !== "like") count++;
      if (tipo === "dislike" && old === "like") count = Math.max(0, count - 1);
      return { ...prev, [cuidadorId]: count };
    });
    toast.success(tipo === "like" ? "Você curtiu este cuidador!" : "Avaliação registrada");
  };

  const handleAddComment = async (cuidadorId: string, mensagem: string) => {
    if (!user || !mensagem.trim()) return;
    const existing = reviews[cuidadorId];
    if (existing) {
      await supabase
        .from("caregiver_reviews")
        .update({ mensagem })
        .eq("user_id", user.id)
        .eq("cuidador_id", cuidadorId);
    } else {
      await supabase
        .from("caregiver_reviews")
        .insert({ user_id: user.id, cuidador_id: cuidadorId, mensagem, tipo: "like" });
      setReviews((prev) => ({ ...prev, [cuidadorId]: { tipo: "like" } }));
      setLikeCounts((prev) => ({
        ...prev,
        [cuidadorId]: (prev[cuidadorId] ?? 0) + 1,
      }));
    }
    const { data: prof } = await supabase
      .from("profiles")
      .select("nome")
      .eq("user_id", user.id)
      .maybeSingle();
    const newComment: CuidadorComment = {
      id:         crypto.randomUUID(),
      user_id:    user.id,
      nome:       prof?.nome ?? "Você",
      mensagem,
      created_at: new Date().toISOString(),
    };
    setComments((prev) => ({
      ...prev,
      [cuidadorId]: [newComment, ...(prev[cuidadorId] ?? [])],
    }));
    toast.success("Comentário adicionado!");
  };

  const startChat = async (cuidadorUserId: string) => {
    if (!user) return;
    const { data: existing } = await supabase
      .from("chat_conversations")
      .select("id")
      .eq("responsavel_id", user.id)
      .eq("cuidador_id", cuidadorUserId)
      .maybeSingle();

    if (existing) {
      toast.info("Você já tem uma conversa com este cuidador. Veja na aba Chat!");
      return;
    }
    const { error } = await supabase.from("chat_conversations").insert({
      responsavel_id: user.id,
      cuidador_id:    cuidadorUserId,
    });
    if (error) toast.error("Erro ao iniciar chat");
    else toast.success("Chat iniciado! Vá para a aba Chat para conversar.");
  };

  // ── Render ────────────────────────────────

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Search bar */}
      <div className="relative max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, especialidade ou cidade…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="h-12 pl-12 text-base rounded-xl border-border/60 focus:border-primary/40 shadow-sm"
        />
      </div>

      {/* Smart filter */}
      <SmartFilter
        value={filters}
        onChange={setFilters}
        dependentes={dependentes}
      />

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {filtrados.length} cuidador{filtrados.length !== 1 ? "es" : ""}{" "}
        encontrado{filtrados.length !== 1 ? "s" : ""}
        {cuidadores.length !== filtrados.length && (
          <span className="ml-1 text-primary/70">
            (de {cuidadores.length} no total)
          </span>
        )}
      </p>

      {/* Grid */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {filtrados.map((c) => (
          <CuidadorCard
            key={c.id}
            cuidador={c}
            isFavorite={favorites.has(c.id)}
            reviewTipo={reviews[c.id]?.tipo}
            likeCount={likeCounts[c.id] ?? 0}
            comments={comments[c.id] ?? []}
            onToggleFavorite={() => toggleFavorite(c.id)}
            onLike={() => handleReview(c.id, "like")}
            onDislike={() => handleReview(c.id, "dislike")}
            onStartChat={() => startChat(c.user_id)}
            onViewProfile={() => setSelectedCuidador(c)}
            onVincular={() => setVincularTarget(c)}
          />
        ))}
      </div>

      {/* Empty state */}
      {filtrados.length === 0 && (
        <div className="text-center py-16">
          <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">
            {cuidadores.length === 0
              ? "Nenhum cuidador cadastrado ainda."
              : "Nenhum resultado para os filtros selecionados."}
          </p>
        </div>
      )}

      {/* Profile dialog */}
      <CuidadorProfileDialog
        cuidador={selectedCuidador}
        open={!!selectedCuidador}
        onClose={() => setSelectedCuidador(null)}
        isFavorite={selectedCuidador ? favorites.has(selectedCuidador.id) : false}
        onToggleFavorite={() =>
          selectedCuidador && toggleFavorite(selectedCuidador.id)
        }
        onStartChat={() =>
          selectedCuidador && startChat(selectedCuidador.user_id)
        }
        onVincular={() => {
          setVincularTarget(selectedCuidador);
          setSelectedCuidador(null);
        }}
        likeCount={selectedCuidador ? (likeCounts[selectedCuidador.id] ?? 0) : 0}
        comments={selectedCuidador ? (comments[selectedCuidador.id] ?? []) : []}
        onAddComment={(msg) =>
          selectedCuidador && handleAddComment(selectedCuidador.id, msg)
        }
      />

      {/* Vincular dialog */}
      <VincularIdosoDialog
        cuidador={vincularTarget}
        open={!!vincularTarget}
        onClose={() => setVincularTarget(null)}
      />
    </div>
  );
};

export default BuscarCuidadores;
