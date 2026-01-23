import { Card } from "@/components/ui/card";
import { 
  DollarSign, 
  Globe, 
  HardHat, 
  TrendingUp, 
  Gift 
} from "lucide-react";

const benefits = [
  {
    icon: DollarSign,
    title: "Competitive Salary",
    description: "Industry-leading compensation packages with performance bonuses and equity options."
  },
  {
    icon: Globe,
    title: "Global Opportunities",
    description: "Work across international markets with opportunities in Dubai, Houston, Singapore, and beyond."
  },
  {
    icon: HardHat,
    title: "Safety First Culture",
    description: "Our commitment to HSE excellence protects our people and communities worldwide."
  },
  {
    icon: TrendingUp,
    title: "Career Development",
    description: "Structured growth paths, mentorship programs, and continuous learning opportunities."
  },
  {
    icon: Gift,
    title: "Benefits Package",
    description: "Comprehensive health coverage, 401(k) matching, paid time off, and family support programs."
  }
];

const WhyWorkWithUs = () => {
  return (
    <section className="py-20 bg-[#1a2634]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white font-orbitron">
            Why Work With Us
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Join a team that values excellence, safety, and innovation in the energy sector
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
          {benefits.map((benefit, index) => (
            <Card 
              key={index}
              className="p-6 text-center bg-[#1a2634]/80 border-slate-700 hover:border-orange-500/50 transition-all duration-300 hover:-translate-y-2 group"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <benefit.icon className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-lg font-bold mb-2 text-white">
                {benefit.title}
              </h3>
              
              <p className="text-sm text-slate-400 leading-relaxed">
                {benefit.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyWorkWithUs;
