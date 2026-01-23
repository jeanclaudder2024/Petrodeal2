import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  GripVertical,
  CheckCircle,
  Clock,
  Target,
  Loader2
} from 'lucide-react';

interface Stage {
  id: string;
  stage_number: number;
  name: string;
  description: string | null;
  passing_threshold: number;
  weight_percentage: number;
  time_limit_minutes: number | null;
  is_enabled: boolean;
  stage_order: number;
}

interface Question {
  id: string;
  stage_id: string;
  question_type: string;
  points: number;
  question_order: number;
  is_enabled: boolean;
  translations?: QuestionTranslation[];
}

interface QuestionTranslation {
  id: string;
  question_id: string;
  language_code: string;
  question_text: string;
  options: any;
  correct_answer: string | null;
  explanation: string | null;
}

const questionTypes = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'true_false', label: 'True/False' },
  { value: 'short_answer', label: 'Short Answer' },
  { value: 'scenario', label: 'Scenario Analysis' },
  { value: 'ranking', label: 'Ranking/Prioritization' },
  { value: 'outreach_draft', label: 'Outreach Draft' },
  { value: 'objection_handling', label: 'Objection Handling' },
];

const AssessmentBuilderTab = () => {
  const queryClient = useQueryClient();
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  // Form states
  const [stageForm, setStageForm] = useState({
    name: '',
    description: '',
    passing_threshold: 60,
    weight_percentage: 25,
    time_limit_minutes: 30,
    is_enabled: true,
  });

  const [questionForm, setQuestionForm] = useState({
    question_type: 'multiple_choice',
    points: 10,
    is_enabled: true,
    question_text: '',
    options: ['', '', '', ''],
    correct_answer: '',
    explanation: '',
  });

  // Fetch stages
  const { data: stages, isLoading: stagesLoading } = useQuery({
    queryKey: ['talent-stages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('talent_stages')
        .select('*')
        .order('stage_order');

      if (error) throw error;
      return data as Stage[];
    },
  });

  // Fetch questions for selected stage
  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['talent-questions', selectedStage],
    queryFn: async () => {
      if (!selectedStage) return [];

      const { data, error } = await supabase
        .from('talent_questions')
        .select(`
          *,
          talent_question_translations (*)
        `)
        .eq('stage_id', selectedStage)
        .order('question_order');

      if (error) throw error;
      return data as (Question & { talent_question_translations: QuestionTranslation[] })[];
    },
    enabled: !!selectedStage,
  });

  // Stage mutations
  const saveStagesMutation = useMutation({
    mutationFn: async (data: Partial<Stage>) => {
      if (editingStage) {
        const { error } = await supabase
          .from('talent_stages')
          .update(data)
          .eq('id', editingStage.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent-stages'] });
      toast.success('Stage updated');
      setIsStageDialogOpen(false);
      setEditingStage(null);
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const toggleStageMutation = useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
      const { error } = await supabase
        .from('talent_stages')
        .update({ is_enabled })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent-stages'] });
      toast.success('Stage status updated');
    },
  });

  // Question mutations
  const saveQuestionMutation = useMutation({
    mutationFn: async () => {
      if (editingQuestion) {
        // Update question
        const { error: qError } = await supabase
          .from('talent_questions')
          .update({
            question_type: questionForm.question_type,
            points: questionForm.points,
            is_enabled: questionForm.is_enabled,
          })
          .eq('id', editingQuestion.id);
        if (qError) throw qError;

        // Update or insert translation
        const { error: tError } = await supabase
          .from('talent_question_translations')
          .upsert({
            question_id: editingQuestion.id,
            language_code: selectedLanguage,
            question_text: questionForm.question_text,
            options: questionForm.question_type === 'multiple_choice' || questionForm.question_type === 'true_false'
              ? questionForm.options.filter(o => o.trim())
              : null,
            correct_answer: questionForm.correct_answer || null,
            explanation: questionForm.explanation || null,
          }, { onConflict: 'question_id,language_code' });
        if (tError) throw tError;
      } else {
        // Create question
        const { data: newQ, error: qError } = await supabase
          .from('talent_questions')
          .insert({
            stage_id: selectedStage,
            question_type: questionForm.question_type,
            points: questionForm.points,
            question_order: (questions?.length || 0) + 1,
            is_enabled: questionForm.is_enabled,
          })
          .select()
          .single();
        if (qError) throw qError;

        // Insert translation
        const { error: tError } = await supabase
          .from('talent_question_translations')
          .insert({
            question_id: newQ.id,
            language_code: selectedLanguage,
            question_text: questionForm.question_text,
            options: questionForm.question_type === 'multiple_choice' || questionForm.question_type === 'true_false'
              ? questionForm.options.filter(o => o.trim())
              : null,
            correct_answer: questionForm.correct_answer || null,
            explanation: questionForm.explanation || null,
          });
        if (tError) throw tError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent-questions'] });
      toast.success(editingQuestion ? 'Question updated' : 'Question created');
      setIsQuestionDialogOpen(false);
      resetQuestionForm();
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('talent_questions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent-questions'] });
      toast.success('Question deleted');
    },
  });

  const resetQuestionForm = () => {
    setQuestionForm({
      question_type: 'multiple_choice',
      points: 10,
      is_enabled: true,
      question_text: '',
      options: ['', '', '', ''],
      correct_answer: '',
      explanation: '',
    });
    setEditingQuestion(null);
  };

  const handleEditStage = (stage: Stage) => {
    setEditingStage(stage);
    setStageForm({
      name: stage.name,
      description: stage.description || '',
      passing_threshold: stage.passing_threshold,
      weight_percentage: stage.weight_percentage,
      time_limit_minutes: stage.time_limit_minutes || 30,
      is_enabled: stage.is_enabled,
    });
    setIsStageDialogOpen(true);
  };

  const handleEditQuestion = (question: Question & { talent_question_translations: QuestionTranslation[] }) => {
    const translation = question.talent_question_translations?.find(t => t.language_code === selectedLanguage) 
      || question.talent_question_translations?.[0];
    
    setEditingQuestion(question);
    setQuestionForm({
      question_type: question.question_type,
      points: question.points,
      is_enabled: question.is_enabled,
      question_text: translation?.question_text || '',
      options: translation?.options || ['', '', '', ''],
      correct_answer: translation?.correct_answer || '',
      explanation: translation?.explanation || '',
    });
    setIsQuestionDialogOpen(true);
  };

  const handleAddQuestion = () => {
    resetQuestionForm();
    setIsQuestionDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Stages Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Stages</CardTitle>
          <CardDescription>
            Configure the 4 assessment stages with passing thresholds and weights
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stagesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4">
              {stages?.map((stage) => (
                <div
                  key={stage.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedStage === stage.id ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground'
                  }`}
                  onClick={() => setSelectedStage(stage.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        {stage.stage_number}
                      </div>
                      <div>
                        <h4 className="font-semibold">{stage.name}</h4>
                        <p className="text-sm text-muted-foreground">{stage.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <div className="flex items-center gap-1">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span>{stage.passing_threshold}% to pass</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{stage.time_limit_minutes} min</span>
                        </div>
                      </div>
                      <Badge variant={stage.is_enabled ? 'default' : 'secondary'}>
                        {stage.weight_percentage}% weight
                      </Badge>
                      <Switch
                        checked={stage.is_enabled}
                        onCheckedChange={(checked) =>
                          toggleStageMutation.mutate({ id: stage.id, is_enabled: checked })
                        }
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditStage(stage);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Questions for Selected Stage */}
      {selectedStage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Questions - {stages?.find(s => s.id === selectedStage)?.name}</span>
              <div className="flex items-center gap-2">
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAddQuestion}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {questionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : questions?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No questions yet. Click "Add Question" to create one.
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {questions?.map((question, index) => {
                  const translation = question.talent_question_translations?.find(
                    (t) => t.language_code === selectedLanguage
                  );
                  return (
                    <AccordionItem key={question.id} value={question.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 text-left">
                          <span className="text-muted-foreground">Q{index + 1}</span>
                          <Badge variant="outline">{question.question_type.replace('_', ' ')}</Badge>
                          <span className="flex-1 truncate">
                            {translation?.question_text || 'No translation for this language'}
                          </span>
                          <Badge variant="secondary">{question.points} pts</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-4">
                          <p className="text-sm">{translation?.question_text}</p>
                          {translation?.options && Array.isArray(translation.options) && (
                            <div className="space-y-2">
                              <Label className="text-muted-foreground">Options:</Label>
                              <ul className="list-disc list-inside text-sm space-y-1">
                                {translation.options.map((opt: string, i: number) => (
                                  <li key={i} className={opt === translation.correct_answer ? 'text-green-600 font-medium' : ''}>
                                    {opt} {opt === translation.correct_answer && '✓'}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <div className="flex items-center gap-2 pt-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditQuestion(question)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteQuestionMutation.mutate(question.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stage Edit Dialog */}
      <Dialog open={isStageDialogOpen} onOpenChange={setIsStageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Stage</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Stage Name</Label>
              <Input
                value={stageForm.name}
                onChange={(e) => setStageForm({ ...stageForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={stageForm.description}
                onChange={(e) => setStageForm({ ...stageForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Passing Threshold (%)</Label>
                <Input
                  type="number"
                  value={stageForm.passing_threshold}
                  onChange={(e) => setStageForm({ ...stageForm, passing_threshold: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>Weight (%)</Label>
                <Input
                  type="number"
                  value={stageForm.weight_percentage}
                  onChange={(e) => setStageForm({ ...stageForm, weight_percentage: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label>Time Limit (minutes)</Label>
              <Input
                type="number"
                value={stageForm.time_limit_minutes}
                onChange={(e) => setStageForm({ ...stageForm, time_limit_minutes: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStageDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveStagesMutation.mutate(stageForm)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question Edit Dialog */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add Question'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Question Type</Label>
                <Select
                  value={questionForm.question_type}
                  onValueChange={(v) => setQuestionForm({ ...questionForm, question_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {questionTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Points</Label>
                <Input
                  type="number"
                  value={questionForm.points}
                  onChange={(e) => setQuestionForm({ ...questionForm, points: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <Label>Question Text ({selectedLanguage.toUpperCase()})</Label>
              <Textarea
                value={questionForm.question_text}
                onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                rows={3}
              />
            </div>

            {(questionForm.question_type === 'multiple_choice' || questionForm.question_type === 'true_false') && (
              <div className="space-y-2">
                <Label>Options</Label>
                {questionForm.options.map((opt, i) => (
                  <Input
                    key={i}
                    value={opt}
                    onChange={(e) => {
                      const newOptions = [...questionForm.options];
                      newOptions[i] = e.target.value;
                      setQuestionForm({ ...questionForm, options: newOptions });
                    }}
                    placeholder={`Option ${i + 1}`}
                  />
                ))}
              </div>
            )}

            {(questionForm.question_type === 'multiple_choice' || questionForm.question_type === 'true_false') && (
              <div>
                <Label>Correct Answer</Label>
                <Select
                  value={questionForm.correct_answer}
                  onValueChange={(v) => setQuestionForm({ ...questionForm, correct_answer: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select correct answer" />
                  </SelectTrigger>
                  <SelectContent>
                    {questionForm.options.filter(o => o.trim()).map((opt, i) => (
                      <SelectItem key={i} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Explanation (shown after answer)</Label>
              <Textarea
                value={questionForm.explanation}
                onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={questionForm.is_enabled}
                onCheckedChange={(checked) => setQuestionForm({ ...questionForm, is_enabled: checked })}
              />
              <Label>Enabled</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuestionDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveQuestionMutation.mutate()} disabled={saveQuestionMutation.isPending}>
              {saveQuestionMutation.isPending ? 'Saving...' : 'Save Question'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssessmentBuilderTab;
