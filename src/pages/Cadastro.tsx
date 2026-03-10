import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plane, Eye, EyeOff, Check, X, Loader2 } from "lucide-react";
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
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import CuidadorFields, { type CuidadorData } from "@/components/CuidadorFields";

const passwordRules = [
  { label: "Pelo menos 8 caracteres", test: (s: string) => s.length >= 8 },
  { label: "Uma letra maiúscula", test: (s: string) => /[A-Z]/.test(s) },
  { label: "Um caractere especial (!@#$...)", test: (s: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(s) },
];

const emptyCuidadorData: CuidadorData = {
  cpf: "", telefone: "", cidade: "", estado: "", especialidade: "",
  anosExperiencia: "", formacao: "", sobre: "", disponibilidade: "", aceitaTermos: false,
};

const Cadastro = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [perfil, setPerfil] = useState("");
  const [cuidadorData, setCuidadorData] = useState<CuidadorData>(emptyCuidadorData);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const allRulesPass = passwordRules.every((r) => r.test(senha));
  const passwordsMatch = senha === confirmarSenha && confirmarSenha.length > 0;

  const isCuidador = perfil === "cuidador";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!allRulesPass) {
      toast({ title: "Senha fraca", description: "Sua senha não atende todos os requisitos.", variant: "destructive" });
      return;
    }
    if (!passwordsMatch) {
      toast({ title: "Senhas diferentes", description: "As senhas não coincidem.", variant: "destructive" });
      return;
    }
    if (isCuidador) {
      if (!cuidadorData.cpf || !cuidadorData.telefone || !cuidadorData.cidade || !cuidadorData.estado || !cuidadorData.especialidade || !cuidadorData.anosExperiencia || !cuidadorData.disponibilidade) {
        toast({ title: "Dados incompletos", description: "Preencha todos os campos obrigatórios do perfil profissional.", variant: "destructive" });
        return;
      }
      if (!cuidadorData.aceitaTermos) {
        toast({ title: "Termos obrigatórios", description: "Você precisa aceitar a declaração de veracidade dos dados.", variant: "destructive" });
        return;
      }
    }

    setLoading(true);
    const metadata: Record<string, unknown> = { nome, perfil };
    if (isCuidador) {
      metadata.cuidador = cuidadorData;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: metadata,
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);

    if (error) {
      toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Conta criada! 🎉", description: "Enviamos um e-mail de confirmação para você. Verifique sua caixa de entrada e também a pasta de spam." });
    navigate("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <Plane className="h-8 w-8 text-primary" />
            <span className="font-heading text-2xl font-bold text-foreground">
              Fly Care
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
                placeholder="Crie uma senha forte"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
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

            {/* Password strength indicators */}
            {senha.length > 0 && (
              <ul className="mt-2 space-y-1">
                {passwordRules.map((rule) => {
                  const passes = rule.test(senha);
                  return (
                    <li key={rule.label} className={`flex items-center gap-2 text-sm transition-colors ${passes ? "text-green-600" : "text-muted-foreground"}`}>
                      {passes ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      {rule.label}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmar-senha" className="text-base">Confirmar senha</Label>
            <div className="relative">
              <Input
                id="confirmar-senha"
                type={showConfirm ? "text" : "password"}
                placeholder="Repita a senha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                required
                className="h-12 pr-12 text-base"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
              >
                {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {confirmarSenha.length > 0 && (
              <p className={`flex items-center gap-2 text-sm ${passwordsMatch ? "text-green-600" : "text-destructive"}`}>
                {passwordsMatch ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                {passwordsMatch ? "Senhas coincidem" : "Senhas não coincidem"}
              </p>
            )}
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

          {/* Campos extras para cuidador */}
          {isCuidador && (
            <CuidadorFields data={cuidadorData} onChange={setCuidadorData} />
          )}

          <Button type="submit" className="h-12 w-full text-base font-semibold" disabled={loading}>
            {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Criando conta...</> : "Criar conta"}
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
