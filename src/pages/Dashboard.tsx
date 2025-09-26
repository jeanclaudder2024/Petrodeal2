import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAccess } from '@/contexts/AccessContext';
import LoadingFallback from '@/components/LoadingFallback';
import AccessControlledDashboard from '@/components/dashboard/AccessControlledDashboard';
import AccessGate from '@/components/AccessGate';
import TrialCountdown from '@/components/TrialCountdown';
import VesselTest from '@/components/VesselTest';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, accessType, trialDaysLeft, loading: accessLoading } = useAccess();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
  }, [user, authLoading, navigate]);

  if (authLoading || accessLoading) {
    return <LoadingFallback />;
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  // Show access gate if user doesn't have access (expired trial)
  if (!hasAccess && accessType === 'expired') {
    return (
      <div className="container mx-auto px-4 py-8">
        <AccessGate 
          fallbackMessage="Your free trial has expired. Please subscribe to continue using the platform."
          showUpgradePrompt={true}
        >
          <div></div>
        </AccessGate>
      </div>
    );
  }

  return (
    <div>
      {/* Show trial countdown at the top of dashboard */}
      <div className="container mx-auto px-4 pt-4">
        <TrialCountdown />
      </div>
      {/* Temporary vessel test */}
      <VesselTest />
      <AccessControlledDashboard />
    </div>
  );
};

export default Dashboard;