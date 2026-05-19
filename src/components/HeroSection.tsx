import { Link } from "react-router-dom";
import { ArrowRight, Bot, Star } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-background py-16 md:py-24 lg:py-32">
      {/* Soft emerald glow */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-[600px] w-[600px] rounded-full bg-primary-light/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-32 h-[500px] w-[500px] rounded-full bg-primary-light/30 blur-3xl" />

      <div className="container relative grid items-center gap-16 lg:grid-cols-2">
        {/* Left content */}
        <div className="animate-fade-in-up space-y-8 z-10">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary-light px-4 py-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-primary-dark">
              Integrado com WhatsApp e IA
            </span>
          </div>

          <h1 className="font-heading text-5xl font-medium leading-[1.1] text-primary-dark md:text-6xl lg:text-7xl">
            O suporte completo para quem{" "}
            <span className="italic text-primary">você cuida</span>
          </h1>

          <p className="max-w-lg text-lg leading-relaxed text-primary-dark/70 lg:text-xl">
            Agende médicos, lembre remédios e encontre cuidadores verificados.
            Um companheiro de IA para o idoso, totalmente integrado ao WhatsApp da família.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link to="/cadastro">
              <button className="group flex items-center rounded-xl bg-primary px-8 py-4 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-1 hover:bg-primary-dark">
                Começar grátis
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
            <a href="#como-funciona">
              <button className="rounded-xl border-2 border-primary/20 px-8 py-4 font-bold text-primary transition-all hover:border-primary">
                Ver como funciona
              </button>
            </a>
          </div>

          {/* Trust stats */}
          <div className="flex flex-wrap items-center gap-8 border-t border-primary/10 pt-6">
            <div>
              <span className="block font-heading text-2xl font-bold text-primary-dark">15k+</span>
              <span className="text-xs font-bold uppercase tracking-widest text-primary-dark/50">
                Famílias
              </span>
            </div>
            <div className="h-8 w-px bg-primary/10" />
            <div>
              <span className="block font-heading text-2xl font-bold text-primary-dark">4.9/5</span>
              <span className="text-xs font-bold uppercase tracking-widest text-primary-dark/50">
                Avaliação App
              </span>
            </div>
            <div className="h-8 w-px bg-primary/10" />
            <div className="flex items-center text-accent">
              <Star className="mr-1 h-5 w-5 fill-current" />
              <span className="text-sm font-bold">Premium Care</span>
            </div>
          </div>
        </div>

        {/* Right visual - phone mockup */}
        <div
          className="relative flex items-center justify-center animate-fade-in-up"
          style={{ animationDelay: "0.2s", opacity: 0 }}
        >
          <div className="relative z-10 h-[580px] w-[280px] rounded-[3rem] bg-primary-dark p-3 shadow-2xl ring-8 ring-primary/5">
            <div className="flex h-full w-full flex-col overflow-hidden rounded-[2.2rem] bg-white">
              <div className="flex h-6 w-full items-end justify-center bg-background pb-1">
                <div className="h-1 w-12 rounded-full bg-black/10" />
              </div>
              <div className="flex-1 space-y-4 p-4">
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 rounded-full bg-primary-light" />
                  <div className="h-4 w-24 rounded-full bg-background" />
                </div>
                <div className="flex h-32 w-full items-center justify-center rounded-2xl bg-background">
                  <span className="text-xs font-bold text-primary">Próxima Medicação: 14:00</span>
                </div>
                <div className="space-y-2">
                  <div className="h-8 w-full rounded-lg bg-background" />
                  <div className="h-8 w-full rounded-lg bg-background" />
                  <div className="h-8 w-2/3 rounded-lg bg-background" />
                </div>
              </div>
            </div>

            {/* Floating AI badge */}
            <div className="absolute -right-12 top-20 flex animate-bounce-slow items-center space-x-3 rounded-2xl border border-primary-light bg-white p-4 shadow-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-primary-dark text-white">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-tighter text-primary">
                  Fly Care IA
                </p>
                <p className="text-xs font-bold text-primary-dark">Dona Maria almoçou</p>
              </div>
            </div>

            {/* Floating WhatsApp badge */}
            <div className="absolute -left-16 bottom-32 flex animate-float items-center space-x-3 rounded-2xl border border-primary-light bg-white p-4 shadow-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366] text-white">
                <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-tighter text-[#25D366]">
                  Relatório Diário
                </p>
                <p className="text-xs font-bold text-primary-dark">Enviado com sucesso</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
