import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  MoreHorizontal, 
  Eye, 
  Mail, 
  UserCheck, 
  UserX, 
  Clock,
  Send,
  Link as LinkIcon,
  Loader2,
  RefreshCw,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';

interface TalentCandidate {
  id: string;
  full_name: string;
  email: string;
  linkedin_url: string | null;
  country: string | null;
  city: string | null;
  professional_background: string | null;
  area_of_interest: string | null;
  preferred_language: string;
  status: string;
  admin_notes: string | null;
  invited_at: string | null;
  completed_at: string | null;
  final_score: number | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending Review', color: 'bg-yellow-500' },
  rejected: { label: 'Rejected', color: 'bg-red-500' },
  shortlisted: { label: 'Shortlisted', color: 'bg-blue-500' },
  invited: { label: 'Invited', color: 'bg-purple-500' },
  in_progress: { label: 'In Progress', color: 'bg-orange-500' },
  completed: { label: 'Completed', color: 'bg-cyan-500' },
  passed: { label: 'Passed', color: 'bg-green-500' },
  failed: { label: 'Failed', color: 'bg-red-600' },
};

const CandidatesTab = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCandidate, setSelectedCandidate] = useState<TalentCandidate | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [inviteLanguage, setInviteLanguage] = useState('en');
  const [linkExpiry, setLinkExpiry] = useState('72');

  // Fetch candidates
  const { data: candidates, isLoading, refetch } = useQuery({
    queryKey: ['talent-candidates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('talent_candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TalentCandidate[];
    },
  });

  // Update candidate status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const updates: any = { status };
      if (notes !== undefined) updates.admin_notes = notes;
      if (status === 'invited') updates.invited_at = new Date().toISOString();

      const { error } = await supabase
        .from('talent_candidates')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent-candidates'] });
      toast.success('Candidate status updated');
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  // Generate assessment link
  const generateLinkMutation = useMutation({
    mutationFn: async ({ candidateId, expiryHours }: { candidateId: string; expiryHours: number }) => {
      const token = crypto.randomUUID() + '-' + crypto.randomUUID();
      const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString();

      const { error } = await supabase
        .from('talent_assessment_links')
        .insert({
          candidate_id: candidateId,
          token,
          expires_at: expiresAt,
        });

      if (error) throw error;

      // Update candidate status to invited
      await supabase
        .from('talent_candidates')
        .update({ status: 'invited', invited_at: new Date().toISOString() })
        .eq('id', candidateId);

      return { token, expiresAt };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['talent-candidates'] });
      const assessmentUrl = `${window.location.origin}/careers/growth-talent/assessment/${data.token}`;
      navigator.clipboard.writeText(assessmentUrl);
      toast.success('Assessment link generated and copied to clipboard!');
      setIsInviteOpen(false);
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  // Save admin notes
  const saveNotesMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from('talent_candidates')
        .update({ admin_notes: notes })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent-candidates'] });
      toast.success('Notes saved');
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  // Filter candidates
  const filteredCandidates = candidates?.filter((c) => {
    const matchesSearch =
      !searchQuery ||
      c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.country?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (candidate: TalentCandidate) => {
    setSelectedCandidate(candidate);
    setAdminNotes(candidate.admin_notes || '');
    setIsDetailOpen(true);
  };

  const handleInvite = (candidate: TalentCandidate) => {
    setSelectedCandidate(candidate);
    setInviteLanguage(candidate.preferred_language || 'en');
    setIsInviteOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || { label: status, color: 'bg-gray-500' };
    return <Badge className={`${config.color} text-white`}>{config.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Candidate Management</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(statusConfig).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {candidates?.filter((c) => c.status === 'pending').length || 0}
            </div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">
              {candidates?.filter((c) => c.status === 'shortlisted').length || 0}
            </div>
            <div className="text-xs text-muted-foreground">Shortlisted</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">
              {candidates?.filter((c) => c.status === 'invited').length || 0}
            </div>
            <div className="text-xs text-muted-foreground">Invited</div>
          </div>
          <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">
              {candidates?.filter((c) => c.status === 'passed').length || 0}
            </div>
            <div className="text-xs text-muted-foreground">Passed</div>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Interest</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No candidates found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCandidates?.map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{candidate.full_name}</div>
                          <div className="text-sm text-muted-foreground">{candidate.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {candidate.city && candidate.country
                          ? `${candidate.city}, ${candidate.country}`
                          : candidate.country || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{candidate.area_of_interest || '-'}</Badge>
                      </TableCell>
                      <TableCell className="uppercase">
                        {candidate.preferred_language}
                      </TableCell>
                      <TableCell>{getStatusBadge(candidate.status)}</TableCell>
                      <TableCell>
                        {candidate.final_score !== null ? (
                          <span className="font-medium">{candidate.final_score}%</span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(candidate.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(candidate)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {candidate.linkedin_url && (
                              <DropdownMenuItem asChild>
                                <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer">
                                  <LinkIcon className="h-4 w-4 mr-2" />
                                  LinkedIn Profile
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {candidate.status === 'pending' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatusMutation.mutate({ id: candidate.id, status: 'shortlisted' })
                                  }
                                >
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Shortlist
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatusMutation.mutate({ id: candidate.id, status: 'rejected' })
                                  }
                                  className="text-destructive"
                                >
                                  <UserX className="h-4 w-4 mr-2" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            {(candidate.status === 'shortlisted' || candidate.status === 'pending') && (
                              <DropdownMenuItem onClick={() => handleInvite(candidate)}>
                                <Send className="h-4 w-4 mr-2" />
                                Invite to Assessment
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Candidate Details</DialogTitle>
            <DialogDescription>
              Review candidate information and add notes
            </DialogDescription>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Full Name</Label>
                  <p className="font-medium">{selectedCandidate.full_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedCandidate.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Location</Label>
                  <p className="font-medium">
                    {selectedCandidate.city && selectedCandidate.country
                      ? `${selectedCandidate.city}, ${selectedCandidate.country}`
                      : selectedCandidate.country || '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Area of Interest</Label>
                  <p className="font-medium">{selectedCandidate.area_of_interest || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Preferred Language</Label>
                  <p className="font-medium uppercase">{selectedCandidate.preferred_language}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div>{getStatusBadge(selectedCandidate.status)}</div>
                </div>
              </div>

              {selectedCandidate.linkedin_url && (
                <div>
                  <Label className="text-muted-foreground">LinkedIn</Label>
                  <a
                    href={selectedCandidate.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline block"
                  >
                    {selectedCandidate.linkedin_url}
                  </a>
                </div>
              )}

              <div>
                <Label className="text-muted-foreground">Professional Background</Label>
                <p className="text-sm bg-muted p-3 rounded-md">
                  {selectedCandidate.professional_background || 'No information provided'}
                </p>
              </div>

              <div>
                <Label>Admin Notes (Private)</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add private notes about this candidate..."
                  rows={4}
                />
              </div>

              <DialogFooter>
                <Button
                  onClick={() => {
                    saveNotesMutation.mutate({ id: selectedCandidate.id, notes: adminNotes });
                    setIsDetailOpen(false);
                  }}
                >
                  Save Notes
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite to Assessment</DialogTitle>
            <DialogDescription>
              Generate a secure assessment link for {selectedCandidate?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Email Language</Label>
              <Select value={inviteLanguage} onValueChange={setInviteLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                  <SelectItem value="nl">Dutch</SelectItem>
                  <SelectItem value="et">Estonian</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Link Expiry (hours)</Label>
              <Select value={linkExpiry} onValueChange={setLinkExpiry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="48">48 hours</SelectItem>
                  <SelectItem value="72">72 hours (Default)</SelectItem>
                  <SelectItem value="168">1 week</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedCandidate) {
                  generateLinkMutation.mutate({
                    candidateId: selectedCandidate.id,
                    expiryHours: parseInt(linkExpiry),
                  });
                }
              }}
              disabled={generateLinkMutation.isPending}
            >
              {generateLinkMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Generate & Copy Link
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CandidatesTab;
