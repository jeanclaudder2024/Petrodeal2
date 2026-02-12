import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  Search,
  Globe
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BulkBlogRow {
  title: string;
  subject: string;
  imageUrl: string | null;
  status: 'schedule' | 'publish';
  date: Date | null;
  category: string | null;
  isValid: boolean;
  errors: string[];
}

interface ProcessingStep {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  icon: React.ReactNode;
}

interface BulkBlogUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categories: { id: string; name: string; slug: string }[];
  onComplete: () => void;
}

type UploadStep = 'upload' | 'preview' | 'processing' | 'complete';

const BulkBlogUploadDialog: React.FC<BulkBlogUploadDialogProps> = ({
  isOpen,
  onClose,
  categories,
  onComplete
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<UploadStep>('upload');
  const [rows, setRows] = useState<BulkBlogRow[]>([]);
  const [processing, setProcessing] = useState({
    current: 0,
    total: 0,
    currentTitle: '',
    currentStep: 0,
    isCancelled: false
  });
  const [results, setResults] = useState({
    success: 0,
    failed: 0,
    errors: [] as string[]
  });
  const [currentSteps, setCurrentSteps] = useState<ProcessingStep[]>([]);

  const resetDialog = () => {
    setStep('upload');
    setRows([]);
    setProcessing({ current: 0, total: 0, currentTitle: '', currentStep: 0, isCancelled: false });
    setResults({ success: 0, failed: 0, errors: [] });
    setCurrentSteps([]);
  };

  const handleClose = () => {
    resetDialog();
    onClose();
  };

  const downloadTemplate = () => {
    const template = [
      {
        'Title *': 'Example: Oil Trading Trends 2025',
        'Subject/Topic *': 'Current oil market trends and predictions',
        'Image URL': '', // Leave empty for AI generation
        'Status *': 'schedule', // 'schedule' or 'publish'
        'Date': '2025-02-15', // Required if status=schedule (YYYY-MM-DD)
        'Category': 'Market Analysis' // Optional: Deal Strategies, Industry Insights, Market Analysis, Oil Trading, Platform Updates
      }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 35 }, // Title
      { wch: 40 }, // Subject
      { wch: 50 }, // Image URL
      { wch: 12 }, // Status
      { wch: 12 }, // Date
      { wch: 20 }  // Category
    ];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Blog Posts');
    XLSX.writeFile(wb, 'blog_posts_template.xlsx');
    
    toast({ title: "Template Downloaded", description: "Fill in the template and upload it back" });
  };

  const parseXLSFile = async (file: File): Promise<BulkBlogRow[]> => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];
    
    return jsonData.map((row, index) => {
      const errors: string[] = [];
      
      // Get values with flexible column names
      const title = row['Title *'] || row['Title'] || row['title'] || '';
      const subject = row['Subject/Topic *'] || row['Subject/Topic'] || row['Subject'] || row['subject'] || '';
      const imageUrl = row['Image URL'] || row['image_url'] || row['imageUrl'] || null;
      const statusRaw = (row['Status *'] || row['Status'] || row['status'] || '').toLowerCase();
      const dateRaw = row['Date'] || row['date'] || null;
      const categoryRaw = row['Category'] || row['category'] || null;
      
      // Validate required fields
      if (!title) errors.push('Title is required');
      if (!subject) errors.push('Subject is required');
      
      // Validate status
      let status: 'schedule' | 'publish' = 'publish';
      if (statusRaw === 'schedule' || statusRaw === 'scheduled') {
        status = 'schedule';
      } else if (statusRaw === 'publish' || statusRaw === 'published') {
        status = 'publish';
      } else if (statusRaw) {
        errors.push(`Invalid status: "${statusRaw}" (use "schedule" or "publish")`);
      }
      
      // Parse and validate date
      let date: Date | null = null;
      if (status === 'schedule') {
        if (!dateRaw) {
          errors.push('Date is required for scheduled posts');
        } else {
          date = new Date(dateRaw);
          if (isNaN(date.getTime())) {
            errors.push(`Invalid date format: "${dateRaw}"`);
            date = null;
          }
          // Allow past dates for historical blog posts
        }
      }
      
      // Validate category if provided
      let category = categoryRaw;
      if (categoryRaw) {
        const matchedCategory = categories.find(
          c => c.name.toLowerCase() === categoryRaw.toLowerCase() || 
               c.slug.toLowerCase() === categoryRaw.toLowerCase()
        );
        if (!matchedCategory) {
          errors.push(`Unknown category: "${categoryRaw}"`);
          category = null;
        } else {
          category = matchedCategory.id;
        }
      }
      
      return {
        title: title.trim(),
        subject: subject.trim(),
        imageUrl: imageUrl ? imageUrl.trim() : null,
        status,
        date,
        category,
        isValid: errors.length === 0,
        errors
      };
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const parsedRows = await parseXLSFile(file);
      setRows(parsedRows);
      setStep('preview');
      
      const invalidCount = parsedRows.filter(r => !r.isValid).length;
      if (invalidCount > 0) {
        toast({
          title: "Validation Issues",
          description: `${invalidCount} of ${parsedRows.length} rows have errors. Fix them before processing.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Parse error:', error);
      toast({
        title: "Error",
        description: "Failed to parse the XLS file. Make sure it's a valid Excel file.",
        variant: "destructive"
      });
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const cleanHTMLContent = (content: string): string => {
    let cleaned = content;
    cleaned = cleaned.replace(/^```html\s*/gi, '');
    cleaned = cleaned.replace(/^```\s*/gi, '');
    cleaned = cleaned.replace(/```\s*$/gi, '');
    cleaned = cleaned.replace(/<!DOCTYPE[^>]*>/gi, '');
    cleaned = cleaned.replace(/<html[^>]*>/gi, '');
    cleaned = cleaned.replace(/<\/html>/gi, '');
    cleaned = cleaned.replace(/<head>[\s\S]*?<\/head>/gi, '');
    cleaned = cleaned.replace(/<body[^>]*>/gi, '');
    cleaned = cleaned.replace(/<\/body>/gi, '');
    return cleaned.trim();
  };

  const generateSlug = (title: string) => {
    // Normalize Unicode characters and remove diacritics
    let slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s-]/g, '')    // Keep only alphanumeric, spaces, dashes
      .replace(/\s+/g, '-')            // Spaces to dashes
      .replace(/-+/g, '-')             // Multiple dashes to single
      .replace(/^-+|-+$/g, '');        // Trim dashes
    
    // If slug is empty or too short (e.g., non-Latin titles), use 'post' as base
    if (slug.length < 3) {
      slug = 'post';
    }
    
    // Add timestamp for guaranteed uniqueness
    slug = `${slug}-${Date.now()}`;
    
    return slug;
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const processBlogRow = async (row: BulkBlogRow, index: number): Promise<boolean> => {
    const steps: ProcessingStep[] = [
      { name: 'AI Generate Content', status: 'pending', icon: <FileText className="h-4 w-4" /> },
      { name: 'AI Generate Image', status: row.imageUrl ? 'completed' : 'pending', icon: <ImageIcon className="h-4 w-4" /> },
      { name: 'AI Generate SEO', status: 'pending', icon: <Search className="h-4 w-4" /> },
      { name: 'AI Generate GEO', status: 'pending', icon: <Globe className="h-4 w-4" /> },
      { name: 'Saving to database', status: 'pending', icon: <CheckCircle2 className="h-4 w-4" /> }
    ];
    
    setCurrentSteps(steps);
    
    try {
      // Find category name from category ID for category-specific writing mode
      const categoryInfo = categories.find(c => c.id === row.category);
      const categoryName = categoryInfo?.name || null;
      
      // Step 1: Generate Content with category-specific writing mode
      steps[0].status = 'processing';
      setCurrentSteps([...steps]);
      
      const contentResult = await supabase.functions.invoke('generate-blog-content', {
        body: { 
          title: row.title, 
          subject: row.subject, 
          type: 'content',
          category: categoryName  // Pass category for professional writing mode
        }
      });
      
      if (contentResult.error) throw new Error('Content generation failed');
      const content = cleanHTMLContent(contentResult.data?.content || '');
      const excerpt = content.match(/<p[^>]*>(.*?)<\/p>/)?.[1]?.replace(/<[^>]*>/g, '').substring(0, 200) + '...' || '';
      
      steps[0].status = 'completed';
      setCurrentSteps([...steps]);
      
      await delay(1000); // Rate limiting
      
      // Step 2: Generate Image (if no URL provided)
      let imageUrl = row.imageUrl;
      if (!imageUrl) {
        steps[1].status = 'processing';
        setCurrentSteps([...steps]);
        
        try {
          const imageResult = await supabase.functions.invoke('generate-blog-image', {
            body: { title: row.title, subject: row.subject }
          });
          
          if (imageResult.data?.success && imageResult.data?.imageUrl) {
            imageUrl = imageResult.data.imageUrl;
            steps[1].status = 'completed';
          } else {
            // Image generation failed but continue without image
            steps[1].status = 'failed';
            console.warn('Image generation failed:', imageResult.data?.error);
          }
        } catch (imgError) {
          steps[1].status = 'failed';
          console.warn('Image generation error:', imgError);
        }
        setCurrentSteps([...steps]);
        
        await delay(1500); // Rate limiting for image API
      }
      
      // Step 3: Generate SEO
      steps[2].status = 'processing';
      setCurrentSteps([...steps]);
      
      const seoResult = await supabase.functions.invoke('generate-blog-content', {
        body: { title: row.title, subject: row.subject, type: 'seo' }
      });
      
      let seoData = { meta_title: '', meta_description: '', meta_keywords: [] };
      if (seoResult.data?.content) {
        try {
          const jsonMatch = seoResult.data.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            seoData = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          console.warn('SEO parse error:', e);
        }
      }
      
      steps[2].status = 'completed';
      setCurrentSteps([...steps]);
      
      await delay(1000); // Rate limiting
      
      // Step 4: Generate GEO
      steps[3].status = 'processing';
      setCurrentSteps([...steps]);
      
      const geoResult = await supabase.functions.invoke('generate-blog-content', {
        body: { title: row.title, subject: row.subject, content, type: 'geo' }
      });
      
      let geoData = { ai_summary: '', qa_block: [], authority_statement: '' };
      if (geoResult.data?.content) {
        try {
          const jsonMatch = geoResult.data.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            geoData = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          console.warn('GEO parse error:', e);
        }
      }
      
      steps[3].status = 'completed';
      setCurrentSteps([...steps]);
      
      await delay(500);
      
      // Step 5: Save to database
      steps[4].status = 'processing';
      setCurrentSteps([...steps]);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      // Determine effective status - auto-publish past dates
      const now = new Date();
      const isPastDate = row.date && row.date <= now;
      const shouldPublish = row.status === 'publish' || isPastDate;
      
      const postData = {
        title: row.title,
        slug: generateSlug(row.title),
        excerpt,
        content,
        featured_image: imageUrl || null,
        category_id: row.category || null,
        author_id: user?.id || null,
        tags: [],
        status: shouldPublish ? 'published' : 'scheduled',
        publish_date: row.date 
          ? row.date.toISOString() 
          : new Date().toISOString(),
        meta_title: seoData.meta_title || null,
        meta_description: seoData.meta_description || null,
        meta_keywords: Array.isArray(seoData.meta_keywords) ? seoData.meta_keywords : null,
        geo_ai_summary: geoData.ai_summary || null,
        geo_qa_block: geoData.qa_block || [],
        geo_authority_statement: geoData.authority_statement || null
      };
      
      const { error: insertError } = await supabase
        .from('blog_posts')
        .insert(postData);
      
      if (insertError) throw insertError;
      
      steps[4].status = 'completed';
      setCurrentSteps([...steps]);
      
      return true;
    } catch (error) {
      console.error(`Error processing row "${row.title}":`, error);
      steps.forEach(s => {
        if (s.status === 'processing') s.status = 'failed';
      });
      setCurrentSteps([...steps]);
      return false;
    }
  };

  const startProcessing = async () => {
    const validRows = rows.filter(r => r.isValid);
    if (validRows.length === 0) {
      toast({
        title: "No Valid Rows",
        description: "Please fix validation errors before processing.",
        variant: "destructive"
      });
      return;
    }
    
    if (validRows.length > 20) {
      const confirm = window.confirm(
        `You're about to process ${validRows.length} posts. This may take ${Math.ceil(validRows.length * 30 / 60)} minutes. Continue?`
      );
      if (!confirm) return;
    }
    
    setStep('processing');
    setProcessing({
      current: 0,
      total: validRows.length,
      currentTitle: '',
      currentStep: 0,
      isCancelled: false
    });
    setResults({ success: 0, failed: 0, errors: [] });
    
    let successCount = 0;
    let failedCount = 0;
    const errorMessages: string[] = [];
    
    for (let i = 0; i < validRows.length; i++) {
      if (processing.isCancelled) break;
      
      const row = validRows[i];
      setProcessing(prev => ({
        ...prev,
        current: i + 1,
        currentTitle: row.title
      }));
      
      const success = await processBlogRow(row, i);
      
      if (success) {
        successCount++;
      } else {
        failedCount++;
        errorMessages.push(`Failed: "${row.title}"`);
      }
      
      // Delay between posts to avoid rate limits
      if (i < validRows.length - 1) {
        await delay(2000);
      }
    }
    
    setResults({
      success: successCount,
      failed: failedCount,
      errors: errorMessages
    });
    setStep('complete');
    
    toast({
      title: "Processing Complete",
      description: `${successCount} posts created, ${failedCount} failed.`,
      variant: failedCount > 0 ? "destructive" : "default"
    });
    
    if (successCount > 0) {
      onComplete();
    }
  };

  const cancelProcessing = () => {
    setProcessing(prev => ({ ...prev, isCancelled: true }));
  };

  const getStepIcon = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-muted" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Bulk Upload Blog Posts
          </DialogTitle>
          <DialogDescription>
            Upload an XLS/XLSX file to create multiple blog posts with AI-generated content.
          </DialogDescription>
        </DialogHeader>
        
        {/* Step: Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">Upload XLS/XLSX File</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop or click to select a file
              </p>
              <div className="flex justify-center gap-4">
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Select File
                </Button>
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".xlsx,.xls" 
                className="hidden" 
                onChange={handleFileUpload}
              />
            </div>
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Required columns:</strong> Title, Subject/Topic, Status (schedule/publish)<br />
                <strong>Optional:</strong> Image URL, Date (for scheduled), Category
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        {/* Step: Preview */}
        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <Badge variant="secondary">{rows.length} rows found</Badge>
                {rows.some(r => !r.isValid) && (
                  <Badge variant="destructive" className="ml-2">
                    {rows.filter(r => !r.isValid).length} with errors
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('upload')}>
                  Back
                </Button>
                <Button 
                  onClick={startProcessing}
                  disabled={!rows.some(r => r.isValid)}
                >
                  Process {rows.filter(r => r.isValid).length} Posts
                </Button>
              </div>
            </div>
            
            <div className="border rounded-lg overflow-auto max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Valid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, idx) => (
                    <TableRow key={idx} className={!row.isValid ? 'bg-destructive/10' : ''}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{row.title || '-'}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {row.subject}
                          </p>
                          {row.errors.length > 0 && (
                            <p className="text-xs text-destructive">
                              {row.errors.join(', ')}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={row.status === 'publish' ? 'default' : 'secondary'}>
                          {row.status}
                        </Badge>
                        {row.date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {row.date.toLocaleDateString()}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {row.imageUrl ? (
                          <Badge variant="outline" className="text-xs">URL provided</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">AI Generate</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {row.isValid ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-destructive" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
        
        {/* Step: Processing */}
        {step === 'processing' && (
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground">
                    Processing post {processing.current} of {processing.total}
                  </p>
                  <p className="font-medium truncate">"{processing.currentTitle}"</p>
                </div>
                
                <Progress 
                  value={(processing.current / processing.total) * 100} 
                  className="h-3 mb-4"
                />
                
                <div className="space-y-2">
                  {currentSteps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm">
                      {getStepIcon(step.status)}
                      <span className={step.status === 'processing' ? 'font-medium' : ''}>
                        Step {idx + 1}: {step.name}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-center">
              <Button variant="destructive" onClick={cancelProcessing}>
                Cancel Processing
              </Button>
            </div>
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please don't close this dialog. Processing may take 20-30 seconds per post.
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        {/* Step: Complete */}
        {step === 'complete' && (
          <div className="space-y-6">
            <div className="text-center py-6">
              {results.failed === 0 ? (
                <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
              ) : (
                <AlertTriangle className="h-16 w-16 mx-auto text-amber-500 mb-4" />
              )}
              <h3 className="text-xl font-bold mb-2">Processing Complete</h3>
              <p className="text-muted-foreground">
                {results.success} posts created successfully
                {results.failed > 0 && `, ${results.failed} failed`}
              </p>
            </div>
            
            {results.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  <p className="font-medium mb-2">Failed posts:</p>
                  <ul className="list-disc list-inside text-sm">
                    {results.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Upload Another File
              </Button>
              <Button onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BulkBlogUploadDialog;
