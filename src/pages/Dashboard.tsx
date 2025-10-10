import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAccess } from '@/contexts/AccessContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LoadingFallback from '@/components/LoadingFallback';
import AccessControlledDashboard from '@/components/dashboard/AccessControlledDashboard';
import AccessGate from '@/components/AccessGate';
import TrialCountdown from '@/components/TrialCountdown';
import { MobileDashboard } from '@/components/MobileDashboard';
import LanguageIndicator from '@/components/LanguageTest';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, accessType, trialDaysLeft, loading: accessLoading } = useAccess();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

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
          fallbackMessage={t('subscription.trialExpired', 'Your free trial has expired. Please subscribe to continue using the platform.')}
          showUpgradePrompt={true}
        >
          <div></div>
        </AccessGate>
      </div>
    );
  }

  if (isMobile) {
    return (
      <MobileDashboard>
        {/* Language Indicator */}
        <LanguageIndicator />
        {/* Show trial countdown at the top of dashboard */}
        <div className="mb-4">
          <TrialCountdown />
        </div>
        <AccessControlledDashboard />
      </MobileDashboard>
    );
  }

  return (
    <div>
      {/* Language Indicator */}
      <div className="container mx-auto px-4 pt-4">
        <LanguageIndicator />
      </div>
      {/* Show trial countdown at the top of dashboard */}
      <div className="container mx-auto px-4 pt-4">
        <TrialCountdown />
      </div>
      <AccessControlledDashboard />
    </div>
  );
};

export default Dashboard;