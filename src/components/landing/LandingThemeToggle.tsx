import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const LandingThemeToggle = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    // Get theme from localStorage or default to dark for landing page
    const savedTheme = localStorage.getItem('landing-theme') as 'light' | 'dark' || 'dark';
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (newTheme: 'light' | 'dark') => {
    const landingContainer = document.querySelector('.landing-page-container');
    const html = document.documentElement;
    
    if (landingContainer) {
      landingContainer.classList.remove('light', 'dark');
      landingContainer.classList.add(newTheme);
    }
    
    // Also apply to html for proper CSS variable inheritance
    if (newTheme === 'light') {
      html.classList.remove('dark');
      html.classList.add('light');
    } else {
      html.classList.remove('light'); 
      html.classList.add('dark');
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('landing-theme', newTheme);
    applyTheme(newTheme);
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleTheme}
      className="hover:bg-muted/50 text-foreground border border-border/50"
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  );
};

export default LandingThemeToggle;