import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { db } from '@/lib/supabase-helper';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface UnsubscribeRequest {
  id: string;
  user_id: string;
  subscriber_id: string | null;
  reason: string | null;
  status: string;
  policy_accepted: boolean;
  subscription_end_date: string | null;
  requested_at: string;
  approved_by: string | null;
  approved_at: string | null;
  admin_notes: string | null;
}

interface SubscriberInfo {
  email: string;
  subscription_tier: string | null;
}

const UnsubscribeRequestsManagement: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<(UnsubscribeRequest & { subscriber?: SubscriberInfo })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<UnsubscribeRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Fetch unsubscribe requests
      const { data, error } = await db
        .from('unsubscribe_requests')
        .select('*')
        .order('requested_at', { ascending: false });

      if (error) {
        console.error('Error fetching unsubscribe_requests:', error);
        throw error;
      }

      console.log('Fetched unsubscribe requests:', data?.length || 0);

      // Fetch all unique user_ids and subscriber_ids from requests
      const userIds = [...new Set((data || []).map(r => r.user_id).filter(Boolean))];
      
      // Batch fetch subscribers by user_id
      let subscribersMap: Record<string, { email: string; subscription_tier: string | null }> = {};
      
      if (userIds.length > 0) {
        const { data: subscribersData, error: subError } = await db
          .from('subscribers')
          .select('user_id, email, subscription_tier')
          .in('user_id', userIds);
        
        if (!subError && subscribersData) {
          subscribersData.forEach((sub: any) => {
            if (sub.user_id) {
              subscribersMap[sub.user_id] = {
                email: sub.email || 'Unknown',
                subscription_tier: sub.subscription_tier
              };
            }
          });
        }
        console.log('Subscribers found:', Object.keys(subscribersMap).length);
      }

      // Map requests with subscriber info
      const requestsWithInfo = (data || []).map(req => {
        const subscriber = req.user_id ? subscribersMap[req.user_id] : null;
        
        return {
          ...req,
          subscriber: subscriber || { 
            email: req.user_id ? `User: ${req.user_id.substring(0, 8)}...` : 'Unknown User', 
            subscription_tier: null 
          }
        };
      });

      console.log('Processed requests:', requestsWithInfo.length);
      setRequests(requestsWithInfo);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load unsubscribe requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedRequest || !actionType || !user?.id) return;

    setProcessing(true);
    try {
      const updateData: Record<string, unknown> = {
        status: actionType === 'approve' ? 'approved' : 'rejected',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        admin_notes: adminNotes || null
      };

      const { error } = await db
        .from('unsubscribe_requests')
        .update(updateData)
        .eq('id', selectedRequest.id);

      if (error) throw error;

      // CRITICAL: If approved, lock the user's account
      if (actionType === 'approve' && selectedRequest.user_id) {
        const { error: lockError } = await db
          .from('subscribers')
          .update({
            is_locked: true,
            locked_at: new Date().toISOString(),
            locked_reason: 'Subscription cancelled by user request',
            subscribed: false,
            subscription_status: 'cancelled',
            is_trial_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', selectedRequest.user_id);

        if (lockError) {
          console.error('Error locking account:', lockError);
          toast.warning('Request approved but failed to lock account. Please lock manually.');
        } else {
          toast.success('Request approved and account locked successfully');
        }
      } else {
        toast.success(`Request ${actionType === 'approve' ? 'approved' : 'rejected'} successfully`);
      }

      setSelectedRequest(null);
      setAdminNotes('');
      setActionType(null);
      fetchRequests();
    } catch (error) {
      console.error('Error processing request:', error);
      toast.error('Failed to process request');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30"><CheckCircle className="h-3 w-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.subscriber?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>Unsubscribe Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No unsubscribe requests found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <div 
                  key={request.id} 
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{request.subscriber?.email || 'Unknown User'}</span>
                        {getStatusBadge(request.status)}
                        {request.subscriber?.subscription_tier && (
                          <Badge variant="secondary">{request.subscriber.subscription_tier}</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Requested: {format(new Date(request.requested_at), 'MMM dd, yyyy HH:mm')}
                        </span>
                        {request.subscription_end_date && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Period ends: {format(new Date(request.subscription_end_date), 'MMM dd, yyyy')}
                          </span>
                        )}
                      </div>

                      {request.reason && (
                        <div className="flex items-start gap-2 text-sm">
                          <MessageSquare className="h-3 w-3 mt-1 text-muted-foreground" />
                          <span className="text-muted-foreground">{request.reason}</span>
                        </div>
                      )}

                      {request.admin_notes && (
                        <div className="p-2 bg-muted/50 rounded text-sm">
                          <span className="font-medium">Admin notes:</span> {request.admin_notes}
                        </div>
                      )}
                    </div>

                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-green-600 hover:bg-green-50 hover:text-green-700"
                          onClick={() => {
                            setSelectedRequest(request);
                            setActionType('approve');
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => {
                            setSelectedRequest(request);
                            setActionType('reject');
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={!!selectedRequest && !!actionType} onOpenChange={() => {
        setSelectedRequest(null);
        setActionType(null);
        setAdminNotes('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === 'approve' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              {actionType === 'approve' ? 'Approve' : 'Reject'} Unsubscribe Request
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' 
                ? "This will approve the user's request to cancel their subscription."
                : "This will reject the user's request. The subscription will remain active."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedRequest && (
              <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                <p><span className="font-medium">User:</span> {(selectedRequest as any).subscriber?.email}</p>
                {selectedRequest.reason && (
                  <p><span className="font-medium">Reason:</span> {selectedRequest.reason}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Admin Notes (optional)</label>
              <Textarea
                placeholder="Add notes for the user or internal reference..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setSelectedRequest(null);
              setActionType(null);
              setAdminNotes('');
            }}>
              Cancel
            </Button>
            <Button 
              variant={actionType === 'approve' ? 'default' : 'destructive'}
              onClick={handleAction}
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UnsubscribeRequestsManagement;
