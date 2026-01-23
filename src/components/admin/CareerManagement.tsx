import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  FileText, 
  Users,
  Briefcase,
  Download,
  Search,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  Send,
  Sparkles,
  RefreshCw,
  Bot,
  HelpCircle,
  Globe
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

interface JobListing {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  employment_type: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  salary_range: string | null;
  status: string;
  featured: boolean;
  posted_at: string | null;
  created_at: string;
}

interface JobApplication {
  id: string;
  job_id: string;
  applicant_name: string;
  email: string;
  phone: string | null;
  resume_url: string;
  cover_letter: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  job_listings?: {
    title: string;
    department: string;
  };
}

const departments = [
  { value: "engineering", label: "Engineering" },
  { value: "operations", label: "Operations" },
  { value: "hse", label: "HSE" },
  { value: "technical_services", label: "Technical Services" },
  { value: "corporate", label: "Corporate" }
];

const employmentTypes = [
  { value: "Full-time", label: "Full-time" },
  { value: "Part-time", label: "Part-time" },
  { value: "Contract", label: "Contract" },
  { value: "Internship", label: "Internship" }
];

const applicationStatuses = [
  { value: "new", label: "New", color: "bg-blue-500" },
  { value: "reviewed", label: "Reviewed", color: "bg-yellow-500" },
  { value: "interview", label: "Interview", color: "bg-purple-500" },
  { value: "offer", label: "Offer", color: "bg-green-500" },
  { value: "hired", label: "Hired", color: "bg-emerald-500" },
  { value: "rejected", label: "Rejected", color: "bg-red-500" }
];

const CareerManagement = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("listings");
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobListing | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    department: "",
    location: "",
    employment_type: "Full-time",
    description: "",
    requirements: "",
    responsibilities: "",
    benefits: "",
    salary_range: "",
    featured: false,
    // SEO fields
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
    // GEO fields
    geo_job_definition: "",
    geo_technical_highlights: "",
    geo_compliance_context: "",
    geo_direct_answers: "[]"
  });
  
  const [jobDialogTab, setJobDialogTab] = useState('basic');
  const [seoGenerating, setSeoGenerating] = useState(false);
  const [geoGenerating, setGeoGenerating] = useState(false);

  // Fetch job listings
  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['admin-job-listings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_listings')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as JobListing[];
    }
  });

  // Fetch applications
  const { data: applications, isLoading: applicationsLoading } = useQuery({
    queryKey: ['admin-job-applications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          job_listings (title, department)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as JobApplication[];
    }
  });

  // Create/Update job mutation
  const saveJobMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingJob) {
        const { error } = await supabase
          .from('job_listings')
          .update(data)
          .eq('id', editingJob.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('job_listings')
          .insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-job-listings'] });
      setIsJobDialogOpen(false);
      resetForm();
      toast({
        title: editingJob ? "Job updated" : "Job created",
        description: editingJob ? "The job listing has been updated." : "The job listing has been created."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete job mutation
  const deleteJobMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('job_listings')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-job-listings'] });
      toast({ title: "Job deleted" });
    }
  });

  // Toggle job status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === 'published') {
        updates.posted_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('job_listings')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-job-listings'] });
      toast({ title: "Status updated" });
    }
  });

  // Update application status mutation
  const updateApplicationMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status?: string; notes?: string }) => {
      const updates: any = { updated_at: new Date().toISOString() };
      if (status) {
        updates.status = status;
        updates.reviewed_at = new Date().toISOString();
      }
      if (notes !== undefined) {
        updates.notes = notes;
      }
      
      const { error } = await supabase
        .from('job_applications')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-job-applications'] });
      toast({ title: "Application updated" });
    }
  });

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      department: "",
      location: "",
      employment_type: "Full-time",
      description: "",
      requirements: "",
      responsibilities: "",
      benefits: "",
      salary_range: "",
      featured: false,
      meta_title: "",
      meta_description: "",
      meta_keywords: "",
      geo_job_definition: "",
      geo_technical_highlights: "",
      geo_compliance_context: "",
      geo_direct_answers: "[]"
    });
    setEditingJob(null);
    setJobDialogTab('basic');
  };

  const handleEditJob = (job: JobListing) => {
    setEditingJob(job);
    const jobWithSeo = job as any;
    setFormData({
      title: job.title,
      slug: job.slug,
      department: job.department,
      location: job.location,
      employment_type: job.employment_type,
      description: job.description,
      requirements: job.requirements?.join('\n') || '',
      responsibilities: job.responsibilities?.join('\n') || '',
      benefits: job.benefits?.join('\n') || '',
      salary_range: job.salary_range || '',
      featured: job.featured,
      meta_title: jobWithSeo.meta_title || '',
      meta_description: jobWithSeo.meta_description || '',
      meta_keywords: Array.isArray(jobWithSeo.meta_keywords) ? jobWithSeo.meta_keywords.join(', ') : '',
      geo_job_definition: jobWithSeo.geo_job_definition || '',
      geo_technical_highlights: jobWithSeo.geo_technical_highlights || '',
      geo_compliance_context: jobWithSeo.geo_compliance_context || '',
      geo_direct_answers: JSON.stringify(jobWithSeo.geo_direct_answers || [])
    });
    setJobDialogTab('basic');
    setIsJobDialogOpen(true);
  };

  const handleSubmitJob = () => {
    const jobData = {
      title: formData.title,
      slug: formData.slug || formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      department: formData.department,
      location: formData.location,
      employment_type: formData.employment_type,
      description: formData.description,
      requirements: formData.requirements.split('\n').filter(r => r.trim()),
      responsibilities: formData.responsibilities.split('\n').filter(r => r.trim()),
      benefits: formData.benefits.split('\n').filter(b => b.trim()),
      salary_range: formData.salary_range || null,
      featured: formData.featured
    };
    saveJobMutation.mutate(jobData);
  };

  // Filter applications
  const filteredApplications = applications?.filter(app => {
    const matchesSearch = !searchQuery || 
      app.applicant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.job_listings?.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || app.status === filterStatus;
    const matchesDepartment = filterDepartment === "all" || app.job_listings?.department === filterDepartment;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = applicationStatuses.find(s => s.value === status);
    return (
      <Badge className={`${statusConfig?.color || 'bg-gray-500'} text-white`}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="listings" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Job Listings
          </TabsTrigger>
          <TabsTrigger value="applications" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Applications
            {applications && applications.filter(a => a.status === 'new').length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {applications.filter(a => a.status === 'new').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Job Listings Tab */}
        <TabsContent value="listings" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Manage Job Listings</h3>
            <Dialog open={isJobDialogOpen} onOpenChange={(open) => {
              setIsJobDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Job
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingJob ? 'Edit Job Listing' : 'Create Job Listing'}</DialogTitle>
                  <DialogDescription>
                    Fill in the details for the job listing
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Job Title *</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Senior Process Engineer"
                      />
                    </div>
                    <div>
                      <Label>URL Slug</Label>
                      <Input
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="Auto-generated from title"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Department *</Label>
                      <Select
                        value={formData.department}
                        onValueChange={(value) => setFormData({ ...formData, department: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map(dept => (
                            <SelectItem key={dept.value} value={dept.value}>
                              {dept.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Employment Type *</Label>
                      <Select
                        value={formData.employment_type}
                        onValueChange={(value) => setFormData({ ...formData, employment_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {employmentTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Location *</Label>
                      <Input
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Houston, TX"
                      />
                    </div>
                    <div>
                      <Label>Salary Range</Label>
                      <Input
                        value={formData.salary_range}
                        onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                        placeholder="$100,000 - $150,000"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Description *</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Detailed job description..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label>Responsibilities (one per line)</Label>
                    <Textarea
                      value={formData.responsibilities}
                      onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                      placeholder="Lead process design initiatives&#10;Collaborate with cross-functional teams&#10;..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label>Requirements (one per line)</Label>
                    <Textarea
                      value={formData.requirements}
                      onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                      placeholder="Bachelor's degree in Engineering&#10;5+ years of experience&#10;..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label>Benefits (one per line)</Label>
                    <Textarea
                      value={formData.benefits}
                      onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                      placeholder="Health insurance&#10;401(k) matching&#10;..."
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.featured}
                      onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                    />
                    <Label>Featured Position</Label>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsJobDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSubmitJob}
                      disabled={!formData.title || !formData.department || !formData.location || !formData.description}
                    >
                      {editingJob ? 'Update Job' : 'Create Job'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : jobs?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No job listings yet. Create your first one!
                    </TableCell>
                  </TableRow>
                ) : (
                  jobs?.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.title}</TableCell>
                      <TableCell className="capitalize">{job.department.replace('_', ' ')}</TableCell>
                      <TableCell>{job.location}</TableCell>
                      <TableCell>{job.employment_type}</TableCell>
                      <TableCell>
                        <Select
                          value={job.status}
                          onValueChange={(value) => toggleStatusMutation.mutate({ id: job.id, status: value })}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {job.featured && <Badge className="bg-orange-500">Featured</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditJob(job)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm('Delete this job listing?')) {
                                deleteJobMutation.mutate(job.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <h3 className="text-lg font-semibold">Manage Applications</h3>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search applicants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {applicationStatuses.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept.value} value={dept.value}>
                      {dept.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applicationsLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredApplications?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No applications found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredApplications?.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{app.applicant_name}</div>
                          <div className="text-sm text-muted-foreground">{app.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{app.job_listings?.title}</div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {app.job_listings?.department?.replace('_', ' ')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(app.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(app.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(app.resume_url, '_blank')}
                            title="Download Resume"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedApplication(app)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Application Details</DialogTitle>
                              </DialogHeader>
                              {selectedApplication && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-muted-foreground">Name</Label>
                                      <p className="font-medium">{selectedApplication.applicant_name}</p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">Email</Label>
                                      <p className="font-medium">{selectedApplication.email}</p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">Phone</Label>
                                      <p className="font-medium">{selectedApplication.phone || 'Not provided'}</p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">Applied</Label>
                                      <p className="font-medium">
                                        {format(new Date(selectedApplication.created_at), 'MMM d, yyyy h:mm a')}
                                      </p>
                                    </div>
                                  </div>

                                  <div>
                                    <Label className="text-muted-foreground">Position</Label>
                                    <p className="font-medium">{selectedApplication.job_listings?.title}</p>
                                  </div>

                                  {selectedApplication.cover_letter && (
                                    <div>
                                      <Label className="text-muted-foreground">Cover Letter</Label>
                                      <p className="mt-1 text-sm whitespace-pre-wrap bg-muted p-3 rounded">
                                        {selectedApplication.cover_letter}
                                      </p>
                                    </div>
                                  )}

                                  <div>
                                    <Label className="text-muted-foreground">Resume</Label>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="mt-1"
                                      onClick={() => window.open(selectedApplication.resume_url, '_blank')}
                                    >
                                      <Download className="w-4 h-4 mr-2" />
                                      Download Resume
                                    </Button>
                                  </div>

                                  <div>
                                    <Label className="text-muted-foreground">Status</Label>
                                    <Select
                                      value={selectedApplication.status}
                                      onValueChange={(value) => {
                                        updateApplicationMutation.mutate({ 
                                          id: selectedApplication.id, 
                                          status: value 
                                        });
                                        setSelectedApplication({ ...selectedApplication, status: value });
                                      }}
                                    >
                                      <SelectTrigger className="mt-1">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {applicationStatuses.map(status => (
                                          <SelectItem key={status.value} value={status.value}>
                                            {status.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div>
                                    <Label className="text-muted-foreground">Internal Notes</Label>
                                    <Textarea
                                      value={selectedApplication.notes || ''}
                                      onChange={(e) => setSelectedApplication({ 
                                        ...selectedApplication, 
                                        notes: e.target.value 
                                      })}
                                      placeholder="Add notes about this applicant..."
                                      rows={3}
                                      className="mt-1"
                                    />
                                    <Button
                                      size="sm"
                                      className="mt-2"
                                      onClick={() => {
                                        updateApplicationMutation.mutate({
                                          id: selectedApplication.id,
                                          notes: selectedApplication.notes || ''
                                        });
                                      }}
                                    >
                                      Save Notes
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CareerManagement;
