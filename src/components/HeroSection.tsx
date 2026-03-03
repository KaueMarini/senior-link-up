import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-background py-20 md:py-32">
      <div className="container grid items-center gap-12 md:grid-cols-2">
        <div className="animate-fade-in-up space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground">
            <MessageCircle className="h-4 w-4 text-primary" />
            Integrado com WhatsApp e IA
          </div>
          <h1 className="font-heading text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
            O suporte completo para quem{" "}
            <span className="text-primary">você cuida</span>
          </h1>
          <p className="max-w-lg text-lg text-muted-foreground md:text-xl">
            Agende médicos, lembre remédios, encontre cuidadores verificados e
            dê ao idoso um companheiro de IA — tudo pelo sistema ou por WhatsApp.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/cadastro">
              <Button size="lg" className="gap-2 text-base">
                Começar grátis
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: "0.2s", opacity: 0 }}>
          <img
            src={heroImage}
            alt="Cuidadora segurando as mãos de uma senhora idosa, ambas sorrindo"
            className="rounded-2xl shadow-2xl shadow-primary/10"
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
