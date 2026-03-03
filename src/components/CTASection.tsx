import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plane } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-20">
      <div className="container">
        <div className="mx-auto max-w-3xl rounded-2xl bg-primary p-10 text-center text-primary-foreground md:p-16">
          <Plane className="mx-auto mb-4 h-10 w-10" />
          <h2 className="font-heading text-3xl font-bold md:text-4xl">
            Cuide de quem te criou
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg opacity-90">
            Cadastre-se gratuitamente e descubra como o Fly Care pode
            transformar o cuidado com seu idoso — pelo sistema ou pelo WhatsApp.
          </p>
          <Link to="/cadastro">
            <Button
              size="lg"
              variant="secondary"
              className="mt-8 text-base font-semibold"
            >
              Criar minha conta
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
