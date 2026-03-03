import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Fly Care" className="h-8 w-8" />
          <span className="font-heading text-xl font-bold text-foreground">
            Fly Care
          </span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link to="/cadastro">
            <Button>Começar agora</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
