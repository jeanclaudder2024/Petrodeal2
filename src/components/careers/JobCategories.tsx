import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { 
  Settings, 
  Factory, 
  HardHat, 
  Wrench, 
  Building2,
  ChevronRight
} from "lucide-react";

interface JobCategoriesProps {
  categoryCounts?: Record<string, number>;
}

const categories = [
  {
    id: "engineering",
    name: "Engineering",
    icon: Settings,
    description: "Design and optimize oil & gas infrastructure"
  },
  {
    id: "operations",
    name: "Operations",
    icon: Factory,
    description: "Manage day-to-day production and logistics"
  },
  {
    id: "hse",
    name: "HSE",
    icon: HardHat,
    description: "Health, Safety & Environmental excellence"
  },
  {
    id: "technical_services",
    name: "Technical Services",
    icon: Wrench,
    description: "Technical support and maintenance expertise"
  },
  {
    id: "corporate",
    name: "Corporate",
    icon: Building2,
    description: "Finance, HR, Legal, and Administration"
  }
];

const JobCategories = ({ categoryCounts = {} }: JobCategoriesProps) => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-[#0f1720]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white font-orbitron">
            Explore Career Areas
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Find your perfect role across our diverse range of departments
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {categories.map((category) => {
            const count = categoryCounts[category.id] || 0;
            
            return (
              <Card 
                key={category.id}
                onClick={() => navigate(`/careers/jobs?department=${category.id}`)}
                className="p-6 bg-[#1a2634] border-slate-700 hover:border-orange-500 transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30 flex items-center justify-center group-hover:from-orange-500 group-hover:to-orange-600 transition-all">
                    <category.icon className="w-7 h-7 text-orange-500 group-hover:text-white transition-colors" />
                  </div>
                  {count > 0 && (
                    <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30">
                      {count} {count === 1 ? 'job' : 'jobs'}
                    </Badge>
                  )}
                </div>
                
                <h3 className="text-xl font-bold mb-2 text-white group-hover:text-orange-400 transition-colors">
                  {category.name}
                </h3>
                
                <p className="text-slate-400 text-sm mb-4">
                  {category.description}
                </p>

                <div className="flex items-center text-orange-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  View positions <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default JobCategories;
