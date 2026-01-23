import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';
import { 
  Gift, Trophy, Target, Fuel, CheckCircle, Mail, Building2, Upload, 
  Link2, Image, Video, FileText, HardHat, Share2, Users, ArrowRight,
  AlertCircle
} from 'lucide-react';

interface RewardProgram {
  id: string;
  name: string;
  description: string | null;
  banner_image_url: string | null;
  icon: string | null;
  disclaimer_text: string | null;
  status: string;
}

interface RewardTask {
  id: string;
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

const CATEGORY_ICONS: Record<string, typeof Target> = {
  review: HardHat,
  social_share: Share2,
  referral: Users,
  email_invite: Mail,
  video_review: Video,
  case_study: FileText,
  custom: Target
};

const RewardProgram = () => {
  const { slug } = useParams<{ slug: string }>();
  const [step, setStep] = useState<'landing' | 'register' | 'tasks' | 'success'>('landing');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<RewardTask | null>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);

  // Fetch program by slug
  const { data: program, isLoading, error } = useQuery({
    queryKey: ['reward-program', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reward_programs')
        .select('*')
        .eq('external_slug', slug)
        .eq('status', 'active')
        .in('program_type', ['external', 'both'])
        .single();
      if (error) throw error;
      return data as RewardProgram;
    },
    enabled: !!slug
  });

  // Fetch tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ['program-tasks', program?.id],
    queryFn: async () => {
      if (!program) return [];
      const { data, error } = await supabase
        .from('reward_program_tasks')
        .select('*')
        .eq('program_id', program.id)
        .eq('is_enabled', true)
        .order('task_order', { ascending: true });
      if (error) throw error;
      return data as RewardTask[];
    },
    enabled: !!program
  });

  // Fetch rewards
  const { data: rewards = [] } = useQuery({
    queryKey: ['program-rewards', program?.id],
    queryFn: async () => {
      if (!program) return [];
      const { data, error } = await supabase
        .from('reward_program_rewards')
        .select('*')
        .eq('program_id', program.id)
        .eq('is_active', true)
        .order('required_points', { ascending: true });
      if (error) throw error;
      return data as ProgramReward[];
    },
    enabled: !!program
  });

  // Register participant
  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!program) throw new Error('Program not found');
      
      const referralCode = `ext-${Date.now().toString(36)}`;
      
      const { data, error } = await supabase
        .from('reward_program_participants')
        .insert({
          program_id: program.id,
          email,
          name,
          company_name: companyName || null,
          source: 'external',
          referral_code: referralCode
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setParticipantId(data.id);
      setStep('tasks');
      toast.success('Welcome! You can now start completing tasks.');
    },
    onError: (error) => toast.error(`Error: ${error.message}`)
  });

  // Submit proof
  const submitProofMutation = useMutation({
    mutationFn: async ({ taskId, proofType, proofUrl: url }: { taskId: string; proofType: string; proofUrl: string }) => {
      if (!participantId) throw new Error('Not registered');

      const { error } = await supabase
        .from('reward_task_submissions')
        .insert({
          task_id: taskId,
          participant_id: participantId,
          proof_type: proofType,
          proof_url: url,
          status: 'pending'
        });
      if (error) throw error;
    },
    onSuccess: () => {
      setSelectedTask(null);
      setProofUrl('');
      setProofFile(null);
      toast.success('Proof submitted! We\'ll review it shortly.');
    },
    onError: (error) => toast.error(`Error: ${error.message}`)
  });

  const handleSubmitProof = async () => {
    if (!selectedTask) return;

    let finalProofUrl = proofUrl;

    // Handle file upload for external users
    if (proofFile) {
      const fileExt = proofFile.name.split('.').pop();
      const filePath = `external/${participantId}/${selectedTask.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
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

  const totalPoints = tasks.reduce((sum, task) => sum + task.points, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a2634] to-[#2d3748]">
        <div className="text-white text-center">
          <Gift className="h-12 w-12 mx-auto animate-pulse mb-4" />
          <p>Loading program...</p>
        </div>
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a2634] to-[#2d3748]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Program Not Found</h2>
            <p className="text-muted-foreground">This reward program doesn't exist or is no longer active.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{program.name} - Reward Program | PetroDealHub</title>
        <meta name="description" content={program.description || 'Join our reward program and earn exclusive benefits'} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-[#1a2634] to-[#2d3748]">
        {/* Hero Section */}
        <div className="relative">
          {program.banner_image_url ? (
            <div 
              className="h-64 bg-cover bg-center"
              style={{ backgroundImage: `url(${program.banner_image_url})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-[#1a2634]" />
            </div>
          ) : (
            <div className="h-64 bg-gradient-to-r from-orange-600 to-orange-400">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#1a2634]" />
            </div>
          )}
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <span className="text-5xl mb-4 block">
                {program.icon === 'fuel' ? '⛽' : program.icon === 'factory' ? '🏭' : program.icon === 'trophy' ? '🏆' : program.icon === 'star' ? '⭐' : '🎁'}
              </span>
              <h1 className="text-4xl font-bold mb-2">{program.name}</h1>
              <p className="text-xl text-white/80 max-w-2xl">{program.description}</p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 -mt-8">
          {/* Landing View */}
          {step === 'landing' && (
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-white/10 border-white/20 text-white">
                  <CardContent className="pt-6 text-center">
                    <Target className="h-8 w-8 mx-auto mb-2 text-orange-400" />
                    <div className="text-3xl font-bold">{tasks.length}</div>
                    <div className="text-sm text-white/60">Tasks to Complete</div>
                  </CardContent>
                </Card>
                <Card className="bg-white/10 border-white/20 text-white">
                  <CardContent className="pt-6 text-center">
                    <Fuel className="h-8 w-8 mx-auto mb-2 text-orange-400" />
                    <div className="text-3xl font-bold">{totalPoints}</div>
                    <div className="text-sm text-white/60">Points to Earn</div>
                  </CardContent>
                </Card>
                <Card className="bg-white/10 border-white/20 text-white">
                  <CardContent className="pt-6 text-center">
                    <Trophy className="h-8 w-8 mx-auto mb-2 text-orange-400" />
                    <div className="text-3xl font-bold">{rewards.length}</div>
                    <div className="text-sm text-white/60">Rewards Available</div>
                  </CardContent>
                </Card>
              </div>

              {/* Tasks Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-orange-500" />
                    How to Participate
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">Tasks Coming Soon</p>
                      <p className="text-sm">The program tasks are being configured. Check back shortly!</p>
                    </div>
                  ) : (
                    tasks.map((task, index) => {
                      const Icon = CATEGORY_ICONS[task.category] || Target;
                      return (
                        <div key={task.id} className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500 text-white font-bold">
                            {index + 1}
                          </div>
                          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                            <Icon className="h-5 w-5 text-orange-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{task.name}</div>
                            {task.description && (
                              <div className="text-sm text-muted-foreground">{task.description}</div>
                            )}
                          </div>
                          <Badge className="bg-orange-500/20 text-orange-600">
                            <Fuel className="h-3 w-3 mr-1" />
                            {task.points} pts
                          </Badge>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              {/* Rewards Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-orange-500" />
                    Rewards You Can Unlock
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {rewards.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Trophy className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">Rewards Coming Soon</p>
                      <p className="text-sm">Exciting rewards are being prepared. Stay tuned!</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {rewards.map((reward) => (
                        <div key={reward.id} className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                          <div className="flex items-center gap-2 mb-2">
                            <Trophy className="h-5 w-5 text-orange-500" />
                            <span className="font-semibold">{reward.name}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Fuel className="h-3 w-3" />
                            {reward.required_points} points required
                          </div>
                          {reward.reward_value && (
                            <Badge variant="secondary" className="mt-2">{reward.reward_value}</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Disclaimer */}
              {program.disclaimer_text && (
                <p className="text-center text-white/60 text-sm italic">
                  {program.disclaimer_text}
                </p>
              )}

              {/* CTA */}
              <div className="text-center">
                <Button 
                  size="lg" 
                  className="bg-orange-500 hover:bg-orange-600 text-lg px-8"
                  onClick={() => setStep('register')}
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          {/* Registration Form */}
          {step === 'register' && (
            <div className="max-w-md mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Join the Program</CardTitle>
                  <CardDescription>Enter your details to start earning rewards</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Company (Optional)</Label>
                    <Input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Your company"
                    />
                  </div>
                  <Button 
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    onClick={() => registerMutation.mutate()}
                    disabled={!email || registerMutation.isPending}
                  >
                    {registerMutation.isPending ? 'Joining...' : 'Join Program'}
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => setStep('landing')}
                  >
                    ← Back
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tasks View */}
          {step === 'tasks' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <Card>
                <CardHeader className="bg-green-50 dark:bg-green-900/20 rounded-t-lg">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <CardTitle>You're In!</CardTitle>
                  </div>
                  <CardDescription>Complete the tasks below to earn your rewards</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {tasks.map((task) => {
                    const Icon = CATEGORY_ICONS[task.category] || Target;
                    const isSelected = selectedTask?.id === task.id;

                    return (
                      <div key={task.id} className="border rounded-lg overflow-hidden">
                        <div 
                          className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedTask(isSelected ? null : task)}
                        >
                          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                            <Icon className="h-5 w-5 text-orange-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{task.name}</div>
                            {task.description && (
                              <div className="text-sm text-muted-foreground">{task.description}</div>
                            )}
                          </div>
                          <Badge className="bg-orange-500/20 text-orange-600">
                            <Fuel className="h-3 w-3 mr-1" />
                            {task.points} pts
                          </Badge>
                        </div>

                        {isSelected && (
                          <div className="p-4 bg-muted/30 border-t space-y-4">
                            {task.completion_method === 'link_submission' && (
                              <div className="space-y-2">
                                <Label>Proof URL</Label>
                                <Input
                                  type="url"
                                  value={proofUrl}
                                  onChange={(e) => setProofUrl(e.target.value)}
                                  placeholder="https://..."
                                />
                              </div>
                            )}
                            {task.completion_method === 'screenshot_upload' && (
                              <div className="space-y-2">
                                <Label>Upload Screenshot</Label>
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                                />
                              </div>
                            )}
                            {task.completion_method === 'manual_approval' && (
                              <div className="space-y-2">
                                <Label>Description</Label>
                                <Input
                                  value={proofUrl}
                                  onChange={(e) => setProofUrl(e.target.value)}
                                  placeholder="Describe what you completed..."
                                />
                              </div>
                            )}
                            <div className="flex gap-2">
                              <Button
                                className="bg-orange-500 hover:bg-orange-600"
                                onClick={handleSubmitProof}
                                disabled={submitProofMutation.isPending || (!proofUrl && !proofFile)}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Submit Proof
                              </Button>
                              <Button variant="ghost" onClick={() => setSelectedTask(null)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Trophy className="h-5 w-5 text-orange-500" />
                    Available Rewards
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {rewards.map((reward) => (
                      <div key={reward.id} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                        <Trophy className="h-5 w-5 text-orange-500" />
                        <div className="flex-1">
                          <div className="font-medium">{reward.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {reward.required_points} points required
                          </div>
                        </div>
                        {reward.reward_value && (
                          <Badge variant="outline">{reward.reward_value}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 py-6">
          <div className="container mx-auto px-4 text-center text-white/40 text-sm">
            Powered by PetroDealHub Rewards
          </div>
        </div>
      </div>
    </>
  );
};

export default RewardProgram;
