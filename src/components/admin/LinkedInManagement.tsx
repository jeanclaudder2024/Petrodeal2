import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { 
  Linkedin, 
  LayoutDashboard, 
  PenSquare, 
  Clock, 
  FileCheck, 
  MessageSquare, 
  Image, 
  BarChart3,
  Upload,
  Send,
  Calendar as CalendarIcon,
  RefreshCw,
  Trash2,
  Eye,
  ExternalLink,
  Users,
  ThumbsUp,
  Share2,
  MessageCircle,
  TrendingUp,
  Link2,
  Unlink
} from 'lucide-react';

interface LinkedInPage {
  id: string;
  page_name: string;
  organization_urn: string;
  profile_image_url: string | null;
  follower_count: number;
  is_active: boolean;
  created_at: string;
}

interface ScheduledPost {
  id: string;
  content: string;
  media_type: string;
  scheduled_for: string;
  status: string;
  created_at: string;
}

interface PublishedPost {
  id: string;
  post_urn: string;
  content: string;
  media_type: string;
  published_at: string;
  impressions: number;
  likes: number;
  comments_count: number;
  shares: number;
}

const LinkedInManagement = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [connectedPage, setConnectedPage] = useState<LinkedInPage | null>(null);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [publishedPosts, setPublishedPosts] = useState<PublishedPost[]>([]);
  
  // Post composer state
  const [postContent, setPostContent] = useState('');
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>();
  const [scheduleTime, setScheduleTime] = useState('12:00');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);

  useEffect(() => {
    fetchConnectedPage();
    fetchScheduledPosts();
    fetchPublishedPosts();
  }, []);

  const fetchConnectedPage = async () => {
    try {
      const { data, error } = await supabase
        .from('linkedin_connected_pages')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      setConnectedPage(data);
    } catch (error) {
      console.error('Error fetching connected page:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduledPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('linkedin_scheduled_posts')
        .select('*')
        .eq('status', 'scheduled')
        .order('scheduled_for', { ascending: true });

      if (error) throw error;
      setScheduledPosts(data || []);
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
    }
  };

  const fetchPublishedPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('linkedin_published_posts')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPublishedPosts(data || []);
    } catch (error) {
      console.error('Error fetching published posts:', error);
    }
  };

  const handleConnectLinkedIn = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('linkedin-oauth', {
        body: { action: 'get_auth_url' }
      });

      if (error) throw error;
      
      // Open LinkedIn auth in new window
      window.open(data.authUrl, '_blank', 'width=600,height=700');
      
      toast({
        title: 'LinkedIn Authorization',
        description: 'Complete the authorization in the popup window.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start LinkedIn authorization',
        variant: 'destructive',
      });
    }
  };

  const handlePublishNow = async () => {
    if (!postContent.trim() || !connectedPage) return;

    setIsPublishing(true);
    try {
      const { data, error } = await supabase.functions.invoke('linkedin-post-publisher', {
        body: {
          action: 'publish_now',
          pageId: connectedPage.id,
          content: postContent,
          mediaType: 'none',
          mediaUrns: [],
        }
      });

      if (error) throw error;

      toast({
        title: 'Post Published!',
        description: 'Your post has been published to LinkedIn.',
      });

      setPostContent('');
      fetchPublishedPosts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to publish post',
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSchedulePost = async () => {
    if (!postContent.trim() || !connectedPage || !scheduleDate) return;

    setIsScheduling(true);
    try {
      const scheduledFor = new Date(scheduleDate);
      const [hours, minutes] = scheduleTime.split(':');
      scheduledFor.setHours(parseInt(hours), parseInt(minutes));

      const { data, error } = await supabase.functions.invoke('linkedin-post-publisher', {
        body: {
          action: 'schedule',
          pageId: connectedPage.id,
          content: postContent,
          mediaType: 'none',
          mediaUrns: [],
          scheduledFor: scheduledFor.toISOString(),
        }
      });

      if (error) throw error;

      toast({
        title: 'Post Scheduled!',
        description: `Your post will be published on ${format(scheduledFor, 'PPP p')}.`,
      });

      setPostContent('');
      setScheduleDate(undefined);
      fetchScheduledPosts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to schedule post',
        variant: 'destructive',
      });
    } finally {
      setIsScheduling(false);
    }
  };

  const handleCancelScheduled = async (postId: string) => {
    try {
      const { error } = await supabase.functions.invoke('linkedin-post-publisher', {
        body: {
          action: 'cancel_scheduled',
          pageId: connectedPage?.id,
          postId,
        }
      });

      if (error) throw error;

      toast({ title: 'Post cancelled' });
      fetchScheduledPosts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSyncAnalytics = async () => {
    if (!connectedPage) return;

    try {
      await supabase.functions.invoke('linkedin-analytics-sync', {
        body: {
          action: 'sync_all',
          pageId: connectedPage.id,
        }
      });

      toast({ title: 'Analytics synced!' });
      fetchPublishedPosts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Linkedin className="h-5 w-5 text-[#0A66C2]" />
            LinkedIn Management
          </CardTitle>
          <CardDescription>
            Manage your PetroDeal Hub LinkedIn company page - create posts, schedule content, and track analytics.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-2">
          <TabsList className="inline-flex h-auto gap-1 p-1 min-w-full sm:min-w-0">
            <TabsTrigger value="dashboard" className="flex items-center gap-1 px-2 py-2 text-xs sm:text-sm sm:px-3">
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-1 px-2 py-2 text-xs sm:text-sm sm:px-3">
              <PenSquare className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Create</span>
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="flex items-center gap-1 px-2 py-2 text-xs sm:text-sm sm:px-3">
              <Clock className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Scheduled</span>
            </TabsTrigger>
            <TabsTrigger value="published" className="flex items-center gap-1 px-2 py-2 text-xs sm:text-sm sm:px-3">
              <FileCheck className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Published</span>
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-1 px-2 py-2 text-xs sm:text-sm sm:px-3">
              <MessageSquare className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Comments</span>
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center gap-1 px-2 py-2 text-xs sm:text-sm sm:px-3">
              <Image className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Media</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1 px-2 py-2 text-xs sm:text-sm sm:px-3">
              <BarChart3 className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connected Page</CardTitle>
            </CardHeader>
            <CardContent>
              {connectedPage ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {connectedPage.profile_image_url ? (
                      <img 
                        src={connectedPage.profile_image_url} 
                        alt={connectedPage.page_name}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-lg bg-[#0A66C2] flex items-center justify-center">
                        <Linkedin className="h-8 w-8 text-white" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold">{connectedPage.page_name}</h3>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{connectedPage.follower_count.toLocaleString()} followers</span>
                      </div>
                      <Badge variant="outline" className="mt-1 text-green-600 border-green-600">
                        Connected
                      </Badge>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Unlink className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Linkedin className="h-16 w-16 mx-auto text-[#0A66C2] mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Connect Your LinkedIn Page</h3>
                  <p className="text-muted-foreground mb-4">
                    Connect your PetroDeal Hub company page to start posting and managing content.
                  </p>
                  <Button onClick={handleConnectLinkedIn} className="bg-[#0A66C2] hover:bg-[#004182]">
                    <Link2 className="h-4 w-4 mr-2" />
                    Connect LinkedIn Page
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {connectedPage && (
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-2xl font-bold">{scheduledPosts.length}</p>
                      <p className="text-sm text-muted-foreground">Scheduled Posts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">{publishedPosts.length}</p>
                      <p className="text-sm text-muted-foreground">Published Posts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">
                        {publishedPosts.reduce((sum, p) => sum + p.likes, 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Likes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-2xl font-bold">
                        {publishedPosts.reduce((sum, p) => sum + p.impressions, 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Impressions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Create Post Tab */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Post</CardTitle>
              <CardDescription>
                Compose your LinkedIn post. Maximum 3000 characters.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Textarea
                  placeholder="What would you like to share?"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="min-h-[200px]"
                  maxLength={3000}
                />
                <p className="text-sm text-muted-foreground mt-1 text-right">
                  {postContent.length}/3000 characters
                </p>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t">
                <Button variant="outline" disabled>
                  <Image className="h-4 w-4 mr-2" />
                  Add Image
                </Button>
                <Button variant="outline" disabled>
                  <Upload className="h-4 w-4 mr-2" />
                  Add Video
                </Button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {scheduleDate ? format(scheduleDate, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={scheduleDate}
                        onSelect={setScheduleDate}
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-32"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handleSchedulePost}
                    disabled={!postContent.trim() || !scheduleDate || isScheduling || !connectedPage}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    {isScheduling ? 'Scheduling...' : 'Schedule'}
                  </Button>
                  <Button
                    onClick={handlePublishNow}
                    disabled={!postContent.trim() || isPublishing || !connectedPage}
                    className="bg-[#0A66C2] hover:bg-[#004182]"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isPublishing ? 'Publishing...' : 'Publish Now'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduled Posts Tab */}
        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Posts</CardTitle>
              <CardDescription>
                Posts queued for future publishing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scheduledPosts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No scheduled posts</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Content</TableHead>
                      <TableHead>Scheduled For</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduledPosts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="max-w-xs truncate">
                          {post.content.substring(0, 100)}...
                        </TableCell>
                        <TableCell>
                          {format(new Date(post.scheduled_for), 'PPP p')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{post.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleCancelScheduled(post.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
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
        </TabsContent>

        {/* Published Posts Tab */}
        <TabsContent value="published">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Published Posts</CardTitle>
                <CardDescription>
                  All posts published to LinkedIn with engagement metrics.
                </CardDescription>
              </div>
              <Button variant="outline" onClick={handleSyncAnalytics}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Analytics
              </Button>
            </CardHeader>
            <CardContent>
              {publishedPosts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No published posts yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Content</TableHead>
                      <TableHead>Published</TableHead>
                      <TableHead>Impressions</TableHead>
                      <TableHead>Likes</TableHead>
                      <TableHead>Comments</TableHead>
                      <TableHead>Shares</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {publishedPosts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="max-w-xs truncate">
                          {post.content?.substring(0, 80)}...
                        </TableCell>
                        <TableCell>
                          {format(new Date(post.published_at), 'PP')}
                        </TableCell>
                        <TableCell>{post.impressions.toLocaleString()}</TableCell>
                        <TableCell>{post.likes.toLocaleString()}</TableCell>
                        <TableCell>{post.comments_count.toLocaleString()}</TableCell>
                        <TableCell>{post.shares.toLocaleString()}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <a 
                              href={`https://www.linkedin.com/feed/update/${post.post_urn}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="comments">
          <Card>
            <CardHeader>
              <CardTitle>Comments Management</CardTitle>
              <CardDescription>
                View and reply to comments on your LinkedIn posts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Comments will appear here after syncing</p>
                <Button variant="outline" className="mt-4" disabled={!connectedPage}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Comments
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Media Library Tab */}
        <TabsContent value="media">
          <Card>
            <CardHeader>
              <CardTitle>Media Library</CardTitle>
              <CardDescription>
                Uploaded images and videos for use in posts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No media uploaded yet</p>
                <Button variant="outline" className="mt-4" disabled={!connectedPage}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Media
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Overview</CardTitle>
              <CardDescription>
                Track your LinkedIn page performance and post engagement.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Users className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                    <p className="text-3xl font-bold">
                      {connectedPage?.follower_count.toLocaleString() || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Followers</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <TrendingUp className="h-8 w-8 mx-auto text-green-500 mb-2" />
                    <p className="text-3xl font-bold">
                      {publishedPosts.reduce((sum, p) => sum + p.impressions, 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Impressions</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <ThumbsUp className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                    <p className="text-3xl font-bold">
                      {publishedPosts.reduce((sum, p) => sum + p.likes + p.comments_count + p.shares, 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Engagements</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LinkedInManagement;
