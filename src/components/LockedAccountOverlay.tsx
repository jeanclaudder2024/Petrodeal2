import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, CreditCard, Mail, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LockedAccountOverlayProps {
  reason?: string;
}

const LockedAccountOverlay: React.FC<LockedAccountOverlayProps> = ({ 
  reason = 'Your trial has expired. Please subscribe to continue using the platform.' 
}) => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="max-w-lg w-full border-destructive/50 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl text-destructive">Account Locked</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-3 p-4 bg-destructive/5 rounded-lg border border-destructive/20">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">{reason}</p>
          </div>

          <div className="space-y-3">
            <p className="text-center text-muted-foreground text-sm">
              To unlock your account and regain access to all features, please subscribe to one of our plans.
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => navigate('/subscription')}
            >
              <CreditCard className="mr-2 h-5 w-5" />
              Subscribe Now
            </Button>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/support')}
            >
              <Mail className="mr-2 h-5 w-5" />
              Contact Support
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            If you believe this is an error, please contact our support team for assistance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LockedAccountOverlay;
