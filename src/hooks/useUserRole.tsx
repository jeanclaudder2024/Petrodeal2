
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
        console.log('No user found, setting role to null');
        setRole(null);
        setLoading(false);
        return;
      }

      console.log('Fetching role for user:', user.email, 'ID:', user.id);

      try {
        const { data, error } = await supabase.rpc('get_user_role', {
          _user_id: user.id
        });

        console.log('Role query result:', { data, error });

        if (error) {
          console.error('Error fetching user role:', error);
          setRole('user'); // Default fallback
        } else {
          console.log('Setting role to:', data || 'user');
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

  console.log('Current role state:', { role, isAdmin, isBroker, isTrader, loading });

  return {
    role,
    loading,
    isAdmin,
    isBroker,
    isTrader
  };
};
