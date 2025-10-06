import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  Shield, 
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import BrokerMembershipPricing from '@/components/BrokerMembershipPricing';

const BrokerMembership = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [membershipStatus, setMembershipStatus] = useState<any>(null);

  useEffect(() => {
    if (user) {
      checkMembershipStatus();
    }
  }, [user]);

  const checkMembershipStatus = async () => {
    try {
      const { data: membershipData } = await supabase.functions.invoke('check-broker-membership');
      setMembershipStatus(membershipData);
    } catch (error) {
      console.error('Error checking membership status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (membershipStatus && membershipStatus.has_membership && membershipStatus.payment_status === 'paid') {
    // User already has paid membership, redirect to setup
    navigate('/broker-setup');
    return null;
  }

  return <BrokerMembershipPricing />;
};

export default BrokerMembership;