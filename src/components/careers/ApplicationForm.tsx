import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Upload, Send, CheckCircle, Loader2 } from "lucide-react";

interface ApplicationFormProps {
  jobId: string;
  jobTitle: string;
}

const ApplicationForm = ({ jobId, jobTitle }: ApplicationFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    applicantName: "",
    email: "",
    phone: "",
    coverLetter: ""
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or Word document",
          variant: "destructive"
        });
        return;
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 5MB",
          variant: "destructive"
        });
        return;
      }
      setResumeFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resumeFile) {
      toast({
        title: "Resume required",
        description: "Please upload your resume/CV",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload resume to storage
      const fileExt = resumeFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('career-documents')
        .upload(fileName, resumeFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('career-documents')
        .getPublicUrl(fileName);

      // Submit application
      const { error: insertError } = await supabase
        .from('job_applications')
        .insert({
          job_id: jobId,
          applicant_name: formData.applicantName,
          email: formData.email,
          phone: formData.phone || null,
          resume_url: publicUrl,
          cover_letter: formData.coverLetter || null,
          status: 'new'
        });

      if (insertError) throw insertError;

      setIsSubmitted(true);
      toast({
        title: "Application submitted!",
        description: "We'll review your application and get back to you soon.",
      });

    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: "Submission failed",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="p-8 bg-[#1a2634] border-slate-700 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Application Submitted!</h3>
        <p className="text-slate-400">
          Thank you for applying for <span className="text-orange-400">{jobTitle}</span>. 
          Our team will review your application and contact you soon.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-[#1a2634] border-slate-700">
      <h3 className="text-xl font-bold text-white mb-6">Apply for this Position</h3>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="name" className="text-slate-300">Full Name *</Label>
          <Input
            id="name"
            required
            value={formData.applicantName}
            onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
            placeholder="John Smith"
            className="mt-1 bg-[#0f1720] border-slate-600 text-white placeholder:text-slate-500 focus:border-orange-500"
          />
        </div>

        <div>
          <Label htmlFor="email" className="text-slate-300">Email Address *</Label>
          <Input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="john@example.com"
            className="mt-1 bg-[#0f1720] border-slate-600 text-white placeholder:text-slate-500 focus:border-orange-500"
          />
        </div>

        <div>
          <Label htmlFor="phone" className="text-slate-300">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+1 (202) 773-6521"
            className="mt-1 bg-[#0f1720] border-slate-600 text-white placeholder:text-slate-500 focus:border-orange-500"
          />
        </div>

        <div>
          <Label htmlFor="resume" className="text-slate-300">Resume/CV * (PDF or Word, max 5MB)</Label>
          <div className="mt-1">
            <label 
              htmlFor="resume"
              className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                resumeFile 
                  ? 'border-orange-500 bg-orange-500/10' 
                  : 'border-slate-600 hover:border-orange-500/50'
              }`}
            >
              <Upload className={`w-5 h-5 ${resumeFile ? 'text-orange-500' : 'text-slate-400'}`} />
              <span className={resumeFile ? 'text-orange-400' : 'text-slate-400'}>
                {resumeFile ? resumeFile.name : 'Click to upload your resume'}
              </span>
            </label>
            <input
              id="resume"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="coverLetter" className="text-slate-300">Cover Letter (Optional)</Label>
          <Textarea
            id="coverLetter"
            value={formData.coverLetter}
            onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
            placeholder="Tell us why you're a great fit for this role..."
            rows={5}
            className="mt-1 bg-[#0f1720] border-slate-600 text-white placeholder:text-slate-500 focus:border-orange-500 resize-none"
          />
        </div>

        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg font-semibold"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Submit Application
            </>
          )}
        </Button>
      </form>
    </Card>
  );
};

export default ApplicationForm;
