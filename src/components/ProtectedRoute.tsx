import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAccess } from '@/contexts/AccessContext';
import { useNavigate } from 'react-router-dom';
import LoadingFallback from '@/components/LoadingFallback';
import AccessGate from '@/components/AccessGate';
import LockedAccountOverlay from '@/components/LockedAccountOverlay';
import { supabase } from '@/lib/supabase-helper';

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
  const [isLocked, setIsLocked] = useState(false);
  const [lockReason, setLockReason] = useState<string>('');
  const [checkingLock, setCheckingLock] = useState(true);

  // Check if account is locked
  useEffect(() => {
    const checkLockStatus = async () => {
      if (!user?.email) {
        setCheckingLock(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('check-subscription');
        
        if (!error && data) {
          if (data.is_locked || data.access_type === 'locked') {
            setIsLocked(true);
            setLockReason(data.locked_reason || 'Your trial has expired. Please subscribe to continue.');
          } else {
            setIsLocked(false);
            setLockReason('');
          }
        }
      } catch (err) {
        console.error('Error checking lock status:', err);
      } finally {
        setCheckingLock(false);
      }
    };

    if (!authLoading && user) {
      checkLockStatus();
    } else if (!authLoading && !user) {
      setCheckingLock(false);
    }
  }, [user, authLoading]);

  // Debug logging
  useEffect(() => {
    console.log('ProtectedRoute state:', {
      user: !!user,
      userEmail: user?.email,
      hasAccess,
      accessType,
      authLoading,
      accessLoading,
      isLocked,
      checkingLock,
      requireSubscription
    });
  }, [user, hasAccess, accessType, authLoading, accessLoading, isLocked, checkingLock, requireSubscription]);

  // Redirect to auth if not authenticated - only after loading is complete
  useEffect(() => {
    if (!authLoading && !accessLoading && !checkingLock && !user) {
      console.log('Redirecting to auth - no user');
      navigate('/auth');
    }
  }, [user, authLoading, accessLoading, checkingLock, navigate]);

  // Show loading while checking auth, access, or lock status
  if (authLoading || accessLoading || checkingLock) {
    return <LoadingFallback />;
  }

  // Not authenticated
  if (!user) {
    return null; // Will redirect via useEffect
  }

  // Account is locked - show overlay
  if (isLocked) {
    return <LockedAccountOverlay reason={lockReason} />;
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
