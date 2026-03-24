import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search, Star, MapPin, Briefcase, Heart, ThumbsUp, ThumbsDown, MessageSquare, BadgeCheck, Phone, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

const BuscarCuidadores = () => {
  const { user } = useAuth();
  const [cuidadores, setCuidadores] = useState<Profile[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCuidador, setSelectedCuidador] = useState<Profile | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [reviews, setReviews] = useState<Record<string, { tipo: string; mensagem?: string }>>({});
  const [mensagem, setMensagem] = useState("");
  const [showMsgDialog, setShowMsgDialog] = useState(false);
  const [msgTarget, setMsgTarget] = useState<Profile | null>(null);

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
      .select("cuidador_id, tipo, mensagem")
      .eq("user_id", user.id);
    const map: Record<string, { tipo: string; mensagem?: string }> = {};
    (data || []).forEach((r) => {
      map[r.cuidador_id] = { tipo: r.tipo, mensagem: r.mensagem || undefined };
    });
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
    setReviews((prev) => ({ ...prev, [cuidadorId]: { ...prev[cuidadorId], tipo } }));
    toast.success(tipo === "like" ? "Você curtiu este cuidador!" : "Avaliação registrada");
  };

  const handleSendMessage = async () => {
    if (!user || !msgTarget) return;
    const existing = reviews[msgTarget.id];
    if (existing) {
      await supabase.from("caregiver_reviews").update({ mensagem }).eq("user_id", user.id).eq("cuidador_id", msgTarget.id);
    } else {
      await supabase.from("caregiver_reviews").insert({ user_id: user.id, cuidador_id: msgTarget.id, tipo: "like", mensagem });
    }
    setReviews((prev) => ({ ...prev, [msgTarget.id]: { ...prev[msgTarget.id], tipo: prev[msgTarget.id]?.tipo || "like", mensagem } }));
    setShowMsgDialog(false);
    setMensagem("");
    toast.success("Mensagem enviada!");
  };

  const filtrados = cuidadores.filter(
    (c) =>
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (c.especialidade || "").toLowerCase().includes(busca.toLowerCase()) ||
      (c.cidade || "").toLowerCase().includes(busca.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input placeholder="Buscar por nome, especialidade ou cidade..." value={busca} onChange={(e) => setBusca(e.target.value)} className="h-12 pl-10 text-base" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtrados.map((c) => (
          <Card key={c.id} className="overflow-hidden hover:shadow-md transition-shadow">
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
                    {c.verificado && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{c.especialidade || "Cuidador(a)"}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => toggleFavorite(c.id)} className="shrink-0">
                  <Heart className={`h-5 w-5 ${favorites.has(c.id) ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                </Button>
              </div>

              {c.bio && <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{c.bio}</p>}

              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                {c.cidade && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {c.cidade}, {c.estado}</span>}
                {c.experiencia && <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {c.experiencia}</span>}
              </div>

              {c.preco_diaria && (
                <p className="mt-3 font-heading font-bold text-foreground">{c.preco_diaria}</p>
              )}

              {/* Actions */}
              <div className="mt-4 flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleReview(c.id, "like")} className={reviews[c.id]?.tipo === "like" ? "border-primary text-primary" : ""}>
                  <ThumbsUp className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleReview(c.id, "dislike")} className={reviews[c.id]?.tipo === "dislike" ? "border-destructive text-destructive" : ""}>
                  <ThumbsDown className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setMsgTarget(c); setMensagem(reviews[c.id]?.mensagem || ""); setShowMsgDialog(true); }}>
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <Button size="sm" className="ml-auto" onClick={() => setSelectedCuidador(c)}>
                  Ver perfil
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtrados.length === 0 && (
        <p className="text-center text-muted-foreground py-12">
          {cuidadores.length === 0 ? "Nenhum cuidador cadastrado ainda." : `Nenhum resultado para "${busca}".`}
        </p>
      )}

      {/* Profile Dialog */}
      <Dialog open={!!selectedCuidador} onOpenChange={() => setSelectedCuidador(null)}>
        <DialogContent className="max-w-lg">
          {selectedCuidador && (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading flex items-center gap-2">
                  {selectedCuidador.nome}
                  {selectedCuidador.verificado && <BadgeCheck className="h-5 w-5 text-primary" />}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 border-2 border-primary/20">
                    <AvatarImage src={selectedCuidador.avatar_url || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                      {(selectedCuidador.nome || "C").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{selectedCuidador.especialidade || "Cuidador(a)"}</p>
                    {selectedCuidador.cidade && <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {selectedCuidador.cidade}, {selectedCuidador.estado}</p>}
                    {selectedCuidador.preco_diaria && <p className="font-heading font-bold text-foreground mt-1">{selectedCuidador.preco_diaria}</p>}
                  </div>
                </div>

                {selectedCuidador.bio && (
                  <div>
                    <h4 className="font-heading font-bold text-sm text-foreground mb-1">Sobre</h4>
                    <p className="text-sm text-muted-foreground">{selectedCuidador.bio}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  {selectedCuidador.experiencia && <div><span className="font-medium text-foreground">Experiência:</span> <span className="text-muted-foreground">{selectedCuidador.experiencia}</span></div>}
                  {selectedCuidador.formacao && <div><span className="font-medium text-foreground">Formação:</span> <span className="text-muted-foreground">{selectedCuidador.formacao}</span></div>}
                  {selectedCuidador.disponibilidade && <div><span className="font-medium text-foreground">Disponibilidade:</span> <span className="text-muted-foreground">{selectedCuidador.disponibilidade}</span></div>}
                  {selectedCuidador.telefone && <div><span className="font-medium text-foreground">Telefone:</span> <span className="text-muted-foreground">{selectedCuidador.telefone}</span></div>}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button className="flex-1 gap-2" onClick={() => toggleFavorite(selectedCuidador.id)}>
                    <Heart className={`h-4 w-4 ${favorites.has(selectedCuidador.id) ? "fill-accent" : ""}`} />
                    {favorites.has(selectedCuidador.id) ? "Favoritado" : "Favoritar"}
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2" onClick={() => { setMsgTarget(selectedCuidador); setMensagem(reviews[selectedCuidador.id]?.mensagem || ""); setShowMsgDialog(true); setSelectedCuidador(null); }}>
                    <MessageSquare className="h-4 w-4" /> Mensagem
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={showMsgDialog} onOpenChange={setShowMsgDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Mensagem para {msgTarget?.nome}</DialogTitle>
          </DialogHeader>
          <Textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)} placeholder="Escreva uma mensagem sobre este cuidador..." rows={4} />
          <Button onClick={handleSendMessage} disabled={!mensagem.trim()}>Enviar mensagem</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BuscarCuidadores;
