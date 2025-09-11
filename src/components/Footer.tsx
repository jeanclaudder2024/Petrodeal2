import { Mail, Linkedin, Twitter, Github } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // shadcn/ui input
import { Label } from "@/components/ui/label"; // shadcn/ui label

const Footer = () => {
  return (
    <footer className="relative border-t border-border/50 bg-slate-900 text-zinc-100">
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand + Newsletter */}
          <div className="space-y-6">
            <Link to="/" className="inline-flex items-center" aria-label="Go to homepage">
              <img
                src="https://i.postimg.cc/rppkVTQb/Chat-GPT-Image-Sep-6-2025-11-30-18-AM.png"
                alt="PetroDealHub"
                className="h-auto w-auto transition-transform hover:scale-110"
              />
            </Link>

            <p className="text-sm leading-relaxed text-zinc-300">
              The world&apos;s most advanced AI-powered oil vessel tracking and trading platform.
              Connecting tankers, refineries, and deals through intelligent technology.
            </p>

            {/* Newsletter */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold tracking-wide text-zinc-200 uppercase">
                Subscribe to updates
              </h4>
              <form
                className="flex w-full max-w-md items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  // TODO: hook up to your newsletter endpoint / service
                }}
              >
                <div className="grid w-full gap-1.5">
                  <Label htmlFor="footer-email" className="sr-only">
                    Email address
                  </Label>
                  <Input
                    id="footer-email"
                    type="email"
                    required
                    placeholder="you@company.com"
                    className="bg-zinc-800/60 border-zinc-700/80 placeholder:text-zinc-500 focus-visible:ring-primary"
                  />
                </div>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90"
                  aria-label="Subscribe"
                >
                  Subscribe
                </Button>
              </form>
              <p className="text-xs text-zinc-400">
                We care about your privacy. Unsubscribe anytime.
              </p>
            </div>

            {/* Socials */}
            <div className="flex gap-4 pt-2" aria-label="Social media">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="text-zinc-400 hover:text-primary transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
             
            </div>
          </div>

          {/* Platform */}
          <nav aria-label="Platform" className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wide">Platform</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/vessel-news" className="text-zinc-300 hover:text-primary transition-colors">
                  Vessel Tracking
                </Link>
              </li>
              <li>
                <Link to="/port-news" className="text-zinc-300 hover:text-primary transition-colors">
                  Port Intelligence
                </Link>
              </li>
              <li>
                <Link to="/refinery-news" className="text-zinc-300 hover:text-primary transition-colors">
                  Refinery Analytics
                </Link>
              </li>
              <li>
                <Link to="/future-trading" className="text-zinc-300 hover:text-primary transition-colors">
                  Features
                </Link>
              </li>
            </ul>
          </nav>

          {/* Resources */}
          <nav aria-label="Resources" className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wide">Resources</h3>
            <ul className="space-y-2">
             <li>
                <Link to="/support-news" className="text-zinc-300 hover:text-primary transition-colors">
                  Support 
                </Link>
              </li>
              <li>
                <Link to="/api-integration" className="text-zinc-300 hover:text-primary transition-colors">
                  API Integration
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-zinc-300 hover:text-primary transition-colors">
                  Blog &amp; Market Reports
                </Link>
              </li>
             
            </ul>
          </nav>

          {/* Company */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wide">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-zinc-300 hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-zinc-300 hover:text-primary transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-zinc-300 hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
            </ul>

            {/* Contact block */}
            <address className="not-italic space-y-3 pt-2">
              <div className="flex items-center gap-3 text-zinc-300">
                <Mail className="h-4 w-4 text-zinc-400" />
                <a
                  href="mailto:support@petrodeallhub.com"
                  className="text-sm hover:text-primary transition-colors"
                >
                  support@petrodeallhub.com
                </a>
              </div>
            </address>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-border/50 pt-8 flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="text-sm text-zinc-400">
            © {new Date().getFullYear()} PetroDealHub. All rights reserved.
          </div>

          <ul className="flex flex-wrap items-center gap-6 text-sm">
            <li>
              <Link to="/privacy-policy" className="text-zinc-300 hover:text-primary transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/policies" className="text-zinc-300 hover:text-primary transition-colors">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link to="/cookies" className="text-zinc-300 hover:text-primary transition-colors">
                Cookie Policy
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Background accents */}
      <div className="pointer-events-none absolute top-10 left-10 h-32 w-32 rounded-full border border-primary/10" />
      <div
        className="pointer-events-none absolute bottom-10 right-10 h-20 w-20 rounded-full border border-emerald-400/10"
        style={{ animationDelay: "1s" }}
      />
    </footer>
  );
};

export default Footer;
