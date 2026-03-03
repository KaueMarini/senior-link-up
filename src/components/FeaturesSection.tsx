import { Shield, Users, Bell, Calendar } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Segurança e Confiança",
    description:
      "Acompanhe em tempo real a rotina e o bem-estar de quem você ama com total tranquilidade.",
  },
  {
    icon: Users,
    title: "Conexão Familiar",
    description:
      "Mantenha toda a família informada e conectada, mesmo à distância.",
  },
  {
    icon: Bell,
    title: "Alertas Inteligentes",
    description:
      "Receba notificações sobre medicações, consultas e atividades importantes.",
  },
  {
    icon: Calendar,
    title: "Rotina Organizada",
    description:
      "Gerencie horários, compromissos e cuidados diários de forma simples e visual.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="bg-secondary/50 py-20">
      <div className="container">
        <div className="mb-14 text-center">
          <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
            Tudo que você precisa em um só lugar
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Funcionalidades pensadas para facilitar o dia a dia de quem cuida e de quem é cuidado.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
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
