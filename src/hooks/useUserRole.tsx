
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'admin' | 'broker' | 'trader' | 'user' | null;

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('get_user_role', {
          _user_id: user.id
        });

        if (error) {
          console.error('Error fetching user role:', error);
          setRole('user'); // Default fallback
        } else {
          setRole(data || 'user');
        }
      } catch (error) {
        console.error('Failed to fetch user role:', error);
        setRole('user'); // Default fallback
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  const isAdmin = role === 'admin';
  const isBroker = role === 'broker';
  const isTrader = role === 'trader';

  return {
    role,
    loading,
    isAdmin,
    isBroker,
    isTrader
  };
};
