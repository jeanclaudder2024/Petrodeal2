import { Button } from "@/components/ui/button";
import { Anchor, Ship, TrendingUp, Users, Newspaper, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ThemeToggle from "./ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navigation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img 
              src="/lovable-uploads/92162cb9-ec10-41e2-bb64-5e35030478d1.png" 
              alt="PetroDeallHub" 
              className="h-10 w-auto"
            />
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-primary transition-fast flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Features
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-primary transition-fast flex items-center gap-2">
              <Anchor className="h-4 w-4" />
              Pricing
            </a>
            <a href="#brokers" className="text-muted-foreground hover:text-primary transition-fast flex items-center gap-2">
              <Users className="h-4 w-4" />
              Brokers
            </a>
            <DropdownMenu>
              <DropdownMenuTrigger className="text-muted-foreground hover:text-primary transition-fast flex items-center gap-2">
                <Newspaper className="h-4 w-4" />
                News
                <ChevronDown className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => navigate('/vessel-news')}>
                  <Ship className="h-4 w-4 mr-2" />
                  Vessel News
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/port-news')}>
                  <Anchor className="h-4 w-4 mr-2" />
                  Port News
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/refinery-news')}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Refinery News
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/support-news')}>
                  <Users className="h-4 w-4 mr-2" />
                  Support News
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <>
                <Button 
                  variant="ghost" 
                  className="text-muted-foreground hover:text-primary"
                  onClick={() => navigate('/dashboard')}
                >
                  Dashboard
                </Button>
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-semibold">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  className="text-muted-foreground hover:text-primary"
                  onClick={() => navigate('/auth')}
                >
                  Sign In
                </Button>
                <Button 
                  className="hero-button"
                  onClick={() => navigate('/auth')}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;