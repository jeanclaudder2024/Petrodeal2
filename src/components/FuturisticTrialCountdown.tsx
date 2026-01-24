import React, { useEffect, useState, useCallback } from 'react';
import { Clock, Zap, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAccess } from '@/contexts/AccessContext';
import { supabase } from "@/integrations/supabase/client";
import { db } from '@/lib/supabase-helper';

interface AccessData {
  access_type?: string;
  trial_active?: boolean;
  trial_days_left?: number;
}

const FuturisticTrialCountdown: React.FC = () => {
  const navigate = useNavigate();
  const { accessType, trialDaysLeft: contextTrialDays } = useAccess();
  const [accessData, setAccessData] = useState<AccessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [defaultTrialDays, setDefaultTrialDays] = useState(7);

  const checkAccess = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch default_trial_days from system_settings (use maybeSingle to avoid 406 when missing)
      const { data: settingsData } = await db
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'default_trial_days')
        .maybeSingle();
      
      if (settingsData?.setting_value != null) {
        const v = settingsData.setting_value;
        const num = typeof v === 'number' ? v : parseInt(String(v), 10);
        if (!isNaN(num) && num > 0) {
          setDefaultTrialDays(num);
        }
      }

      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      setAccessData(data);
    } catch (error) {
      console.error('Error checking access:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  const isTrial = accessType === 'trial' || accessData?.access_type === 'trial';
  const isExpired = accessType === 'expired' || accessData?.access_type === 'expired';
  const hasSubscription = accessType === 'subscription' || accessData?.access_type === 'subscription';
  const trialDaysLeft = accessData?.trial_days_left ?? contextTrialDays ?? 0;
  const trialActive = accessData?.trial_active ?? isTrial;

  if (loading || isExpired || hasSubscription || !trialActive || !isTrial) {
    return null;
  }

  const displayDays = Math.max(0, trialDaysLeft);
  const isLastDay = displayDays <= 1;
  const isUrgent = displayDays <= 3;
  const progress = Math.max(0, Math.min(100, ((defaultTrialDays - displayDays) / defaultTrialDays) * 100));

  return (
    <Card className={`relative overflow-hidden border-0 ${
      isUrgent 
        ? 'bg-gradient-to-br from-red-900/90 via-orange-900/80 to-yellow-900/70' 
        : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
    }`}>
      {/* Industrial overlay pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(255,255,255,0.03) 10px,
            rgba(255,255,255,0.03) 20px
          )`
        }} />
      </div>
      
      {/* Glow effect */}
      <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl ${
        isUrgent ? 'bg-red-500/30' : 'bg-amber-500/20'
      }`} />
      
      <CardContent className="relative p-6">
        <div className="flex items-center gap-6">
          {/* Futuristic Clock Display */}
          <div className="relative">
            {/* Outer ring */}
            <div className={`w-24 h-24 rounded-full border-4 ${
              isUrgent ? 'border-red-500/50' : 'border-amber-500/50'
            } flex items-center justify-center relative`}>
              {/* Progress ring */}
              <svg className="absolute w-full h-full -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="44"
                  fill="none"
                  stroke={isUrgent ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}
                  strokeWidth="4"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="44"
                  fill="none"
                  stroke={isUrgent ? '#ef4444' : '#f59e0b'}
                  strokeWidth="4"
                  strokeDasharray={`${(100 - progress) * 2.76} 276`}
                  className="transition-all duration-1000"
                />
              </svg>
              
              {/* Inner content */}
              <div className="text-center z-10">
                <div className={`text-3xl font-black ${
                  isUrgent ? 'text-red-400' : 'text-amber-400'
                } font-mono tracking-tight`}>
                  {displayDays}
                </div>
                <div className="text-xs text-slate-400 uppercase tracking-widest">
                  {displayDays === 1 ? 'Day' : 'Days'}
                </div>
              </div>
              
              {/* Pulse effect for urgent */}
              {isUrgent && (
                <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-30" />
              )}
            </div>
            
            {/* Icon badge */}
            <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full ${
              isUrgent ? 'bg-red-500' : 'bg-amber-500'
            } flex items-center justify-center shadow-lg`}>
              {isUrgent ? (
                <AlertTriangle className="w-4 h-4 text-white" />
              ) : (
                <Clock className="w-4 h-4 text-white" />
              )}
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                isUrgent 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                <Zap className="w-3 h-3" />
                Free Trial
              </span>
            </div>
            
            <h3 className={`text-lg font-bold ${
              isUrgent ? 'text-red-300' : 'text-amber-200'
            }`}>
              {isLastDay 
                ? 'Your trial expires today!' 
                : `Your free trial expires in ${displayDays} days`
              }
            </h3>
            
            <p className="text-sm text-slate-400 mt-1">
              {isLastDay 
                ? 'Upgrade now to continue accessing all premium features.'
                : 'Upgrade to unlock unlimited vessel tracking, port data, and premium analytics.'
              }
            </p>
            
            {/* Progress bar */}
            <div className="mt-3 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  isUrgent 
                    ? 'bg-gradient-to-r from-red-500 to-orange-500' 
                    : 'bg-gradient-to-r from-amber-500 to-yellow-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-slate-500">Trial started</span>
              <span className={`text-xs ${isUrgent ? 'text-red-400' : 'text-amber-400'}`}>
                {displayDays} days remaining
              </span>
            </div>
          </div>
          
          {/* CTA Button */}
          <Button 
            onClick={() => navigate('/subscription')}
            size="lg"
            className={`relative overflow-hidden font-bold ${
              isUrgent 
                ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white' 
                : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black'
            } shadow-lg`}
          >
            <span className="relative z-10">
              {isLastDay ? 'Upgrade Now' : 'View Plans'}
            </span>
            {/* Shine effect */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </Button>
        </div>
      </CardContent>
      
      <style>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </Card>
  );
};

export default FuturisticTrialCountdown;
