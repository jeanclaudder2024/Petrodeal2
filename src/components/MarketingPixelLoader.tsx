import { useEffect, useState } from 'react';
import { getEnabledPixels, MarketingSetting } from '@/hooks/useMarketingPixels';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
    lintrk?: (...args: unknown[]) => void;
    _linkedin_partner_id?: string;
    _linkedin_data_partner_ids?: string[];
    hj?: (...args: unknown[]) => void;
    _hjSettings?: { hjid: number; hjsv: number };
  }
}

const MarketingPixelLoader = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadPixels = async () => {
      if (loaded) return;

      try {
        const pixels = await getEnabledPixels();
        
        pixels.forEach((pixel) => {
          switch (pixel.provider) {
            case 'gtm':
              loadGTM(pixel.tracking_id);
              break;
            case 'ga4':
              loadGA4(pixel.tracking_id);
              break;
            case 'facebook_pixel':
              loadFacebookPixel(pixel.tracking_id);
              break;
            case 'linkedin':
              loadLinkedInPixel(pixel.tracking_id);
              break;
            case 'hotjar':
              loadHotjar(pixel.tracking_id);
              break;
            case 'custom':
              if (pixel.config && typeof pixel.config === 'object' && !Array.isArray(pixel.config)) {
                loadCustomScript(pixel.config as Record<string, unknown>);
              }
              break;
            default:
              console.log(`Unknown pixel provider: ${pixel.provider}`);
          }
        });

        setLoaded(true);
      } catch (error) {
        console.error('Error loading marketing pixels:', error);
      }
    };

    loadPixels();
  }, [loaded]);

  return null;
};

// Google Tag Manager
const loadGTM = (containerId: string) => {
  if (document.querySelector(`script[src*="googletagmanager.com/gtm.js?id=${containerId}"]`)) {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${containerId}`;
  document.head.appendChild(script);

  // Add noscript iframe
  const noscript = document.createElement('noscript');
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.googletagmanager.com/ns.html?id=${containerId}`;
  iframe.height = '0';
  iframe.width = '0';
  iframe.style.display = 'none';
  iframe.style.visibility = 'hidden';
  noscript.appendChild(iframe);
  document.body.insertBefore(noscript, document.body.firstChild);

  console.log(`[Marketing] GTM loaded: ${containerId}`);
};

// Google Analytics 4
const loadGA4 = (measurementId: string) => {
  if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${measurementId}"]`)) {
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    window.dataLayer!.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId);

  console.log(`[Marketing] GA4 loaded: ${measurementId}`);
};

// Facebook Pixel
const loadFacebookPixel = (pixelId: string) => {
  if (window.fbq) return;

  const fbq = function() {
    (fbq as any).callMethod ? (fbq as any).callMethod.apply(fbq, arguments) : (fbq as any).queue.push(arguments);
  };
  (fbq as any).push = fbq;
  (fbq as any).loaded = true;
  (fbq as any).version = '2.0';
  (fbq as any).queue = [];
  window.fbq = fbq as any;

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);

  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');

  console.log(`[Marketing] Facebook Pixel loaded: ${pixelId}`);
};

// LinkedIn Insight Tag
const loadLinkedInPixel = (partnerId: string) => {
  if (window.lintrk) return;

  window._linkedin_partner_id = partnerId;
  window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
  window._linkedin_data_partner_ids.push(partnerId);

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://snap.licdn.com/li.lms-analytics/insight.min.js';
  document.head.appendChild(script);

  console.log(`[Marketing] LinkedIn Insight loaded: ${partnerId}`);
};

// Hotjar
const loadHotjar = (siteId: string) => {
  if (window.hj) return;

  window.hj = function() {
    ((window.hj as any).q = (window.hj as any).q || []).push(arguments);
  };
  window._hjSettings = { hjid: parseInt(siteId), hjsv: 6 };

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://static.hotjar.com/c/hotjar-${siteId}.js?sv=6`;
  document.head.appendChild(script);

  console.log(`[Marketing] Hotjar loaded: ${siteId}`);
};

// Custom Script
const loadCustomScript = (config: Record<string, unknown>) => {
  if (config.script && typeof config.script === 'string') {
    const script = document.createElement('script');
    script.innerHTML = config.script;
    document.head.appendChild(script);
    console.log('[Marketing] Custom script loaded');
  }
};

export default MarketingPixelLoader;
