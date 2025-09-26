import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAccess } from '@/contexts/AccessContext';
import { useNavigate } from 'react-router-dom';
import LoadingFallback from '@/components/LoadingFallback';
import AccessGate from '@/components/AccessGate';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSubscription?: boolean;
  fallbackMessage?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireSubscription = false,
  fallbackMessage = "This feature requires an active subscription"
}) => {
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, accessType, loading: accessLoading } = useAccess();
  const navigate = useNavigate();

  // Debug logging
  useEffect(() => {
    console.log('ProtectedRoute state:', {
      user: !!user,
      userEmail: user?.email,
      hasAccess,
      accessType,
      authLoading,
      accessLoading,
      requireSubscription
    });
  }, [user, hasAccess, accessType, authLoading, accessLoading, requireSubscription]);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('Redirecting to auth - no user');
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Show loading while checking auth or access
  if (authLoading || accessLoading) {
    return <LoadingFallback />;
  }

  // Not authenticated
  if (!user) {
    return null; // Will redirect via useEffect
  }

  // Subscription required but user doesn't have it
  if (requireSubscription && accessType !== 'subscription') {
    return (
      <AccessGate 
        fallbackMessage={fallbackMessage}
        showUpgradePrompt={true}
      >
        <div></div>
      </AccessGate>
    );
  }

  // No access at all (expired trial)
  if (!hasAccess) {
    return (
      <AccessGate 
        fallbackMessage="Your access has expired. Please subscribe to continue using the platform."
        showUpgradePrompt={true}
      >
        <div></div>
      </AccessGate>
    );
  }

  // All checks passed, render children
  return <>{children}</>;
};

export default ProtectedRoute;