import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Save, 
  Upload, 
  Image, 
  Type, 
  Layout, 
  Eye, 
  EyeOff,
  Trash2,
  Plus,
  RefreshCw,
  Settings
} from "lucide-react";

interface LandingPageContent {
  id: string;
  section_name: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  content: any;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const LandingPageManager = () => {
  const [contentSections, setContentSections] = useState<LandingPageContent[]>([]);
  const [selectedSection, setSelectedSection] = useState<LandingPageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchLandingPageContent();
  }, []);

  const fetchLandingPageContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('landing_page_content')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setContentSections(data || []);
      if (data && data.length > 0) {
        setSelectedSection(data[0]);
      }
    } catch (error) {
      console.error('Error fetching landing page content:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch landing page content"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSection = async () => {
    if (!selectedSection) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('landing_page_content')
        .update({
          title: selectedSection.title,
          subtitle: selectedSection.subtitle,
          description: selectedSection.description,
          content: selectedSection.content,
          image_url: selectedSection.image_url,
          is_active: selectedSection.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedSection.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Landing page section updated successfully"
      });

      await fetchLandingPageContent();
    } catch (error) {
      console.error('Error saving section:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save section"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedSection) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedSection.section_name}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('landing-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('landing-images')
        .getPublicUrl(filePath);

      setSelectedSection({
        ...selectedSection,
        image_url: publicUrl
      });

      toast({
        title: "Success",
        description: "Image uploaded successfully"
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload image"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCreateSection = async () => {
    try {
      const newSectionName = prompt('Enter section name:');
      if (!newSectionName) return;

      const { data, error } = await supabase
        .from('landing_page_content')
        .insert({
          section_name: newSectionName.toLowerCase().replace(/\s+/g, '_'),
          title: `New ${newSectionName}`,
          subtitle: 'Add your subtitle here',
          description: 'Add your description here',
          content: {},
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "New section created successfully"
      });

      await fetchLandingPageContent();
      setSelectedSection(data);
    } catch (error) {
      console.error('Error creating section:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create section"
      });
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return;

    try {
      const { error } = await supabase
        .from('landing_page_content')
        .delete()
        .eq('id', sectionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Section deleted successfully"
      });

      await fetchLandingPageContent();
      setSelectedSection(null);
    } catch (error) {
      console.error('Error deleting section:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete section"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Landing Page Manager</h2>
          <p className="text-muted-foreground">
            Manage content and images for your landing page sections
          </p>
        </div>
        <Button onClick={handleCreateSection} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Section
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sections List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layout className="h-5 w-5" />
              Sections
            </CardTitle>
            <CardDescription>
              Select a section to edit
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {contentSections.map((section) => (
              <div
                key={section.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedSection?.id === section.id
                    ? 'bg-primary/10 border-primary'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedSection(section)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium capitalize">
                      {section.section_name.replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {section.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {section.is_active ? (
                      <Eye className="h-4 w-4 text-green-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Section Editor */}
        <Card className="lg:col-span-3">
          {selectedSection ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Edit Section: {selectedSection.section_name.replace(/_/g, ' ')}
                    </CardTitle>
                    <CardDescription>
                      Customize content, images, and settings for this section
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedSection.is_active ? "default" : "secondary"}>
                      {selectedSection.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteSection(selectedSection.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="content" className="space-y-6">
                  <TabsList>
                    <TabsTrigger value="content" className="gap-2">
                      <Type className="h-4 w-4" />
                      Content
                    </TabsTrigger>
                    <TabsTrigger value="image" className="gap-2">
                      <Image className="h-4 w-4" />
                      Image
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="gap-2">
                      <Settings className="h-4 w-4" />
                      Settings
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="content" className="space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={selectedSection.title || ''}
                          onChange={(e) => setSelectedSection({
                            ...selectedSection,
                            title: e.target.value
                          })}
                          placeholder="Enter section title"
                        />
                      </div>

                      <div>
                        <Label htmlFor="subtitle">Subtitle</Label>
                        <Input
                          id="subtitle"
                          value={selectedSection.subtitle || ''}
                          onChange={(e) => setSelectedSection({
                            ...selectedSection,
                            subtitle: e.target.value
                          })}
                          placeholder="Enter section subtitle"
                        />
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          rows={4}
                          value={selectedSection.description || ''}
                          onChange={(e) => setSelectedSection({
                            ...selectedSection,
                            description: e.target.value
                          })}
                          placeholder="Enter section description"
                        />
                      </div>

                      <div>
                        <Label htmlFor="content">Additional Content (JSON)</Label>
                        <Textarea
                          id="content"
                          rows={6}
                          value={JSON.stringify(selectedSection.content || {}, null, 2)}
                          onChange={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value);
                              setSelectedSection({
                                ...selectedSection,
                                content: parsed
                              });
                            } catch (error) {
                              // Invalid JSON, don't update
                            }
                          }}
                          placeholder="Enter additional content as JSON"
                          className="font-mono text-sm"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="image" className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="image-upload">Upload Image</Label>
                        <div className="flex items-center gap-4 mt-2">
                          <Input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploading}
                          />
                          <Button disabled={uploading} size="sm">
                            {uploading ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {selectedSection.image_url && (
                        <div>
                          <Label>Current Image</Label>
                          <div className="mt-2 p-4 border rounded-lg">
                            <img
                              src={selectedSection.image_url}
                              alt="Section image"
                              className="max-w-full h-auto max-h-64 rounded"
                            />
                            <p className="text-sm text-muted-foreground mt-2">
                              {selectedSection.image_url}
                            </p>
                          </div>
                        </div>
                      )}

                      <div>
                        <Label htmlFor="image-url">Or Enter Image URL</Label>
                        <Input
                          id="image-url"
                          value={selectedSection.image_url || ''}
                          onChange={(e) => setSelectedSection({
                            ...selectedSection,
                            image_url: e.target.value
                          })}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="settings" className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Section Visibility</Label>
                          <p className="text-sm text-muted-foreground">
                            Controls whether this section appears on the landing page
                          </p>
                        </div>
                        <Switch
                          checked={selectedSection.is_active}
                          onCheckedChange={(checked) => setSelectedSection({
                            ...selectedSection,
                            is_active: checked
                          })}
                        />
                      </div>

                      <Separator />

                      <div>
                        <Label>Section Name</Label>
                        <Input
                          value={selectedSection.section_name}
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Section identifier (cannot be changed)
                        </p>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        <p><strong>Created:</strong> {new Date(selectedSection.created_at).toLocaleString()}</p>
                        <p><strong>Last Updated:</strong> {new Date(selectedSection.updated_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex items-center justify-end gap-4 pt-6">
                  <Button variant="outline" onClick={fetchLandingPageContent}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button onClick={handleSaveSection} disabled={saving}>
                    {saving ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <Layout className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a section to edit</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default LandingPageManager;