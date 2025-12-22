import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, FileText, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Execution {
  id: string;
  workflow_id: string | null;
  agent_id: string | null;
  trigger_event: string | null;
  trigger_data: unknown;
  status: string | null;
  steps_completed: unknown;
  current_step: number | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  execution_time_ms: number | null;
  agent_workflows?: { name: string } | null;
  [key: string]: unknown;
}

const ExecutionLogsTab = () => {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchExecutions();
  }, []);

  const fetchExecutions = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_executions')
        .select('*, agent_workflows(name)')
        .order('started_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setExecutions(data || []);
    } catch (error) {
      console.error('Error fetching executions:', error);
      toast.error('Failed to load execution logs');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Failed</Badge>;
      case 'running':
        return <Badge className="bg-blue-500"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Running</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
    }
  };

  const openDetails = (execution: Execution) => {
    setSelectedExecution(execution);
    setDetailsOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Execution Logs</h3>
        <Button variant="outline" onClick={fetchExecutions}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {executions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No execution logs yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Logs will appear here when workflows are triggered
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Steps</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {executions.map((execution) => (
                  <TableRow key={execution.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetails(execution)}>
                    <TableCell className="font-medium">
                      {execution.agent_workflows?.name || 'Unknown Workflow'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{execution.trigger_event}</Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(execution.status)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(execution.started_at), 'MMM d, HH:mm:ss')}
                    </TableCell>
                    <TableCell className="text-sm">
                      {execution.execution_time_ms ? `${execution.execution_time_ms}ms` : '-'}
                    </TableCell>
                    <TableCell>
                      {Array.isArray(execution.steps_completed) ? execution.steps_completed.length : 0}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Execution Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Execution Details</DialogTitle>
          </DialogHeader>
          {selectedExecution && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Workflow</p>
                    <p className="font-medium">{selectedExecution.agent_workflows?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    {getStatusBadge(selectedExecution.status)}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Trigger Event</p>
                    <p className="font-medium">{selectedExecution.trigger_event}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">{selectedExecution.execution_time_ms ? `${selectedExecution.execution_time_ms}ms` : 'In Progress'}</p>
                  </div>
                </div>

                {selectedExecution.error_message && (
                  <Card className="border-destructive">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-destructive">Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-sm whitespace-pre-wrap">{selectedExecution.error_message}</pre>
                    </CardContent>
                  </Card>
                )}

                <div>
                  <h4 className="font-medium mb-2">Trigger Data</h4>
                  <pre className="text-sm bg-muted p-3 rounded-lg overflow-auto max-h-[200px]">
                    {JSON.stringify(selectedExecution.trigger_data, null, 2)}
                  </pre>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Steps ({Array.isArray(selectedExecution.steps_completed) ? selectedExecution.steps_completed.length : 0})</h4>
                  <div className="space-y-2">
                    {Array.isArray(selectedExecution.steps_completed) && selectedExecution.steps_completed.map((step: any, idx: number) => (
                      <Card key={idx} className={step.status === 'failed' ? 'border-destructive' : ''}>
                        <CardContent className="py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Step {step.step}</span>
                              <Badge variant="outline">{step.node_type}</Badge>
                              <span className="text-sm text-muted-foreground">{step.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {step.status === 'completed' ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-destructive" />
                              )}
                              <span className="text-sm text-muted-foreground">{step.duration_ms}ms</span>
                            </div>
                          </div>
                          {step.error && (
                            <p className="text-sm text-destructive mt-2">{step.error}</p>
                          )}
                          {step.result && (
                            <details className="mt-2">
                              <summary className="text-sm text-muted-foreground cursor-pointer">View Result</summary>
                              <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-[100px]">
                                {JSON.stringify(step.result, null, 2)}
                              </pre>
                            </details>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExecutionLogsTab;
