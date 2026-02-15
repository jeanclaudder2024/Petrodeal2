import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Ship, RefreshCw, FolderOpen, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DOCUMENT_API_URL } from '@/config/documentApi';

import {
  DocumentCard,
  SecureDownloadFlow,
  LegalDisclaimerModal,
  hasAcceptedDisclaimer,
  CommercialPartiesCard,
  UpgradeDialog,
  PlanStatusFooter,
  DocumentTemplate,
  ProcessingStatus,
  CommercialParty
} from '@/components/vessel-documents';

interface VesselDocumentGeneratorProps {
  vesselImo: string;
  vesselName: string;
}

const API_BASE_URL = DOCUMENT_API_URL;

export default function VesselDocumentGenerator({ vesselImo, vesselName }: VesselDocumentGeneratorProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingStatus, setProcessingStatus] = useState<Record<string, ProcessingStatus>>({});
  const [userPlanTier, setUserPlanTier] = useState<string | null>(null);
  const [userPlanName, setUserPlanName] = useState<string | null>(null);
  const [totalDownloads, setTotalDownloads] = useState<number>(0);
  const [maxPlanDownloads, setMaxPlanDownloads] = useState<number | null>(null);
  
  // Commercial parties
  const [buyer, setBuyer] = useState<CommercialParty | null>(null);
  const [seller, setSeller] = useState<CommercialParty | null>(null);
  const [loadingParties, setLoadingParties] = useState(true);
  
  // Dialogs
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [lockedTemplate, setLockedTemplate] = useState<DocumentTemplate | null>(null);
  const [showDownloadFlow, setShowDownloadFlow] = useState(false);
  const [downloadFlowStatus, setDownloadFlowStatus] = useState<ProcessingStatus>({ status: 'idle', message: '', progress: 0 });
  const [currentDownloadTemplate, setCurrentDownloadTemplate] = useState<string>('');
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [pendingDownloadTemplate, setPendingDownloadTemplate] = useState<DocumentTemplate | null>(null);

  // Fetch commercial parties from vessel
  useEffect(() => {
    const fetchCommercialParties = async () => {
      if (!vesselImo) return;
      
      setLoadingParties(true);
      try {
        // Get vessel with company references
        const { data: vessel } = await supabase
          .from('vessels')
          .select('buyer_company_uuid, seller_company_uuid')
          .eq('imo', vesselImo)
          .single();

        if (vessel?.buyer_company_uuid) {
          const { data: buyerData } = await supabase
            .from('buyer_companies')
            .select('id, name, country')
            .eq('id', vessel.buyer_company_uuid)
            .single();

          if (buyerData) {
            // Get buyer's primary bank
            const { data: buyerBank } = await supabase
              .from('buyer_company_bank_accounts')
              .select('bank_name, swift_code')
              .eq('company_id', buyerData.id)
              .eq('is_primary', true)
              .single();

            setBuyer({
              id: buyerData.id,
              name: buyerData.name,
              country: buyerData.country || undefined,
              bank_name: buyerBank?.bank_name || undefined,
              swift_code: buyerBank?.swift_code || undefined
            });
          }
        }

        if (vessel?.seller_company_uuid) {
          const { data: sellerData } = await supabase
            .from('seller_companies')
            .select('id, name, country')
            .eq('id', vessel.seller_company_uuid)
            .single();

          if (sellerData) {
            // Get seller's primary bank
            const { data: sellerBank } = await supabase
              .from('seller_company_bank_accounts')
              .select('bank_name, swift_code')
              .eq('company_id', sellerData.id)
              .eq('is_primary', true)
              .single();

            setSeller({
              id: sellerData.id,
              name: sellerData.name,
              country: sellerData.country || undefined,
              bank_name: sellerBank?.bank_name || undefined,
              swift_code: sellerBank?.swift_code || undefined
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch commercial parties:', error);
      } finally {
        setLoadingParties(false);
      }
    };

    fetchCommercialParties();
  }, [vesselImo]);

  // Fetch templates
  useEffect(() => {
    setTemplates([]);
    setLoading(true);
    const timer = setTimeout(() => fetchTemplates(), 100);
    return () => clearTimeout(timer);
  }, [vesselImo, user?.id]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      
      // Get user plan info first
      let userPlanTierForTemplates: string | null = null;
      let userPlanNameForTemplates: string | null = null;
      let maxDownloadsForPlan: number | null = null;
      
      if (user?.id) {
        try {
          const { data: subscriber } = await supabase
            .from('subscribers')
            .select('subscription_tier')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle();
          
          if (subscriber?.subscription_tier) {
            const { data: plan } = await supabase
              .from('subscription_plans')
              .select('plan_name, plan_tier, max_downloads_per_month')
              .eq('plan_tier', subscriber.subscription_tier)
              .limit(1)
              .single();
            
            if (plan) {
              userPlanTierForTemplates = plan.plan_tier;
              userPlanNameForTemplates = plan.plan_name;
              setUserPlanTier(plan.plan_tier);
              setUserPlanName(plan.plan_name);
              
              // Handle unlimited (-1 or null)
              if (plan.max_downloads_per_month === -1 || plan.max_downloads_per_month === null) {
                maxDownloadsForPlan = null; // unlimited
              } else {
                maxDownloadsForPlan = plan.max_downloads_per_month;
              }
              setMaxPlanDownloads(maxDownloadsForPlan);
            }
          }
          
          // Get total downloads count
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);
          
          const { count } = await supabase
            .from('processed_documents')
            .select('*', { count: 'exact', head: true })
            .eq('created_by', user.id)
            .gte('created_at', startOfMonth.toISOString());
          
          setTotalDownloads(count || 0);
        } catch (planError) {
          console.error('Failed to fetch plan info:', planError);
        }
      }

      // Fetch ALL templates first, then check permissions from Supabase
      try {
        // Get all templates from API
        const allResponse = await fetch(`${API_BASE_URL}/templates`);
        let allTemplatesMap = new Map<string, DocumentTemplate>();

        if (allResponse.ok) {
          const allData = await allResponse.json();
          (allData.templates || [])
            .filter((t: any) => t.is_active !== false)
            .forEach((t: any) => {
              const id = t.id || t.template_id || t.file_name;
              allTemplatesMap.set(id, {
                id,
                name: t.name || t.metadata?.display_name || t.title || t.file_name?.replace('.docx', '') || 'Unknown',
                title: t.title,
                description: t.description || t.metadata?.description || '',
                file_name: t.file_name || '',
                placeholders: t.placeholders || [],
                is_active: true,
                can_download: false, // Default locked
                plan_name: null,
                plan_tier: null,
                plan_tiers: [],
                remaining_downloads: undefined,
                max_downloads: undefined,
                current_downloads: undefined,
                _user_plan_tier: userPlanTierForTemplates,
                _user_plan_name: userPlanNameForTemplates,
                metadata: { display_name: t.name, description: t.description, ...t.metadata }
              } as DocumentTemplate);
            });
        }

        // Query Supabase plan_template_permissions directly to unlock templates
        if (user?.id && userPlanTierForTemplates) {
          try {
            // Get user's plan_id from subscription_plans
            const { data: planData } = await supabase
              .from('subscription_plans')
              .select('id')
              .eq('plan_tier', userPlanTierForTemplates)
              .eq('is_active', true)
              .limit(1)
              .maybeSingle();

            if (planData?.id) {
              // Fetch permissions for this plan
              const { data: planPerms } = await supabase
                .from('plan_template_permissions')
                .select('template_id, can_download, max_downloads_per_template')
                .eq('plan_id', planData.id)
                .eq('can_download', true);

              // Fetch document_templates for UUID-to-filename mapping
              const { data: dbTemplates } = await supabase
                .from('document_templates')
                .select('id, file_name, title');

              if (planPerms && dbTemplates) {
                // Build UUID -> file_name map
                const uuidToFileName = new Map<string, string>();
                const uuidToTitle = new Map<string, string>();
                dbTemplates.forEach((dt: any) => {
                  if (dt.file_name) uuidToFileName.set(dt.id, dt.file_name);
                  if (dt.title) uuidToTitle.set(dt.id, dt.title);
                });

                // Build a set of permitted file_names for quick lookup
                const permittedFileNames = new Set<string>();
                const permsByFileName = new Map<string, any>();
                planPerms.forEach((perm: any) => {
                  const fileName = uuidToFileName.get(perm.template_id);
                  if (fileName) {
                    permittedFileNames.add(fileName);
                    permittedFileNames.add(fileName.replace('.docx', ''));
                    permsByFileName.set(fileName, perm);
                    permsByFileName.set(fileName.replace('.docx', ''), perm);
                  }
                  // Also match by title
                  const title = uuidToTitle.get(perm.template_id);
                  if (title) {
                    permittedFileNames.add(title);
                    permsByFileName.set(title, perm);
                  }
                });

                // Count current month's downloads
                const startOfMonth = new Date();
                startOfMonth.setDate(1);
                startOfMonth.setHours(0, 0, 0, 0);

                // Unlock matching templates
                allTemplatesMap.forEach((template, key) => {
                  const matchKeys = [template.file_name, template.file_name?.replace('.docx', ''), template.name, template.title, key];
                  const matched = matchKeys.some(k => k && permittedFileNames.has(k));
                  
                  if (matched) {
                    const perm = matchKeys.map(k => k && permsByFileName.get(k)).find(Boolean);
                    template.can_download = true;
                    template.plan_name = userPlanNameForTemplates;
                    template.plan_tier = userPlanTierForTemplates;
                    if (perm?.max_downloads_per_template !== undefined && perm.max_downloads_per_template !== null) {
                      template.max_downloads = perm.max_downloads_per_template === -1 ? null : perm.max_downloads_per_template;
                    }
                  }
                });
              }
            }
          } catch (permError) {
            console.error('Failed to fetch plan permissions from Supabase:', permError);
          }
        }

        // Convert map to sorted array: downloadable first, then locked
        const finalTemplates = Array.from(allTemplatesMap.values()).sort((a, b) => {
          if (a.can_download && !b.can_download) return -1;
          if (!a.can_download && b.can_download) return 1;
          return (a.name || '').localeCompare(b.name || '');
        });

        setTemplates(finalTemplates);
      } catch (error) {
        console.error('Failed to fetch templates:', error);
        toast.error('Failed to load document templates');
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      toast.error('Failed to load document templates');
    } finally {
      setLoading(false);
    }
  };

  // Check if template is locked — simple: trust can_download set by Supabase permissions
  const isTemplateLocked = useCallback((template: DocumentTemplate): boolean => {
    if (template.can_download === true) {
      // Check download limit
      if (template.remaining_downloads !== undefined && template.remaining_downloads !== null && template.remaining_downloads <= 0) {
        return true;
      }
      return false;
    }
    return true;
  }, []);

  // Handle download with legal disclaimer check
  const handleDownload = useCallback((template: DocumentTemplate) => {
    // Check if legal disclaimer has been accepted
    if (!hasAcceptedDisclaimer()) {
      setPendingDownloadTemplate(template);
      setShowDisclaimer(true);
      return;
    }
    
    processDocument(template);
  }, []);

  // Process document download
  const processDocument = async (template: DocumentTemplate) => {
    const templateKey = template.id;
    
    setCurrentDownloadTemplate(template.name || template.file_name || 'Document');
    setShowDownloadFlow(true);
    
    // Step 1: Verifying
    setDownloadFlowStatus({ status: 'verifying', message: 'Verifying access permissions...', progress: 15 });
    setProcessingStatus(prev => ({ ...prev, [templateKey]: { status: 'verifying', message: 'Verifying...', progress: 15 } }));
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Step 2: Validating
    setDownloadFlowStatus({ status: 'validating', message: 'Validating document integrity...', progress: 40 });
    setProcessingStatus(prev => ({ ...prev, [templateKey]: { status: 'validating', message: 'Validating...', progress: 40 } }));
    
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Step 3: Downloading
    setDownloadFlowStatus({ status: 'downloading', message: 'Preparing official certified copy...', progress: 60 });
    setProcessingStatus(prev => ({ ...prev, [templateKey]: { status: 'downloading', message: 'Preparing...', progress: 60 } }));

    try {
      let templateName = template.file_name || template.name || '';
      if (templateName.toLowerCase().endsWith('.docx')) {
        templateName = templateName.slice(0, -5);
      }

      const response = await fetch(`${API_BASE_URL}/generate-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          template_name: templateName,
          vessel_imo: vesselImo,
          // Pass buyer/seller UUIDs so Replit can fetch company data for placeholders
          buyer_id: buyer?.id || null,
          seller_id: seller?.id || null
        }),
      });

      // Handle 402 - OpenAI quota exceeded
      if (response.status === 402) {
        let errorType = '';
        try {
          const errorData = await response.json();
          errorType = errorData.error_type || '';
        } catch {}
        
        if (errorType === 'openai_quota_exceeded') {
          toast.warning('AI generation is temporarily unavailable due to quota limits. Please try again later or contact support.');
        } else {
          toast.warning('Document generation is temporarily unavailable. Please try again later.');
        }
        
        setDownloadFlowStatus({ status: 'failed', message: 'AI quota exceeded — try again later', progress: 0 });
        setProcessingStatus(prev => ({ ...prev, [templateKey]: { status: 'failed', message: 'AI quota exceeded', progress: 0 } }));
        return;
      }

      if (response.ok) {
        setDownloadFlowStatus({ status: 'downloading', message: 'Downloading certified copy...', progress: 85 });
        
        const contentType = response.headers.get('Content-Type') || '';
        let blob: Blob;
        let filename = `${templateName}_${vesselImo}.pdf`;

        if (contentType.includes('application/json')) {
          const data = await response.json();
          
          if (data.pdf_base64) {
            const binaryString = atob(data.pdf_base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            blob = new Blob([bytes], { type: 'application/pdf' });
            if (data.file_name) filename = data.file_name;
          } else if (data.docx_base64) {
            const binaryString = atob(data.docx_base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
            filename = data.file_name || filename.replace('.pdf', '.docx');
          } else {
            throw new Error('No document data in response');
          }
        } else {
          blob = await response.blob();
        }

        // Trigger download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setDownloadFlowStatus({ status: 'completed', message: 'Official document downloaded successfully', progress: 100 });
        setProcessingStatus(prev => ({ ...prev, [templateKey]: { status: 'completed', message: 'Downloaded', progress: 100 } }));
        
        toast.success('Document verified and downloaded successfully');
      } else {
        let errorMessage = `Failed to process (${response.status})`;
        try {
          const errorData = await response.clone().json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {}
        
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Processing failed';
      setDownloadFlowStatus({ status: 'failed', message: errorMsg, progress: 0 });
      setProcessingStatus(prev => ({ ...prev, [templateKey]: { status: 'failed', message: errorMsg, progress: 0 } }));
      toast.error(errorMsg);
    }
  };

  // Handle disclaimer accept
  const handleDisclaimerAccept = () => {
    setShowDisclaimer(false);
    if (pendingDownloadTemplate) {
      processDocument(pendingDownloadTemplate);
      setPendingDownloadTemplate(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-[hsl(210,20%,85%)] bg-gradient-to-r from-[hsl(210,40%,96%)] via-[hsl(210,30%,98%)] to-[hsl(210,30%,98%)]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[hsl(210,40%,92%)] flex items-center justify-center">
                <Shield className="h-5 w-5 text-[hsl(210,55%,30%)]" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2 text-[hsl(210,55%,18%)]">
                  Trade Documentation Center
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  <Ship className="h-3.5 w-3.5 inline mr-1" />
                  {vesselName} <span className="font-mono text-xs bg-[hsl(210,30%,93%)] px-1.5 rounded">IMO: {vesselImo}</span>
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTemplates}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Commercial Parties */}
      <CommercialPartiesCard buyer={buyer} seller={seller} loading={loadingParties} />

      {/* Documents List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Trade Documents
            {templates.length > 0 && (
              <span className="text-xs font-normal text-muted-foreground">
                ({templates.filter(t => !isTemplateLocked(t)).length} available · {templates.filter(t => isTemplateLocked(t)).length} locked)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No document templates available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map(template => {
                const templateKey = template.id;
                const status = processingStatus[templateKey];
                const isLocked = isTemplateLocked(template);
                const isProcessing = status?.status === 'verifying' || status?.status === 'validating' || status?.status === 'downloading';
                
                return (
                  <DocumentCard
                    key={templateKey}
                    template={template}
                    status={status}
                    isLocked={isLocked}
                    isProcessing={isProcessing}
                    remainingDownloads={template.remaining_downloads}
                    maxDownloads={template.max_downloads}
                    onDownload={() => handleDownload(template)}
                    onUpgrade={() => {
                      setLockedTemplate(template);
                      setUpgradeDialogOpen(true);
                    }}
                  />
                );
              })}
            </div>
          )}
        </CardContent>
        
        {/* Plan Status Footer */}
        {user && (
          <PlanStatusFooter
            planName={userPlanName}
            planTier={userPlanTier}
            totalDownloads={totalDownloads}
            maxDownloads={maxPlanDownloads}
          />
        )}
      </Card>

      {/* Trust Indicators */}
      <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground py-2">
        <span className="flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5" />
          Secured document handling
        </span>
        <span className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          Prepared according to international commercial practices
        </span>
      </div>

      {/* Dialogs */}
      <SecureDownloadFlow
        isOpen={showDownloadFlow}
        onClose={() => setShowDownloadFlow(false)}
        documentName={currentDownloadTemplate}
        status={downloadFlowStatus.status as any}
        progress={downloadFlowStatus.progress || 0}
        message={downloadFlowStatus.message}
        onRetry={() => pendingDownloadTemplate && processDocument(pendingDownloadTemplate)}
      />

      <LegalDisclaimerModal
        isOpen={showDisclaimer}
        onAccept={handleDisclaimerAccept}
        onCancel={() => {
          setShowDisclaimer(false);
          setPendingDownloadTemplate(null);
        }}
      />

      <UpgradeDialog
        isOpen={upgradeDialogOpen}
        onClose={() => setUpgradeDialogOpen(false)}
        template={lockedTemplate}
      />
    </div>
  );
}
