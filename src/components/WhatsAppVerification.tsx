import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Phone, CheckCircle, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface WhatsAppVerificationProps {
  telefone: string;
  onTelefoneChange: (value: string) => void;
  verified: boolean;
  onVerified: (verified: boolean) => void;
  label?: string;
  required?: boolean;
}

const WhatsAppVerification = ({
  telefone,
  onTelefoneChange,
  verified,
  onVerified,
  label = "Telefone / WhatsApp",
  required = false,
}: WhatsAppVerificationProps) => {
  const [step, setStep] = useState<"input" | "code">("input");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleTelefoneChange = (value: string) => {
    // Reset verification if number changes
    if (verified) {
      onVerified(false);
    }
    if (step === "code") {
      setStep("input");
      setCode("");
    }
    // Ensure starts with 55
    let cleaned = value.replace(/[^0-9]/g, "");
    if (!cleaned.startsWith("55")) {
      cleaned = "55" + cleaned.replace(/^55*/, "");
    }
    onTelefoneChange(cleaned);
  };

  const sendCode = async () => {
    if (telefone.length < 12) {
      toast.error("Digite um número válido com DDD (ex: 5511999999999)");
      return;
    }
    setSending(true);
    try {
      const res = await fetch(
        "https://webhook.saveautomatik.shop/webhook/validaWhatsappflycare",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ telefone }),
        }
      );
      const text = await res.text();
      if (text.includes("Código enviado com sucesso")) {
        toast.success("Código enviado para seu WhatsApp!");
        setStep("code");
      } else {
        toast.error("Erro ao enviar código. Tente novamente.");
      }
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setSending(false);
    }
  };

  const verifyCode = async () => {
    if (!code.trim()) {
      toast.error("Digite o código recebido");
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch(
        "https://webhook.saveautomatik.shop/webhook/validaCodigoflycare",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ telefone, codigo: code.trim() }),
        }
      );
      const data = await res.json();
      if (data.valid === true || data.valid === "true") {
        toast.success("WhatsApp verificado com sucesso!");
        onVerified(true);
        setStep("input");
      } else {
        toast.error("Código inválido. Tente novamente.");
      }
    } catch {
      toast.error("Erro ao verificar. Tente novamente.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <Phone className="h-4 w-4" />
          {label}
          {required && !verified && (
            <span className="text-xs text-destructive">(verificação obrigatória)</span>
          )}
          {verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              <CheckCircle className="h-3 w-3" /> Verificado
            </span>
          )}
        </Label>
        <div className="flex gap-2">
          <Input
            value={telefone}
            onChange={(e) => handleTelefoneChange(e.target.value)}
            placeholder="5511999999999"
            className="h-12 text-base font-mono"
            disabled={verified}
            maxLength={15}
          />
          {!verified && step === "input" && (
            <Button
              type="button"
              variant="outline"
              onClick={sendCode}
              disabled={sending || telefone.length < 12}
              className="h-12 shrink-0 gap-1.5 whitespace-nowrap"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Phone className="h-4 w-4" />
              )}
              Enviar código
            </Button>
          )}
        </div>
      </div>

      {step === "code" && !verified && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Digite o código enviado para seu WhatsApp:
          </p>
          <div className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
              className="h-12 text-center text-lg font-mono tracking-widest"
              maxLength={8}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={verifyCode}
              disabled={verifying || !code.trim()}
              className="h-10 gap-1.5"
            >
              {verifying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Verificar
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={sendCode}
              disabled={sending}
              className="h-10 gap-1.5 text-muted-foreground"
            >
              <RefreshCw className="h-4 w-4" />
              Reenviar código
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppVerification;
