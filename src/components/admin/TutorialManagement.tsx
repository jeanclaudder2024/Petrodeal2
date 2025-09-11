import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Edit, Trash2, Video, Eye, EyeOff } from "lucide-react";

const tutorialSchema = z.object({
  title: z.string().min(1, "Title is required"),
  video_url: z.string().url("Must be a valid URL").min(1, "Video URL is required"),
  description: z.string().optional(),
  is_active: z.boolean(),
  sort_order: z.number().min(0).default(0),
});

type TutorialForm = z.infer<typeof tutorialSchema>;

const TutorialManagement = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState<any>(null);
  const queryClient = useQueryClient();

  const form = useForm<TutorialForm>({
    resolver: zodResolver(tutorialSchema),
    defaultValues: {
      title: "",
      video_url: "",
      description: "",
      is_active: true,
      sort_order: 0,
    },
  });

  // Fetch tutorials
  const { data: tutorials, isLoading } = useQuery({
    queryKey: ['admin-tutorials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tutorials')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  // Create tutorial mutation
  const createMutation = useMutation({
    mutationFn: async (data: TutorialForm) => {
      const user = await supabase.auth.getUser();
      const { error } = await supabase
        .from('tutorials')
        .insert({ 
          title: data.title,
          video_url: data.video_url,
          description: data.description,
          is_active: data.is_active,
          sort_order: data.sort_order,
          created_by: user.data.user?.id 
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tutorials', 'tutorials'] });
      toast.success("Tutorial created successfully");
      setIsCreateOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error("Failed to create tutorial: " + error.message);
    }
  });

  // Update tutorial mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TutorialForm }) => {
      const { error } = await supabase
        .from('tutorials')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tutorials', 'tutorials'] });
      toast.success("Tutorial updated successfully");
      setEditingTutorial(null);
      form.reset();
    },
    onError: (error: any) => {
      toast.error("Failed to update tutorial: " + error.message);
    }
  });

  // Delete tutorial mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tutorials')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tutorials', 'tutorials'] });
      toast.success("Tutorial deleted successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to delete tutorial: " + error.message);
    }
  });

  const onSubmit = (data: TutorialForm) => {
    if (editingTutorial) {
      updateMutation.mutate({ id: editingTutorial.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (tutorial: any) => {
    setEditingTutorial(tutorial);
    form.reset({
      title: tutorial.title,
      video_url: tutorial.video_url,
      description: tutorial.description || "",
      is_active: tutorial.is_active,
      sort_order: tutorial.sort_order || 0,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this tutorial?")) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setEditingTutorial(null);
    form.reset({
      title: "",
      video_url: "",
      description: "",
      is_active: true,
      sort_order: 0,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Video className="h-6 w-6" />
            Tutorial Management
          </h2>
          <p className="text-muted-foreground">
            Manage tutorial videos and content for the learning center.
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tutorial
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTutorial ? "Edit Tutorial" : "Create New Tutorial"}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Tutorial title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="video_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video URL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://www.youtube.com/embed/..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        Use YouTube embed URL format for best results
                      </p>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tutorial description..."
                          rows={4}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sort_order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sort Order</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Active</FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Show tutorial to users
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsCreateOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingTutorial ? "Update" : "Create"} Tutorial
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tutorials</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sort Order</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tutorials?.map((tutorial) => (
                  <TableRow key={tutorial.id}>
                    <TableCell className="font-medium">
                      {tutorial.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant={tutorial.is_active ? "default" : "secondary"}>
                        {tutorial.is_active ? (
                          <>
                            <Eye className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>{tutorial.sort_order}</TableCell>
                    <TableCell>
                      {new Date(tutorial.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            handleEdit(tutorial);
                            setIsCreateOpen(true);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(tutorial.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TutorialManagement;