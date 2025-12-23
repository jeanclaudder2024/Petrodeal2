import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertTriangle, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { db } from '@/lib/supabase-helper';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface UnsubscribeRequestProps {
  subscriptionEndDate?: string | null;
  isTrialActive?: boolean;
  showForTrial?: boolean;
}

interface ExistingRequest {
  id: string;
  status: string;
  reason: string | null;
  requested_at: string;
  admin_notes: string | null;
}

const UnsubscribeRequest: React.FC<UnsubscribeRequestProps> = ({
  subscriptionEndDate,
  isTrialActive = false,
  showForTrial = false
}) => {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingRequest, setExistingRequest] = useState<ExistingRequest | null>(null);
  const [checkingRequest, setCheckingRequest] = useState(true);

  useEffect(() => {
    if (user?.id) {
      checkExistingRequest();
    }
  }, [user?.id]);

  const checkExistingRequest = async () => {
    if (!user?.id) return;
    
    setCheckingRequest(true);
    try {
      const { data, error } = await db
        .from('unsubscribe_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('requested_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setExistingRequest(data);
      }
    } catch (error) {
      console.error('Error checking existing request:', error);
    } finally {
      setCheckingRequest(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!user?.id || !policyAccepted) return;

    setLoading(true);
    try {
      const { error } = await db
        .from('unsubscribe_requests')
        .insert({
          user_id: user.id,
          reason: reason || null,
          policy_accepted: true,
          subscription_end_date: subscriptionEndDate || null,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Unsubscribe request submitted successfully');
      setIsDialogOpen(false);
      setPolicyAccepted(false);
      setReason('');
      checkExistingRequest();
    } catch (error) {
      console.error('Error submitting unsubscribe request:', error);
      toast.error('Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30"><Clock className="h-3 w-3 mr-1" /> Pending Review</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30"><CheckCircle className="h-3 w-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (checkingRequest) {
    return (
      <Card className="mt-6 border-destructive/20">
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  // Show existing request status
  if (existingRequest && existingRequest.status !== 'rejected') {
    return (
      <Card className="mt-6 border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            Unsubscribe Request
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status:</span>
            {getStatusBadge(existingRequest.status)}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Submitted:</span>
            <span className="text-sm">{format(new Date(existingRequest.requested_at), 'MMM dd, yyyy HH:mm')}</span>
          </div>
          {existingRequest.reason && (
            <div>
              <span className="text-sm text-muted-foreground">Your reason:</span>
              <p className="text-sm mt-1">{existingRequest.reason}</p>
            </div>
          )}
          {existingRequest.admin_notes && existingRequest.status !== 'pending' && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Admin Response:</span>
              <p className="text-sm mt-1">{existingRequest.admin_notes}</p>
            </div>
          )}
          {existingRequest.status === 'pending' && (
            <p className="text-sm text-muted-foreground">
              Your request is being reviewed by our team. You will be notified once a decision is made.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Different UI for trial users
  const cardTitle = showForTrial ? 'End Free Trial' : 'Cancel Subscription';
  const cardDescription = showForTrial 
    ? 'Request to end your free trial early. Requires admin approval.'
    : 'Request to cancel your subscription. Requires admin approval.';

  return (
    <>
      <Card className="mt-6 border-destructive/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {cardTitle}
          </CardTitle>
          <CardDescription>
            {cardDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <p className="font-medium mb-2">Important Information:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {showForTrial ? (
                  <>
                    <li>Ending your free trial requires admin approval</li>
                    <li>Once approved, you will lose access to trial features</li>
                    <li>You can re-subscribe to a paid plan at any time</li>
                  </>
                ) : (
                  <>
                    <li>Unsubscribe requests require admin approval</li>
                    <li>Your subscription will remain active until the current period ends</li>
                    {subscriptionEndDate && (
                      <li>Current period ends: {format(new Date(subscriptionEndDate), 'MMMM dd, yyyy')}</li>
                    )}
                  </>
                )}
              </ul>
            </div>
            <Button 
              variant="outline" 
              className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
              onClick={() => setIsDialogOpen(true)}
            >
              {showForTrial ? 'End Free Trial' : 'Request Unsubscribe'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Request Subscription Cancellation
            </DialogTitle>
            <DialogDescription>
              Please review the cancellation policy before submitting your request.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg text-sm space-y-2">
              <p className="font-semibold">Cancellation Policy:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>All unsubscribe requests require admin approval</li>
                <li>Cancellation is only processed after your current billing period ends</li>
                <li>If you're on a free trial, the trial period must complete first</li>
                <li>You will retain access to all features until the subscription end date</li>
                <li>Refunds are handled on a case-by-case basis</li>
                <li>Re-subscribing after cancellation may not include previous discounts</li>
              </ol>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for cancellation (optional)</Label>
              <Textarea
                id="reason"
                placeholder="Please let us know why you're leaving..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="policy"
                checked={policyAccepted}
                onCheckedChange={(checked) => setPolicyAccepted(checked === true)}
              />
              <label
                htmlFor="policy"
                className="text-sm leading-tight cursor-pointer"
              >
                I have read and accept the cancellation policy. I understand that my request requires admin approval and my subscription will remain active until the end of the current period.
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleSubmitRequest}
              disabled={!policyAccepted || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UnsubscribeRequest;
