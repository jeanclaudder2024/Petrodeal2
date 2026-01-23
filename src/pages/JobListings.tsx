import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import LandingNavbar from "@/components/landing/LandingNavbar";
import Footer from "@/components/Footer";
import JobCard from "@/components/careers/JobCard";
import JobFilters from "@/components/careers/JobFilters";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, AlertCircle } from "lucide-react";

const JobListings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [department, setDepartment] = useState(searchParams.get("department") || "all");
  const [location, setLocation] = useState("all");
  const [employmentType, setEmploymentType] = useState("all");

  // Update URL when department changes
  useEffect(() => {
    if (department !== "all") {
      searchParams.set("department", department);
    } else {
      searchParams.delete("department");
    }
    setSearchParams(searchParams);
  }, [department]);

  // Fetch all published jobs
  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['job-listings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_listings')
        .select('*')
        .eq('status', 'published')
        .order('featured', { ascending: false })
        .order('posted_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Get unique locations for filter
  const locations = useMemo(() => {
    if (!jobs) return [];
    const uniqueLocations = [...new Set(jobs.map(job => job.location))];
    return uniqueLocations.sort();
  }, [jobs]);

  // Filter jobs
  const filteredJobs = useMemo(() => {
    if (!jobs) return [];
    
    return jobs.filter(job => {
      const matchesSearch = !searchQuery || 
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDepartment = department === "all" || job.department === department;
      const matchesLocation = location === "all" || job.location === location;
      const matchesType = employmentType === "all" || 
        job.employment_type.toLowerCase() === employmentType.toLowerCase();
      
      return matchesSearch && matchesDepartment && matchesLocation && matchesType;
    });
  }, [jobs, searchQuery, department, location, employmentType]);

  const clearFilters = () => {
    setSearchQuery("");
    setDepartment("all");
    setLocation("all");
    setEmploymentType("all");
  };

  return (
    <div className="min-h-screen bg-[#0f1720]">
      <LandingNavbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-12 bg-gradient-to-b from-[#1a2634] to-[#0f1720]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white font-orbitron">
              Open Positions
            </h1>
            <p className="text-xl text-slate-300">
              Discover opportunities to build your career in the energy sector
            </p>
          </div>
        </div>
      </section>

      {/* Jobs Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* Filters */}
            <JobFilters
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              department={department}
              setDepartment={setDepartment}
              location={location}
              setLocation={setLocation}
              employmentType={employmentType}
              setEmploymentType={setEmploymentType}
              locations={locations}
              onClearFilters={clearFilters}
            />

            {/* Results count */}
            <div className="mb-6 text-slate-400">
              {!isLoading && (
                <span>
                  Showing {filteredJobs.length} {filteredJobs.length === 1 ? 'position' : 'positions'}
                </span>
              )}
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-40 w-full bg-slate-800" />
                ))}
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="text-center py-16">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Error loading jobs</h3>
                <p className="text-slate-400">Please try again later</p>
              </div>
            )}

            {/* Jobs list */}
            {!isLoading && !error && (
              <div className="space-y-4">
                {filteredJobs.length > 0 ? (
                  filteredJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))
                ) : (
                  <div className="text-center py-16 bg-[#1a2634] rounded-xl border border-slate-700">
                    <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No positions found</h3>
                    <p className="text-slate-400">
                      Try adjusting your filters or check back later for new opportunities
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default JobListings;
