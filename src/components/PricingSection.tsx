import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Gratuito",
    price: "R$ 0",
    period: "para sempre",
    description: "Para quem quer começar a organizar o cuidado.",
    features: [
      "1 idoso cadastrado",
      "Agenda de consultas e remédios",
      "Notificações por WhatsApp",
      "Anexar até 10 documentos",
    ],
    cta: "Começar grátis",
    highlighted: false,
  },
  {
    name: "Essencial",
    price: "R$ 49",
    period: "/mês",
    description: "Para famílias que querem o cuidado completo.",
    features: [
      "Até 3 idosos cadastrados",
      "IA Companheira ilimitada",
      "Notificações por WhatsApp e áudio",
      "Documentos e laudos ilimitados",
      "Busca de cuidadores verificados",
    ],
    cta: "Assinar agora",
    highlighted: true,
  },
  {
    name: "Família",
    price: "R$ 89",
    period: "/mês",
    description: "Para quem cuida de vários idosos com vários cuidadores.",
    features: [
      "Idosos ilimitados",
      "Cuidadores ilimitados",
      "Tudo do plano Essencial",
      "Relatórios mensais por e-mail",
      "Suporte prioritário",
      "Painel multi-família",
    ],
    cta: "Assinar agora",
    highlighted: false,
  },
];

const PricingSection = () => {
  return (
    <section className="bg-secondary/50 py-20">
      <div className="container">
        <div className="mb-14 text-center">
          <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
            Planos e preços
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Escolha o plano ideal para a sua família. Cancele quando quiser.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              className={`animate-fade-in-up relative flex flex-col rounded-2xl border p-8 shadow-sm transition-shadow hover:shadow-md ${
                plan.highlighted
                  ? "border-primary bg-card ring-2 ring-primary/20"
                  : "bg-card"
              }`}
              style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                  Mais popular
                </span>
              )}
              <h3 className="font-heading text-xl font-bold text-foreground">
                {plan.name}
              </h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-heading text-4xl font-bold text-foreground">
                  {plan.price}
                </span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {plan.description}
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/cadastro" className="mt-8">
                <Button
                  className="w-full"
                  variant={plan.highlighted ? "default" : "outline"}
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
