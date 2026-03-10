import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Star, MapPin, Clock, Phone, ArrowLeft, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";

interface Cuidador {
  id: number;
  nome: string;
  foto: string;
  especialidade: string;
  avaliacao: number;
  cidade: string;
  experiencia: string;
  preco: string;
  disponivel: boolean;
  verificado: boolean;
  descricao: string;
}

const cuidadoresMock: Cuidador[] = [
  {
    id: 1,
    nome: "Maria Silva",
    foto: "https://i.pravatar.cc/150?img=1",
    especialidade: "Cuidados gerais e acompanhamento",
    avaliacao: 4.9,
    cidade: "São Paulo, SP",
    experiencia: "8 anos",
    preco: "R$ 150/dia",
    disponivel: true,
    verificado: true,
    descricao: "Especializada em cuidados com idosos acamados e pós-operatório. Formação em enfermagem.",
  },
  {
    id: 2,
    nome: "João Santos",
    foto: "https://i.pravatar.cc/150?img=3",
    especialidade: "Fisioterapia e reabilitação",
    avaliacao: 4.7,
    cidade: "Rio de Janeiro, RJ",
    experiencia: "5 anos",
    preco: "R$ 180/dia",
    disponivel: true,
    verificado: true,
    descricao: "Fisioterapeuta formado com foco em mobilidade e reabilitação de idosos.",
  },
  {
    id: 3,
    nome: "Ana Oliveira",
    foto: "https://i.pravatar.cc/150?img=5",
    especialidade: "Cuidados com Alzheimer",
    avaliacao: 5.0,
    cidade: "Belo Horizonte, MG",
    experiencia: "12 anos",
    preco: "R$ 200/dia",
    disponivel: false,
    verificado: true,
    descricao: "Experiência extensa em cuidados com pacientes com Alzheimer e demência.",
  },
  {
    id: 4,
    nome: "Carlos Ferreira",
    foto: "https://i.pravatar.cc/150?img=8",
    especialidade: "Acompanhamento noturno",
    avaliacao: 4.6,
    cidade: "Curitiba, PR",
    experiencia: "3 anos",
    preco: "R$ 130/dia",
    disponivel: true,
    verificado: false,
    descricao: "Disponível para plantões noturnos. Experiência em cuidados domiciliares.",
  },
  {
    id: 5,
    nome: "Fernanda Costa",
    foto: "https://i.pravatar.cc/150?img=9",
    especialidade: "Nutrição e cuidados alimentares",
    avaliacao: 4.8,
    cidade: "Salvador, BA",
    experiencia: "6 anos",
    preco: "R$ 160/dia",
    disponivel: true,
    verificado: true,
    descricao: "Nutricionista especializada em dietas para idosos com restrições alimentares.",
  },
  {
    id: 6,
    nome: "Roberto Lima",
    foto: "https://i.pravatar.cc/150?img=12",
    especialidade: "Cuidados paliativos",
    avaliacao: 4.9,
    cidade: "Porto Alegre, RS",
    experiencia: "10 anos",
    preco: "R$ 220/dia",
    disponivel: true,
    verificado: true,
    descricao: "Enfermeiro com especialização em cuidados paliativos e suporte emocional.",
  },
];

const Cuidadores = () => {
  const [busca, setBusca] = useState("");

  const filtrados = cuidadoresMock.filter(
    (c) =>
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.especialidade.toLowerCase().includes(busca.toLowerCase()) ||
      c.cidade.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-10">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Encontre um Cuidador
          </h1>
          <p className="mt-2 text-muted-foreground">
            Profissionais verificados e qualificados para cuidar de quem você ama.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, especialidade ou cidade..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="h-12 pl-10 text-base"
          />
        </div>

        {/* Results */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((c) => (
            <Card key={c.id} className="overflow-hidden transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <img
                    src={c.foto}
                    alt={c.nome}
                    className="h-16 w-16 rounded-full object-cover border-2 border-primary/20"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-bold text-foreground truncate">{c.nome}</h3>
                      {c.verificado && (
                        <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{c.especialidade}</p>
                  </div>
                </div>

                <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{c.descricao}</p>

                <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-accent fill-accent" /> {c.avaliacao}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {c.cidade}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {c.experiencia}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="font-heading font-bold text-foreground">{c.preco}</span>
                  {c.disponivel ? (
                    <Badge className="bg-primary/10 text-primary border-primary/20">Disponível</Badge>
                  ) : (
                    <Badge variant="secondary">Indisponível</Badge>
                  )}
                </div>

                <Button
                  className="mt-4 w-full"
                  disabled={!c.disponivel}
                >
                  <Phone className="h-4 w-4" /> Entrar em contato
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filtrados.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            Nenhum cuidador encontrado para "{busca}".
          </p>
        )}
      </main>
    </div>
  );
};

export default Cuidadores;
