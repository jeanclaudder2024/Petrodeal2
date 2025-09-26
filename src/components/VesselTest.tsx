import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const VesselTest = () => {
  const [vessels, setVessels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testVesselConnection = async () => {
      try {
        console.log('🧪 Testing vessel connection...');
        
        // Test basic connection
        const { data, error, count } = await supabase
          .from('vessels')
          .select('*', { count: 'exact' });
        
        console.log('🧪 Test result:', { data, error, count });
        
        if (error) {
          setError(error.message);
          console.error('🧪 Error:', error);
        } else {
          setVessels(data || []);
          console.log('🧪 Success! Found', data?.length || 0, 'vessels');
        }
      } catch (err) {
        console.error('🧪 Exception:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    testVesselConnection();
  }, []);

  if (loading) return <div>Testing vessel connection...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Vessel Test Results</h2>
      <p>Found {vessels.length} vessels</p>
      {vessels.slice(0, 3).map((vessel, index) => (
        <div key={index} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
          <strong>{vessel.name}</strong> - {vessel.vessel_type} - {vessel.flag}
        </div>
      ))}
    </div>
  );
};

export default VesselTest;