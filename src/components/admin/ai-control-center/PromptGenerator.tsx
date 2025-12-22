import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Sparkles, Bot, Code, Copy, Check, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  summary?: {
    assistants: number;
    sdk_agents: number;
    tools: number;
    workflows: number;
  };
}

const PromptGenerator = () => {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [generatedJson, setGeneratedJson] = useState<any>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<{ type: string; index: number } | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a description');
      return;
    }

    setGenerating(true);
    setValidation(null);
    try {
      const { data, error } = await supabase.functions.invoke('openai-agent-builder', {
        body: {
          action: 'prompt_to_json',
          prompt: prompt
        }
      });

      if (error) throw error;

      setGeneratedJson(data.config);
      setValidation(data.validation);
      
      if (data.validation?.valid) {
        toast.success('Blueprint generated and validated');
      } else {
        toast.warning('Blueprint generated with validation errors');
      }
    } catch (error) {
      console.error('Error generating config:', error);
      toast.error('Failed to generate configuration');
    } finally {
      setGenerating(false);
    }
  };

  const handleValidate = async () => {
    if (!generatedJson) return;

    try {
      const { data, error } = await supabase.functions.invoke('openai-agent-builder', {
        body: {
          action: 'validate_blueprint',
          blueprint: generatedJson
        }
      });

      if (error) throw error;

      setValidation(data);
      if (data.valid) {
        toast.success('Blueprint is valid');
      } else {
        toast.error(`Validation failed with ${data.errors.length} errors`);
      }
    } catch (error) {
      console.error('Error validating:', error);
      toast.error('Failed to validate blueprint');
    }
  };

  const handleCompile = async () => {
    if (!generatedJson || !selectedTarget || !validation?.valid) {
      toast.error('Please select a valid target to compile');
      return;
    }

    setCompiling(true);
    try {
      const { data, error } = await supabase.functions.invoke('openai-agent-builder', {
        body: {
          action: 'compile_blueprint',
          blueprint: generatedJson,
          target: selectedTarget.type,
          target_index: selectedTarget.index,
          created_by: user?.id
        }
      });

      if (error) throw error;

      toast.success(`${selectedTarget.type === 'assistant' ? 'Assistant' : 'SDK Agent'} created successfully`);
      setSelectedTarget(null);
    } catch (error) {
      console.error('Error compiling:', error);
      toast.error('Failed to compile');
    } finally {
      setCompiling(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(generatedJson, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  const getTargetOptions = () => {
    const options: { type: string; index: number; label: string }[] = [];
    
    if (generatedJson?.assistants?.length > 0) {
      generatedJson.assistants.forEach((a: any, idx: number) => {
        options.push({ type: 'assistant', index: idx, label: `Assistant: ${a.name}` });
      });
    }
    
    if (generatedJson?.sdk_agents?.length > 0) {
      generatedJson.sdk_agents.forEach((a: any, idx: number) => {
        options.push({ type: 'sdk_agent', index: idx, label: `SDK Agent: ${a.name}` });
      });
    }
    
    return options;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Blueprint Generator
        </CardTitle>
        <CardDescription>
          Describe your AI system and generate a strict, validated Blueprint JSON
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="prompt">Describe Your AI System</Label>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Example: I need a customer support chatbot that can answer questions about subscriptions, and an operations agent that monitors vessel arrivals and sends notifications to brokers..."
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            Be specific about: Assistants (chat/analysis), SDK Agents (event-driven), Tools needed, and Workflows
          </p>
        </div>
        
        <Button onClick={handleGenerate} disabled={generating || !prompt.trim()}>
          {generating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          Generate Blueprint
        </Button>

        {generatedJson && (
          <div className="space-y-4 mt-4 pt-4 border-t">
            {/* Validation Status */}
            {validation && (
              <Alert variant={validation.valid ? 'default' : 'destructive'}>
                {validation.valid ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {validation.valid ? 'Blueprint Valid' : 'Validation Errors'}
                </AlertTitle>
                <AlertDescription>
                  {validation.valid ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {validation.summary && (
                        <>
                          <Badge variant="outline">{validation.summary.assistants} Assistants</Badge>
                          <Badge variant="outline">{validation.summary.sdk_agents} SDK Agents</Badge>
                          <Badge variant="outline">{validation.summary.tools} Tools</Badge>
                          <Badge variant="outline">{validation.summary.workflows} Workflows</Badge>
                        </>
                      )}
                    </div>
                  ) : (
                    <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                      {validation.errors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* JSON Preview with Tabs */}
            <Tabs defaultValue="json" className="w-full">
              <TabsList>
                <TabsTrigger value="json">Raw JSON</TabsTrigger>
                <TabsTrigger value="assistants">Assistants ({generatedJson.assistants?.length || 0})</TabsTrigger>
                <TabsTrigger value="agents">SDK Agents ({generatedJson.sdk_agents?.length || 0})</TabsTrigger>
                <TabsTrigger value="tools">Tools ({generatedJson.tools?.length || 0})</TabsTrigger>
                <TabsTrigger value="workflows">Workflows ({generatedJson.workflows?.length || 0})</TabsTrigger>
              </TabsList>

              <TabsContent value="json" className="mt-2">
                <div className="flex items-center justify-between mb-2">
                  <Label>Generated Blueprint</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleValidate}>
                      Re-validate
                    </Button>
                    <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                      {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                </div>
                <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto max-h-[300px]">
                  {JSON.stringify(generatedJson, null, 2)}
                </pre>
              </TabsContent>

              <TabsContent value="assistants" className="mt-2">
                {generatedJson.assistants?.length > 0 ? (
                  <div className="space-y-2">
                    {generatedJson.assistants.map((a: any, idx: number) => (
                      <Card key={idx} className="p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{a.name}</h4>
                            <p className="text-sm text-muted-foreground">{a.description}</p>
                            <Badge variant="secondary" className="mt-1">{a.model || 'gpt-4o'}</Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedTarget({ type: 'assistant', index: idx })}
                          >
                            Select
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No assistants defined</p>
                )}
              </TabsContent>

              <TabsContent value="agents" className="mt-2">
                {generatedJson.sdk_agents?.length > 0 ? (
                  <div className="space-y-2">
                    {generatedJson.sdk_agents.map((a: any, idx: number) => (
                      <Card key={idx} className="p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{a.name}</h4>
                            <p className="text-sm text-muted-foreground">{a.responsibility?.substring(0, 100)}...</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {a.triggers?.map((t: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                              ))}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedTarget({ type: 'sdk_agent', index: idx })}
                          >
                            Select
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No SDK agents defined</p>
                )}
              </TabsContent>

              <TabsContent value="tools" className="mt-2">
                {generatedJson.tools?.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {generatedJson.tools.map((t: any, idx: number) => (
                      <Card key={idx} className="p-2">
                        <h4 className="font-medium text-sm">{t.name}</h4>
                        <p className="text-xs text-muted-foreground">{t.function_name}</p>
                        <Badge variant="secondary" className="text-xs mt-1">{t.type}</Badge>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No tools defined</p>
                )}
              </TabsContent>

              <TabsContent value="workflows" className="mt-2">
                {generatedJson.workflows?.length > 0 ? (
                  <div className="space-y-2">
                    {generatedJson.workflows.map((w: any, idx: number) => (
                      <Card key={idx} className="p-3">
                        <h4 className="font-medium">{w.name}</h4>
                        <Badge variant="outline" className="mt-1">{w.trigger}</Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {w.steps?.length || 0} steps
                        </p>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No workflows defined</p>
                )}
              </TabsContent>
            </Tabs>

            {/* Compile Section */}
            <div className="flex items-center gap-4 pt-4 border-t">
              <div className="flex-1">
                <Label className="mb-2 block">Select target to compile:</Label>
                <Select
                  value={selectedTarget ? `${selectedTarget.type}-${selectedTarget.index}` : ''}
                  onValueChange={(v) => {
                    const [type, idx] = v.split('-');
                    setSelectedTarget({ type, index: parseInt(idx) });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Assistant or SDK Agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {getTargetOptions().map((opt) => (
                      <SelectItem key={`${opt.type}-${opt.index}`} value={`${opt.type}-${opt.index}`}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleCompile}
                disabled={compiling || !selectedTarget || !validation?.valid}
                className="mt-6"
              >
                {compiling ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : selectedTarget?.type === 'assistant' ? (
                  <Bot className="h-4 w-4 mr-2" />
                ) : (
                  <Code className="h-4 w-4 mr-2" />
                )}
                Compile Selected
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PromptGenerator;