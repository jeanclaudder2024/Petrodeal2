import { useState, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UploadedCompany {
  company_name: string;
  country: string;
}

export interface GeneratedCompanyData {
  name: string;
  country: string;
  _error?: boolean;
  _errorMessage?: string;
  [key: string]: any;
}

export interface BulkUploadState {
  step: 'upload' | 'preview' | 'generating' | 'review';
  uploadedCompanies: UploadedCompany[];
  generatedCompanies: GeneratedCompanyData[];
  generationProgress: { current: number; total: number };
  isGenerating: boolean;
  validationErrors: string[];
}

export function useBulkCompanyUpload(companyType: 'buyer' | 'seller') {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [state, setState] = useState<BulkUploadState>({
    step: 'upload',
    uploadedCompanies: [],
    generatedCompanies: [],
    generationProgress: { current: 0, total: 0 },
    isGenerating: false,
    validationErrors: [],
  });
  const abortRef = useRef(false);

  const resetState = useCallback(() => {
    abortRef.current = false;
    setState({
      step: 'upload',
      uploadedCompanies: [],
      generatedCompanies: [],
      generationProgress: { current: 0, total: 0 },
      isGenerating: false,
      validationErrors: [],
    });
  }, []);

  const openDialog = useCallback(() => {
    resetState();
    setDialogOpen(true);
  }, [resetState]);

  const closeDialog = useCallback(() => {
    abortRef.current = true;
    setDialogOpen(false);
    resetState();
  }, [resetState]);

  const parseFile = useCallback(async (file: File): Promise<{ data: UploadedCompany[]; errors: string[] }> => {
    const errors: string[] = [];
    const data: UploadedCompany[] = [];

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

      if (jsonData.length === 0) {
        errors.push('File is empty or has no data rows');
        return { data, errors };
      }

      // Check for required columns (case-insensitive)
      const firstRow = jsonData[0];
      const columns = Object.keys(firstRow).map(c => c.toLowerCase().trim());
      
      const hasCompanyName = columns.some(c => 
        c === 'company_name' || c === 'companyname' || c === 'company name' || c === 'name'
      );
      const hasCountry = columns.some(c => c === 'country');

      if (!hasCompanyName) {
        errors.push('Missing required column: company_name (or "name", "companyname", "company name")');
      }
      if (!hasCountry) {
        errors.push('Missing required column: country');
      }

      if (errors.length > 0) {
        return { data, errors };
      }

      // Find the actual column names
      const originalColumns = Object.keys(firstRow);
      const companyNameCol = originalColumns.find(c => {
        const lc = c.toLowerCase().trim();
        return lc === 'company_name' || lc === 'companyname' || lc === 'company name' || lc === 'name';
      });
      const countryCol = originalColumns.find(c => c.toLowerCase().trim() === 'country');

      // Parse rows
      jsonData.forEach((row, index) => {
        const companyName = String(row[companyNameCol!] || '').trim();
        const country = String(row[countryCol!] || '').trim();

        if (!companyName) {
          errors.push(`Row ${index + 2}: Missing company name`);
          return;
        }
        if (!country) {
          errors.push(`Row ${index + 2}: Missing country for "${companyName}"`);
          return;
        }

        data.push({ company_name: companyName, country });
      });

      if (data.length === 0 && errors.length === 0) {
        errors.push('No valid companies found in file');
      }

    } catch (error) {
      errors.push(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { data, errors };
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    const { data, errors } = await parseFile(file);

    if (errors.length > 0 && data.length === 0) {
      setState(prev => ({ ...prev, validationErrors: errors }));
      toast({
        title: 'File Validation Failed',
        description: errors[0],
        variant: 'destructive',
      });
      return;
    }

    setState(prev => ({
      ...prev,
      step: 'preview',
      uploadedCompanies: data,
      validationErrors: errors,
    }));

    if (errors.length > 0) {
      toast({
        title: 'Some rows skipped',
        description: `${data.length} companies loaded, ${errors.length} rows had issues`,
        variant: 'default',
      });
    } else {
      toast({
        title: 'File loaded successfully',
        description: `${data.length} companies ready for AI generation`,
      });
    }
  }, [parseFile, toast]);

  const removeCompany = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      uploadedCompanies: prev.uploadedCompanies.filter((_, i) => i !== index),
    }));
  }, []);

  const generateAllWithAI = useCallback(async () => {
    abortRef.current = false;
    setState(prev => ({
      ...prev,
      step: 'generating',
      isGenerating: true,
      generationProgress: { current: 0, total: prev.uploadedCompanies.length },
      generatedCompanies: [],
    }));

    const generated: GeneratedCompanyData[] = [];

    for (let i = 0; i < state.uploadedCompanies.length; i++) {
      if (abortRef.current) {
        break;
      }

      const company = state.uploadedCompanies[i];
      setState(prev => ({
        ...prev,
        generationProgress: { current: i + 1, total: prev.uploadedCompanies.length },
      }));

      try {
        const { data, error } = await supabase.functions.invoke('autofill-company-data', {
          body: {
            companyName: company.company_name,
            country: company.country,
            companyType: companyType,
          },
        });

        if (error) throw error;

        if (data?.success && data?.data) {
          generated.push({
            name: company.company_name,
            country: company.country,
            ...data.data,
            bankAccounts: data.data.bankAccounts || [],
          });
        } else {
          generated.push({
            name: company.company_name,
            country: company.country,
            _error: true,
            _errorMessage: data?.error || 'AI generation failed',
          });
        }
      } catch (error) {
        generated.push({
          name: company.company_name,
          country: company.country,
          _error: true,
          _errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // Small delay to avoid rate limiting
      if (i < state.uploadedCompanies.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }

    setState(prev => ({
      ...prev,
      step: 'review',
      isGenerating: false,
      generatedCompanies: generated,
    }));

    const successCount = generated.filter(c => !c._error).length;
    const errorCount = generated.filter(c => c._error).length;

    toast({
      title: 'AI Generation Complete',
      description: `${successCount} companies generated successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
      variant: errorCount > 0 ? 'default' : 'default',
    });
  }, [state.uploadedCompanies, companyType, toast]);

  const removeGeneratedCompany = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      generatedCompanies: prev.generatedCompanies.filter((_, i) => i !== index),
    }));
  }, []);

  const goBackToPreview = useCallback(() => {
    setState(prev => ({
      ...prev,
      step: 'preview',
      generatedCompanies: [],
    }));
  }, []);

  return {
    dialogOpen,
    state,
    openDialog,
    closeDialog,
    handleFileUpload,
    removeCompany,
    generateAllWithAI,
    removeGeneratedCompany,
    goBackToPreview,
    resetState,
  };
}
