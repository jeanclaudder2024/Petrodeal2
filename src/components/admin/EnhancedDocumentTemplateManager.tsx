import React, { useState, useEffect } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';

import { Textarea } from '@/components/ui/textarea';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { Badge } from '@/components/ui/badge';

import { Alert, AlertDescription } from '@/components/ui/alert';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { Upload, FileText, Eye, Settings, CheckCircle, AlertCircle, Loader2, TestTube, Info, Database, ArrowRight, Search, RefreshCw, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

import { toast } from 'sonner';



interface DocumentTemplate {

  id: string;

  title: string;

  description?: string;

  file_name: string;

  file_url: string;

  placeholders: any;

  field_mappings: any;

  analysis_result: any;

  is_active: boolean;

  template_status: string;

  mapping_confidence: number;

  auto_mapped_fields: any;

  supports_pdf: boolean;

  last_tested?: string;

  test_results: any;

  subscription_level: string;

  created_at: string;

  advanced_mappings?: Record<string, any>; // Added for new mapping structure
}



interface TemplateReview {

  template_info: {

    title: string;

    description: string;

    total_placeholders: number;

  };

  placeholder_analysis: Array<{

    name: string;

    hasData: boolean;

    dataSource: string | null;

    value: string | null;

    willUseFallback: boolean;

    suggested_mapping: string[];

    auto_fix_suggestions: string[];

  }>;

  statistics: {

    total_placeholders: number;

    available_data: number;

    missing_data: number;

    completion_rate: string;

  };

  available_vessel_fields: string[];

  recommendations: string[];

}


// Database schema definitions for mapping interface
interface DatabaseTable {
  name: string;
  displayName: string;
  description: string;
  icon: string;
  fields: DatabaseField[];
}

interface DatabaseField {
  name: string;
  displayName: string;
  type: string;
  description: string;
  example?: string;
}

// Enhanced mapping interface state
interface MappingState {
  selectedTable: string;
  selectedField: string;
  mappingType: 'database' | 'fixed' | 'choices' | 'random';
  fixedText: string;
  choices: string[];
  previewValue: string;
}


export default function EnhancedDocumentTemplateManager() {

  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);

  const [loading, setLoading] = useState(true);

  const [uploading, setUploading] = useState(false);

  const [analyzing, setAnalyzing] = useState(false);

  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const [showReviewDialog, setShowReviewDialog] = useState(false);

  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);

  const [templateReview, setTemplateReview] = useState<TemplateReview | null>(null);

  const [testingTemplate, setTestingTemplate] = useState<string | null>(null);



  const [uploadForm, setUploadForm] = useState({

    title: '',

    description: '',

    subscription_level: 'basic',

    file: null as File | null,

    skip_ai_analysis: true

  });


  const [mappingEdits, setMappingEdits] = useState<Record<string, any>>({});
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  
  // Enhanced mapping interface state
  const [currentMappingPlaceholder, setCurrentMappingPlaceholder] = useState<string | null>(null);
  const [mappingStates, setMappingStates] = useState<Record<string, MappingState>>({});
  const [databaseTables, setDatabaseTables] = useState<DatabaseTable[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddPlaceholderDialog, setShowAddPlaceholderDialog] = useState(false);
  const [newPlaceholder, setNewPlaceholder] = useState({ name: '', mapping: '' });
  const [selectedTemplateForPlaceholder, setSelectedTemplateForPlaceholder] = useState<string | null>(null);
  const [showSmartSuggestions, setShowSmartSuggestions] = useState(false);
  
  // Common placeholder suggestions
  const smartPlaceholderSuggestions = [
    { name: 'vessel_name', mapping: 'vessels.name', description: 'Vessel name' },
    { name: 'imo', mapping: 'vessels.imo', description: 'IMO number' },
    { name: 'flag', mapping: 'vessels.flag', description: 'Flag state' },
    { name: 'vessel_type', mapping: 'vessels.vessel_type', description: 'Vessel type' },
    { name: 'built', mapping: 'vessels.built', description: 'Year built' },
    { name: 'deadweight', mapping: 'vessels.deadweight', description: 'Deadweight tonnage' },
    { name: 'owner_name', mapping: 'vessels.owner_name', description: 'Owner company' },
    { name: 'operator_name', mapping: 'vessels.operator_name', description: 'Operator company' },
    { name: 'contract_date', mapping: 'Current Date', description: 'Contract date' },
    { name: 'invoice_number', mapping: 'Random Number', description: 'Invoice number' },
    { name: 'document_date', mapping: 'Current Date', description: 'Document date' },
    { name: 'company_name', mapping: 'Sample Company Ltd', description: 'Company name' }
  ];


  useEffect(() => {

    fetchTemplates();

    loadDatabaseSchema();
  }, []);


  // Database schema definitions
  const getDatabaseSchema = (): DatabaseTable[] => [
    {
      name: 'vessels',
      displayName: 'Vessels',
      description: 'Ship and vessel information',
      icon: '🚢',
      fields: [
        { name: 'name', displayName: 'Vessel Name', type: 'text', description: 'Official vessel name', example: 'MV Ocean Star' },
        { name: 'imo', displayName: 'IMO Number', type: 'text', description: 'International Maritime Organization number', example: '1234567' },
        { name: 'mmsi', displayName: 'MMSI', type: 'text', description: 'Maritime Mobile Service Identity', example: '123456789' },
        { name: 'callsign', displayName: 'Call Sign', type: 'text', description: 'Radio call sign', example: 'ABCD' },
        { name: 'flag', displayName: 'Flag State', type: 'text', description: 'Country of registration', example: 'Panama' },
        { name: 'built', displayName: 'Year Built', type: 'number', description: 'Construction year', example: '2015' },
        { name: 'deadweight', displayName: 'Deadweight', type: 'number', description: 'Maximum cargo capacity in tons', example: '50000' },
        { name: 'length', displayName: 'Length', type: 'number', description: 'Overall length in meters', example: '200' },
        { name: 'width', displayName: 'Width', type: 'number', description: 'Maximum width in meters', example: '32' },
        { name: 'draught', displayName: 'Draught', type: 'number', description: 'Maximum draught in meters', example: '12' },
        { name: 'speed', displayName: 'Speed', type: 'number', description: 'Maximum speed in knots', example: '15' },
        { name: 'vessel_type', displayName: 'Vessel Type', type: 'text', description: 'Type of vessel', example: 'Oil Tanker' },
        { name: 'gross_tonnage', displayName: 'Gross Tonnage', type: 'number', description: 'Gross tonnage', example: '30000' },
        { name: 'net_tonnage', displayName: 'Net Tonnage', type: 'number', description: 'Net tonnage', example: '25000' },
        { name: 'owner_name', displayName: 'Owner Name', type: 'text', description: 'Vessel owner company', example: 'Ocean Shipping Ltd' },
        { name: 'operator_name', displayName: 'Operator Name', type: 'text', description: 'Vessel operator company', example: 'Maritime Operations Inc' },
        { name: 'cargo_capacity', displayName: 'Cargo Capacity', type: 'number', description: 'Cargo capacity in cubic meters', example: '50000' },
        { name: 'engine_power', displayName: 'Engine Power', type: 'number', description: 'Engine power in kW', example: '15000' },
        { name: 'fuel_consumption', displayName: 'Fuel Consumption', type: 'number', description: 'Daily fuel consumption in tons', example: '50' },
        { name: 'crew_size', displayName: 'Crew Size', type: 'number', description: 'Number of crew members', example: '25' }
      ]
    },
    {
      name: 'ports',
      displayName: 'Ports',
      description: 'Port and harbor information',
      icon: '⚓',
      fields: [
        { name: 'name', displayName: 'Port Name', type: 'text', description: 'Official port name', example: 'Port of Singapore' },
        { name: 'country', displayName: 'Country', type: 'text', description: 'Port country', example: 'Singapore' },
        { name: 'city', displayName: 'City', type: 'text', description: 'Port city', example: 'Singapore' },
        { name: 'region', displayName: 'Region', type: 'text', description: 'Geographic region', example: 'Southeast Asia' },
        { name: 'port_type', displayName: 'Port Type', type: 'text', description: 'Type of port', example: 'Container Port' },
        { name: 'address', displayName: 'Address', type: 'text', description: 'Port address', example: '1 Harbour Front Ave' },
        { name: 'phone', displayName: 'Phone', type: 'text', description: 'Contact phone', example: '+65 1234 5678' },
        { name: 'email', displayName: 'Email', type: 'email', description: 'Contact email', example: 'info@portofsingapore.com' },
        { name: 'website', displayName: 'Website', type: 'url', description: 'Port website', example: 'https://portofsingapore.com' },
        { name: 'capacity', displayName: 'Capacity', type: 'number', description: 'Port capacity in TEU', example: '50000000' },
        { name: 'max_draught', displayName: 'Max Draught', type: 'number', description: 'Maximum vessel draught in meters', example: '16' },
        { name: 'berth_count', displayName: 'Berth Count', type: 'number', description: 'Number of berths', example: '50' },
        { name: 'terminal_count', displayName: 'Terminal Count', type: 'number', description: 'Number of terminals', example: '8' },
        { name: 'channel_depth', displayName: 'Channel Depth', type: 'number', description: 'Channel depth in meters', example: '18' },
        { name: 'pilotage_required', displayName: 'Pilotage Required', type: 'boolean', description: 'Whether pilotage is required', example: 'Yes' },
        { name: 'established', displayName: 'Established', type: 'number', description: 'Year port was established', example: '1819' },
        { name: 'total_cargo', displayName: 'Total Cargo', type: 'number', description: 'Annual cargo throughput in tons', example: '500000000' },
        { name: 'vessel_count', displayName: 'Vessel Count', type: 'number', description: 'Annual vessel calls', example: '50000' },
        { name: 'port_charges', displayName: 'Port Charges', type: 'text', description: 'Port charges information', example: 'Standard rates apply' },
        { name: 'tidal_range', displayName: 'Tidal Range', type: 'number', description: 'Tidal range in meters', example: '2.5' }
      ]
    },
    {
      name: 'companies',
      displayName: 'Companies',
      description: 'Company and business information',
      icon: '🏢',
      fields: [
        { name: 'name', displayName: 'Company Name', type: 'text', description: 'Official company name', example: 'Maritime Trading Ltd' },
        { name: 'country', displayName: 'Country', type: 'text', description: 'Company country', example: 'Singapore' },
        { name: 'city', displayName: 'City', type: 'text', description: 'Company city', example: 'Singapore' },
        { name: 'address', displayName: 'Address', type: 'text', description: 'Company address', example: '123 Business St' },
        { name: 'phone', displayName: 'Phone', type: 'text', description: 'Contact phone', example: '+65 1234 5678' },
        { name: 'email', displayName: 'Email', type: 'email', description: 'Contact email', example: 'info@maritimetrading.com' },
        { name: 'website', displayName: 'Website', type: 'url', description: 'Company website', example: 'https://maritimetrading.com' },
        { name: 'ceo_name', displayName: 'CEO Name', type: 'text', description: 'Chief Executive Officer name', example: 'John Smith' },
        { name: 'founded_year', displayName: 'Founded Year', type: 'number', description: 'Year company was founded', example: '1995' },
        { name: 'employees_count', displayName: 'Employees Count', type: 'number', description: 'Number of employees', example: '500' },
        { name: 'annual_revenue', displayName: 'Annual Revenue', type: 'number', description: 'Annual revenue in USD', example: '100000000' },
        { name: 'industry', displayName: 'Industry', type: 'text', description: 'Industry sector', example: 'Maritime Trading' }
      ]
    },
    {
      name: 'refineries',
      displayName: 'Refineries',
      description: 'Oil refinery and processing information',
      icon: '🏭',
      fields: [
        { name: 'name', displayName: 'Refinery Name', type: 'text', description: 'Official refinery name', example: 'Singapore Refinery Complex' },
        { name: 'country', displayName: 'Country', type: 'text', description: 'Refinery country', example: 'Singapore' },
        { name: 'city', displayName: 'City', type: 'text', description: 'Refinery city', example: 'Singapore' },
        { name: 'address', displayName: 'Address', type: 'text', description: 'Refinery address', example: '456 Industrial Ave' },
        { name: 'processing_capacity', displayName: 'Processing Capacity', type: 'number', description: 'Daily processing capacity in barrels', example: '500000' },
        { name: 'refinery_type', displayName: 'Refinery Type', type: 'text', description: 'Type of refinery', example: 'Complex Refinery' },
        { name: 'owner', displayName: 'Owner', type: 'text', description: 'Refinery owner', example: 'Oil Corp Ltd' },
        { name: 'operator', displayName: 'Operator', type: 'text', description: 'Refinery operator', example: 'Refinery Operations Inc' },
        { name: 'year_built', displayName: 'Year Built', type: 'number', description: 'Year refinery was built', example: '1985' },
        { name: 'last_maintenance', displayName: 'Last Maintenance', type: 'date', description: 'Last maintenance date', example: '2024-01-15' },
        { name: 'next_maintenance', displayName: 'Next Maintenance', type: 'date', description: 'Next maintenance date', example: '2024-07-15' },
        { name: 'complexity', displayName: 'Complexity', type: 'text', description: 'Refinery complexity', example: 'High' },
        { name: 'email', displayName: 'Email', type: 'email', description: 'Contact email', example: 'info@refinery.com' },
        { name: 'phone', displayName: 'Phone', type: 'text', description: 'Contact phone', example: '+65 9876 5432' },
        { name: 'website', displayName: 'Website', type: 'url', description: 'Refinery website', example: 'https://refinery.com' },
        { name: 'technical_specs', displayName: 'Technical Specs', type: 'text', description: 'Technical specifications', example: 'Advanced processing units' },
        { name: 'utilization', displayName: 'Utilization', type: 'number', description: 'Current utilization percentage', example: '85' },
        { name: 'active_vessels', displayName: 'Active Vessels', type: 'number', description: 'Number of active vessels', example: '25' },
        { name: 'crude_oil_sources', displayName: 'Crude Oil Sources', type: 'text', description: 'Sources of crude oil', example: 'Middle East, Africa' },
        { name: 'processing_units', displayName: 'Processing Units', type: 'number', description: 'Number of processing units', example: '12' },
        { name: 'storage_capacity', displayName: 'Storage Capacity', type: 'number', description: 'Storage capacity in barrels', example: '2000000' },
        { name: 'pipeline_connections', displayName: 'Pipeline Connections', type: 'number', description: 'Number of pipeline connections', example: '8' },
        { name: 'shipping_terminals', displayName: 'Shipping Terminals', type: 'number', description: 'Number of shipping terminals', example: '4' },
        { name: 'rail_connections', displayName: 'Rail Connections', type: 'number', description: 'Number of rail connections', example: '2' },
        { name: 'environmental_certifications', displayName: 'Environmental Certifications', type: 'text', description: 'Environmental certifications', example: 'ISO 14001' },
        { name: 'fuel_types', displayName: 'Fuel Types', type: 'text', description: 'Types of fuel produced', example: 'Gasoline, Diesel, Jet Fuel' },
        { name: 'refinery_complexity', displayName: 'Refinery Complexity', type: 'text', description: 'Complexity level', example: 'High' },
        { name: 'daily_throughput', displayName: 'Daily Throughput', type: 'number', description: 'Daily throughput in barrels', example: '450000' },
        { name: 'annual_revenue', displayName: 'Annual Revenue', type: 'number', description: 'Annual revenue in USD', example: '5000000000' },
        { name: 'employees_count', displayName: 'Employees Count', type: 'number', description: 'Number of employees', example: '2000' },
        { name: 'established_year', displayName: 'Established Year', type: 'number', description: 'Year established', example: '1985' },
        { name: 'parent_company', displayName: 'Parent Company', type: 'text', description: 'Parent company name', example: 'Global Oil Corp' }
      ]
    }
  ];

  const loadDatabaseSchema = async () => {
    setLoadingTables(true);
    try {
      // In a real implementation, you might fetch this from an API
      // For now, we'll use the static schema
      const schema = getDatabaseSchema();
      setDatabaseTables(schema);
    } catch (error) {
      console.error('Error loading database schema:', error);
      toast.error('Failed to load database schema');
    } finally {
      setLoadingTables(false);
    }
  };


  const fetchTemplates = async () => {

    try {

      const { data, error } = await supabase

        .from('document_templates')

        .select('*')

        .order('created_at', { ascending: false });



      if (error) throw error;

      setTemplates(data || []);

    } catch (error) {

      console.error('Error fetching templates:', error);

      toast.error('Failed to fetch templates');

    } finally {

      setLoading(false);

    }

  };



  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {

    const file = event.target.files?.[0];

    if (file) {

      if (!file.name.endsWith('.docx')) {

        toast.error('Please select a Word document (.docx) file');

        return;

      }

      setUploadForm(prev => ({ ...prev, file }));

    }

  };



  const analyzeDocument = async (skipAnalysis = false) => {

    if (!uploadForm.file || !uploadForm.title) {

      toast.error('Please fill all required fields');

      return;

    }



    setUploading(true);

    if (!skipAnalysis) setAnalyzing(true);



    try {

      // Upload file to storage

      const fileName = `${Date.now()}_${uploadForm.file.name}`;

      const { data: uploadData, error: uploadError } = await supabase.storage

        .from('word-templates')

        .upload(fileName, uploadForm.file);



      if (uploadError) throw uploadError;



      const { data: { publicUrl } } = supabase.storage

        .from('word-templates')

        .getPublicUrl(fileName);



      if (!skipAnalysis) {

        // Analyze with AI

        const { data, error } = await supabase.functions.invoke('analyze-word-template', {

          body: {

            file_url: publicUrl,

            file_name: fileName,

            title: uploadForm.title,

            description: uploadForm.description,

            subscription_level: uploadForm.subscription_level

          }

        });



        if (error) throw error;



        if (data.success) {

          toast.success('Template analyzed and uploaded successfully!');

          fetchTemplates();

          resetForm();

        } else {

          throw new Error(data.error || 'Analysis failed');

        }

      } else {

        // Quick upload without AI analysis - but still extract placeholders

        console.log('🔧 Quick upload: Extracting placeholders without AI analysis...');

        const { data, error } = await supabase.functions.invoke('analyze-word-template', {

          body: {

            file_url: publicUrl,

            file_name: fileName,

            title: uploadForm.title,

            description: uploadForm.description,

            subscription_level: uploadForm.subscription_level,

            skip_ai: true // This will extract placeholders but skip AI mapping

          }

        });



        if (error) {

          console.error('❌ Quick upload placeholder extraction failed:', error);

          // Fallback: create template without placeholders

          const { error: insertError } = await supabase

            .from('document_templates')

            .insert({

              title: uploadForm.title,

              description: uploadForm.description,

              file_name: fileName,

              file_url: publicUrl,

              subscription_level: uploadForm.subscription_level,

              placeholders: [],

              field_mappings: {},

              analysis_result: { error: 'Placeholder extraction failed', fallback: true },

              template_status: 'draft',

              is_active: false,

              supports_pdf: true,

            mapping_confidence: 0

          });



        if (insertError) throw insertError;



        toast.success('Template uploaded successfully (fallback mode)! You can review and activate it later.');

        fetchTemplates();

        resetForm();

        } else if (data && data.success) {

          console.log('✅ Quick upload with placeholder extraction succeeded');

          toast.success('Template uploaded successfully with placeholders extracted!');

          fetchTemplates();

          resetForm();

        } else {

          throw new Error(data?.error || 'Placeholder extraction failed');

        }

      }

    } catch (error) {

      console.error('Error processing document:', error);

      toast.error(error instanceof Error ? error.message : 'Failed to process document');

    } finally {

      setUploading(false);

      setAnalyzing(false);

    }

  };



  const reviewTemplate = async (template: DocumentTemplate) => {

    setSelectedTemplate(template);

    setShowReviewDialog(true);



    try {

      const { data, error } = await supabase.functions.invoke('template-review', {

        body: {

          templateId: template.id,

          vesselId: 1 // Use a sample vessel for review

        }

      });



      if (error) throw error;



        if (data.success) {

          setTemplateReview(data);

        } else {

          throw new Error(data.error || 'Review failed');

        }

    } catch (error) {

      console.error('Error reviewing template:', error);

      toast.error('Failed to review template');

    }

  };



  const testTemplate = async (template: DocumentTemplate) => {

    setTestingTemplate(template.id);



    try {

      const { data, error } = await supabase.functions.invoke('enhanced-document-processor', {

        body: {

          templateId: template.id,

          vesselId: 1, // Use a sample vessel

          format: 'pdf'

        }

      });



      if (error) throw error;



      if (data.success) {

        // Update test results

        await supabase

          .from('document_templates')

          .update({

            last_tested: new Date().toISOString(),

            test_results: data.processing_stats

          })

          .eq('id', template.id);



        toast.success('Template test completed successfully!');

        fetchTemplates();

      } else {

        throw new Error(data.error || 'Test failed');

      }

    } catch (error) {

      console.error('Error testing template:', error);

      toast.error('Template test failed');

    } finally {

      setTestingTemplate(null);

    }

  };



  const toggleActive = async (template: DocumentTemplate) => {

    try {

      const { error } = await supabase

        .from('document_templates')

        .update({ 

          is_active: !template.is_active,

          template_status: !template.is_active ? 'active' : 'draft'

        })

        .eq('id', template.id);



      if (error) throw error;



      toast.success(`Template ${!template.is_active ? 'activated' : 'deactivated'}`);

      fetchTemplates();

    } catch (error) {

      console.error('Error updating template:', error);

      toast.error('Failed to update template');

    }

  };



  const deleteTemplate = async (template: DocumentTemplate) => {

    if (!confirm('Are you sure you want to delete this template?')) return;



    try {

      const { error } = await supabase

        .from('document_templates')

        .delete()

        .eq('id', template.id);



      if (error) throw error;



      toast.success('Template deleted successfully');

      fetchTemplates();

    } catch (error) {

      console.error('Error deleting template:', error);

      toast.error('Failed to delete template');

    }

  };



  const resetForm = () => {

    setUploadForm({

      title: '',

      description: '',

      subscription_level: 'basic',

      file: null,

      skip_ai_analysis: true

    });

    setShowUploadDialog(false);

  };



  const reAnalyzeTemplate = async (templateId: string, fileUrl: string, title: string, description: string) => {

    setAnalyzing(true);

    try {

      const { data, error } = await supabase.functions.invoke('analyze-word-template', {

        body: {

          file_url: fileUrl,

          file_name: title,

          title: title,

          description: description,

          subscription_level: 'basic',

          template_id: templateId

        }

      });



      if (error) throw error;



      if (data.success) {

        // Update the existing template with new analysis

        const { error: updateError } = await supabase

          .from('document_templates')

          .update({

            placeholders: data.placeholders,

            field_mappings: data.field_mappings,

            analysis_result: data.analysis_result,

            mapping_confidence: data.analysis_result?.confidence_score || 0,

            template_status: data.placeholders?.length > 0 ? 'analyzed' : 'needs_review'

          })

          .eq('id', templateId);



        if (updateError) throw updateError;



        toast.success(`Re-analysis complete! Found ${data.placeholders?.length || 0} placeholders with improved detection`);

        fetchTemplates();

      } else {

        throw new Error(data.error || 'Failed to re-analyze template');

      }

    } catch (error) {

      console.error('Error re-analyzing template:', error);

      toast.error(error instanceof Error ? error.message : 'Failed to re-analyze template');

    } finally {

      setAnalyzing(false);

    }

  };



  const validateTemplate = async (templateId: string) => {

    setTestingTemplate(templateId);

    try {

      const { data, error } = await supabase.functions.invoke('validate-template', {

        body: {

          templateId: templateId,

          testWithVesselId: 1 // Use first vessel for testing

        }

      });



      if (error) throw error;



      if (data.success) {

        const validation = data.validation;

        
        
        // Show validation results

        let message = `Validation Score: ${validation.final_score}/100`;

        if (validation.overall_status === 'success') {

          toast.success(message, {

            description: `Template passed all tests. ${validation.document_generation_test?.filled_from_data || 0} fields mapped successfully.`,

            duration: 5000

          });

        } else if (validation.overall_status === 'warning') {

          toast.warning(message, {

            description: `Template works but has ${validation.issues.length} issues to address.`,

            duration: 5000

          });

        } else {

          toast.error(message, {

            description: `Template has critical issues: ${validation.issues.join(', ')}`,

            duration: 7000

          });

        }



        // Update template with validation results

        await supabase

          .from('document_templates')

          .update({

            last_tested: new Date().toISOString(),

            test_results: validation

          })

          .eq('id', templateId);



        fetchTemplates();

      } else {

        throw new Error(data.error || 'Validation failed');

      }

    } catch (error) {

      console.error('Error validating template:', error);

      toast.error('Template validation failed');

    } finally {

      setTestingTemplate(null);

    }

  };


  const startEditMappings = (template: DocumentTemplate) => {
    setEditingTemplateId(template.id);
    // Initialize mappingEdits with current field_mappings or suggestions
    const initial: Record<string, any> = {};
    const initialMappingStates: Record<string, MappingState> = {};
    
    (template.placeholders || []).forEach((ph: string) => {
      if (template.advanced_mappings && template.advanced_mappings[ph]) {
        const mapping = template.advanced_mappings[ph];
        initial[ph] = mapping;
        
        // Initialize mapping state
        initialMappingStates[ph] = {
          selectedTable: mapping.dbField ? mapping.dbField.split('.')[0] : '',
          selectedField: mapping.dbField ? mapping.dbField.split('.')[1] || mapping.dbField : '',
          mappingType: mapping.dbField ? 'database' : mapping.fixedText ? 'fixed' : mapping.choices ? 'choices' : 'random',
          fixedText: mapping.fixedText || '',
          choices: mapping.choices ? mapping.choices.split(',').map(c => c.trim()) : [],
          previewValue: ''
        };
      } else {
        initial[ph] = { dbField: '', fixedText: '', choices: '' };
        initialMappingStates[ph] = {
          selectedTable: '',
          selectedField: '',
          mappingType: 'database',
          fixedText: '',
          choices: [],
          previewValue: ''
        };
      }
    });
    
    setMappingEdits(initial);
    setMappingStates(initialMappingStates);
  };

  const handleMappingChange = (ph: string, value: string) => {
    setMappingEdits(prev => ({ ...prev, [ph]: value }));
  };

  // Enhanced mapping helper functions
  const updateMappingState = (placeholder: string, updates: Partial<MappingState>) => {
    setMappingStates(prev => ({
      ...prev,
      [placeholder]: { ...prev[placeholder], ...updates }
    }));
  };

  const getSelectedTableFields = (tableName: string) => {
    const table = databaseTables.find(t => t.name === tableName);
    return table ? table.fields : [];
  };

  const generatePreviewValue = (placeholder: string, mappingState: MappingState) => {
    if (mappingState.mappingType === 'database' && mappingState.selectedTable && mappingState.selectedField) {
      const table = databaseTables.find(t => t.name === mappingState.selectedTable);
      const field = table?.fields.find(f => f.name === mappingState.selectedField);
      return field?.example || `[${mappingState.selectedTable}.${mappingState.selectedField}]`;
    } else if (mappingState.mappingType === 'fixed') {
      return mappingState.fixedText || '[Fixed Text]';
    } else if (mappingState.mappingType === 'choices') {
      return mappingState.choices.length > 0 ? mappingState.choices[0] : '[Random Choice]';
    } else {
      return '[Random Generated]';
    }
  };

  const saveMappingForPlaceholder = (placeholder: string, mappingState: MappingState) => {
    let dbField = '';
    if (mappingState.mappingType === 'database' && mappingState.selectedTable && mappingState.selectedField) {
      dbField = `${mappingState.selectedTable}.${mappingState.selectedField}`;
    }

    const mapping = {
      dbField,
      fixedText: mappingState.mappingType === 'fixed' ? mappingState.fixedText : '',
      choices: mappingState.mappingType === 'choices' ? mappingState.choices.join(', ') : ''
    };

    setMappingEdits(prev => ({
      ...prev,
      [placeholder]: mapping
    }));

    // Update preview value
    const previewValue = generatePreviewValue(placeholder, mappingState);
    updateMappingState(placeholder, { previewValue });
  };

  const getMappingStatus = (placeholder: string) => {
    const mapping = mappingEdits[placeholder];
    if (mapping?.dbField) return 'database';
    if (mapping?.fixedText) return 'fixed';
    if (mapping?.choices) return 'choices';
    return 'random';
  };

  const getMappingStatusColor = (status: string) => {
    switch (status) {
      case 'database': return 'bg-green-100 text-green-800 border-green-200';
      case 'fixed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'choices': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'random': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const saveMappings = async (template: DocumentTemplate) => {
    try {
      const { error } = await supabase
        .from('document_templates')
        .update({ 
          advanced_mappings: mappingEdits,
          field_mappings: mappingEdits // Also update field_mappings for backward compatibility
        })
        .eq('id', template.id);
      if (error) throw error;
      toast.success('Mappings updated successfully!');
      setEditingTemplateId(null);
      fetchTemplates();
    } catch (error) {
      console.error('Error saving mappings:', error);
      toast.error('Failed to update mappings. Please ensure the advanced_mappings column exists in the database.');
    }
  };

  const addManualPlaceholder = async () => {
    if (!newPlaceholder.name || !selectedTemplateForPlaceholder) {
      toast.error('Please enter placeholder name and select mapping');
      return;
    }

    try {
      const template = templates.find(t => t.id === selectedTemplateForPlaceholder);
      if (!template) return;

      // Add to placeholders array
      const updatedPlaceholders = [...(template.placeholders || []), newPlaceholder.name];
      
      // Add to advanced mappings
      const updatedMappings = {
        ...(template.advanced_mappings || {}),
        [newPlaceholder.name]: {
          dbField: newPlaceholder.mapping.startsWith('vessels.') ? newPlaceholder.mapping : '',
          fixedText: !newPlaceholder.mapping.startsWith('vessels.') ? newPlaceholder.mapping : '',
          choices: ''
        }
      };

      const { error } = await supabase
        .from('document_templates')
        .update({ 
          placeholders: updatedPlaceholders,
          advanced_mappings: updatedMappings
        })
        .eq('id', selectedTemplateForPlaceholder);

      if (error) throw error;
      
      toast.success(`Placeholder {${newPlaceholder.name}} added successfully!`);
      setNewPlaceholder({ name: '', mapping: '' });
      setShowAddPlaceholderDialog(false);
      setSelectedTemplateForPlaceholder(null);
      fetchTemplates();
    } catch (error) {
      console.error('Error adding placeholder:', error);
      toast.error('Failed to add placeholder');
    }
  };


  const getStatusBadge = (template: DocumentTemplate) => {

    if (template.is_active) {

      return <Badge className="bg-green-500">Active</Badge>;

    }

    if (template.template_status === 'draft') {

      return <Badge variant="secondary">Draft</Badge>;

    }

    return <Badge variant="outline">{template.template_status}</Badge>;

  };



  const getConfidenceBadge = (confidence: number) => {

    if (confidence >= 80) return <Badge className="bg-green-500">High</Badge>;

    if (confidence >= 60) return <Badge className="bg-yellow-500">Medium</Badge>;

    return <Badge className="bg-red-500">Low</Badge>;

  };



  if (loading) {

    return (

      <div className="flex items-center justify-center h-64">

        <Loader2 className="h-8 w-8 animate-spin" />

        <span className="ml-2">Loading templates...</span>

      </div>

    );

  }



  return (

    <div className="space-y-6">

      <div className="flex justify-between items-center">

        <div>

          <h2 className="text-3xl font-bold tracking-tight">Enhanced Document Templates</h2>

          <p className="text-muted-foreground">

            Upload, analyze, and manage Word document templates with smart placeholder detection

          </p>

        </div>

        <Button onClick={() => setShowUploadDialog(true)} className="flex items-center gap-2">

          <Upload className="h-4 w-4" />

          Upload Template

        </Button>

      </div>



      <Tabs defaultValue="templates" className="space-y-4">

        <TabsList>

          <TabsTrigger value="templates">Templates</TabsTrigger>

          <TabsTrigger value="analytics">Analytics</TabsTrigger>

        </TabsList>



        <TabsContent value="templates">

          {templates.length === 0 ? (

            <Card>

              <CardContent className="flex flex-col items-center justify-center py-12">

                <FileText className="h-12 w-12 text-muted-foreground mb-4" />

                <h3 className="text-lg font-semibold mb-2">No templates yet</h3>

                <p className="text-muted-foreground text-center mb-4">

                  Upload your first Word document template to get started

                </p>

                <Button onClick={() => setShowUploadDialog(true)} className="flex items-center gap-2">

                  <Upload className="h-4 w-4" />

                  Upload Template

                </Button>

              </CardContent>

            </Card>

          ) : (

            <Card>

              <CardHeader>

                <CardTitle>Document Templates</CardTitle>

              </CardHeader>

              <CardContent>

                <Table>

                  <TableHeader>

                    <TableRow>

                      <TableHead>Title</TableHead>

                      <TableHead>Placeholders</TableHead>

                      <TableHead>Confidence</TableHead>

                      <TableHead>Permission</TableHead>

                      <TableHead>Status</TableHead>

                      <TableHead>Last Tested</TableHead>

                      <TableHead>Actions</TableHead>

                    </TableRow>

                  </TableHeader>

                  <TableBody>

                    {templates.map((template) => [
                      <TableRow key={template.id}>

                        <TableCell>{template.title}</TableCell>
                        <TableCell>{Array.isArray(template.placeholders) ? template.placeholders.length : 0}</TableCell>
                        <TableCell>{template.mapping_confidence || 0}%</TableCell>
                        <TableCell>{template.subscription_level}</TableCell>
                        <TableCell>

                          {template.is_active ? (
                            <Badge variant="secondary">Active</Badge>
                          ) : (
                            <Badge variant="destructive">Inactive</Badge>
                          )}
                         </TableCell>

                        <TableCell>{template.last_tested ? new Date(template.last_tested).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>

                          <div className="flex gap-2 flex-wrap">
                            <Button size="sm" variant="outline" onClick={() => startEditMappings(template)}>
                              Edit
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => {
                              setSelectedTemplateForPlaceholder(template.id);
                              setShowAddPlaceholderDialog(true);
                            }}>
                              Add Placeholder
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                              setSelectedTemplateForPlaceholder(template.id);
                              setShowSmartSuggestions(true);
                            }}>
                              Smart Suggestions
                            </Button>
                            <Button size="sm" variant={template.is_active ? "destructive" : "secondary"} onClick={async () => {
                              const { error } = await supabase
                                .from('document_templates')
                                .update({ is_active: !template.is_active })
                                .eq('id', template.id);
                              if (!error) {
                                toast.success(template.is_active ? 'Template deactivated' : 'Template activated');
                                fetchTemplates();
                              } else {
                                toast.error('Failed to update status');
                              }
                            }}>
                              {template.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                              window.open(template.file_url, '_blank');
                            }}>
                              Download
                            </Button>
                            <Button size="sm" variant="destructive" onClick={async () => {
                              if (window.confirm(`Delete "${template.title}"?`)) {
                                try {
                                  console.log('Attempting to delete template:', template.id);
                                  const { data, error } = await supabase
                                    .from('document_templates')
                                    .delete()
                                    .eq('id', template.id)
                                    .select();
                                  
                                  console.log('Delete result:', { data, error });
                                  
                                  if (error) {
                                    console.error('Delete error details:', error);
                                    toast.error(`Delete failed: ${error.message}`);
                                    return;
                                  }
                                  
                                  toast.success('Template deleted');
                                  fetchTemplates();
                                } catch (error) {
                                  console.error('Delete exception:', error);
                                  toast.error('Delete failed');
                                }
                              }
                            }}>
                              Delete
                            </Button>
                          </div>

                        </TableCell>

                      </TableRow>,
                      editingTemplateId === template.id && (
                        <TableRow key={template.id + '-edit'}>
                          <TableCell colSpan={7} className="p-0">
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6">
                              <div className="flex items-center justify-between mb-6">
                                <div>
                                  <h3 className="text-xl font-semibold text-gray-900">Professional Placeholder Mapping</h3>
                                  <p className="text-sm text-gray-600 mt-1">
                                    Map each placeholder to database fields, fixed text, or choices for professional document generation
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" onClick={() => setEditingTemplateId(null)}>
                                    <X className="h-4 w-4 mr-2" />
                                    Cancel
                                  </Button>
                                  <Button size="sm" onClick={() => saveMappings(template)}>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save All Mappings
                                  </Button>
                                </div>
                              </div>

                              {/* Search and Filter */}
                              <div className="mb-6">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                  <Input
                                    placeholder="Search placeholders..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                  />
                                </div>
                              </div>

                              {/* Placeholders Grid */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {(template.placeholders || [])
                                  .filter((ph: string) => 
                                    ph.toLowerCase().includes(searchTerm.toLowerCase())
                                  )
                                  .map((ph: string) => {
                                    const mappingState = mappingStates[ph] || {
                                      selectedTable: '',
                                      selectedField: '',
                                      mappingType: 'database' as const,
                                      fixedText: '',
                                      choices: [],
                                      previewValue: ''
                                    };
                                    const status = getMappingStatus(ph);
                                    const availableFields = getSelectedTableFields(mappingState.selectedTable);

                                    return (
                                      <Card key={ph} className="border-2 hover:border-blue-300 transition-colors">
                                        <CardHeader className="pb-3">
                                          <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">

                                              <Badge className={`${getMappingStatusColor(status)} border`}>
                                                {status === 'database' && <Database className="h-3 w-3 mr-1" />}
                                                {status === 'fixed' && <CheckCircle className="h-3 w-3 mr-1" />}
                                                {status === 'choices' && <RefreshCw className="h-3 w-3 mr-1" />}
                                                {status === 'random' && <AlertCircle className="h-3 w-3 mr-1" />}
                                                {status.toUpperCase()}
                                              </Badge>
                                            </div>
                             <Button

                               size="sm"

                               variant="outline"

                                              onClick={() => setCurrentMappingPlaceholder(
                                                currentMappingPlaceholder === ph ? null : ph
                                              )}
                                            >
                                              {currentMappingPlaceholder === ph ? 'Hide' : 'Configure'}
                              </Button>

                                          </div>
                                          <div className="mt-2">
                                            <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                                              {`{${ph}}`}
                                            </code>
                                            {mappingState.previewValue && (
                                              <div className="mt-2 text-sm text-gray-600">
                                                <strong>Preview:</strong> {mappingState.previewValue}
                                              </div>
                                            )}
                                          </div>
                                        </CardHeader>

                                        {currentMappingPlaceholder === ph && (
                                          <CardContent className="pt-0">
                                            <div className="space-y-4">
                                              {/* Mapping Type Selection */}
                                              <div>
                                                <Label className="text-sm font-medium">Mapping Type</Label>
                                                <div className="grid grid-cols-2 gap-2 mt-2">
                                                  {[
                                                    { value: 'database', label: 'Database Field', icon: '🗄️' },
                                                    { value: 'fixed', label: 'Fixed Text', icon: '📝' },
                                                    { value: 'choices', label: 'Multiple Choices', icon: '🎲' },
                                                    { value: 'random', label: 'Random Generated', icon: '🎯' }
                                                  ].map((type) => (
                             <Button

                                                      key={type.value}
                               size="sm"

                                                      variant={mappingState.mappingType === type.value ? "default" : "outline"}
                                                      onClick={() => {
                                                        updateMappingState(ph, { mappingType: type.value as any });
                                                        saveMappingForPlaceholder(ph, { ...mappingState, mappingType: type.value as any });
                                                      }}
                                                      className="justify-start"
                                                    >
                                                      <span className="mr-2">{type.icon}</span>
                                                      {type.label}
                             </Button>

                                                  ))}
                                                </div>
                                              </div>

                                              {/* Database Field Selection */}
                                              {mappingState.mappingType === 'database' && (
                                                <div className="space-y-3">
                                                  <div>
                                                    <Label className="text-sm font-medium">Database Table</Label>
                                                    <Select
                                                      value={mappingState.selectedTable}
                                                      onValueChange={(value) => {
                                                        updateMappingState(ph, { 
                                                          selectedTable: value, 
                                                          selectedField: '' 
                                                        });
                                                      }}
                                                    >
                                                      <SelectTrigger>
                                                        <SelectValue placeholder="Select table..." />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                        {databaseTables.map((table) => (
                                                          <SelectItem key={table.name} value={table.name}>
                                                            <div className="flex items-center gap-2">
                                                              <span>{table.icon}</span>
                                                              <span>{table.displayName}</span>
                                                              <span className="text-xs text-gray-500">({table.fields.length} fields)</span>
                           </div>
                                                          </SelectItem>
                                                        ))}
                                                      </SelectContent>
                                                    </Select>
                                                  </div>

                                                  {mappingState.selectedTable && (
                                                    <div>
                                                      <Label className="text-sm font-medium">Field</Label>
                                                      <Select
                                                        value={mappingState.selectedField}
                                                        onValueChange={(value) => {
                                                          updateMappingState(ph, { selectedField: value });
                                                          saveMappingForPlaceholder(ph, { ...mappingState, selectedField: value });
                                                        }}
                                                      >
                                                        <SelectTrigger>
                                                          <SelectValue placeholder="Select field..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                          {availableFields.map((field) => (
                                                            <SelectItem key={field.name} value={field.name}>
                                                              <div>
                                                                <div className="font-medium">{field.displayName}</div>
                                                                <div className="text-xs text-gray-500">{field.description}</div>
                                                                {field.example && (
                                                                  <div className="text-xs text-blue-600">e.g., {field.example}</div>
                                                                )}
                                                              </div>
                                                            </SelectItem>
                                                          ))}
                                                        </SelectContent>
                                                      </Select>
                                                    </div>
                                                  )}
                                                </div>
                                              )}

                                              {/* Fixed Text Input */}
                                              {mappingState.mappingType === 'fixed' && (
                                                <div>
                                                  <Label className="text-sm font-medium">Fixed Text Value</Label>
                                                  <Input
                                                    value={mappingState.fixedText}
                                                    onChange={(e) => {
                                                      updateMappingState(ph, { fixedText: e.target.value });
                                                      saveMappingForPlaceholder(ph, { ...mappingState, fixedText: e.target.value });
                                                    }}
                                                    placeholder="Enter fixed text..."
                                                    className="mt-1"
                                                  />
                                                </div>
                                              )}

                                              {/* Multiple Choices Input */}
                                              {mappingState.mappingType === 'choices' && (
                                                <div>
                                                  <Label className="text-sm font-medium">Multiple Choices</Label>
                                                  <Textarea
                                                    value={mappingState.choices.join(', ')}
                                                    onChange={(e) => {
                                                      const choices = e.target.value.split(',').map(c => c.trim()).filter(Boolean);
                                                      updateMappingState(ph, { choices });
                                                      saveMappingForPlaceholder(ph, { ...mappingState, choices });
                                                    }}
                                                    placeholder="Enter choices separated by commas..."
                                                    className="mt-1"
                                                    rows={3}
                                                  />
                                                  <p className="text-xs text-gray-500 mt-1">
                                                    System will randomly select one choice when generating documents
                                                  </p>
                                                </div>
                                              )}

                                              {/* Random Generation Info */}
                                              {mappingState.mappingType === 'random' && (
                                                <div className="p-3 bg-gray-50 rounded-lg">
                                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <span>System will generate realistic maritime data for this placeholder</span>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </CardContent>
                                        )}
                                      </Card>
                                    );
                                  })}
                              </div>

                              {/* Summary */}
                              <div className="mt-6 p-4 bg-white rounded-lg border">
                                <h4 className="font-medium text-gray-900 mb-2">Mapping Summary</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">
                                      {Object.values(mappingEdits).filter(m => m?.dbField).length}
                                    </div>
                                    <div className="text-gray-600">Database Fields</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">
                                      {Object.values(mappingEdits).filter(m => m?.fixedText).length}
                                    </div>
                                    <div className="text-gray-600">Fixed Text</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-yellow-600">
                                      {Object.values(mappingEdits).filter(m => m?.choices).length}
                                    </div>
                                    <div className="text-gray-600">Choices</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-600">
                                      {Object.values(mappingEdits).filter(m => !m?.dbField && !m?.fixedText && !m?.choices).length}
                                    </div>
                                    <div className="text-gray-600">Random</div>
                                  </div>
                                </div>
                              </div>
                           </div>

                        </TableCell>

                      </TableRow>

                      )
                    ])}
                  </TableBody>

                </Table>

              </CardContent>

            </Card>

          )}

        </TabsContent>



        <TabsContent value="analytics">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <Card>

              <CardHeader>

                <CardTitle className="text-sm font-medium">Total Templates</CardTitle>

              </CardHeader>

              <CardContent>

                <div className="text-2xl font-bold">{templates.length}</div>

              </CardContent>

            </Card>

            <Card>

              <CardHeader>

                <CardTitle className="text-sm font-medium">Active Templates</CardTitle>

              </CardHeader>

              <CardContent>

                <div className="text-2xl font-bold">

                  {templates.filter(t => t.is_active).length}

                </div>

              </CardContent>

            </Card>

            <Card>

              <CardHeader>

                <CardTitle className="text-sm font-medium">Avg. Confidence</CardTitle>

              </CardHeader>

              <CardContent>

                <div className="text-2xl font-bold">

                  {templates.length > 0 

                    ? Math.round(templates.reduce((sum, t) => sum + (t.mapping_confidence || 0), 0) / templates.length)

                    : 0}%

                </div>

              </CardContent>

            </Card>

          </div>

        </TabsContent>

      </Tabs>



      {/* Upload Dialog */}

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>

        <DialogContent className="sm:max-w-lg">

          <DialogHeader>

            <DialogTitle>Upload Document Template</DialogTitle>

            <p className="text-sm text-muted-foreground">

              Upload Word documents (.docx) to create templates for vessel document generation

            </p>

          </DialogHeader>

          <div className="space-y-4">

            <div>

              <Label htmlFor="title">Title *</Label>

              <Input

                id="title"

                value={uploadForm.title}

                onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}

                placeholder="Template title"

              />

            </div>

            <div>

              <Label htmlFor="description">Description</Label>

              <Textarea

                id="description"

                value={uploadForm.description}

                onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}

                placeholder="Template description"

              />

            </div>

            <div>

              <Label htmlFor="subscription_level">Permission Level</Label>

              <Select

                value={uploadForm.subscription_level}

                onValueChange={(value) => setUploadForm(prev => ({ ...prev, subscription_level: value }))}

              >

                <SelectTrigger>

                  <SelectValue />

                </SelectTrigger>

                <SelectContent>

                  <SelectItem value="basic">Basic</SelectItem>

                  <SelectItem value="professional">Professional</SelectItem>

                  <SelectItem value="enterprise">Enterprise</SelectItem>

                </SelectContent>

              </Select>

            </div>

            <div>

              <Label htmlFor="file">Word Document *</Label>

              <Input

                id="file"

                type="file"

                accept=".docx"

                onChange={handleFileSelect}

              />

            </div>

            <Alert>

              <Info className="h-4 w-4" />

              <AlertDescription>

                <strong>Upload Options:</strong> You can upload templates with or without AI analysis. 

                Without analysis, templates will be saved as drafts for manual review.

              </AlertDescription>

            </Alert>

            
            
            <div className="flex justify-end space-x-2">

              <Button variant="outline" onClick={resetForm}>

                Cancel

              </Button>

              
              
              <Button

                variant="outline"

                onClick={() => analyzeDocument(true)}

                disabled={uploading || !uploadForm.file || !uploadForm.title}

              >

                {uploading && uploadForm.skip_ai_analysis ? (

                  <>

                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />

                    Uploading...

                  </>

                ) : (

                  <>

                    <Upload className="mr-2 h-4 w-4" />

                    Quick Upload Only

                  </>

                )}

              </Button>

              
              
              <Button

                onClick={() => analyzeDocument(false)}

                disabled={uploading || !uploadForm.file || !uploadForm.title}

              >

                {uploading && !uploadForm.skip_ai_analysis ? (

                  <>

                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />

                    Analyzing...

                  </>

                ) : (

                  <>

                    <Settings className="mr-2 h-4 w-4" />

                    Upload & Analyze with AI

                  </>

                )}

              </Button>

            </div>

          </div>

        </DialogContent>

      </Dialog>



      {/* Review Dialog */}

      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>

        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">

          <DialogHeader>

            <DialogTitle>Template Review: {selectedTemplate?.title}</DialogTitle>

          </DialogHeader>

          
          
          {templateReview && (

            <div className="space-y-6">

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                <Card>

                  <CardContent className="p-4">

                    <div className="text-2xl font-bold">{templateReview.statistics.total_placeholders}</div>

                    <div className="text-sm text-muted-foreground">Total Placeholders</div>

                  </CardContent>

                </Card>

                <Card>

                  <CardContent className="p-4">

                    <div className="text-2xl font-bold text-green-600">{templateReview.statistics.available_data}</div>

                    <div className="text-sm text-muted-foreground">Available Data</div>

                  </CardContent>

                </Card>

                <Card>

                  <CardContent className="p-4">

                    <div className="text-2xl font-bold text-orange-600">{templateReview.statistics.missing_data}</div>

                    <div className="text-sm text-muted-foreground">Will Use Random</div>

                  </CardContent>

                </Card>

                <Card>

                  <CardContent className="p-4">

                    <div className="text-2xl font-bold">{templateReview.statistics.completion_rate}%</div>

                    <div className="text-sm text-muted-foreground">Completion Rate</div>

                  </CardContent>

                </Card>

              </div>



              <div>

                <h4 className="font-semibold mb-3">Recommendations</h4>

                <div className="space-y-2">

                  {templateReview.recommendations.map((rec, index) => (

                    <Alert key={index}>

                      <AlertCircle className="h-4 w-4" />

                      <AlertDescription>{rec}</AlertDescription>

                    </Alert>

                  ))}

                </div>

              </div>



              <div>

                <h4 className="font-semibold mb-3">Placeholder Analysis</h4>

                <Table>

                  <TableHeader>

                    <TableRow>

                      <TableHead>Placeholder</TableHead>

                      <TableHead>Status</TableHead>

                      <TableHead>Data Source</TableHead>

                      <TableHead>Preview Value</TableHead>

                    </TableRow>

                  </TableHeader>

                  <TableBody>

                    {templateReview.placeholder_analysis.map((placeholder, index) => (

                      <TableRow key={index}>

                        <TableCell className="font-mono text-sm">{placeholder.name}</TableCell>

                        <TableCell>

                          {placeholder.hasData ? (

                            <Badge className="bg-green-500">

                              <CheckCircle className="w-3 h-3 mr-1" />

                              Available

                            </Badge>

                          ) : (

                            <Badge className="bg-orange-500">

                              <AlertCircle className="w-3 h-3 mr-1" />

                              Random

                            </Badge>

                          )}

                        </TableCell>

                        <TableCell className="text-sm text-muted-foreground">

                          {placeholder.dataSource || 'Will generate random data'}

                        </TableCell>

                        <TableCell className="text-sm">

                          {placeholder.value || 'Random maritime data'}

                        </TableCell>

                      </TableRow>

                    ))}

                  </TableBody>

                 </Table>

               </div>



               {/* Debug Information */}

               {selectedTemplate?.analysis_result?.debugging_info && (

                 <div>

                   <h4 className="font-semibold mb-3">Debugging Information</h4>

                   <div className="space-y-4">

                     <Card>

                       <CardHeader>

                         <CardTitle className="text-lg">Text Extraction</CardTitle>

                       </CardHeader>

                       <CardContent className="space-y-3">

                         <div className="grid grid-cols-2 gap-4">

                           <div>

                             <label className="text-sm font-medium">Extraction Method:</label>

                             <Badge variant="outline" className="ml-2">

                               {selectedTemplate.analysis_result.debugging_info.extraction_method}

                             </Badge>

                           </div>

                           <div>

                             <label className="text-sm font-medium">Text Length:</label>

                             <span className="ml-2 text-sm">{selectedTemplate.analysis_result.text_length} characters</span>

                           </div>

                         </div>

                         
                         
                         {selectedTemplate.analysis_result.text_sample && (

                           <div>

                             <label className="text-sm font-medium">Extracted Text Sample:</label>

                             <div className="mt-2 p-3 bg-muted rounded-md">

                               <pre className="text-xs whitespace-pre-wrap">

                                 {selectedTemplate.analysis_result.text_sample}

                               </pre>

                             </div>

                           </div>

                         )}

                         
                         
                         {selectedTemplate.analysis_result.pattern_breakdown && (

                           <div>

                             <label className="text-sm font-medium">Pattern Detection Results:</label>

                             <div className="mt-2 space-y-2">

                               {Object.entries(selectedTemplate.analysis_result.pattern_breakdown).map(([pattern, matches]) => (

                                 <div key={pattern} className="flex justify-between items-center p-2 bg-muted rounded">

                                   <span className="text-sm font-medium">{pattern}:</span>

                                   <Badge variant="outline">

                                     {Array.isArray(matches) ? matches.length : 0} found

                                   </Badge>

                                 </div>

                               ))}

                             </div>

                           </div>

                         )}

                       </CardContent>

                     </Card>

                   </div>

                 </div>

               )}

            </div>

          )}

        </DialogContent>

      </Dialog>

      {/* Add Placeholder Dialog */}
      <Dialog open={showAddPlaceholderDialog} onOpenChange={setShowAddPlaceholderDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Manual Placeholder</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Add a new placeholder that will be inserted into the document template
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="placeholder-name">Placeholder Name</Label>
              <Input
                id="placeholder-name"
                value={newPlaceholder.name}
                onChange={(e) => setNewPlaceholder(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., contract_date, custom_field"
              />
              <p className="text-xs text-gray-500 mt-1">
                Will appear as: {`{${newPlaceholder.name || 'placeholder_name'}}`}
              </p>
            </div>
            <div>
              <Label htmlFor="placeholder-mapping">Mapping</Label>
              <Select
                value={newPlaceholder.mapping}
                onValueChange={(value) => setNewPlaceholder(prev => ({ ...prev, mapping: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select mapping type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vessels.name">Vessel Name</SelectItem>
                  <SelectItem value="vessels.imo">IMO Number</SelectItem>
                  <SelectItem value="vessels.flag">Flag State</SelectItem>
                  <SelectItem value="vessels.vessel_type">Vessel Type</SelectItem>
                  <SelectItem value="vessels.built">Year Built</SelectItem>
                  <SelectItem value="vessels.deadweight">Deadweight</SelectItem>
                  <SelectItem value="vessels.length">Length</SelectItem>
                  <SelectItem value="vessels.owner_name">Owner Name</SelectItem>
                  <SelectItem value="vessels.operator_name">Operator Name</SelectItem>
                  <SelectItem value="Current Date">Current Date</SelectItem>
                  <SelectItem value="Sample Text">Sample Text</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => {
                setShowAddPlaceholderDialog(false);
                setNewPlaceholder({ name: '', mapping: '' });
                setSelectedTemplateForPlaceholder(null);
              }}>
                Cancel
              </Button>
              <Button onClick={addManualPlaceholder}>
                Add Placeholder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Smart Suggestions Dialog */}
      <Dialog open={showSmartSuggestions} onOpenChange={setShowSmartSuggestions}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Smart Placeholder Suggestions</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Click to add common placeholders to your template
            </p>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {smartPlaceholderSuggestions.map((suggestion) => {
              const template = templates.find(t => t.id === selectedTemplateForPlaceholder);
              const alreadyExists = template?.placeholders?.includes(suggestion.name);
              
              return (
                <Card key={suggestion.name} className={`p-3 cursor-pointer transition-colors ${
                  alreadyExists ? 'bg-gray-100 opacity-50' : 'hover:bg-blue-50'
                }`} onClick={async () => {
                  if (alreadyExists) {
                    toast.info(`Placeholder {${suggestion.name}} already exists`);
                    return;
                  }
                  
                  try {
                    const template = templates.find(t => t.id === selectedTemplateForPlaceholder);
                    if (!template) return;

                    const updatedPlaceholders = [...(template.placeholders || []), suggestion.name];
                    const updatedMappings = {
                      ...(template.advanced_mappings || {}),
                      [suggestion.name]: {
                        dbField: suggestion.mapping.startsWith('vessels.') ? suggestion.mapping : '',
                        fixedText: !suggestion.mapping.startsWith('vessels.') ? suggestion.mapping : '',
                        choices: ''
                      }
                    };

                    const { error } = await supabase
                      .from('document_templates')
                      .update({ 
                        placeholders: updatedPlaceholders,
                        advanced_mappings: updatedMappings
                      })
                      .eq('id', selectedTemplateForPlaceholder);

                    if (error) throw error;
                    
                    toast.success(`Added {${suggestion.name}}`);
                    fetchTemplates();
                  } catch (error) {
                    toast.error('Failed to add placeholder');
                  }
                }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {`{${suggestion.name}}`}
                      </code>
                      <p className="text-xs text-gray-600 mt-1">{suggestion.description}</p>
                    </div>
                    {alreadyExists ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => {
              setShowSmartSuggestions(false);
              setSelectedTemplateForPlaceholder(null);
            }}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>

  );

}

// Helper to generate a random value for a placeholder
function generateRandomValue(ph: string): string {
  // Simple random generator for demo; can be improved
  const samples = [
    'Sample123', 'Oceanic', '2025-10-01', 'IMO1234567', 'PortX', 'CompanyY', 'RandomValue', Math.floor(Math.random()*100000).toString()
  ];
  return samples[Math.floor(Math.random() * samples.length)];
}