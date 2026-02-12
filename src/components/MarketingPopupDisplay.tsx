import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Droplets, Fuel, Ship, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

interface MarketingPopup {
  id: string;
  popup_type: string;
  title: string;
  subtitle: string | null;
  content: string | null;
  image_url: string | null;
  button_text: string;
  button_link: string | null;
  style_config: Json | null;
  trigger_pages: string[] | null;
  show_on_all_pages: boolean;
  display_delay_seconds: number;
  show_once_per_session: boolean;
  collect_name: boolean;
  collect_email: boolean;
  collect_phone: boolean;
}

const MarketingPopupDisplay = () => {
  const [popup, setPopup] = useState<MarketingPopup | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    checkAndShowPopup();
  }, [location.pathname]);

  const checkAndShowPopup = async () => {
    const shownPopups = JSON.parse(sessionStorage.getItem('shownPopups') || '[]');
    
    try {
      const { data: popups, error } = await supabase
        .from('marketing_popups')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const currentPath = location.pathname;
      const matchingPopup = popups?.find((p: MarketingPopup) => {
        if (p.show_once_per_session && shownPopups.includes(p.id)) {
          return false;
        }
        if (p.show_on_all_pages) return true;
        return (p.trigger_pages || [])?.some(page => currentPath === page || currentPath.startsWith(page + '/'));
      });

      if (matchingPopup) {
        setTimeout(() => {
          setPopup(matchingPopup);
          setIsVisible(true);
          
          if (matchingPopup.show_once_per_session) {
            sessionStorage.setItem('shownPopups', JSON.stringify([...shownPopups, matchingPopup.id]));
          }
        }, (matchingPopup.display_delay_seconds || 0) * 1000);
      }
    } catch (error) {
      console.error('Error fetching popup:', error);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    // Always mark as dismissed in sessionStorage to prevent re-trigger on route changes
    if (popup) {
      const shownPopups = JSON.parse(sessionStorage.getItem('shownPopups') || '[]');
      if (!shownPopups.includes(popup.id)) {
        sessionStorage.setItem('shownPopups', JSON.stringify([...shownPopups, popup.id]));
      }
    }
    setTimeout(() => setPopup(null), 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!popup) return;

    if (popup.collect_email && !formData.email) {
      toast({ title: "Email required", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('popup_subscribers').insert({
        popup_id: popup.id,
        name: formData.name || null,
        email: formData.email || null,
        phone: formData.phone || null,
        page_subscribed_from: location.pathname
      });

      if (error) throw error;

      toast({ title: "Success!", description: "Thank you for subscribing!" });
      handleClose();

      if (popup.button_link) {
        window.location.href = popup.button_link;
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({ title: "Error", description: "Failed to subscribe", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!popup || !isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300" onClick={handleClose}>
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-500" onClick={(e) => e.stopPropagation()}>
        
        {/* Background with oil platform theme */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        
        {/* Decorative elements - Oil rig silhouette */}
        <div className="absolute top-0 right-0 w-48 h-48 opacity-10">
          <svg viewBox="0 0 100 100" fill="currentColor" className="text-amber-500">
            <path d="M50 5 L45 30 L35 30 L35 80 L30 80 L30 95 L70 95 L70 80 L65 80 L65 30 L55 30 Z" />
            <rect x="25" y="40" width="50" height="5" />
            <rect x="20" y="55" width="60" height="5" />
            <circle cx="50" cy="20" r="8" />
          </svg>
        </div>
        
        {/* Animated pipeline decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent animate-pulse" />
        
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/80 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative z-10">
          {/* Header with icons */}
          <div className="px-8 pt-8 pb-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                <Fuel className="h-5 w-5" />
              </div>
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                <Ship className="h-5 w-5" />
              </div>
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Droplets className="h-5 w-5" />
              </div>
            </div>
            
            {/* Title with gradient */}
            <h2 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 bg-clip-text text-transparent">
              {popup.title}
            </h2>
            
            {popup.subtitle && (
              <p className="text-center text-slate-300 text-lg mb-2">
                {popup.subtitle}
              </p>
            )}
            
            {popup.content && (
              <p className="text-center text-slate-400 text-sm leading-relaxed">
                {popup.content}
              </p>
            )}
          </div>

          {/* Image section */}
          {popup.image_url && (
            <div className="px-8 pb-4">
              <div className="relative rounded-xl overflow-hidden border border-amber-500/20">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                <img 
                  src={popup.image_url} 
                  alt={popup.title}
                  className="w-full h-40 object-cover"
                />
              </div>
            </div>
          )}

          {/* Form section */}
          <div className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {popup.collect_name && (
                <div className="relative">
                  <Input
                    placeholder="Your name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-amber-500/50 focus:ring-amber-500/20"
                  />
                </div>
              )}
              
              {popup.collect_email && (
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="Your email address"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-amber-500/50 focus:ring-amber-500/20"
                  />
                </div>
              )}
              
              {popup.collect_phone && (
                <div className="relative">
                  <Input
                    type="tel"
                    placeholder="Your phone number"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-amber-500/50 focus:ring-amber-500/20"
                  />
                </div>
              )}
              
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-bold py-6 text-lg shadow-lg shadow-amber-500/25 transition-all hover:shadow-amber-500/40 hover:scale-[1.02] group"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {popup.button_text}
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </form>

            <button
              onClick={handleClose}
              className="w-full mt-4 text-center text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              No thanks, maybe later
            </button>
          </div>

          {/* Footer decoration */}
          <div className="h-2 bg-gradient-to-r from-amber-500/0 via-amber-500 to-amber-500/0" />
        </div>
      </div>
    </div>
  );
};

export default MarketingPopupDisplay;