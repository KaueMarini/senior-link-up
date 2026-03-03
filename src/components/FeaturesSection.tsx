import { MessageCircle, CalendarCheck, Brain, ShieldCheck, FileText, Users } from "lucide-react";

const features = [
  {
    icon: MessageCircle,
    title: "Tudo via WhatsApp",
    description:
      "O responsável agenda consultas, envia áudios e cria lembretes direto pelo WhatsApp. O idoso e o cuidador são notificados automaticamente.",
  },
  {
    icon: CalendarCheck,
    title: "Agenda Inteligente",
    description:
      "Marque exames, médicos e remédios. O sistema notifica o idoso e o cuidador com antecedência e no horário exato.",
  },
  {
    icon: Brain,
    title: "IA Companheira",
    description:
      "O idoso conversa com uma IA amigável para tirar dúvidas, relembrar o que fez ontem ou simplesmente ter companhia.",
  },
  {
    icon: FileText,
    title: "Laudos e Exames",
    description:
      "Anexe relatórios, laudos e exames pelo sistema ou por WhatsApp. Tudo organizado e acessível em um só lugar.",
  },
  {
    icon: ShieldCheck,
    title: "Cuidadores Verificados",
    description:
      "Encontre cuidadores com verificação rigorosa de CPF e RG. Segurança para quem você mais ama.",
  },
  {
    icon: Users,
    title: "Controle Total",
    description:
      "O responsável gerencia telefones, notificações e toda a rotina do idoso — de qualquer lugar, a qualquer hora.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="bg-secondary/50 py-20">
      <div className="container">
        <div className="mb-14 text-center">
          <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
            Tudo que seu idoso precisa, na palma da mão
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Do lembrete de remédio à companhia por IA — um ecossistema completo
            para responsáveis, cuidadores e idosos.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="animate-fade-in-up rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-heading text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
