import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, RefreshCw, CheckCircle, XCircle, Clock, Eye, 
  DollarSign, Users, TrendingUp, CreditCard 
} from "lucide-react";
import { format } from "date-fns";

interface BrokerMembership {
  id: string;
  user_id: string;
  email: string;
  payment_status: string;
  membership_status: string;
  verification_status: string;
  amount: number;
  currency: string;
  stripe_session_id: string | null;
  payment_date: string | null;
  created_at: string;
  updated_at: string;
}

interface BrokerProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string;
  company_name: string | null;
  country: string | null;
  verified_at: string | null;
}

const BrokerSubscriptionManagement = () => {
  const [memberships, setMemberships] = useState<BrokerMembership[]>([]);
  const [profiles, setProfiles] = useState<BrokerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMembership, setSelectedMembership] = useState<BrokerMembership | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<BrokerProfile | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [membershipsRes, profilesRes] = await Promise.all([
        supabase.from('broker_memberships').select('*').order('created_at', { ascending: false }),
        supabase.from('broker_profiles').select('*')
      ]);

      if (membershipsRes.error) throw membershipsRes.error;
      if (profilesRes.error) throw profilesRes.error;

      setMemberships(membershipsRes.data || []);
      setProfiles(profilesRes.data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getProfileForMembership = (membership: BrokerMembership) => {
    return profiles.find(p => p.user_id === membership.user_id);
  };

  const handleAction = async (action: 'approve' | 'reject' | 'activate' | 'deactivate') => {
    if (!selectedMembership) return;
    setProcessing(true);

    try {
      const updates: Partial<BrokerMembership> = {
        updated_at: new Date().toISOString()
      };

      if (action === 'approve') {
        updates.verification_status = 'verified';
        updates.membership_status = 'active';
      } else if (action === 'reject') {
        updates.verification_status = 'rejected';
        updates.membership_status = 'rejected';
      } else if (action === 'activate') {
        updates.membership_status = 'active';
      } else if (action === 'deactivate') {
        updates.membership_status = 'suspended';
      }

      const { error } = await supabase
        .from('broker_memberships')
        .update(updates)
        .eq('id', selectedMembership.id);

      if (error) throw error;

      // Update broker profile verification if approving
      if (action === 'approve' && selectedProfile) {
        await supabase
          .from('broker_profiles')
          .update({ 
            verified_at: new Date().toISOString(),
            verification_notes: actionNotes
          })
          .eq('id', selectedProfile.id);
      }

      toast({ 
        title: "Success", 
        description: `Membership ${action}d successfully` 
      });

      setActionDialogOpen(false);
      setSelectedMembership(null);
      setActionNotes('');
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      active: { variant: "default", icon: CheckCircle },
      pending: { variant: "secondary", icon: Clock },
      rejected: { variant: "destructive", icon: XCircle },
      suspended: { variant: "outline", icon: XCircle },
      verified: { variant: "default", icon: CheckCircle },
      paid: { variant: "default", icon: CreditCard },
    };

    const config = statusConfig[status] || { variant: "outline", icon: Clock };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const filteredMemberships = memberships.filter(m => {
    const profile = getProfileForMembership(m);
    const matchesSearch = 
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile?.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      m.membership_status === statusFilter ||
      m.verification_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: memberships.length,
    active: memberships.filter(m => m.membership_status === 'active').length,
    pending: memberships.filter(m => m.verification_status === 'pending').length,
    revenue: memberships.filter(m => m.payment_status === 'paid').reduce((sum, m) => sum + (m.amount || 0), 0) / 100
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Brokers</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/10">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <DollarSign className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${stats.revenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Broker Memberships</CardTitle>
          <CardDescription>Manage broker subscriptions, verify profiles, and control access</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, name, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Broker</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Membership</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMemberships.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No broker memberships found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMemberships.map((membership) => {
                    const profile = getProfileForMembership(membership);
                    return (
                      <TableRow key={membership.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{profile?.full_name || 'N/A'}</p>
                            <p className="text-sm text-muted-foreground">{membership.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{profile?.company_name || 'N/A'}</p>
                            <p className="text-sm text-muted-foreground">{profile?.country || ''}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            {getStatusBadge(membership.payment_status || 'pending')}
                            <p className="text-sm text-muted-foreground mt-1">
                              ${((membership.amount || 0) / 100).toFixed(2)} {membership.currency?.toUpperCase()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(membership.membership_status || 'pending')}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(membership.verification_status || 'pending')}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{format(new Date(membership.created_at), 'MMM d, yyyy')}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(membership.created_at), 'HH:mm')}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedMembership(membership);
                                setSelectedProfile(profile || null);
                                setActionDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Manage
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Broker Membership</DialogTitle>
            <DialogDescription>
              Review and manage this broker's membership status
            </DialogDescription>
          </DialogHeader>

          {selectedMembership && (
            <div className="space-y-6">
              {/* Broker Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedMembership.email}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedProfile?.full_name || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Company</p>
                  <p className="font-medium">{selectedProfile?.company_name || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedProfile?.phone || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Country</p>
                  <p className="font-medium">{selectedProfile?.country || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Amount Paid</p>
                  <p className="font-medium">
                    ${((selectedMembership.amount || 0) / 100).toFixed(2)} {selectedMembership.currency?.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Current Status */}
              <div className="flex gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Payment Status</p>
                  {getStatusBadge(selectedMembership.payment_status || 'pending')}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Membership Status</p>
                  {getStatusBadge(selectedMembership.membership_status || 'pending')}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Verification Status</p>
                  {getStatusBadge(selectedMembership.verification_status || 'pending')}
                </div>
              </div>

              {/* Notes */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Admin Notes (optional)</p>
                <Textarea
                  placeholder="Add notes about this action..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                {selectedMembership.verification_status === 'pending' && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => handleAction('reject')}
                      disabled={processing}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleAction('approve')}
                      disabled={processing}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve & Verify
                    </Button>
                  </>
                )}
                {selectedMembership.membership_status === 'active' && (
                  <Button
                    variant="outline"
                    onClick={() => handleAction('deactivate')}
                    disabled={processing}
                  >
                    Suspend Membership
                  </Button>
                )}
                {selectedMembership.membership_status === 'suspended' && (
                  <Button
                    onClick={() => handleAction('activate')}
                    disabled={processing}
                  >
                    Reactivate Membership
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrokerSubscriptionManagement;
