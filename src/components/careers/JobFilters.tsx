import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";

interface JobFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  department: string;
  setDepartment: (dept: string) => void;
  location: string;
  setLocation: (loc: string) => void;
  employmentType: string;
  setEmploymentType: (type: string) => void;
  locations: string[];
  onClearFilters: () => void;
}

const departments = [
  { value: "all", label: "All Departments" },
  { value: "engineering", label: "Engineering" },
  { value: "operations", label: "Operations" },
  { value: "hse", label: "HSE" },
  { value: "technical_services", label: "Technical Services" },
  { value: "corporate", label: "Corporate" }
];

const employmentTypes = [
  { value: "all", label: "All Types" },
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" }
];

const JobFilters = ({
  searchQuery,
  setSearchQuery,
  department,
  setDepartment,
  location,
  setLocation,
  employmentType,
  setEmploymentType,
  locations,
  onClearFilters
}: JobFiltersProps) => {
  const hasFilters = searchQuery || department !== "all" || location !== "all" || employmentType !== "all";

  return (
    <div className="bg-[#1a2634] border border-slate-700 rounded-xl p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search */}
        <div className="lg:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search job titles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#0f1720] border-slate-600 text-white placeholder:text-slate-500 focus:border-orange-500"
          />
        </div>

        {/* Department */}
        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger className="bg-[#0f1720] border-slate-600 text-white focus:ring-orange-500">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a2634] border-slate-700">
            {departments.map((dept) => (
              <SelectItem key={dept.value} value={dept.value} className="text-white hover:bg-slate-700">
                {dept.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Location */}
        <Select value={location} onValueChange={setLocation}>
          <SelectTrigger className="bg-[#0f1720] border-slate-600 text-white focus:ring-orange-500">
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a2634] border-slate-700">
            <SelectItem value="all" className="text-white hover:bg-slate-700">All Locations</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc} value={loc} className="text-white hover:bg-slate-700">
                {loc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Employment Type */}
        <Select value={employmentType} onValueChange={setEmploymentType}>
          <SelectTrigger className="bg-[#0f1720] border-slate-600 text-white focus:ring-orange-500">
            <SelectValue placeholder="Job Type" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a2634] border-slate-700">
            {employmentTypes.map((type) => (
              <SelectItem key={type.value} value={type.value} className="text-white hover:bg-slate-700">
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasFilters && (
        <div className="mt-4 flex justify-end">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onClearFilters}
            className="text-slate-400 hover:text-white hover:bg-slate-700"
          >
            <X className="w-4 h-4 mr-1" />
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default JobFilters;
