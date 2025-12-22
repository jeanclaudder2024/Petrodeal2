import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Zap, Eye, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PlatformEvent {
  id: string;
  event_name: string;
  description: string;
  category: string;
  sample_payload: any;
  is_active: boolean;
}

interface EventUsage {
  workflows: string[];
  agents: string[];
}

const EventRegistryTab = () => {
  const [events, setEvents] = useState<PlatformEvent[]>([]);
  const [eventUsage, setEventUsage] = useState<Record<string, EventUsage>>({});
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<PlatformEvent | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      // Fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from('event_registry')
        .select('*')
        .order('category', { ascending: true });

      if (eventsError) throw eventsError;

      // Fetch workflows to check event usage
      const { data: workflows } = await supabase
        .from('agent_workflows')
        .select('id, name, trigger_event');

      // Fetch agents to check event usage
      const { data: agents } = await supabase
        .from('ai_agents')
        .select('id, name, triggers');

      // Build usage map
      const usage: Record<string, EventUsage> = {};
      
      for (const event of eventsData || []) {
        usage[event.event_name] = { workflows: [], agents: [] };
        
        // Check which workflows use this event
        workflows?.forEach(w => {
          if (w.trigger_event === event.event_name) {
            usage[event.event_name].workflows.push(w.name);
          }
        });

        // Check which agents use this event
        agents?.forEach(a => {
          const triggers = Array.isArray(a.triggers) ? a.triggers : [];
          if (triggers.includes(event.event_name)) {
            usage[event.event_name].agents.push(a.name);
          }
        });
      }

      setEvents(eventsData || []);
      setEventUsage(usage);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      vessel: 'bg-blue-500',
      order: 'bg-green-500',
      support: 'bg-yellow-500',
      email: 'bg-purple-500',
      subscription: 'bg-orange-500',
      billing: 'bg-red-500',
      broker: 'bg-pink-500',
      deal: 'bg-indigo-500',
      system: 'bg-gray-500'
    };
    return colors[category] || 'bg-gray-500';
  };

  const openDetails = (event: PlatformEvent) => {
    setSelectedEvent(event);
    setDetailsOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const groupedEvents = events.reduce((acc, event) => {
    if (!acc[event.category]) acc[event.category] = [];
    acc[event.category].push(event);
    return acc;
  }, {} as Record<string, PlatformEvent[]>);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Event Registry</h3>
          <p className="text-sm text-muted-foreground">
            View all platform events and their bindings to workflows and agents
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {events.length} events registered
        </Badge>
      </div>

      {Object.entries(groupedEvents).map(([category, categoryEvents]) => (
        <Card key={category}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getCategoryColor(category)}`} />
              {category.charAt(0).toUpperCase() + category.slice(1)} Events
              <Badge variant="secondary" className="ml-2">{categoryEvents.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Workflows</TableHead>
                  <TableHead>Agents</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryEvents.map((event) => {
                  const usage = eventUsage[event.event_name] || { workflows: [], agents: [] };
                  const hasBindings = usage.workflows.length > 0 || usage.agents.length > 0;
                  
                  return (
                    <TableRow key={event.id}>
                      <TableCell className="font-mono text-sm">{event.event_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {event.description}
                      </TableCell>
                      <TableCell>
                        {usage.workflows.length > 0 ? (
                          <Badge variant="outline" className="text-xs">
                            {usage.workflows.length} workflow{usage.workflows.length !== 1 ? 's' : ''}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {usage.agents.length > 0 ? (
                          <Badge variant="outline" className="text-xs">
                            {usage.agents.length} agent{usage.agents.length !== 1 ? 's' : ''}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasBindings ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => openDetails(event)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {/* Event Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              {selectedEvent?.event_name}
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">Description</h4>
                <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
              </div>

              <div>
                <h4 className="font-medium mb-1">Category</h4>
                <Badge className={getCategoryColor(selectedEvent.category)}>
                  {selectedEvent.category}
                </Badge>
              </div>

              <div>
                <h4 className="font-medium mb-2">Sample Payload</h4>
                <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto max-h-[200px]">
                  {JSON.stringify(selectedEvent.sample_payload, null, 2)}
                </pre>
              </div>

              <div>
                <h4 className="font-medium mb-2">Bindings</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Workflows:</p>
                    {eventUsage[selectedEvent.event_name]?.workflows.length > 0 ? (
                      <div className="space-y-1">
                        {eventUsage[selectedEvent.event_name].workflows.map((name, idx) => (
                          <Badge key={idx} variant="outline">{name}</Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No workflows bound</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">SDK Agents:</p>
                    {eventUsage[selectedEvent.event_name]?.agents.length > 0 ? (
                      <div className="space-y-1">
                        {eventUsage[selectedEvent.event_name].agents.map((name, idx) => (
                          <Badge key={idx} variant="outline">{name}</Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No agents bound</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventRegistryTab;