import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  ChevronDown,
  Home,
  Info,
  BookOpen,
  Compass,
  Layers,
  DollarSign,
  Newspaper,
  Code,
  Headphones,
  FileText,
  Shield,
  Phone,
  Briefcase,
  Anchor,
  Factory,
  Users,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import LandingThemeToggle from "./LandingThemeToggle";

const LandingNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Platform Navigation (Vessel / Ports / Refinery)
  const platformItems = [
    { name: "Vessel", to: "/vessel-news", icon: <Home className="w-4 h-4" /> },
    { name: "Ports", to: "/port-news", icon: <Anchor className="w-4 h-4" /> },
    { name: "Refinery", to: "/refinery-news", icon: <Factory className="w-4 h-4" /> },

  ];

  // Services (anchors if you have sections on landing; keep as Links if routed pages)
  const servicesItems = [
    { name: "Services", to: "/#services", icon: <Layers className="w-4 h-4" /> },
    { name: "How It Works", to: "/#how-it-works", icon: <Compass className="w-4 h-4" /> },
    { name: "Pricing", to: "/#pricing", icon: <DollarSign className="w-4 h-4" /> },
  ];

  // Features (API Integration + Feature Pages = your FutureTrading page)
  const featuresItems = [
    { name: "API Integration", to: "/api-integration", icon: <Code className="w-4 h-4" /> },
    { name: "Feature Pages", to: "/future-trading", icon: <Layers className="w-4 h-4" /> },
  ];

  // Resources (Docs + Blog)
  const resourceItems = [
    { name: "Documentation", to: "/documentation", icon: <Newspaper className="w-4 h-4" /> },
    { name: "Blog", to: "/blog", icon: <BookOpen className="w-4 h-4" /> },
    { name: "Support", to: "/support-news", icon: <Headphones className="w-4 h-4" /> },

  ];

  // Legal (Privacy / Terms / Cookies)
  const legalItems = [
    { name: "Privacy Policy", to: "/privacy-policy", icon: <Shield className="w-4 h-4" /> },
    { name: "Terms of Service", to: "/policies", icon: <FileText className="w-4 h-4" /> },
    { name: "Cookies", to: "/cookies", icon: <FileText className="w-4 h-4" /> },
  ];

  // Company (About / Careers / Contact)
  const companyItems = [
    { name: "About Us", to: "/about", icon: <Info className="w-4 h-4" /> },
    { name: "Careers", to: "/careers", icon: <Briefcase className="w-4 h-4" /> },
    { name: "Contact", to: "/contact", icon: <Phone className="w-4 h-4" /> },
  ];

  const handleAuthClick = () => navigate("/auth");
  const handleDemoClick = () => navigate("/contact");

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-border/50 shadow-md bg-[#1d1d28]/[0.76]">
      <div className="container mx-auto px-4 sm:px-6">
        {/* responsive height for logo */}
        <div className="flex items-center justify-between h-16 sm:h-20 md:h-24 lg:h-[130px]">
          {/* Logo (responsive sizing) */}
          <Link to="/" className="flex items-center space-x-3 group">
            <img
              src="https://i.postimg.cc/rppkVTQb/Chat-GPT-Image-Sep-6-2025-11-30-18-AM.png"
              alt="PetroDealHub Logo"
              className="h-12 sm:h-16 md:h-20 lg:h-[150px] w-auto transition-transform group-hover:scale-110"
            />
          </Link>

          {/* Desktop Nav - organized by categories */}
          <div className="hidden lg:flex items-center space-x-8 xl:space-x-10">
            {/* Platform */}
            <div className="relative group">
              <button className="flex items-center gap-1 text-muted-foreground hover:text-primary font-medium">
                Platform
                <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute top-full left-0 mt-2 w-64 bg-background border border-border rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                {platformItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.to}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:bg-muted/50 hover:text-primary rounded-md"
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Services */}
            <div className="relative group">
              <button className="flex items-center gap-1 text-muted-foreground hover:text-primary font-medium">
                Services
                <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute top-full left-0 mt-2 w-64 bg-background border border-border rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                {servicesItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.to}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:bg-muted/50 hover:text-primary rounded-md"
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="relative group">
              <button className="flex items-center gap-1 text-muted-foreground hover:text-primary font-medium">
                Features
                <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute top-full left-0 mt-2 w-64 bg-background border border-border rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                {featuresItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.to}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:bg-muted/50 hover:text-primary rounded-md"
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Resources (includes Support) */}
            <div className="relative group">
              <button className="flex items-center gap-1 text-muted-foreground hover:text-primary font-medium">
                Resources
                <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute top-full left-0 mt-2 w-64 bg-background border border-border rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                {resourceItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.to}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:bg-muted/50 hover:text-primary rounded-md"
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Legal */}
            <div className="relative group">
              <button className="flex items-center gap-1 text-muted-foreground hover:text-primary font-medium">
                Legal
                <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute top-full left-0 mt-2 w-64 bg-background border border-border rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                {legalItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.to}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:bg-muted/50 hover:text-primary rounded-md"
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Company */}
            <div className="relative group">
              <button className="flex items-center gap-1 text-muted-foreground hover:text-primary font-medium">
                Company
                <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute top-full left-0 mt-2 w-56 bg-background border border-border rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                {companyItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.to}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:bg-muted/50 hover:text-primary rounded-md"
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="hidden lg:flex items-center space-x-4">
            <LandingThemeToggle />
            <Button
              onClick={handleAuthClick}
              className="font-medium hover:shadow-md bg-orange-500 hover:bg-orange-600 text-white border-none"
            >
              Sign In
            </Button>
            <Button
              onClick={handleDemoClick}
              className="bg-gradient-to-r from-primary to-accent hover:scale-105 hover:shadow-lg transition-all font-medium"
            >
              Request Demo
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className="flex items-center gap-2 lg:hidden">
            <LandingThemeToggle />
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-muted/50 text-foreground border border-border/50"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-full sm:w-80 bg-background/95 backdrop-blur-md"
              >
                <div className="flex flex-col h-full">
                  {/* Mobile Nav */}
                  <div className="flex-1 py-4 space-y-4 overflow-y-auto">
                    {[
                      { title: "Platform", items: platformItems },
                      { title: "Services", items: servicesItems },
                      { title: "Features", items: featuresItems },
                      { title: "Resources", items: resourceItems },
                      { title: "Legal", items: legalItems },
                      { title: "Company", items: companyItems },
                    ].map(({ title, items }) => (
                      <div key={title} className="space-y-1">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase px-2">
                          {title}
                        </h4>
                        {items.map((item) => (
                          <Link
                            key={item.name}
                            to={item.to}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2 text-sm text-foreground hover:text-primary py-2 px-2 rounded-md hover:bg-muted/50 transition-colors"
                          >
                            {item.icon}
                            {item.name}
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Mobile CTA */}
                  <div className="space-y-3 py-4 border-t border-border/50">
                    <Button
                      onClick={() => {
                        handleAuthClick();
                        setIsOpen(false);
                      }}
                      className="w-full font-medium bg-orange-500 hover:bg-orange-600 text-white py-3"
                    >
                      Sign In
                    </Button>
                    <Button
                      onClick={() => {
                        handleDemoClick();
                        setIsOpen(false);
                      }}
                      className="w-full bg-gradient-to-r from-primary to-accent font-medium py-3"
                    >
                      Request Demo
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default LandingNavbar;
