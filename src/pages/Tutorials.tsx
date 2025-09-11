import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, BookOpen, Video } from "lucide-react";

const Tutorials = () => {
  const { data: tutorials, isLoading, error } = useQuery({
    queryKey: ['tutorials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tutorials')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-background via-background to-background/80">
        <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Skeleton className="h-8 w-32 mx-auto mb-4" />
              <Skeleton className="h-12 w-96 mx-auto mb-6" />
              <Skeleton className="h-6 w-96 mx-auto" />
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-16">
          <div className="grid gap-8 max-w-4xl mx-auto">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader>
                  <Skeleton className="h-6 w-64" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-64 w-full mb-4" />
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-background via-background to-background/80 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Tutorials</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Unable to load tutorial content. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-background via-background to-background/80">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 py-16 lg:py-24">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-gradient-to-r from-primary to-accent text-white">
              <BookOpen className="h-4 w-4 mr-2" />
              Learning Center
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Tutorials
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Master PetroDealHub with our comprehensive video tutorials. Learn how to navigate the platform, track vessels, manage deals, and maximize your petroleum trading efficiency.
            </p>
          </div>
        </div>
      </div>

      {/* Tutorials Content */}
      <div className="container mx-auto px-4 py-16">
        {tutorials?.length === 0 ? (
          <div className="max-w-4xl mx-auto text-center">
            <Video className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Tutorials Available</h3>
            <p className="text-muted-foreground">
              Tutorial content is coming soon. Check back later for comprehensive learning resources.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 max-w-4xl mx-auto">
            {tutorials?.map((tutorial, index) => (
              <Card key={tutorial.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    {tutorial.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Video Container */}
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                    <iframe
                      src={tutorial.video_url}
                      title={tutorial.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  
                  {/* Description */}
                  {tutorial.description && (
                    <div className="prose prose-sm max-w-none">
                      <p className="text-muted-foreground leading-relaxed">
                        {tutorial.description}
                      </p>
                    </div>
                  )}
                  
                  {/* Action Badge */}
                  <div className="flex justify-start">
                    <Badge variant="outline" className="text-primary border-primary">
                      <Play className="h-3 w-3 mr-1" />
                      Watch Tutorial
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tutorials;