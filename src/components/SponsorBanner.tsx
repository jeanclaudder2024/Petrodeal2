import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ExternalLink, Star } from 'lucide-react';

interface SponsorBannerData {
  id: string;
  sponsor_name: string;
  sponsor_logo_url: string | null;
  sponsor_text: string;
  sponsor_website_url: string | null;
}

interface SponsorBannerProps {
  location: 'registration' | 'footer' | 'dashboard_map';
  className?: string;
}

const SponsorBanner: React.FC<SponsorBannerProps> = ({ location, className = '' }) => {
  const [sponsors, setSponsors] = useState<SponsorBannerData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSponsors();
  }, [location]);

  const loadSponsors = async () => {
    try {
      console.log('[SponsorBanner] Loading sponsors for location:', location);
      
      let query = supabase
        .from('sponsor_banners')
        .select('id, sponsor_name, sponsor_logo_url, sponsor_text, sponsor_website_url')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(5);

      // Add location filter based on prop
      if (location === 'registration') {
        query = query.eq('show_on_registration', true);
      } else if (location === 'footer') {
        query = query.eq('show_on_footer', true);
      } else if (location === 'dashboard_map') {
        query = query.eq('show_on_dashboard_map', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[SponsorBanner] Error loading sponsors:', error);
        throw error;
      }
      
      console.log('[SponsorBanner] Loaded sponsors:', data?.length || 0, data);
      setSponsors((data as unknown as SponsorBannerData[]) || []);
    } catch (error) {
      console.error('[SponsorBanner] Error loading sponsors:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || sponsors.length === 0) {
    return null;
  }

  // Different layouts based on location
  if (location === 'footer') {
    return (
      <div className={`sponsor-banner py-6 ${className}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Our Partners</span>
            <Star className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {sponsors.map((sponsor) => (
              <a 
                key={sponsor.id}
                href={sponsor.sponsor_website_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-3 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-primary/30 transition-all duration-300"
              >
                {sponsor.sponsor_logo_url && (
                  <img 
                    src={sponsor.sponsor_logo_url} 
                    alt={sponsor.sponsor_name}
                    className="h-12 w-auto max-w-32 object-contain filter brightness-90 group-hover:brightness-110 transition-all"
                  />
                )}
                <div className="text-center">
                  <p className="font-medium text-zinc-200 group-hover:text-primary transition-colors">
                    {sponsor.sponsor_name}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1 max-w-48 line-clamp-2">
                    {sponsor.sponsor_text}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-zinc-500 group-hover:text-primary transition-colors" />
              </a>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Registration & Dashboard Map layout
  return (
    <div className={`sponsor-banner ${className}`}>
      <div className="py-4 px-6 bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 backdrop-blur-sm rounded-xl border border-border/50">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Star className="h-4 w-4 text-amber-500" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Proudly Sponsored By
          </span>
          <Star className="h-4 w-4 text-amber-500" />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6">
          {sponsors.map((sponsor) => (
            <a 
              key={sponsor.id}
              href={sponsor.sponsor_website_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 px-4 py-2 rounded-lg bg-background/50 hover:bg-background border border-border/50 hover:border-primary/50 transition-all duration-200 hover:shadow-md"
            >
              {sponsor.sponsor_logo_url && (
                <img 
                  src={sponsor.sponsor_logo_url} 
                  alt={sponsor.sponsor_name}
                  className="h-10 w-auto max-w-24 object-contain group-hover:scale-105 transition-transform"
                />
              )}
              <div className="max-w-48">
                <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                  {sponsor.sponsor_name}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {sponsor.sponsor_text}
                </p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SponsorBanner;
