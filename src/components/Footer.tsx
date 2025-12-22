import { Mail, Linkedin, Twitter, Facebook, Instagram } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SponsorBanner from "@/components/SponsorBanner";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SocialLinks {
  linkedin_url: string;
  twitter_url: string;
  facebook_url: string;
  instagram_url: string;
}

const Footer = () => {
  const { toast } = useToast();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    linkedin_url: "",
    twitter_url: "",
    facebook_url: "",
    instagram_url: ""
  });

  useEffect(() => {
    fetchSocialLinks();
  }, []);

  const fetchSocialLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('cms_settings')
        .select('key, value_en')
        .in('key', ['linkedin_url', 'twitter_url', 'facebook_url', 'instagram_url']);
      
      if (data && !error) {
        const links: SocialLinks = { linkedin_url: "", twitter_url: "", facebook_url: "", instagram_url: "" };
        data.forEach(item => {
          if (item.key in links) {
            links[item.key as keyof SocialLinks] = item.value_en || "";
          }
        });
        setSocialLinks(links);
      }
    } catch (error) {
      // Silent fail
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email: newsletterEmail, source: 'footer' });
      
      if (error) {
        if (error.code === '23505') {
          toast({ title: "Already subscribed", description: "This email is already on our list." });
        } else {
          throw error;
        }
      } else {
        toast({ title: "Subscribed!", description: "Thank you for subscribing to our newsletter." });
        setNewsletterEmail("");
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to subscribe. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="relative border-t border-border/50 bg-slate-900 text-zinc-100">
      {/* Sponsor Partners Section */}
      <div className="border-b border-border/30 bg-gradient-to-b from-slate-800/80 to-slate-900">
        <SponsorBanner location="footer" className="" />
      </div>
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand + Newsletter */}
          <div className="space-y-6">
            <Link to="/" className="inline-flex items-center" aria-label="Go to homepage">
              <img
                src="/lovable-uploads/92162cb9-ec10-41e2-bb64-5e35030478d1.png"
                alt="PetroDealHub"
                className="h-auto w-auto transition-transform hover:scale-110"
              />
            </Link>

            <p className="text-sm leading-relaxed text-zinc-300">
              A next-generation oil vessel tracking and trading platform.
              Connecting tankers, refineries, and deals through intelligent market technology.
            </p>


            {/* Socials */}
            <div className="flex gap-4 pt-2" aria-label="Social media">
              {socialLinks.linkedin_url && (
                <a
                  href={socialLinks.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="text-zinc-400 hover:text-primary transition-colors"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              )}
              {socialLinks.twitter_url && (
                <a
                  href={socialLinks.twitter_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                  className="text-zinc-400 hover:text-primary transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {socialLinks.facebook_url && (
                <a
                  href={socialLinks.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="text-zinc-400 hover:text-primary transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {socialLinks.instagram_url && (
                <a
                  href={socialLinks.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="text-zinc-400 hover:text-primary transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
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

          {/* Company & Contact */}
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

            {/* Contact & Newsletter */}
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

            {/* Newsletter - moved here */}
            <div className="space-y-2 pt-3 border-t border-zinc-700/50">
              <h4 className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">
                Subscribe to updates
              </h4>
              <form
                className="flex items-center gap-2"
                onSubmit={handleNewsletterSubmit}
              >
                <Input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="bg-zinc-800/60 border-zinc-700/80 placeholder:text-zinc-500 focus-visible:ring-primary h-9 text-sm"
                />
                <Button
                  type="submit"
                  disabled={submitting}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 h-9"
                  aria-label="Subscribe"
                >
                  {submitting ? "..." : "Go"}
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-zinc-500">
            Information provided on PetroDealHub is for informational purposes only and does not constitute legal or financial advice.
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="mt-6 border-t border-border/50 pt-8 flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="text-sm text-zinc-400 text-center md:text-left">
            © {new Date().getFullYear()} PetroDealHub. All rights reserved. Operated by PetroDealHub. Registered Company in the United States.
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
