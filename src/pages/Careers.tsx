import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import LandingNavbar from "@/components/landing/LandingNavbar";
import Footer from "@/components/Footer";
import WhyWorkWithUs from "@/components/careers/WhyWorkWithUs";
import JobCategories from "@/components/careers/JobCategories";
import JobCard from "@/components/careers/JobCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronDown,
  Briefcase,
  ArrowRight
} from "lucide-react";

const Careers = () => {
  const navigate = useNavigate();

  // Fetch featured jobs
  const { data: featuredJobs } = useQuery({
    queryKey: ['featured-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_listings')
        .select('*')
        .eq('status', 'published')
        .eq('featured', true)
        .limit(3);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch job counts by department
  const { data: categoryCounts } = useQuery({
    queryKey: ['job-category-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_listings')
        .select('department')
        .eq('status', 'published');
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach(job => {
        counts[job.department] = (counts[job.department] || 0) + 1;
      });
      return counts;
    }
  });

  const scrollToJobs = () => {
    document.getElementById('open-positions')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0f1720]">
      <LandingNavbar />
      
      {/* Hero Section with Oil Rig Background */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/lovable-uploads/92162cb9-ec10-41e2-bb64-5e35030478d1.png')`,
            filter: 'brightness(0.3)'
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a2634]/80 via-[#0f1720]/60 to-[#0f1720]" />
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          <Badge className="mb-6 px-6 py-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 text-sm">
            <Briefcase className="w-4 h-4 mr-2 inline" />
            Now Hiring
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white font-orbitron tracking-tight">
            JOIN OUR <span className="text-orange-500">TEAM</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-8 leading-relaxed">
            Lead the future of global energy. Join a world-class team driving innovation 
            in oil trading, refinery operations, and maritime logistics.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg"
              onClick={scrollToJobs}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-orange-500/20"
            >
              View Open Positions
              <ChevronDown className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate('/about-us')}
              className="border-slate-600 text-white hover:bg-slate-800 px-8 py-6 text-lg"
            >
              Learn About Us
            </Button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-orange-500" />
        </div>
      </section>

      {/* Why Work With Us */}
      <WhyWorkWithUs />

      {/* Job Categories */}
      <JobCategories categoryCounts={categoryCounts || {}} />

      {/* Featured Jobs */}
      {featuredJobs && featuredJobs.length > 0 && (
        <section id="open-positions" className="py-20 bg-[#1a2634]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white font-orbitron">
                Featured Positions
              </h2>
              <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                Explore our top opportunities and take the next step in your career
              </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-4">
              {featuredJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>

            <div className="text-center mt-10">
              <Button 
                size="lg"
                onClick={() => navigate('/careers/jobs')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg font-semibold"
              >
                View All Positions
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-orange-500/10 via-[#0f1720] to-[#1a2634]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white font-orbitron">
              Ready to Power the Future?
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Whether you're an experienced professional or just starting your career, 
              we have opportunities for driven individuals who want to make an impact.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg"
                onClick={() => navigate('/careers/jobs')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-orange-500/20"
              >
                Explore Opportunities
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Careers;
