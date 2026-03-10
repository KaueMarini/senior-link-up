import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, UserCircle } from "lucide-react";
import logo from "@/assets/logo.png";
import { useAuth } from "@/hooks/useAuth";

const Header = () => {
  const { user, loading, signOut, userName } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-20 items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Fly Care" className="h-20 w-20" />
          <span className="font-heading text-xl font-bold text-foreground">
            Fly Care
          </span>
        </Link>

        <nav className="flex items-center gap-3">
          {loading ? null : user ? (
            <>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <UserCircle className="h-5 w-5 text-primary" />
                <span className="font-medium">Olá, {userName}!</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline">Entrar</Button>
              </Link>
              <Link to="/cadastro">
                <Button>Começar agora</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
