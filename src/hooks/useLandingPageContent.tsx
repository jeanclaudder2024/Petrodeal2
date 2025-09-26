import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LandingPageContent {
  id: string;
  section_name: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  content: any;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useLandingPageContent = (sectionName: string) => {
  const [content, setContent] = useState<LandingPageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error: fetchError } = await supabase
          .from('landing_page_content')
          .select('*')
          .eq('section_name', sectionName)
          .eq('is_active', true)
          .maybeSingle();

        if (fetchError) {
          throw fetchError;
        }

        setContent(data);
      } catch (err) {
        console.error('Error fetching landing page content:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch content');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [sectionName]);

  return { content, loading, error };
};