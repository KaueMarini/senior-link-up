import { UserPlus, Settings, BellRing } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "1",
    title: "Cadastre o idoso",
    description:
      "O responsável cria a conta, adiciona os telefones do idoso e dos cuidadores em poucos minutos.",
  },
  {
    icon: Settings,
    step: "2",
    title: "Configure a rotina",
    description:
      "Agende médicos, remédios e anexe exames pelo sistema ou simplesmente envie uma mensagem no WhatsApp.",
  },
  {
    icon: BellRing,
    step: "3",
    title: "Todos são notificados",
    description:
      "O idoso e o cuidador recebem lembretes automáticos por WhatsApp — com antecedência e no horário exato.",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-20">
      <div className="container">
        <div className="mb-14 text-center">
          <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
            Como funciona
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Três passos simples para transformar o cuidado com quem você ama.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={s.step}
              className="animate-fade-in-up relative flex flex-col items-center text-center"
              style={{ animationDelay: `${i * 0.15}s`, opacity: 0 }}
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                <s.icon className="h-7 w-7" />
              </div>
              {i < steps.length - 1 && (
                <div className="absolute left-[calc(50%+40px)] top-8 hidden h-0.5 w-[calc(100%-80px)] bg-border md:block" />
              )}
              <span className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">
                Passo {s.step}
              </span>
              <h3 className="mb-2 font-heading text-xl font-bold text-foreground">
                {s.title}
              </h3>
              <p className="max-w-xs text-muted-foreground">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
