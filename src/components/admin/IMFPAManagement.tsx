import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  FileText, 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Trash2,
  Download,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { db } from '@/lib/supabase-helper';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface IMFPAAgreement {
  imfpa_id: string;
  deal_id: string;
  imfpa_reference_code: string | null;
  status: string;
  broker_role: string | null;
  broker_entity_name: string | null;
  seller_entity_name: string | null;
  buyer_entity_name: string | null;
  commodity_type: string | null;
  commission_type: string | null;
  commission_value: number | null;
  currency: string | null;
  valid_from: string | null;
  valid_until: string | null;
  signed_by_broker: boolean;
  signed_by_seller: boolean;
  signed_by_buyer: boolean;
  document_url: string | null;
  created_at: string;
}

const IMFPAManagement = () => {
  const [agreements, setAgreements] = useState<IMFPAAgreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgreement, setSelectedAgreement] = useState<IMFPAAgreement | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAgreements();
  }, []);

  const fetchAgreements = async () => {
    setLoading(true);
    try {
      const { data, error } = await db
        .from('imfpa_agreements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgreements(data || []);
    } catch (error) {
      console.error('Error fetching IMFPA agreements:', error);
      toast({
        title: "Error",
        description: "Failed to load IMFPA agreements",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (imfpaId: string) => {
    try {
      const { error } = await db
        .from('imfpa_agreements')
        .update({ status: 'active' })
        .eq('imfpa_id', imfpaId);

      if (error) throw error;

      toast({ title: "Success", description: "IMFPA agreement approved" });
      fetchAgreements();
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve agreement",
        variant: "destructive"
      });
    }
  };

  const handleReject = async (imfpaId: string) => {
    try {
      const { error } = await db
        .from('imfpa_agreements')
        .update({ status: 'rejected' })
        .eq('imfpa_id', imfpaId);

      if (error) throw error;

      toast({ title: "Success", description: "IMFPA agreement rejected" });
      fetchAgreements();
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject agreement",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (imfpaId: string) => {
    if (!confirm('Are you sure you want to delete this IMFPA agreement?')) return;

    try {
      const { error } = await db
        .from('imfpa_agreements')
        .delete()
        .eq('imfpa_id', imfpaId);

      if (error) throw error;

      toast({ title: "Success", description: "IMFPA agreement deleted" });
      fetchAgreements();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete agreement",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: React.ReactNode }> = {
      draft: { variant: 'secondary', icon: <Clock className="h-3 w-3 mr-1" /> },
      pending: { variant: 'outline', icon: <AlertTriangle className="h-3 w-3 mr-1" /> },
      active: { variant: 'default', icon: <CheckCircle className="h-3 w-3 mr-1" /> },
      completed: { variant: 'default', icon: <CheckCircle className="h-3 w-3 mr-1" /> },
      rejected: { variant: 'destructive', icon: <XCircle className="h-3 w-3 mr-1" /> }
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredAgreements = agreements.filter(a =>
    a.imfpa_reference_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.broker_entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.seller_entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.buyer_entity_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: agreements.length,
    draft: agreements.filter(a => a.status === 'draft').length,
    pending: agreements.filter(a => a.status === 'pending').length,
    active: agreements.filter(a => a.status === 'active').length,
    completed: agreements.filter(a => a.status === 'completed').length
  };

  return (
    <Card className="trading-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          IMFPA Agreement Management
        </CardTitle>
        <CardDescription>Review, approve, and manage IMFPA agreements</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
            <div className="text-xs text-muted-foreground">Draft</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by reference code, broker, seller, or buyer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Broker</TableHead>
                <TableHead>Parties</TableHead>
                <TableHead>Commodity</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Signatures</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : filteredAgreements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No IMFPA agreements found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAgreements.map((agreement) => (
                  <TableRow key={agreement.imfpa_id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">
                      {agreement.imfpa_reference_code || agreement.imfpa_id.slice(0, 8)}
                    </TableCell>
                    <TableCell>{agreement.broker_entity_name || 'N/A'}</TableCell>
                    <TableCell className="text-sm">
                      <div className="space-y-1">
                        <div><span className="text-muted-foreground">S:</span> {agreement.seller_entity_name || 'TBD'}</div>
                        <div><span className="text-muted-foreground">B:</span> {agreement.buyer_entity_name || 'TBD'}</div>
                      </div>
                    </TableCell>
                    <TableCell>{agreement.commodity_type || 'N/A'}</TableCell>
                    <TableCell>
                      {agreement.commission_value ? (
                        <>
                          {agreement.commission_value}
                          {agreement.commission_type === 'percentage' ? '%' : ` ${agreement.currency || 'USD'}`}
                        </>
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell>{getStatusBadge(agreement.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Badge variant={agreement.signed_by_broker ? 'default' : 'outline'} className="text-xs">B</Badge>
                        <Badge variant={agreement.signed_by_seller ? 'default' : 'outline'} className="text-xs">S</Badge>
                        <Badge variant={agreement.signed_by_buyer ? 'default' : 'outline'} className="text-xs">Byr</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedAgreement(agreement);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {agreement.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(agreement.imfpa_id)}
                              className="text-green-600 hover:bg-green-50"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(agreement.imfpa_id)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(agreement.imfpa_id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              IMFPA Agreement Details
            </DialogTitle>
            <DialogDescription>
              Review complete agreement information
            </DialogDescription>
          </DialogHeader>

          {selectedAgreement && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Reference Code</label>
                  <p className="font-mono">{selectedAgreement.imfpa_reference_code || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedAgreement.status)}</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Broker Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-muted-foreground">Entity Name</label>
                    <p>{selectedAgreement.broker_entity_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground">Role</label>
                    <p>{selectedAgreement.broker_role || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Transaction Parties</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-muted-foreground">Seller</label>
                    <p>{selectedAgreement.seller_entity_name || 'To be determined'}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground">Buyer</label>
                    <p>{selectedAgreement.buyer_entity_name || 'To be determined'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Commission Details</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <label className="text-muted-foreground">Commodity</label>
                    <p>{selectedAgreement.commodity_type || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground">Commission Type</label>
                    <p className="capitalize">{selectedAgreement.commission_type || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground">Value</label>
                    <p>
                      {selectedAgreement.commission_value || 'N/A'}
                      {selectedAgreement.commission_type === 'percentage' ? '%' : ` ${selectedAgreement.currency || ''}`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Validity Period</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-muted-foreground">From</label>
                    <p>{selectedAgreement.valid_from ? format(new Date(selectedAgreement.valid_from), 'MMM dd, yyyy') : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground">Until</label>
                    <p>{selectedAgreement.valid_until ? format(new Date(selectedAgreement.valid_until), 'MMM dd, yyyy') : 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Signatures</h4>
                <div className="flex gap-4">
                  <Badge variant={selectedAgreement.signed_by_broker ? 'default' : 'outline'}>
                    {selectedAgreement.signed_by_broker ? '✓' : '○'} Broker
                  </Badge>
                  <Badge variant={selectedAgreement.signed_by_seller ? 'default' : 'outline'}>
                    {selectedAgreement.signed_by_seller ? '✓' : '○'} Seller
                  </Badge>
                  <Badge variant={selectedAgreement.signed_by_buyer ? 'default' : 'outline'}>
                    {selectedAgreement.signed_by_buyer ? '✓' : '○'} Buyer
                  </Badge>
                </div>
              </div>

              {selectedAgreement.document_url && (
                <div className="border-t pt-4">
                  <Button variant="outline" className="flex items-center gap-2" asChild>
                    <a href={selectedAgreement.document_url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                      Download Document
                    </a>
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedAgreement?.status === 'pending' && (
              <>
                <Button
                  onClick={() => handleApprove(selectedAgreement.imfpa_id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Agreement
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleReject(selectedAgreement.imfpa_id)}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Agreement
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default IMFPAManagement;