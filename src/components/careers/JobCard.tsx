import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  MapPin, 
  Clock, 
  Building2,
  DollarSign,
  ChevronRight
} from "lucide-react";

interface JobCardProps {
  job: {
    id: string;
    title: string;
    slug: string;
    department: string;
    location: string;
    employment_type: string;
    description: string;
    salary_range?: string | null;
    featured?: boolean;
  };
}

const departmentLabels: Record<string, string> = {
  engineering: "Engineering",
  operations: "Operations",
  hse: "HSE",
  technical_services: "Technical Services",
  corporate: "Corporate"
};

const typeColors: Record<string, string> = {
  "full-time": "bg-green-500/20 text-green-400 border-green-500/30",
  "part-time": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "contract": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "internship": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
};

const JobCard = ({ job }: JobCardProps) => {
  const navigate = useNavigate();

  return (
    <Card 
      className={`p-6 bg-[#1a2634] border-slate-700 hover:border-orange-500/50 transition-all duration-300 group cursor-pointer ${
        job.featured ? 'ring-2 ring-orange-500/30' : ''
      }`}
      onClick={() => navigate(`/careers/jobs/${job.slug}`)}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {job.featured && (
              <Badge className="bg-orange-500 text-white border-0">
                Featured
              </Badge>
            )}
            <Badge className={typeColors[job.employment_type.toLowerCase()] || typeColors["full-time"]}>
              {job.employment_type}
            </Badge>
          </div>
          
          <h3 className="text-xl font-bold text-white group-hover:text-orange-400 transition-colors mb-2">
            {job.title}
          </h3>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-3">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-orange-500" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Building2 className="w-4 h-4 text-orange-500" />
              <span>{departmentLabels[job.department] || job.department}</span>
            </div>
            {job.salary_range && (
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-orange-500" />
                <span>{job.salary_range}</span>
              </div>
            )}
          </div>
          
          <p className="text-slate-400 text-sm line-clamp-2">
            {job.description.replace(/<[^>]*>/g, '').substring(0, 150)}...
          </p>
        </div>

        <div className="flex md:flex-col items-center gap-2">
          <Button 
            className="bg-orange-500 hover:bg-orange-600 text-white group-hover:shadow-lg group-hover:shadow-orange-500/20"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/careers/jobs/${job.slug}`);
            }}
          >
            Apply Now
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default JobCard;
