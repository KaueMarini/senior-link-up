import { Link } from "react-router-dom";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import PricingSection from "@/components/PricingSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Heart, Search, Stethoscope } from "lucide-react";

const WelcomeSection = ({ userName, userPerfil }: { userName: string; userPerfil: string }) => {
  const isFamiliar = userPerfil === "familiar";
  const isCuidador = userPerfil === "cuidador";

  return (
    <section className="bg-primary/5 border-b">
      <div className="container py-10">
        <h2 className="font-heading text-2xl font-bold text-foreground">
          Bem-vindo(a), {userName}! <Heart className="inline h-6 w-6 text-accent fill-accent" />
        </h2>
        <p className="mt-1 text-muted-foreground">
          É bom ter você de volta. O que gostaria de fazer hoje?
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          {isFamiliar && (
            <Link to="/cuidadores">
              <Button size="lg" className="gap-2">
                <Search className="h-5 w-5" />
                Encontrar cuidadores
              </Button>
            </Link>
          )}
          {isCuidador && (
            <Link to="/dashboard/cuidador">
              <Button size="lg" className="gap-2">
                <Stethoscope className="h-5 w-5" />
                Meu Painel
              </Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
};

const Index = () => {
  const { user, loading, userName, userPerfil } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {!loading && user ? (
          <WelcomeSection userName={userName} userPerfil={userPerfil} />
        ) : (
          <HeroSection />
        )}
        <FeaturesSection />
        <HowItWorksSection />
        {!user && <PricingSection />}
        {!user && <CTASection />}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
