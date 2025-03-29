
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Menu, X, User } from "lucide-react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    toast({
      title: "Logged in successfully",
      description: "Welcome to Digital Toastmasters!",
    });
    navigate("/dashboard");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
    navigate("/");
  };

  return (
    <nav className="border-b bg-background py-4">
      <div className="container px-4 mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-primary">
          Digital Toastmasters
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-4">
          {isLoggedIn ? (
            <>
              <Link to="/dashboard" className="text-foreground hover:text-primary transition-colors">
                Dashboard
              </Link>
              <Link to="/history" className="text-foreground hover:text-primary transition-colors">
                History
              </Link>
              <div className="flex items-center ml-4 space-x-2">
                <ThemeSwitcher />
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => navigate("/profile")}
                  className="rounded-full"
                >
                  <User className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                >
                  Log out
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center ml-4 space-x-2">
              <ThemeSwitcher />
              <Button
                variant="default"
                onClick={handleLogin}
              >
                Log in with Google
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          <ThemeSwitcher />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMenu}
            className="ml-2"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden py-4 px-4 bg-background border-b">
          <div className="flex flex-col space-y-4">
            {isLoggedIn ? (
              <>
                <Link to="/dashboard" className="text-foreground hover:text-primary transition-colors">
                  Dashboard
                </Link>
                <Link to="/history" className="text-foreground hover:text-primary transition-colors">
                  History
                </Link>
                <Link to="/profile" className="text-foreground hover:text-primary transition-colors">
                  Profile
                </Link>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full"
                >
                  Log out
                </Button>
              </>
            ) : (
              <Button
                variant="default"
                onClick={handleLogin}
                className="w-full"
              >
                Log in with Google
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
