import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t bg-card py-8">
      <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" fill="hsl(var(--primary))" />
          <span className="font-heading font-semibold text-foreground">CuidarBem</span>
        </div>
        <p className="text-sm text-muted-foreground">
          © 2026 CuidarBem. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
