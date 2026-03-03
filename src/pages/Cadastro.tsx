import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Cadastro = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Auth será implementado pelo usuário via Supabase
    console.log({ nome, email, senha, perfil });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <Heart className="h-8 w-8 text-primary" fill="hsl(var(--primary))" />
            <span className="font-heading text-2xl font-bold text-foreground">
              CuidarBem
            </span>
          </Link>
          <h1 className="mt-6 font-heading text-3xl font-bold text-foreground">
            Crie sua conta
          </h1>
          <p className="mt-2 text-muted-foreground">
            Comece a cuidar de quem você ama
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border bg-card p-8 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="nome" className="text-base">Nome completo</Label>
            <Input
              id="nome"
              type="text"
              placeholder="Seu nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-base">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha" className="text-base">Senha</Label>
            <div className="relative">
              <Input
                id="senha"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                minLength={6}
                className="h-12 pr-12 text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="perfil" className="text-base">Eu sou</Label>
            <Select value={perfil} onValueChange={setPerfil} required>
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="Selecione seu perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="idoso">Idoso(a)</SelectItem>
                <SelectItem value="cuidador">Cuidador(a)</SelectItem>
                <SelectItem value="familiar">Familiar / Responsável</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="h-12 w-full text-base font-semibold">
            Criar conta
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <Link to="/" className="font-medium text-primary hover:underline">
              Fazer login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Cadastro;
