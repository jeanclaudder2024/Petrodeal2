// GA4 Analytics Helper for PetroDealHub
// Provides consistent event tracking across the platform with multi-provider support

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    lintrk?: (...args: unknown[]) => void;
    posthog?: { capture: (event: string, properties?: Record<string, unknown>) => void };
    hj?: (...args: unknown[]) => void;
  }
}

// Helper to safely call gtag
const trackGA4 = (eventName: string, params?: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
};

// Helper to track Facebook Pixel events
const trackFacebook = (eventName: string, params?: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', eventName, params);
  }
};

// Helper to track LinkedIn events
const trackLinkedIn = (conversionId: string) => {
  if (typeof window !== 'undefined' && window.lintrk) {
    window.lintrk('track', { conversion_id: conversionId });
  }
};

// Helper to track PostHog events
const trackPostHog = (eventName: string, params?: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && window.posthog) {
    window.posthog.capture(eventName, params);
  }
};

// Multi-provider event tracking
const trackEvent = (
  eventName: string, 
  params?: Record<string, unknown>,
  providers: string[] = ['ga4']
) => {
  if (typeof window === 'undefined') return;

  console.log(`[Analytics] Event tracked: ${eventName}`, params);

  providers.forEach(provider => {
    switch (provider) {
      case 'ga4':
        trackGA4(eventName, params);
        break;
      case 'facebook_pixel':
        trackFacebook(eventName, params);
        break;
      case 'linkedin':
        trackLinkedIn(eventName);
        break;
      case 'posthog':
        trackPostHog(eventName, params);
        break;
    }
  });
};

// 1️⃣ Event: sign_up_complete - After successful signup
export const trackSignUpComplete = (method: string = 'email') => {
  trackEvent('sign_up_complete', { method }, ['ga4', 'facebook_pixel', 'linkedin']);
};

// 2️⃣ Event: trial_started - After trial activation
export const trackTrialStarted = (trialDays: number = 5) => {
  trackEvent('trial_started', { trial_days: trialDays }, ['ga4', 'facebook_pixel']);
};

// 3️⃣ Event: subscription_success - After successful Stripe payment
export const trackSubscriptionSuccess = (plan: string, billing: string, value: number) => {
  trackEvent('subscription_success', { plan, billing, value }, ['ga4', 'facebook_pixel', 'linkedin']);
  
  // Also send as purchase event for Facebook
  if (window.fbq) {
    window.fbq('track', 'Purchase', { value, currency: 'USD' });
  }
};

// 4️⃣ Event: document_download - When user downloads any document
export const trackDocumentDownload = (documentType: string = 'pdf') => {
  trackEvent('document_download', { document_type: documentType }, ['ga4']);
};

// 5️⃣ Event: contact_submit - When contact form is submitted
export const trackContactSubmit = () => {
  trackEvent('contact_submit', {}, ['ga4', 'facebook_pixel']);
  
  // Facebook Lead event
  if (window.fbq) {
    window.fbq('track', 'Lead');
  }
};

// 6️⃣ Event: deal_view - When user views deal details
export const trackDealView = (dealType: string, accessLevel: string) => {
  trackEvent('deal_view', { deal_type: dealType, access_level: accessLevel }, ['ga4']);
};

// 7️⃣ Event: search_used - When user uses search or filters
export const trackSearchUsed = (searchType: string, keyword: string) => {
  trackEvent('search_used', { search_type: searchType, keyword }, ['ga4']);
};

// 8️⃣ Event: feature_locked_view - When free user tries to access locked feature
export const trackFeatureLockedView = (featureName: string) => {
  trackEvent('feature_locked_view', { feature_name: featureName }, ['ga4']);
};

// 9️⃣ Event: pricing_view - When pricing/subscription page is viewed
export const trackPricingView = () => {
  trackEvent('pricing_view', {}, ['ga4', 'facebook_pixel']);
};

// 🔟 Event: product_viewed - When user views product details
export const trackProductViewed = (productName: string, productCategory?: string) => {
  trackEvent('product_viewed', { product_name: productName, product_category: productCategory }, ['ga4']);
};

// 1️⃣1️⃣ Event: company_contacted - When user initiates contact with a company
export const trackCompanyContacted = (companyName: string, contactMethod?: string) => {
  trackEvent('company_contacted', { company_name: companyName, contact_method: contactMethod }, ['ga4', 'linkedin']);
};

// 1️⃣2️⃣ Event: broker_profile_viewed - When user views broker profile
export const trackBrokerProfileViewed = (brokerId: string) => {
  trackEvent('broker_profile_viewed', { broker_id: brokerId }, ['ga4']);
};

// 1️⃣3️⃣ Event: deal_started - When user starts a new deal
export const trackDealStarted = (dealType: string, value?: number) => {
  trackEvent('deal_started', { deal_type: dealType, deal_value: value }, ['ga4', 'facebook_pixel', 'linkedin']);
};

// 1️⃣4️⃣ Event: document_generated - When user generates a document
export const trackDocumentGenerated = (documentType: string) => {
  trackEvent('document_generated', { document_type: documentType }, ['ga4']);
};

// Page view tracking
export const trackPageView = (pagePath: string, pageTitle: string) => {
  trackEvent('page_view', { page_path: pagePath, page_title: pageTitle }, ['ga4']);
};

// UTM Parameter capture
export const captureUTMParams = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  
  const params = new URLSearchParams(window.location.search);
  const utmParams: Record<string, string> = {};
  
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(key => {
    const value = params.get(key);
    if (value) {
      utmParams[key] = value;
    }
  });
  
  // Store in sessionStorage for later use
  if (Object.keys(utmParams).length > 0) {
    sessionStorage.setItem('utm_params', JSON.stringify(utmParams));
  }
  
  return utmParams;
};

// Get stored UTM params
export const getStoredUTMParams = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = sessionStorage.getItem('utm_params');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// Export the generic trackEvent for custom tracking needs
export { trackEvent };
