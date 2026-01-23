import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Gift, Trophy, Target, Fuel, CheckCircle, Clock, XCircle, Upload, 
  Link2, Image, Video, FileText, HardHat, Share2, Users, Mail
} from 'lucide-react';

interface RewardProgram {
  id: string;
  name: string;
  description: string | null;
  banner_image_url: string | null;
  icon: string | null;
  disclaimer_text: string | null;
}

interface RewardTask {
  id: string;
  program_id: string;
  name: string;
  description: string | null;
  category: string;
  completion_method: string;
  points: number;
  task_order: number;
}

interface ProgramReward {
  id: string;
  name: string;
  required_points: number;
  reward_type: string;
  reward_value: string | null;
}

interface Participant {
  id: string;
  total_points: number;
  referral_code: string | null;
}

interface TaskSubmission {
  id: string;
  task_id: string;
  status: string;
  points_awarded: number;
}

const CATEGORY_ICONS: Record<string, typeof Target> = {
  review: HardHat,
  social_share: Share2,
  referral: Users,
  email_invite: Mail,
  video_review: Video,
  case_study: FileText,
  custom: Target
};

const PROOF_ICONS: Record<string, typeof Link2> = {
  link_submission: Link2,
  screenshot_upload: Image,
  email_validation: Mail,
  manual_approval: FileText,
  auto_referral: Users
};

const UserRewardPrograms = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProgram, setSelectedProgram] = useState<RewardProgram | null>(null);
  const [selectedTask, setSelectedTask] = useState<RewardTask | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [proofUrl, setProofUrl] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);

  // Fetch active internal programs
  const { data: programs = [] } = useQuery({
    queryKey: ['user-reward-programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reward_programs')
        .select('*')
        .eq('status', 'active')
        .in('program_type', ['internal', 'both'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as RewardProgram[];
    }
  });

  // Fetch user's participation
  const { data: participations = [] } = useQuery({
    queryKey: ['user-participations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('reward_program_participants')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return data as Participant[];
    },
    enabled: !!user
  });

  // Fetch tasks for selected program
  const { data: tasks = [] } = useQuery({
    queryKey: ['program-tasks', selectedProgram?.id],
    queryFn: async () => {
      if (!selectedProgram) return [];
      const { data, error } = await supabase
        .from('reward_program_tasks')
        .select('*')
        .eq('program_id', selectedProgram.id)
        .eq('is_enabled', true)
        .order('task_order', { ascending: true });
      if (error) throw error;
      return data as RewardTask[];
    },
    enabled: !!selectedProgram
  });

  // Fetch rewards for selected program
  const { data: rewards = [] } = useQuery({
    queryKey: ['program-rewards', selectedProgram?.id],
    queryFn: async () => {
      if (!selectedProgram) return [];
      const { data, error } = await supabase
        .from('reward_program_rewards')
        .select('*')
        .eq('program_id', selectedProgram.id)
        .eq('is_active', true)
        .order('required_points', { ascending: true });
      if (error) throw error;
      return data as ProgramReward[];
    },
    enabled: !!selectedProgram
  });

  // Fetch user's submissions for selected program
  const { data: submissions = [] } = useQuery({
    queryKey: ['user-submissions', selectedProgram?.id, user?.id],
    queryFn: async () => {
      if (!selectedProgram || !user) return [];
      const participation = participations.find(p => p.id);
      if (!participation) return [];
      
      const { data, error } = await supabase
        .from('reward_task_submissions')
        .select('*')
        .eq('participant_id', participation.id);
      if (error) throw error;
      return data as TaskSubmission[];
    },
    enabled: !!selectedProgram && !!user && participations.length > 0
  });

  // Join program mutation
  const joinProgramMutation = useMutation({
    mutationFn: async (programId: string) => {
      if (!user) throw new Error('Must be logged in');
      
      const referralCode = `${user.id.slice(0, 8)}-${Date.now().toString(36)}`;
      
      const { error } = await supabase
        .from('reward_program_participants')
        .insert({
          program_id: programId,
          user_id: user.id,
          email: user.email!,
          source: 'internal',
          referral_code: referralCode
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-participations'] });
      toast.success('Joined program successfully!');
    },
    onError: (error) => toast.error(`Error: ${error.message}`)
  });

  // Submit proof mutation
  const submitProofMutation = useMutation({
    mutationFn: async ({ taskId, proofType, proofUrl: url }: { taskId: string; proofType: string; proofUrl: string }) => {
      if (!user) throw new Error('Must be logged in');
      
      const participation = participations.find(p => p.id);
      if (!participation) throw new Error('Not participating in this program');

      const { error } = await supabase
        .from('reward_task_submissions')
        .insert({
          task_id: taskId,
          participant_id: participation.id,
          proof_type: proofType,
          proof_url: url,
          status: 'pending'
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-submissions'] });
      setIsSubmitModalOpen(false);
      setProofUrl('');
      setProofFile(null);
      setSelectedTask(null);
      toast.success('Proof submitted! Awaiting review.');
    },
    onError: (error) => toast.error(`Error: ${error.message}`)
  });

  const handleSubmitProof = async () => {
    if (!selectedTask) return;

    let finalProofUrl = proofUrl;

    // Handle file upload
    if (proofFile && user) {
      const fileExt = proofFile.name.split('.').pop();
      const filePath = `${user.id}/${selectedTask.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('reward-proofs')
        .upload(filePath, proofFile);
      
      if (uploadError) {
        toast.error('Failed to upload file');
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('reward-proofs')
        .getPublicUrl(filePath);
      
      finalProofUrl = publicUrl;
    }

    const proofType = selectedTask.completion_method === 'screenshot_upload' ? 'screenshot' :
                      selectedTask.completion_method === 'link_submission' ? 'link' :
                      'document';

    submitProofMutation.mutate({
      taskId: selectedTask.id,
      proofType,
      proofUrl: finalProofUrl
    });
  };

  const getParticipation = (programId: string) => {
    return participations.find(p => p.id);
  };

  const getTaskStatus = (taskId: string): 'available' | 'pending' | 'approved' | 'rejected' => {
    const submission = submissions.find(s => s.task_id === taskId);
    if (!submission) return 'available';
    return submission.status as 'pending' | 'approved' | 'rejected';
  };

  const getTotalPoints = () => {
    const participation = participations.find(p => p.id);
    return participation?.total_points || 0;
  };

  const getMaxPoints = () => {
    return tasks.reduce((sum, task) => sum + task.points, 0);
  };

  const getNextReward = () => {
    const currentPoints = getTotalPoints();
    return rewards.find(r => r.required_points > currentPoints);
  };

  if (!user) {
    return (
      <Card className="border-2 border-orange-200 dark:border-orange-900/50">
        <CardContent className="py-12 text-center">
          <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Sign in to access rewards</h3>
          <p className="text-muted-foreground">Join our reward programs and earn points for exclusive benefits</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
          <Gift className="h-8 w-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Reward Programs</h2>
          <p className="text-muted-foreground">Complete tasks, earn points, unlock rewards</p>
        </div>
      </div>

      {/* Program Selection */}
      {!selectedProgram ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {programs.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center">
                <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No active programs</h3>
                <p className="text-muted-foreground">Check back soon for new reward opportunities</p>
              </CardContent>
            </Card>
          ) : (
            programs.map((program) => {
              const isJoined = !!getParticipation(program.id);
              return (
                <Card 
                  key={program.id} 
                  className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-orange-300 dark:hover:border-orange-700"
                  onClick={() => setSelectedProgram(program)}
                >
                  {program.banner_image_url && (
                    <div className="h-32 bg-cover bg-center rounded-t-lg" style={{ backgroundImage: `url(${program.banner_image_url})` }} />
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {program.icon === 'fuel' ? '⛽' : program.icon === 'factory' ? '🏭' : program.icon === 'trophy' ? '🏆' : program.icon === 'star' ? '⭐' : '🎁'}
                      </span>
                      <CardTitle>{program.name}</CardTitle>
                    </div>
                    <CardDescription>{program.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isJoined ? (
                      <Badge className="bg-green-500/20 text-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Joined
                      </Badge>
                    ) : (
                      <Button 
                        size="sm" 
                        className="bg-orange-500 hover:bg-orange-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          joinProgramMutation.mutate(program.id);
                        }}
                      >
                        Join Program
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Back button and program header */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setSelectedProgram(null)}>
              ← Back to Programs
            </Button>
          </div>

          {/* Program Overview Card */}
          <Card className="border-2 border-orange-200 dark:border-orange-900/50 overflow-hidden">
            {selectedProgram.banner_image_url && (
              <div className="h-40 bg-cover bg-center" style={{ backgroundImage: `url(${selectedProgram.banner_image_url})` }} />
            )}
            <CardHeader className="bg-gradient-to-r from-[#1a2634] to-[#2d3748] text-white">
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  {selectedProgram.icon === 'fuel' ? '⛽' : selectedProgram.icon === 'factory' ? '🏭' : selectedProgram.icon === 'trophy' ? '🏆' : selectedProgram.icon === 'star' ? '⭐' : '🎁'}
                </span>
                <div>
                  <CardTitle className="text-xl">{selectedProgram.name}</CardTitle>
                  <CardDescription className="text-gray-300">{selectedProgram.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Points Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Fuel className="h-5 w-5 text-orange-500" />
                    <span className="font-semibold">{getTotalPoints()} / {getMaxPoints()} points</span>
                  </div>
                  {getNextReward() && (
                    <span className="text-sm text-muted-foreground">
                      Next: {getNextReward()?.name} ({getNextReward()!.required_points - getTotalPoints()} pts away)
                    </span>
                  )}
                </div>
                {/* Pipeline-style progress bar */}
                <div className="relative h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500"
                    style={{ width: `${Math.min((getTotalPoints() / getMaxPoints()) * 100, 100)}%` }}
                  />
                  {/* Pipeline segments */}
                  <div className="absolute inset-0 flex">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="flex-1 border-r border-gray-300 dark:border-gray-600" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              {selectedProgram.disclaimer_text && (
                <p className="text-xs text-muted-foreground italic mb-4">
                  {selectedProgram.disclaimer_text}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Tasks List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-500" />
                Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tasks.map((task) => {
                const status = getTaskStatus(task.id);
                const Icon = CATEGORY_ICONS[task.category] || Target;
                const ProofIcon = PROOF_ICONS[task.completion_method] || Upload;

                return (
                  <div 
                    key={task.id} 
                    className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                      status === 'approved' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                      status === 'pending' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
                      status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                      'hover:bg-muted/50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      status === 'approved' ? 'bg-green-100 dark:bg-green-800' :
                      status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-800' :
                      status === 'rejected' ? 'bg-red-100 dark:bg-red-800' :
                      'bg-orange-100 dark:bg-orange-900/30'
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        status === 'approved' ? 'text-green-600 dark:text-green-400' :
                        status === 'pending' ? 'text-yellow-600 dark:text-yellow-400' :
                        status === 'rejected' ? 'text-red-600 dark:text-red-400' :
                        'text-orange-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{task.name}</div>
                      {task.description && (
                        <div className="text-sm text-muted-foreground">{task.description}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-orange-600 font-semibold">
                      <Fuel className="h-4 w-4" />
                      {task.points} pts
                    </div>
                    <div>
                      {status === 'approved' && (
                        <Badge className="bg-green-500/20 text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                      {status === 'pending' && (
                        <Badge className="bg-yellow-500/20 text-yellow-600">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                      {status === 'rejected' && (
                        <Badge className="bg-red-500/20 text-red-600">
                          <XCircle className="h-3 w-3 mr-1" />
                          Rejected
                        </Badge>
                      )}
                      {status === 'available' && (
                        <Button
                          size="sm"
                          className="bg-orange-500 hover:bg-orange-600"
                          onClick={() => {
                            setSelectedTask(task);
                            setIsSubmitModalOpen(true);
                          }}
                        >
                          <ProofIcon className="h-4 w-4 mr-1" />
                          Submit Proof
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Rewards */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-orange-500" />
                Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rewards.map((reward) => {
                  const isUnlocked = getTotalPoints() >= reward.required_points;
                  return (
                    <Card key={reward.id} className={isUnlocked ? 'border-green-300 dark:border-green-700' : 'opacity-60'}>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Trophy className={`h-5 w-5 ${isUnlocked ? 'text-green-500' : 'text-muted-foreground'}`} />
                          <span className="font-semibold">{reward.name}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                          <Fuel className="h-3 w-3" />
                          {reward.required_points} points
                        </div>
                        <Badge variant={isUnlocked ? 'default' : 'secondary'}>
                          {isUnlocked ? '🎉 Unlocked!' : 'Locked'}
                        </Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Submit Proof Modal */}
      <Dialog open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Proof: {selectedTask?.name}</DialogTitle>
            <DialogDescription>{selectedTask?.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedTask?.completion_method === 'link_submission' && (
              <div className="space-y-2">
                <Label>Proof URL</Label>
                <Input
                  type="url"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="https://..."
                />
                <p className="text-xs text-muted-foreground">
                  Paste the link to your review, post, or content
                </p>
              </div>
            )}
            {selectedTask?.completion_method === 'screenshot_upload' && (
              <div className="space-y-2">
                <Label>Upload Screenshot</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-muted-foreground">
                  Upload a screenshot as proof of completion
                </p>
              </div>
            )}
            {selectedTask?.completion_method === 'manual_approval' && (
              <div className="space-y-2">
                <Label>Description / Notes</Label>
                <Input
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="Describe what you completed..."
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubmitModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSubmitProof}
              className="bg-orange-500 hover:bg-orange-600"
              disabled={submitProofMutation.isPending || (!proofUrl && !proofFile)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserRewardPrograms;
