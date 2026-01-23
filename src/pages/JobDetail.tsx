import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import LandingNavbar from "@/components/landing/LandingNavbar";
import Footer from "@/components/Footer";
import ApplicationForm from "@/components/careers/ApplicationForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MapPin, 
  Building2, 
  Clock, 
  DollarSign, 
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Calendar
} from "lucide-react";
import { format } from "date-fns";

const departmentLabels: Record<string, string> = {
  engineering: "Engineering",
  operations: "Operations",
  hse: "HSE",
  technical_services: "Technical Services",
  corporate: "Corporate"
};

const JobDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data: job, isLoading, error } = useQuery({
    queryKey: ['job-detail', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_listings')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f1720]">
        <LandingNavbar />
        <div className="container mx-auto px-4 pt-24 pb-16">
          <Skeleton className="h-10 w-48 bg-slate-800 mb-6" />
          <Skeleton className="h-16 w-3/4 bg-slate-800 mb-4" />
          <Skeleton className="h-6 w-1/2 bg-slate-800 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-64 bg-slate-800" />
              <Skeleton className="h-48 bg-slate-800" />
            </div>
            <Skeleton className="h-96 bg-slate-800" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-[#0f1720]">
        <LandingNavbar />
        <div className="container mx-auto px-4 pt-24 pb-16">
          <div className="text-center py-20">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-4">Position Not Found</h1>
            <p className="text-slate-400 mb-8">This job listing may have been removed or is no longer available.</p>
            <Button 
              onClick={() => navigate('/careers/jobs')}
              className="bg-orange-500 hover:bg-orange-600"
            >
              View All Positions
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1720]">
      <LandingNavbar />
      
      {/* Header */}
      <section className="pt-24 pb-12 bg-gradient-to-b from-[#1a2634] to-[#0f1720]">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/careers/jobs')}
              className="text-slate-400 hover:text-white mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to All Positions
            </Button>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              {job.featured && (
                <Badge className="bg-orange-500 text-white border-0">Featured</Badge>
              )}
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                {job.employment_type}
              </Badge>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 font-orbitron">
              {job.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-slate-300">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-500" />
                <span>{job.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-orange-500" />
                <span>{departmentLabels[job.department] || job.department}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <span>{job.employment_type}</span>
              </div>
              {job.salary_range && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-orange-500" />
                  <span>{job.salary_range}</span>
                </div>
              )}
              {job.posted_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-500" />
                  <span>Posted {format(new Date(job.posted_at), 'MMM d, yyyy')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Job Details */}
              <div className="lg:col-span-2 space-y-8">
                {/* Description */}
                <div className="bg-[#1a2634] border border-slate-700 rounded-xl p-6">
                  <h2 className="text-xl font-bold text-white mb-4">About This Role</h2>
                  <div 
                    className="prose prose-invert prose-slate max-w-none text-slate-300"
                    dangerouslySetInnerHTML={{ __html: job.description }}
                  />
                </div>

                {/* Responsibilities */}
                {job.responsibilities && job.responsibilities.length > 0 && (
                  <div className="bg-[#1a2634] border border-slate-700 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Key Responsibilities</h2>
                    <ul className="space-y-3">
                      {job.responsibilities.map((responsibility: string, index: number) => (
                        <li key={index} className="flex items-start gap-3 text-slate-300">
                          <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                          <span>{responsibility}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Requirements */}
                {job.requirements && job.requirements.length > 0 && (
                  <div className="bg-[#1a2634] border border-slate-700 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Requirements</h2>
                    <ul className="space-y-3">
                      {job.requirements.map((requirement: string, index: number) => (
                        <li key={index} className="flex items-start gap-3 text-slate-300">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{requirement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Benefits */}
                {job.benefits && job.benefits.length > 0 && (
                  <div className="bg-[#1a2634] border border-slate-700 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4">What We Offer</h2>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {job.benefits.map((benefit: string, index: number) => (
                        <li key={index} className="flex items-start gap-3 text-slate-300">
                          <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Application Form - Sticky */}
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <ApplicationForm jobId={job.id} jobTitle={job.title} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default JobDetail;
