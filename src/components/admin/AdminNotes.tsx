import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Edit, Trash2 } from 'lucide-react';
import { db } from '@/lib/supabase-helper';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AdminNote {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

const AdminNotes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<AdminNote | null>(null);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    category: 'general',
    priority: 'normal'
  });

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const { data, error } = await db
        .from('admin_notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Failed to fetch admin notes:', error);
      toast({
        title: "Error",
        description: "Failed to load admin notes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await db
        .from('admin_notes')
        .insert({
          ...newNote,
          admin_id: user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Note created successfully"
      });

      setIsCreateDialogOpen(false);
      setNewNote({
        title: '',
        content: '',
        category: 'general',
        priority: 'normal'
      });
      fetchNotes();
    } catch (error) {
      console.error('Failed to create note:', error);
      toast({
        title: "Error",
        description: "Failed to create note",
        variant: "destructive"
      });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await db
        .from('admin_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Note deleted successfully"
      });

      fetchNotes();
    } catch (error) {
      console.error('Failed to delete note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive"
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'security': return 'bg-red-500';
      case 'feature': return 'bg-blue-500';
      case 'bug': return 'bg-orange-500';
      case 'maintenance': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="trading-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Admin Notes
              </CardTitle>
              <CardDescription>
                Keep track of important administrative tasks and reminders
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="hero-button">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Admin Note</DialogTitle>
                  <DialogDescription>
                    Add a new administrative note or reminder
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateNote} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newNote.title}
                      onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                      placeholder="Note title"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select onValueChange={(value) => setNewNote({ ...newNote, category: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="security">Security</SelectItem>
                          <SelectItem value="feature">Feature</SelectItem>
                          <SelectItem value="bug">Bug</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select onValueChange={(value) => setNewNote({ ...newNote, priority: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={newNote.content}
                      onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                      placeholder="Note content..."
                      rows={4}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="hero-button">
                      Create Note
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.length === 0 ? (
              <div className="col-span-full text-center text-muted-foreground py-8">
                No admin notes found. Create your first note to get started.
              </div>
            ) : (
              notes.map((note) => (
                <Card key={note.id} className="trading-card">
                  <CardHeader className="space-y-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{note.title}</CardTitle>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge 
                        variant="outline" 
                        className={`text-white ${getCategoryColor(note.category)}`}
                      >
                        {note.category}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-white ${getPriorityColor(note.priority)}`}
                      >
                        {note.priority}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {note.content}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(note.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNotes;