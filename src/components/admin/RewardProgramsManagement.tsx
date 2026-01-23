import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, supabase } from '@/lib/supabase-helper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Plus, Gift, Target, Trophy, BarChart3, Eye, Link2, Pause, Play, Trash2, 
  Edit, CheckCircle, XCircle, Clock, Upload, ExternalLink, HardHat, Share2, 
  Video, Users, Mail, FileText, Fuel, Factory, Settings
} from 'lucide-react';

// Types
interface RewardProgram {
  id: string;
  name: string;
  description: string | null;
  program_type: 'internal' | 'external' | 'both';
  status: 'draft' | 'active' | 'paused' | 'expired';
  banner_image_url: string | null;
  icon: string | null;
  start_date: string | null;
  end_date: string | null;
  external_slug: string | null;
  disclaimer_text: string | null;
  created_at: string;
  updated_at: string;
}

interface RewardTask {
  id: string;
  program_id: string;
  name: string;
  description: string | null;
  category: 'review' | 'social_share' | 'referral' | 'email_invite' | 'video_review' | 'case_study' | 'custom';
  completion_method: 'link_submission' | 'screenshot_upload' | 'email_validation' | 'manual_approval' | 'auto_referral';
  points: number;
  task_order: number;
  is_enabled: boolean;
  validation_config: Record<string, unknown>;
  created_at: string;
}

interface ProgramReward {
  id: string;
  program_id: string;
  name: string;
  required_points: number;
  reward_type: 'percentage_discount' | 'free_months' | 'feature_unlock' | 'vip_access' | 'custom';
  reward_value: string | null;
  auto_apply: boolean;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

interface TaskSubmission {
  id: string;
  task_id: string;
  participant_id: string;
  proof_type: 'link' | 'screenshot' | 'video_link' | 'document';
  proof_url: string | null;
  proof_metadata: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  points_awarded: number;
  created_at: string;
  task?: RewardTask;
  participant?: {
    email: string;
    name: string | null;
  };
}

const CATEGORY_ICONS: Record<string, typeof HardHat> = {
  review: HardHat,
  social_share: Share2,
  referral: Users,
  email_invite: Mail,
  video_review: Video,
  case_study: FileText,
  custom: Settings
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-green-500/20 text-green-600 dark:text-green-400',
  paused: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
  expired: 'bg-red-500/20 text-red-600 dark:text-red-400'
};

const RewardProgramsManagement = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('programs');
  const [selectedProgram, setSelectedProgram] = useState<RewardProgram | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isRewardDialogOpen, setIsRewardDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Partial<RewardProgram>>({});
  const [editingTask, setEditingTask] = useState<Partial<RewardTask>>({});
  const [editingReward, setEditingReward] = useState<Partial<ProgramReward>>({});

  // Fetch programs
  const { data: programs = [], isLoading: loadingPrograms } = useQuery({
    queryKey: ['reward-programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reward_programs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as RewardProgram[];
    }
  });

  // Fetch tasks for selected program
  const { data: tasks = [] } = useQuery({
    queryKey: ['reward-tasks', selectedProgram?.id],
    queryFn: async () => {
      if (!selectedProgram) return [];
      const { data, error } = await supabase
        .from('reward_program_tasks')
        .select('*')
        .eq('program_id', selectedProgram.id)
        .order('task_order', { ascending: true });
      if (error) throw error;
      return data as RewardTask[];
    },
    enabled: !!selectedProgram
  });

  // Fetch rewards for selected program
  const { data: rewards = [] } = useQuery({
    queryKey: ['reward-program-rewards', selectedProgram?.id],
    queryFn: async () => {
      if (!selectedProgram) return [];
      const { data, error } = await supabase
        .from('reward_program_rewards')
        .select('*')
        .eq('program_id', selectedProgram.id)
        .order('required_points', { ascending: true });
      if (error) throw error;
      return data as ProgramReward[];
    },
    enabled: !!selectedProgram
  });

  // Fetch all submissions for review
  const { data: submissions = [] } = useQuery({
    queryKey: ['reward-submissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reward_task_submissions')
        .select(`
          *,
          task:reward_program_tasks(*),
          participant:reward_program_participants(email, name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as TaskSubmission[];
    }
  });

  // Fetch analytics
  const { data: analytics } = useQuery({
    queryKey: ['reward-analytics'],
    queryFn: async () => {
      const [participantsRes, submissionsRes, redemptionsRes] = await Promise.all([
        supabase.from('reward_program_participants').select('id, total_points', { count: 'exact' }),
        supabase.from('reward_task_submissions').select('id, status, points_awarded', { count: 'exact' }),
        supabase.from('reward_redemptions').select('id, status', { count: 'exact' })
      ]);
      
      const totalPoints = participantsRes.data?.reduce((sum, p) => sum + (p.total_points || 0), 0) || 0;
      const approvedSubmissions = submissionsRes.data?.filter(s => s.status === 'approved').length || 0;
      const redeemedRewards = redemptionsRes.data?.filter(r => r.status === 'redeemed').length || 0;
      
      return {
        totalParticipants: participantsRes.count || 0,
        totalSubmissions: submissionsRes.count || 0,
        approvedSubmissions,
        totalPointsDistributed: totalPoints,
        rewardsRedeemed: redeemedRewards
      };
    }
  });

  // Program mutations
  const saveProgramMutation = useMutation({
    mutationFn: async (program: Partial<RewardProgram>) => {
      const { id, created_at, updated_at, ...updateData } = program as any;
      if (program.id) {
        const { error } = await supabase
          .from('reward_programs')
          .update(updateData)
          .eq('id', program.id);
        if (error) throw error;
      } else {
        const slug = program.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const insertData = {
          name: program.name!,
          description: program.description,
          program_type: program.program_type || 'internal',
          status: program.status || 'draft',
          banner_image_url: program.banner_image_url,
          icon: program.icon,
          start_date: program.start_date,
          end_date: program.end_date,
          external_slug: slug,
          disclaimer_text: program.disclaimer_text
        };
        const { error } = await db
          .from('reward_programs')
          .insert([insertData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reward-programs'] });
      setIsCreateDialogOpen(false);
      setEditingProgram({});
      toast.success('Program saved successfully');
    },
    onError: (error) => toast.error(`Error: ${error.message}`)
  });

  const toggleProgramStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('reward_programs')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reward-programs'] });
      toast.success('Program status updated');
    }
  });

  const deleteProgramMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reward_programs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reward-programs'] });
      toast.success('Program deleted');
    }
  });

  // Task mutations
  const saveTaskMutation = useMutation({
    mutationFn: async (task: Partial<RewardTask>) => {
      const { id, created_at, validation_config, ...taskData } = task as any;
      if (task.id) {
        const { error } = await db.from('reward_program_tasks').update(taskData).eq('id', task.id);
        if (error) throw error;
      } else {
        const { error } = await db.from('reward_program_tasks').insert({
          ...taskData,
          program_id: selectedProgram?.id,
          task_order: tasks.length
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reward-tasks'] });
      setIsTaskDialogOpen(false);
      setEditingTask({});
      toast.success('Task saved');
    },
    onError: (error) => toast.error(`Error saving task: ${error.message}`)
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
      const { error } = await db.from('reward_program_tasks').update({ is_enabled }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reward-tasks'] }),
    onError: (error) => toast.error(`Error toggling task: ${error.message}`)
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('reward_program_tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reward-tasks'] });
      toast.success('Task deleted');
    },
    onError: (error) => toast.error(`Error deleting task: ${error.message}`)
  });

  // Reward mutations
  const saveRewardMutation = useMutation({
    mutationFn: async (reward: Partial<ProgramReward>) => {
      const { id, created_at, ...rewardData } = reward as any;
      if (reward.id) {
        const { error } = await db.from('reward_program_rewards').update(rewardData).eq('id', reward.id);
        if (error) throw error;
      } else {
        const { error } = await db.from('reward_program_rewards').insert({
          ...rewardData,
          program_id: selectedProgram?.id
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reward-program-rewards'] });
      setIsRewardDialogOpen(false);
      setEditingReward({});
      toast.success('Reward saved');
    },
    onError: (error) => toast.error(`Error saving reward: ${error.message}`)
  });

  const toggleRewardMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await db.from('reward_program_rewards').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reward-program-rewards'] }),
    onError: (error) => toast.error(`Error toggling reward: ${error.message}`)
  });

  // Submission mutations
  const reviewSubmissionMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: 'approved' | 'rejected'; notes?: string }) => {
      const submission = submissions.find(s => s.id === id);
      if (!submission) throw new Error('Submission not found');

      const { error: updateError } = await supabase
        .from('reward_task_submissions')
        .update({
          status,
          admin_notes: notes,
          reviewed_at: new Date().toISOString(),
          points_awarded: status === 'approved' ? submission.task?.points || 0 : 0
        })
        .eq('id', id);
      if (updateError) throw updateError;

      if (status === 'approved' && submission.task) {
        // Update participant points directly
        const { data: participant } = await supabase
          .from('reward_program_participants')
          .select('total_points')
          .eq('id', submission.participant_id)
          .single();
        
        await supabase
          .from('reward_program_participants')
          .update({ total_points: (participant?.total_points || 0) + submission.task.points })
          .eq('id', submission.participant_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reward-submissions'] });
      toast.success('Submission reviewed');
    }
  });

  const copyExternalLink = (slug: string) => {
    const url = `${window.location.origin}/rewards/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  return (
    <Card className="border-2 border-orange-200 dark:border-orange-900/50">
      <CardHeader className="bg-gradient-to-r from-[#1a2634] to-[#2d3748] text-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500 rounded-lg">
            <Gift className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl">Interactive Reward Programs</CardTitle>
            <CardDescription className="text-gray-300">
              Create and manage reward programs for internal users and external campaigns
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto pb-2 mb-6">
            <TabsList className="inline-flex h-auto gap-1 p-1 min-w-full sm:min-w-0">
              <TabsTrigger value="programs" className="flex items-center gap-1 px-2 py-2 text-xs sm:text-sm sm:px-3 sm:gap-2">
                <Gift className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Programs</span>
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-1 px-2 py-2 text-xs sm:text-sm sm:px-3 sm:gap-2" disabled={!selectedProgram}>
                <Target className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Tasks</span>
              </TabsTrigger>
              <TabsTrigger value="rewards" className="flex items-center gap-1 px-2 py-2 text-xs sm:text-sm sm:px-3 sm:gap-2" disabled={!selectedProgram}>
                <Trophy className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Rewards</span>
              </TabsTrigger>
              <TabsTrigger value="submissions" className="flex items-center gap-1 px-2 py-2 text-xs sm:text-sm sm:px-3 sm:gap-2">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Submissions</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-1 px-2 py-2 text-xs sm:text-sm sm:px-3 sm:gap-2">
                <BarChart3 className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Programs Tab */}
          <TabsContent value="programs" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">All Programs</h3>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Program
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingProgram.id ? 'Edit Program' : 'Create New Program'}</DialogTitle>
                    <DialogDescription>Configure your reward program details</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Program Name</Label>
                        <Input
                          value={editingProgram.name || ''}
                          onChange={(e) => setEditingProgram({ ...editingProgram, name: e.target.value })}
                          placeholder="Early Adopter Rewards"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Program Type</Label>
                        <Select
                          value={editingProgram.program_type || 'internal'}
                          onValueChange={(v) => setEditingProgram({ ...editingProgram, program_type: v as RewardProgram['program_type'] })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="internal">Internal (Dashboard)</SelectItem>
                            <SelectItem value="external">External (Public Link)</SelectItem>
                            <SelectItem value="both">Both</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={editingProgram.description || ''}
                        onChange={(e) => setEditingProgram({ ...editingProgram, description: e.target.value })}
                        placeholder="Describe your reward program..."
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={editingProgram.start_date?.split('T')[0] || ''}
                          onChange={(e) => setEditingProgram({ ...editingProgram, start_date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={editingProgram.end_date?.split('T')[0] || ''}
                          onChange={(e) => setEditingProgram({ ...editingProgram, end_date: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Banner Image URL</Label>
                      <Input
                        value={editingProgram.banner_image_url || ''}
                        onChange={(e) => setEditingProgram({ ...editingProgram, banner_image_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Disclaimer Text</Label>
                      <Textarea
                        value={editingProgram.disclaimer_text || 'We value honest and genuine feedback. Your participation is voluntary.'}
                        onChange={(e) => setEditingProgram({ ...editingProgram, disclaimer_text: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                          value={editingProgram.status || 'draft'}
                          onValueChange={(v) => setEditingProgram({ ...editingProgram, status: v as RewardProgram['status'] })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="paused">Paused</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Icon</Label>
                        <Select
                          value={editingProgram.icon || 'gift'}
                          onValueChange={(v) => setEditingProgram({ ...editingProgram, icon: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gift">🎁 Gift</SelectItem>
                            <SelectItem value="fuel">⛽ Fuel</SelectItem>
                            <SelectItem value="factory">🏭 Factory</SelectItem>
                            <SelectItem value="trophy">🏆 Trophy</SelectItem>
                            <SelectItem value="star">⭐ Star</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                    <Button 
                      onClick={() => saveProgramMutation.mutate(editingProgram)}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      {editingProgram.id ? 'Update' : 'Create'} Program
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {loadingPrograms ? (
              <div className="text-center py-8">Loading programs...</div>
            ) : programs.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-muted-foreground/20 rounded-lg">
                <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No programs yet</h3>
                <p className="text-muted-foreground mb-4">Create your first reward program to get started</p>
              </div>
            ) : (
              <>
                {/* Helper text when no program is selected */}
                {!selectedProgram && programs.length > 0 && (
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center gap-3">
                    <Target className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>Tip:</strong> Click <strong>"Manage Tasks"</strong> or <strong>"Manage Rewards"</strong> on any program card below to add tasks and rewards to that program.
                    </p>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {programs.map((program) => (
                    <Card 
                      key={program.id} 
                      className={`transition-all hover:shadow-lg ${selectedProgram?.id === program.id ? 'ring-2 ring-orange-500' : ''}`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">
                              {program.icon === 'fuel' ? '⛽' : program.icon === 'factory' ? '🏭' : program.icon === 'trophy' ? '🏆' : program.icon === 'star' ? '⭐' : '🎁'}
                            </span>
                            <CardTitle className="text-lg">{program.name}</CardTitle>
                          </div>
                          <Badge className={STATUS_COLORS[program.status]}>{program.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-2">{program.description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline">{program.program_type}</Badge>
                          {program.start_date && (
                            <span>
                              {format(new Date(program.start_date), 'MMM d')} - {program.end_date ? format(new Date(program.end_date), 'MMM d, yyyy') : 'Ongoing'}
                            </span>
                          )}
                        </div>
                        
                        {/* Primary Actions - Manage Tasks & Rewards */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/30"
                            onClick={() => {
                              setSelectedProgram(program);
                              setActiveTab('tasks');
                            }}
                          >
                            <Target className="h-3 w-3 mr-1" />
                            Manage Tasks
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/30"
                            onClick={() => {
                              setSelectedProgram(program);
                              setActiveTab('rewards');
                            }}
                          >
                            <Trophy className="h-3 w-3 mr-1" />
                            Manage Rewards
                          </Button>
                        </div>

                        {/* Secondary Actions */}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingProgram(program);
                              setIsCreateDialogOpen(true);
                            }}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          {(program.program_type === 'external' || program.program_type === 'both') && program.external_slug && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyExternalLink(program.external_slug!)}
                            >
                              <Link2 className="h-3 w-3 mr-1" />
                              Copy Link
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(`/rewards/${program.external_slug}`, '_blank')}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              toggleProgramStatus.mutate({
                                id: program.id,
                                status: program.status === 'active' ? 'paused' : 'active'
                              });
                            }}
                          >
                            {program.status === 'active' ? (
                              <><Pause className="h-3 w-3 mr-1" />Pause</>
                            ) : (
                              <><Play className="h-3 w-3 mr-1" />Activate</>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm('Delete this program?')) {
                                deleteProgramMutation.mutate(program.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Tasks for: {selectedProgram?.name}</h3>
              <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingTask.id ? 'Edit Task' : 'Add New Task'}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Task Name</Label>
                      <Input
                        value={editingTask.name || ''}
                        onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })}
                        placeholder="Leave a Google Review"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={editingTask.description || ''}
                        onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                        placeholder="Describe what the user needs to do..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                          value={editingTask.category || 'review'}
                          onValueChange={(v) => setEditingTask({ ...editingTask, category: v as RewardTask['category'] })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="review">Review</SelectItem>
                            <SelectItem value="social_share">Social Share</SelectItem>
                            <SelectItem value="referral">Referral</SelectItem>
                            <SelectItem value="email_invite">Email Invite</SelectItem>
                            <SelectItem value="video_review">Video Review</SelectItem>
                            <SelectItem value="case_study">Case Study</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Completion Method</Label>
                        <Select
                          value={editingTask.completion_method || 'link_submission'}
                          onValueChange={(v) => setEditingTask({ ...editingTask, completion_method: v as RewardTask['completion_method'] })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="link_submission">Link Submission</SelectItem>
                            <SelectItem value="screenshot_upload">Screenshot Upload</SelectItem>
                            <SelectItem value="email_validation">Email Validation</SelectItem>
                            <SelectItem value="manual_approval">Manual Approval</SelectItem>
                            <SelectItem value="auto_referral">Auto (Referral)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Points</Label>
                      <Input
                        type="number"
                        value={editingTask.points || 0}
                        onChange={(e) => setEditingTask({ ...editingTask, points: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>Cancel</Button>
                    <Button 
                      onClick={() => saveTaskMutation.mutate(editingTask)}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      Save Task
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {tasks.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-muted-foreground/20 rounded-lg">
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
                <p className="text-muted-foreground">Add tasks that users can complete to earn points</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task, index) => {
                  const Icon = CATEGORY_ICONS[task.category] || Target;
                  return (
                    <div key={task.id} className="flex items-center gap-4 p-4 bg-card border rounded-lg">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-mono text-sm">#{index + 1}</span>
                      </div>
                      <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                        <Icon className="h-5 w-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{task.name}</div>
                        <div className="text-sm text-muted-foreground">{task.description}</div>
                      </div>
                      <Badge variant="secondary">{task.category.replace('_', ' ')}</Badge>
                      <div className="flex items-center gap-1 text-orange-600 font-semibold">
                        <Fuel className="h-4 w-4" />
                        {task.points} pts
                      </div>
                      <Switch
                        checked={task.is_enabled}
                        onCheckedChange={(checked) => toggleTaskMutation.mutate({ id: task.id, is_enabled: checked })}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingTask(task);
                          setIsTaskDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => {
                          if (confirm('Delete this task?')) deleteTaskMutation.mutate(task.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Rewards for: {selectedProgram?.name}</h3>
              <Dialog open={isRewardDialogOpen} onOpenChange={setIsRewardDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Reward
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingReward.id ? 'Edit Reward' : 'Add New Reward'}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Reward Name</Label>
                      <Input
                        value={editingReward.name || ''}
                        onChange={(e) => setEditingReward({ ...editingReward, name: e.target.value })}
                        placeholder="20% Discount"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Required Points</Label>
                        <Input
                          type="number"
                          value={editingReward.required_points || 0}
                          onChange={(e) => setEditingReward({ ...editingReward, required_points: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Reward Type</Label>
                        <Select
                          value={editingReward.reward_type || 'percentage_discount'}
                          onValueChange={(v) => setEditingReward({ ...editingReward, reward_type: v as ProgramReward['reward_type'] })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage_discount">Percentage Discount</SelectItem>
                            <SelectItem value="free_months">Free Months</SelectItem>
                            <SelectItem value="feature_unlock">Feature Unlock</SelectItem>
                            <SelectItem value="vip_access">VIP Access</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Reward Value</Label>
                      <Input
                        value={editingReward.reward_value || ''}
                        onChange={(e) => setEditingReward({ ...editingReward, reward_value: e.target.value })}
                        placeholder="e.g., 20, 1 Month, Premium Access"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editingReward.auto_apply || false}
                        onCheckedChange={(checked) => setEditingReward({ ...editingReward, auto_apply: checked })}
                      />
                      <Label>Auto-apply when points reached</Label>
                    </div>
                    <div className="space-y-2">
                      <Label>Expires At (Optional)</Label>
                      <Input
                        type="date"
                        value={editingReward.expires_at?.split('T')[0] || ''}
                        onChange={(e) => setEditingReward({ ...editingReward, expires_at: e.target.value || null })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsRewardDialogOpen(false)}>Cancel</Button>
                    <Button 
                      onClick={() => saveRewardMutation.mutate(editingReward)}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      Save Reward
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {rewards.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-muted-foreground/20 rounded-lg">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No rewards yet</h3>
                <p className="text-muted-foreground">Add rewards that users can unlock with their points</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rewards.map((reward) => (
                  <Card key={reward.id} className={!reward.is_active ? 'opacity-60' : ''}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-orange-500" />
                          {reward.name}
                        </CardTitle>
                        <Switch
                          checked={reward.is_active}
                          onCheckedChange={(checked) => toggleRewardMutation.mutate({ id: reward.id, is_active: checked })}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Fuel className="h-4 w-4 text-orange-500" />
                        <span className="font-semibold">{reward.required_points} points required</span>
                      </div>
                      <Badge variant="outline">{reward.reward_type.replace(/_/g, ' ')}</Badge>
                      {reward.reward_value && (
                        <p className="text-sm text-muted-foreground">Value: {reward.reward_value}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {reward.auto_apply ? '✓ Auto-apply' : '○ Manual approval'}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingReward(reward);
                            setIsRewardDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Submissions Tab */}
          <TabsContent value="submissions" className="space-y-4">
            <h3 className="text-lg font-semibold">Proof Submissions</h3>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participant</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Proof</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No submissions yet
                    </TableCell>
                  </TableRow>
                ) : (
                  submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{submission.participant?.name || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">{submission.participant?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {submission.task && (
                            <>
                              {(() => {
                                const Icon = CATEGORY_ICONS[submission.task.category] || Target;
                                return <Icon className="h-4 w-4 text-muted-foreground" />;
                              })()}
                              <span>{submission.task.name}</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {submission.proof_url && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(submission.proof_url!, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            {submission.proof_type}
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          submission.status === 'approved' ? 'bg-green-500/20 text-green-600' :
                          submission.status === 'rejected' ? 'bg-red-500/20 text-red-600' :
                          'bg-yellow-500/20 text-yellow-600'
                        }>
                          {submission.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {submission.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                          {submission.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                          {submission.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(submission.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        {submission.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => reviewSubmissionMutation.mutate({ id: submission.id, status: 'approved' })}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => reviewSubmissionMutation.mutate({ id: submission.id, status: 'rejected' })}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <h3 className="text-lg font-semibold">Program Analytics</h3>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Participants</CardDescription>
                  <CardTitle className="text-3xl text-orange-600">{analytics?.totalParticipants || 0}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Submissions</CardDescription>
                  <CardTitle className="text-3xl">{analytics?.totalSubmissions || 0}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Approved</CardDescription>
                  <CardTitle className="text-3xl text-green-600">{analytics?.approvedSubmissions || 0}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Points Distributed</CardDescription>
                  <CardTitle className="text-3xl flex items-center gap-1">
                    <Fuel className="h-6 w-6 text-orange-500" />
                    {analytics?.totalPointsDistributed || 0}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Rewards Redeemed</CardDescription>
                  <CardTitle className="text-3xl text-purple-600">{analytics?.rewardsRedeemed || 0}</CardTitle>
                </CardHeader>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RewardProgramsManagement;
