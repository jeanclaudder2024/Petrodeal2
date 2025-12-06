import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Download, FileText, Loader2, CheckCircle, XCircle, Lock, CreditCard, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface DocumentTemplate {
  id: string;
  name: string;
  title?: string;
  description?: string;
  file_name: string;
  placeholders?: string[];
  is_active?: boolean;
  can_download?: boolean;
  plan_name?: string;
  plan_tier?: string;
  plan_tiers?: string[]; // Array of plan tiers that can access this template
  remaining_downloads?: number;
  _user_plan_tier?: string | null; // User's plan tier (stored in template for plan matching)
  _user_plan_name?: string | null; // User's plan name (stored in template for plan matching)
  max_downloads?: number;
  current_downloads?: number;
  metadata?: {
    description?: string;
    display_name?: string;
  };
}

interface ProcessingStatus {
  status: 'idle' | 'processing' | 'completed' | 'failed';
  message: string;
  progress?: number;
}

interface VesselDocumentGeneratorProps {
  vesselImo: string;
  vesselName: string;
}

// For VPS deployment - use production API
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://petrodealhub.com/api'  // Production API
  : 'http://localhost:8000'; // Development

export default function VesselDocumentGenerator({ vesselImo, vesselName }: VesselDocumentGeneratorProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<Record<string, ProcessingStatus>>({});
  // Store user's plan information to check against template requirements
  const [userPlanTier, setUserPlanTier] = useState<string | null>(null);
  const [userPlanName, setUserPlanName] = useState<string | null>(null);
  // Dialog state for locked templates
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [lockedTemplate, setLockedTemplate] = useState<DocumentTemplate | null>(null);

  // Force refresh when component mounts, vessel changes, or user changes
  useEffect(() => {
    // Clear any cached data first
    setTemplates([]);
    setLoading(true);
    // Fetch fresh data with a small delay to ensure state is cleared
    const timer = setTimeout(() => {
      fetchTemplates();
    }, 100);
    return () => clearTimeout(timer);
  }, [vesselImo, user?.id]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      
      // If user is logged in, try user-downloadable-templates endpoint
      // But if it fails (500 error), silently fallback to public templates
      if (user?.id) {
        try {
          // Validate user.id is not null/undefined/empty
          const userId = user.id;
          if (!userId || userId === null || userId === undefined || String(userId).trim() === '') {
            // Skip user endpoint if user.id is invalid
            throw new Error('Invalid user ID');
          }
          
          // FIRST: Pre-fetch user's plan info BEFORE processing templates
          let userPlanTierForTemplates: string | null = null;
          let userPlanNameForTemplates: string | null = null;
          
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
                  .select('plan_name, plan_tier')
                  .eq('plan_tier', subscriber.subscription_tier)
                  .limit(1)
                  .single();
                
                if (plan) {
                  userPlanTierForTemplates = plan.plan_tier;
                  userPlanNameForTemplates = plan.plan_name;
                }
              }
            } catch (planError) {
              // Error handled silently for security
            }
          }
          
          // Add cache busting to ensure fresh data
          const cacheBuster = `?t=${Date.now()}`;
          const response = await fetch(`${API_BASE_URL}/user-downloadable-templates${cacheBuster}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
            },
            credentials: 'include',
            body: JSON.stringify({ user_id: String(userId).trim() }),
          });
          
          // Only process if response is successful (200-299)
          if (response.ok) {
            const data = await response.json();
            
            if (data.templates && Array.isArray(data.templates)) {
              // Process templates from backend
              const processedTemplates = data.templates.map((t: any) => {
                // Backend returns: name (display_name), description, plan_name, metadata
                const displayName = t.name || 
                                   t.metadata?.display_name || 
                                   t.title || 
                                   (t.file_name ? t.file_name.replace('.docx', '') : '') || 
                                   'Unknown Template';
                
                const description = t.description || 
                                   t.metadata?.description || 
                                   '';
                
                // CRITICAL: Use plan_name directly from backend
                // Backend returns template's required plan (which plan allows downloading this template)
                // This is what the user configured in CMS, not the user's current plan
                const planName = t.plan_name || null;  // Don't fallback to plan_tier, use only plan_name from API
                
                // Process max_downloads: -1 means unlimited (convert to null), otherwise use as-is
                let maxDownloads = t.max_downloads;
                if (maxDownloads === -1 || maxDownloads === '-1') {
                  maxDownloads = null; // null means unlimited
                } else if (maxDownloads !== null && maxDownloads !== undefined && maxDownloads !== '') {
                  // Convert to number if it's a string
                  maxDownloads = typeof maxDownloads === 'string' ? parseInt(maxDownloads, 10) : maxDownloads;
                  if (isNaN(maxDownloads) || maxDownloads < 0) {
                    maxDownloads = undefined; // Invalid value
                  }
                }
                
                return {
                  id: t.id || t.template_id || String(t.id),
                  name: displayName,
                  title: t.title || displayName,
                  description: description,
                  file_name: t.file_name || '',
                  placeholders: t.placeholders || [],
                  is_active: t.is_active !== false,
                  can_download: t.can_download === true, // Must be explicitly true
                  plan_name: planName, // Use directly from backend (template's required plan from CMS)
                  plan_tier: t.plan_tier || null,
                  plan_tiers: t.plan_tiers || [], // Store plan_tiers array from API
                  remaining_downloads: t.remaining_downloads,
                  max_downloads: maxDownloads, // Use directly from backend (user's actual plan max_downloads)
                  current_downloads: t.current_downloads,
                  // Store user's plan info in template for plan matching in render
                  _user_plan_tier: userPlanTierForTemplates,
                  _user_plan_name: userPlanNameForTemplates,
                  metadata: {
                    display_name: displayName,
                    description: description,
                    ...t.metadata
                  }
                } as DocumentTemplate;
              });
              
              setTemplates(processedTemplates);
              setLoading(false);
              return;
            }
          }
          // If response is not ok (500, 404, etc.), silently continue to fallback
          // Don't log or show error - just use public templates
        } catch (error) {
          // Network error or other exception - silently continue to fallback
          // This is expected if the endpoint doesn't exist or has issues
          // No need to log or show error to user
        }
      }
      
      // Fallback: fetch all templates
      const response = await fetch(`${API_BASE_URL}/templates`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        const templatesList = data.templates || [];
        // Don't set can_download here - it will be determined by plan permissions below
        let activeTemplates = templatesList
          .filter((t: DocumentTemplate) => t.is_active !== false);
        
        // Enrich templates with plan information and check user permissions
        try {
          // Get user's plan information
          let userPlanTier: string | null = null;
          let userPlanId: string | null = null;
          let userMaxDownloads: number | null | undefined = undefined; // undefined = not fetched yet, null = unlimited, number = limit
          let userCurrentDownloads: number = 0;
          let userPlanDetails: { plan_name: string; plan_tier: string; max_downloads_per_month: number | null } | null = null;
          
          if (user?.id) {
            try {
              const { data: subscriber, error: subscriberError } = await supabase
                .from('subscribers')
                .select('subscription_tier')
                .eq('user_id', user.id)
                .limit(1)
                .maybeSingle(); // Use maybeSingle() instead of single() to handle no results gracefully
              
              if (subscriberError) {
                // Error handled silently for security
              }
              
              if (subscriber) {
                userPlanTier = subscriber.subscription_tier || null;
                
                // Get plan details including max downloads
                if (userPlanTier) {
                  const { data: plan } = await supabase
                    .from('subscription_plans')
                    .select('id, plan_name, plan_tier, max_downloads_per_month')
                    .eq('plan_tier', userPlanTier)
                    .limit(1)
                    .single();
                  
                  if (plan) {
                    userPlanId = plan.id;
                    // Store plan details for later use
                    userPlanDetails = {
                      plan_name: plan.plan_name,
                      plan_tier: plan.plan_tier,
                      max_downloads_per_month: plan.max_downloads_per_month
                    };
                    // Store user's plan in state so it's available in render function
                    setUserPlanTier(plan.plan_tier);
                    setUserPlanName(plan.plan_name);
                    
                    // Handle unlimited downloads: -1 means unlimited, null/undefined means use default
                    const maxDownloadsValue = plan.max_downloads_per_month;
                    
                    if (maxDownloadsValue === -1 || maxDownloadsValue === '-1') {
                      userMaxDownloads = null; // null means unlimited
                    } else if (maxDownloadsValue === null || maxDownloadsValue === undefined || maxDownloadsValue === '') {
                      // If not set, default to 10 (not unlimited!)
                      userMaxDownloads = 10;
                    } else {
                      // Convert to number if it's a string
                      const numValue = typeof maxDownloadsValue === 'string' ? parseInt(maxDownloadsValue, 10) : maxDownloadsValue;
                      if (isNaN(numValue) || numValue < 0) {
                        userMaxDownloads = 10; // Invalid value, use default
                      } else {
                        userMaxDownloads = numValue;
                      }
                    }
                    
                    // Get current month's download count for user (only if not unlimited)
                    if (userMaxDownloads !== null) {
                      const startOfMonth = new Date();
                      startOfMonth.setDate(1);
                      startOfMonth.setHours(0, 0, 0, 0);
                      
                      const { count } = await supabase
                        .from('processed_documents')
                        .select('*', { count: 'exact', head: true })
                        .eq('created_by', user.id)
                        .gte('created_at', startOfMonth.toISOString());
                      
                      userCurrentDownloads = count || 0;
                    } else {
                      userCurrentDownloads = 0; // Unlimited, so no need to count
                    }
                  }
                }
              }
            } catch (planError) {
              // Error handled silently for security
            }
          }
          
          // Get all templates from database to match by file_name
          const { data: dbTemplates } = await supabase
            .from('document_templates')
            .select('id, file_name, title, description')
            .eq('is_active', true);
          
          if (dbTemplates) {
            // Check if user has broker membership
            let hasBrokerMembership = false;
            let brokerMembershipId: string | null = null;
            if (user) {
              try {
                const { data: brokerMembership } = await supabase
                  .from('broker_memberships')
                  .select('id')
                  .eq('user_id', user.id)
                  .eq('payment_status', 'paid')
                  .eq('membership_status', 'active')
                  .single();
                
                if (brokerMembership) {
                  hasBrokerMembership = true;
                  brokerMembershipId = brokerMembership.id;
                }
              } catch (e) {
                // No broker membership
              }
            }
            
            const templateIds = dbTemplates.map(t => t.id);
            
            // Get permissions based on user type (broker or subscription plan)
            let permissions: any[] = [];
            let planDetails: Record<string, any> = {};
            
            if (hasBrokerMembership && brokerMembershipId) {
              // Get broker template permissions with per-template limits
              const { data: brokerPerms } = await supabase
                .from('broker_template_permissions')
                .select('template_id, can_download, max_downloads_per_template')
                .eq('broker_membership_id', brokerMembershipId)
                .in('template_id', templateIds);
              
              if (brokerPerms) {
                permissions = brokerPerms.map(p => ({
                  template_id: p.template_id,
                  plan_id: brokerMembershipId, // Use broker membership ID as plan_id for consistency
                  can_download: p.can_download,
                  max_downloads_per_template: p.max_downloads_per_template,
                  is_broker: true
                }));
              }
            } else if (userPlanId) {
              // Get plan permissions for templates with per-template limits
              const { data: planPerms } = await supabase
                .from('plan_template_permissions')
                .select('template_id, plan_id, can_download, max_downloads_per_template')
                .eq('plan_id', userPlanId)
                .in('template_id', templateIds);
              
              if (planPerms) {
                permissions = planPerms;
              }
              
              // Get plan details (including max_downloads_per_month as fallback)
              if (permissions && permissions.length > 0) {
                const planIds = [...new Set(permissions.map(p => p.plan_id))];
                const { data: plans } = await supabase
                  .from('subscription_plans')
                  .select('id, plan_name, plan_tier, max_downloads_per_month')
                  .in('id', planIds);
                
                if (plans) {
                  planDetails = Object.fromEntries(
                    plans.map(p => [p.id, { 
                      plan_name: p.plan_name, 
                      plan_tier: p.plan_tier,
                      max_downloads_per_month: p.max_downloads_per_month
                    }])
                  );
                }
              }
            }
            
            
            // userPlanDetails is already set above if user is logged in
            
            // Create a map of file_name to template info
            const templateMap = new Map<string, any>();
            dbTemplates.forEach(t => {
              const fileName = t.file_name?.replace('.docx', '').toLowerCase() || '';
              if (fileName) {
                templateMap.set(fileName, {
                  id: t.id,
                  title: t.title,
                  description: t.description
                });
              }
            });
            
            // Fetch all template download counts in parallel first (if user is logged in)
            const templateDownloadCounts = new Map<string, number>();
            if (user && dbTemplates && dbTemplates.length > 0) {
              try {
                const startOfMonth = new Date();
                startOfMonth.setDate(1);
                startOfMonth.setHours(0, 0, 0, 0);
                
                const templateIds = dbTemplates.map(t => t.id);
                const { data: downloads } = await supabase
                  .from('user_document_downloads')
                  .select('template_id')
                  .eq('user_id', user.id)
                  .in('template_id', templateIds)
                  .gte('created_at', startOfMonth.toISOString());
                
                // Count downloads per template
                if (downloads) {
                  downloads.forEach(d => {
                    const templateId = d.template_id;
                    const current = templateDownloadCounts.get(templateId) || 0;
                    templateDownloadCounts.set(templateId, current + 1);
                  });
                }
              } catch (e) {
                // Error handled silently for security
              }
            }
            
            // Fetch broker membership template requirements in parallel
            const brokerTemplateRequirements = new Map<string, boolean>();
            if (hasBrokerMembership && dbTemplates) {
              try {
                const templateIds = dbTemplates.map(t => t.id);
                const { data: templateData } = await supabase
                  .from('document_templates')
                  .select('id, requires_broker_membership')
                  .in('id', templateIds);
                
                if (templateData) {
                  templateData.forEach(t => {
                    brokerTemplateRequirements.set(t.id, t.requires_broker_membership || false);
                  });
                }
              } catch (e) {
                // Error handled silently for security
              }
            }
            
            // Enrich activeTemplates with plan information and check permissions
            activeTemplates = activeTemplates.map(t => {
              const fileName = (t.file_name || t.name || '').replace('.docx', '').toLowerCase();
              const dbTemplate = templateMap.get(fileName);
              
              let canDownload = false; // Default to false - must have explicit permission
              // CRITICAL: Preserve plan_name from API (template's required plan from CMS)
              // Don't override with user's plan - API already returns the correct template restriction
              let planName: string | null = t.plan_name || null;  // Use plan_name from API response
              let planTier: string | null = t.plan_tier || null;  // Use plan_tier from API response
              let remainingDownloads: number | null = null;
              let maxDownloads: number | null = null;
              
              // Always use user's plan max_downloads if user is logged in
              // This ensures we show the correct limit even if template doesn't have restrictions
              if (userPlanId && userPlanDetails) {
                // Use userMaxDownloads - it's already set from the plan fetch above
                // userMaxDownloads can be: null (unlimited), a number, or undefined (if not set yet)
                // If undefined, we haven't fetched the plan yet, so don't set a default here
                if (userMaxDownloads !== undefined) {
                  maxDownloads = userMaxDownloads; // Can be null (unlimited) or a number
                  if (maxDownloads !== null) {
                    remainingDownloads = Math.max(0, maxDownloads - userCurrentDownloads);
                  } else {
                    remainingDownloads = null; // Unlimited
                  }
                } else {
                  // Plan fetch might have failed - try to get from userPlanDetails
                  const planMaxValue = userPlanDetails.max_downloads_per_month;
                  if (planMaxValue === -1 || planMaxValue === '-1') {
                    maxDownloads = null; // Unlimited
                    remainingDownloads = null;
                  } else if (planMaxValue !== null && planMaxValue !== undefined && planMaxValue !== '') {
                    const numValue = typeof planMaxValue === 'string' ? parseInt(planMaxValue, 10) : planMaxValue;
                    if (!isNaN(numValue) && numValue >= 0) {
                      maxDownloads = numValue;
                      remainingDownloads = Math.max(0, numValue - userCurrentDownloads);
                    }
                  }
                }
                
                // DON'T override plan_name here - keep the template's required plan from API
                // planName and planTier are already set from API response above
              }
              
              if (dbTemplate) {
                // Find permission for this template
                const templatePerm = permissions?.find(p => p.template_id === dbTemplate.id);
                
                // Get per-template download limit
                let perTemplateLimit: number | null = null;
                if (templatePerm && templatePerm.max_downloads_per_template !== null && templatePerm.max_downloads_per_template !== undefined) {
                  perTemplateLimit = templatePerm.max_downloads_per_template;
                } else if (userPlanDetails && !hasBrokerMembership) {
                  // Fallback to plan-level limit if no per-template limit
                  const planMaxValue = userPlanDetails.max_downloads_per_month;
                  if (planMaxValue !== null && planMaxValue !== undefined && planMaxValue !== -1) {
                    perTemplateLimit = typeof planMaxValue === 'string' ? parseInt(planMaxValue, 10) : planMaxValue;
                  }
                }
                
                // Get download count for THIS template from pre-fetched data
                const templateCurrentDownloads = templateDownloadCounts.get(dbTemplate.id) || 0;
                
                // Calculate remaining downloads for this template
                let templateRemainingDownloads: number | null = null;
                if (perTemplateLimit !== null) {
                  templateRemainingDownloads = Math.max(0, perTemplateLimit - templateCurrentDownloads);
                }
                
                // Use per-template limit instead of plan-level
                maxDownloads = perTemplateLimit;
                remainingDownloads = templateRemainingDownloads;
                
                // CRITICAL: Don't override plan_name here - use what came from API
                // The API already returns the template's required plan from CMS
                // Only override for broker membership (special case)
                if (hasBrokerMembership) {
                  // Broker membership check
                  if (templatePerm) {
                    canDownload = templatePerm.can_download === true;
                    // Only override plan_name if template requires broker membership
                    const requiresBroker = brokerTemplateRequirements.get(dbTemplate.id) || false;
                    if (requiresBroker) {
                      planName = 'Broker Membership';
                      planTier = 'broker';
                    }
                  } else {
                    // Check if template requires broker membership (from pre-fetched data)
                    const requiresBroker = brokerTemplateRequirements.get(dbTemplate.id) || false;
                    if (requiresBroker) {
                      canDownload = true;
                      planName = 'Broker Membership';
                      planTier = 'broker';
                    } else {
                      canDownload = false;
                    }
                  }
                } else if (userPlanId) {
                  // Subscription plan check - use can_download from API, don't override plan_name
                  if (templatePerm) {
                    canDownload = templatePerm.plan_id === userPlanId && templatePerm.can_download === true;
                    // Don't override plan_name - keep what came from API
                  } else {
                    canDownload = false;
                    // Don't override plan_name - keep what came from API (template's required plan)
                  }
                } else {
                  // User not logged in - use can_download from API
                  if (templatePerm) {
                    canDownload = false;
                    // Don't override plan_name - keep what came from API
                  } else {
                    canDownload = true;
                  }
                }
              } else if (userPlanId || hasBrokerMembership) {
                // Template not in database, but user is logged in
                canDownload = true;
              } else {
                // Template not in database and user not logged in - allow (public template)
                canDownload = true;
              }
              
              return {
                ...t,
                id: dbTemplate?.id || t.id,
                plan_name: planName,
                plan_tier: planTier,
                can_download: canDownload,
                max_downloads: maxDownloads,
                remaining_downloads: remainingDownloads,
                current_downloads: templateCurrentDownloads || userCurrentDownloads,
                // Store user's plan info in template for plan matching in render
                _user_plan_tier: userPlanDetails?.plan_tier || null,
                _user_plan_name: userPlanDetails?.plan_name || null
              };
            });
          } else if (userPlanId && userMaxDownloads !== undefined) {
            // No database templates, but user is logged in - enrich with user's plan data
            activeTemplates = activeTemplates.map(t => ({
              ...t,
              max_downloads: userMaxDownloads,
              remaining_downloads: userMaxDownloads !== null 
                ? Math.max(0, userMaxDownloads - userCurrentDownloads)
                : null,
              current_downloads: userCurrentDownloads
            }));
          }
        } catch (planError) {
          // If plan enrichment fails, just use templates without plan info
          // This is expected if database is not available or user doesn't have access
        }
        
        setTemplates(activeTemplates);
      } else {
        const errorText = await response.text();
        // Failed to fetch templates
        toast.error(`Failed to fetch templates: ${response.status}`);
      }
    } catch (error: any) {
      // Error fetching templates
      toast.error(`Error fetching templates: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const processDocument = async (template: DocumentTemplate) => {
    const templateKey = template.id || template.file_name || template.name;
    
    // Enhanced lock/unlock check - MUST MATCH the render logic exactly
    // Use the SAME plan matching logic as the render section
    let hasPermission = true; // Start with true, then check restrictions
    
    // Get template's plan info
    const planName = template.plan_name || null;
    const templatePlanTiers = template.plan_tiers || [];
    
    // Check 1: If user is not logged in and template requires a plan, lock it
    if (!user?.id) {
      if (planName && planName !== 'All Plans' && planName !== null) {
        hasPermission = false;
      } else if (templatePlanTiers.length > 0) {
        hasPermission = false;
      }
    }
    
    // Check 2: If user is logged in, compare template's required plan with user's plan
    if (user?.id) {
      // Get user's plan from template object (stored during enrichment) or from state (fallback)
      const templateUserPlanTier = template._user_plan_tier !== undefined ? template._user_plan_tier : userPlanTier;
      const templateUserPlanName = template._user_plan_name !== undefined ? template._user_plan_name : userPlanName;
      
      // Normalize plan tiers to lowercase for comparison
      const normalizedUserPlanTier = templateUserPlanTier ? templateUserPlanTier.toLowerCase().trim() : null;
      const normalizedTemplatePlanTiers = templatePlanTiers.map(tier => tier ? tier.toLowerCase().trim() : '').filter(tier => tier);
      
      // First check plan_tiers array
      if (normalizedTemplatePlanTiers.length > 0) {
        if (!normalizedUserPlanTier || !normalizedTemplatePlanTiers.includes(normalizedUserPlanTier)) {
          // User's plan tier is not in template's allowed tiers - LOCK IT
          hasPermission = false;
        } else {
          // User's tier IS in the allowed tiers - UNLOCK IT
          hasPermission = true;
        }
      } else if (planName && planName !== 'All Plans' && planName !== null) {
        // If no plan_tiers but has plan_name, compare plan names (case-insensitive)
        const normalizedPlanName = planName.toLowerCase().trim();
        const normalizedUserPlanName = templateUserPlanName ? templateUserPlanName.toLowerCase().trim() : null;
        
        // Extract tier from plan name (e.g., "Enterprise Plan" -> "enterprise")
        const planNameTier = normalizedPlanName.replace(/\s*plan\s*$/i, '').trim();
        const userPlanNameTier = normalizedUserPlanName ? normalizedUserPlanName.replace(/\s*plan\s*$/i, '').trim() : null;
        
        // Check if plan names match OR if extracted tiers match OR if user tier matches plan name tier
        const planNamesMatch = normalizedPlanName === normalizedUserPlanName;
        const tiersMatch = planNameTier === userPlanNameTier || planNameTier === normalizedUserPlanTier;
        const userTierMatchesPlanName = normalizedUserPlanTier && (normalizedPlanName.includes(normalizedUserPlanTier) || planNameTier === normalizedUserPlanTier);
        
        // Also check if plan name contains user tier or vice versa (e.g., "Professional Plan" contains "professional")
        const planNameContainsTier = normalizedUserPlanTier && normalizedPlanName.includes(normalizedUserPlanTier);
        const tierMatchesPlanName = normalizedUserPlanTier && planNameTier === normalizedUserPlanTier;
        
        if (!normalizedUserPlanName && !normalizedUserPlanTier) {
          // User has no plan but template requires one - LOCK IT
          hasPermission = false;
        } else if (planNamesMatch || tiersMatch || userTierMatchesPlanName || planNameContainsTier || tierMatchesPlanName) {
          // Plan matches - UNLOCK IT (trust plan check over API)
          hasPermission = true;
        } else {
          // Template requires different plan than user has - LOCK IT
          hasPermission = false;
        }
      }
    }
    
    // Check 3: If can_download is explicitly false (API says user can't download), 
    // BUT: If our plan check says the user has access, TRUST THE PLAN CHECK over API
    if (template.can_download === false) {
      if (!hasPermission) {
        // Both API and plan check say no - lock it
        hasPermission = false;
      }
      // If plan check says yes, keep hasPermission = true (trust plan check)
    }
    
    // Check 4: Remaining downloads (per-template or plan-level)
    const hasRemainingDownloads = template.remaining_downloads === undefined || 
                                 template.remaining_downloads === null || 
                                 template.remaining_downloads > 0;
    
    // Final check: Both permission AND remaining downloads must be true
    const canDownload = hasPermission && hasRemainingDownloads;
    const isLocked = !canDownload;
    
    // Lock check with detailed error messages
    if (isLocked) {
      const templateName = template.title || template.name || template.file_name || 'this template';
      
      if (!hasPermission) {
        // Locked due to plan permission
        if (template.plan_name) {
          toast.error(`This template requires ${template.plan_name} plan. Please upgrade to access this template.`, {
            duration: 5000
          });
      } else {
          toast.error('This template is not available in your current plan. Please upgrade to access this template.', {
            duration: 5000
          });
        }
      } else if (!hasRemainingDownloads) {
        // Locked due to download limit reached
        if (template.max_downloads !== null && template.max_downloads !== undefined) {
          toast.error(`Your monthly downloads for ${templateName} are finished (${template.max_downloads}/${template.max_downloads} used). Please upgrade your plan for more downloads.`, {
            duration: 5000
          });
        } else {
          toast.error(`Your monthly downloads for ${templateName} are finished for this month. Please upgrade your plan for more downloads.`, {
            duration: 5000
          });
        }
      } else {
        // Generic lock message
        toast.error('You do not have permission to download this template.', {
          duration: 5000
        });
      }
      return;
    }
    
    try {
      setProcessingStatus(prev => ({
        ...prev,
        [templateKey]: {
          status: 'processing',
          message: 'Downloading',
          progress: 10
        }
      }));

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProcessingStatus(prev => {
          const current = prev[templateKey];
          if (current && current.status === 'processing' && current.progress && current.progress < 95) {
            return {
              ...prev,
              [templateKey]: {
                ...current,
                progress: Math.min(current.progress + 8, 95),
                message: 'Downloading'
              }
            };
          }
          return prev;
        });
      }, 400);

      const timeoutId = setTimeout(() => {
        clearInterval(progressInterval);
        setProcessingStatus(prev => ({
          ...prev,
          [templateKey]: {
            status: 'failed',
            message: 'Request timeout'
          }
        }));
        toast.error('Request timeout - please try again');
      }, 30000);

      // Send request to backend - EXACTLY like CMS does (which works perfectly!)
      // CMS sends ONLY: template_name and vessel_imo (no template_id, no user_id)
      
      // Validate vessel_imo first
      const vesselImoTrimmed = String(vesselImo || '').trim();
      if (!vesselImoTrimmed || vesselImoTrimmed === '') {
        toast.error('Vessel IMO is missing. Please try again.');
        setProcessingStatus(prev => ({
          ...prev,
          [templateKey]: {
            status: 'failed',
            message: 'Vessel IMO missing'
          }
        }));
        return;
      }

      // Get template_name from template (like CMS does)
      // CMS uses templateName directly, we need to get it from template.file_name or template.name
      let templateName = '';
      if (template.file_name) {
        templateName = String(template.file_name).trim();
      } else if (template.name) {
        templateName = String(template.name).trim();
      } else {
        toast.error('Template name is missing. Please refresh and try again.');
        setProcessingStatus(prev => ({
          ...prev,
          [templateKey]: {
            status: 'failed',
            message: 'Template name missing'
          }
        }));
        return;
      }

      // Remove .docx extension if present (CMS sends it without extension)
      if (templateName.toLowerCase().endsWith('.docx')) {
        templateName = templateName.slice(0, -5);
      }

      // Final validation
      if (!templateName || templateName === '' || templateName === 'null' || templateName === 'undefined') {
        toast.error('Invalid template name. Please refresh and try again.');
        setProcessingStatus(prev => ({
          ...prev,
          [templateKey]: {
            status: 'failed',
            message: 'Invalid template name'
          }
        }));
        return;
      }

      // Build request data - CMS style (simple and works!)
      const requestData: any = {
        template_name: templateName,
        vessel_imo: vesselImoTrimmed
      };
      
      // DO NOT send template_id or user_id - CMS doesn't send them and it works!

      let response;
      try {
        response = await fetch(`${API_BASE_URL}/generate-document`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(requestData),
        });
      } catch (fetchError) {
        // Network error
        setProcessingStatus(prev => ({
          ...prev,
          [templateKey]: {
            status: 'failed',
            message: 'Network error - please check your connection'
          }
        }));
        toast.error('Network error. Please try again.');
        return;
      }

      clearInterval(progressInterval);
      clearTimeout(timeoutId);

      if (response.ok) {
        const contentDisposition = response.headers.get('Content-Disposition');
        const templateName = template.file_name || template.name || 'template';
        const apiTemplateName = templateName.replace('.docx', '');
        let filename = `${apiTemplateName}_${vesselImo}.pdf`;
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch) {
            filename = filenameMatch[1].replace(/['"]/g, '').trim();
          }
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setProcessingStatus(prev => ({
          ...prev,
          [templateKey]: {
            status: 'completed',
            message: 'Downloaded successfully',
            progress: 100
          }
        }));
        
        toast.success('Document downloaded successfully');
      } else {
        // Try to get error message from response
        // Note: response body can only be read once, so we clone it
        let errorMessage = `Failed to process (${response.status})`;
        try {
          // Clone response to read it without consuming the original
          const responseClone = response.clone();
          const errorData = await responseClone.json();
          if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          }
        } catch (e) {
          // If response is not JSON, try text
          try {
            const responseClone = response.clone();
            const errorText = await responseClone.text();
            if (errorText) {
              errorMessage = errorText.substring(0, 200); // Limit length
            }
          } catch (textError) {
            // Use default message
          }
        }
        
        setProcessingStatus(prev => ({
          ...prev,
          [templateKey]: {
            status: 'failed',
            message: `Failed (${response.status})`
          }
        }));
        
        // Handle different error status codes with actual error message
        if (response.status === 404) {
          toast.error(`Template or vessel not found: ${errorMessage}`);
        } else if (response.status === 403) {
          toast.error(`Permission denied: ${errorMessage}`);
        } else if (response.status === 500) {
          toast.error(`Server error: ${errorMessage}`);
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      // Error processing document
      setProcessingStatus(prev => ({
        ...prev,
        [templateKey]: {
          status: 'failed',
          message: 'Processing error',
          progress: 0
        }
      }));
      toast.error('Error processing file');
    }
  };

  const getStatusIcon = (status: ProcessingStatus['status']) => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: ProcessingStatus['status']) => {
    switch (status) {
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading templates...</span>
      </div>
    );
  }

  return (
    <div>
        {templates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No templates available.</p>
            <p className="text-sm">Contact your administrator to upload templates.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={fetchTemplates}
            >
              Refresh Templates
            </Button>
          </div>
        ) : (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Available Document Templates ({templates.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates.map((template) => {
              const templateKey = template.id || template.file_name || template.name;
              const status = processingStatus[templateKey];
              const isProcessing = status?.status === 'processing';
              
              // Get display values
              const displayName = template.metadata?.display_name || 
                                 template.name || 
                                 template.title || 
                                 (template.file_name ? template.file_name.replace('.docx', '') : '') || 
                                 'Unknown Template';
              
              const description = template.description || 
                                 template.metadata?.description || 
                                 '';
              
              // CRITICAL: Use plan_name directly from template (comes from backend with template's required plan from CMS)
              const planName = template.plan_name || null;  // Don't fallback to plan_tier, use only plan_name from API
              
              // Enhanced lock/unlock check - matches plan system logic
              // CRITICAL: Check if template's required plan matches user's plan FIRST
              // Then check can_download from API
              let hasPermission = true; // Start with true, then check restrictions
              
              // Get template's plan tiers (array of tiers that can access this template)
              const templatePlanTiers = template.plan_tiers || [];
              
              // Check 1: If user is not logged in and template requires a plan, lock it
              if (!user?.id) {
                if (planName && planName !== 'All Plans' && planName !== null) {
                  hasPermission = false;
                } else if (templatePlanTiers.length > 0) {
                  hasPermission = false;
                }
              }
              
              // Check 2: If user is logged in, compare template's required plan with user's plan
              // Use plan info stored in template object (more reliable than state)
              if (user?.id) {
                // Get user's plan from template object (stored during enrichment) or from state (fallback)
                const templateUserPlanTier = template._user_plan_tier !== undefined ? template._user_plan_tier : userPlanTier;
                const templateUserPlanName = template._user_plan_name !== undefined ? template._user_plan_name : userPlanName;
                
                // Normalize plan tiers to lowercase for comparison
                const normalizedUserPlanTier = templateUserPlanTier ? templateUserPlanTier.toLowerCase().trim() : null;
                const normalizedTemplatePlanTiers = templatePlanTiers.map(tier => tier ? tier.toLowerCase().trim() : '').filter(tier => tier);
                
                // First check plan_tiers array
                if (normalizedTemplatePlanTiers.length > 0) {
                  if (!normalizedUserPlanTier || !normalizedTemplatePlanTiers.includes(normalizedUserPlanTier)) {
                    // User's plan tier is not in template's allowed tiers - LOCK IT
                    hasPermission = false;
                  } else {
                    // User's tier IS in the allowed tiers - UNLOCK IT
                    hasPermission = true;
                  }
                } else if (planName && planName !== 'All Plans' && planName !== null) {
                  // If no plan_tiers but has plan_name, compare plan names (case-insensitive)
                  const normalizedPlanName = planName.toLowerCase().trim();
                  const normalizedUserPlanName = templateUserPlanName ? templateUserPlanName.toLowerCase().trim() : null;
                  
                  // Extract tier from plan name (e.g., "Enterprise Plan" -> "enterprise")
                  const planNameTier = normalizedPlanName.replace(/\s*plan\s*$/i, '').trim();
                  const userPlanNameTier = normalizedUserPlanName ? normalizedUserPlanName.replace(/\s*plan\s*$/i, '').trim() : null;
                  
                  // Check if plan names match OR if extracted tiers match OR if user tier matches plan name tier
                  const planNamesMatch = normalizedPlanName === normalizedUserPlanName;
                  const tiersMatch = planNameTier === userPlanNameTier || planNameTier === normalizedUserPlanTier;
                  const userTierMatchesPlanName = normalizedUserPlanTier && (normalizedPlanName.includes(normalizedUserPlanTier) || planNameTier === normalizedUserPlanTier);
                  
                  // Also check if plan name contains user tier or vice versa (e.g., "Professional Plan" contains "professional")
                  const planNameContainsTier = normalizedUserPlanTier && normalizedPlanName.includes(normalizedUserPlanTier);
                  const tierMatchesPlanName = normalizedUserPlanTier && planNameTier === normalizedUserPlanTier;
                  
                  if (!normalizedUserPlanName && !normalizedUserPlanTier) {
                    // User has no plan but template requires one - LOCK IT
                    hasPermission = false;
                  } else if (planNamesMatch || tiersMatch || userTierMatchesPlanName || planNameContainsTier || tierMatchesPlanName) {
                    // Plan matches - UNLOCK IT (multiple ways to match)
                    hasPermission = true;
                  } else {
                    // Template requires different plan than user has - LOCK IT
                    hasPermission = false;
                  }
                }
              }
              
              // Check 3: If can_download is explicitly false (API says user can't download), lock it
              // BUT: If our plan check says the user has access, TRUST THE PLAN CHECK over API
              // The API might return can_download: false even if plan matches, so we trust our plan check first
              if (template.can_download === false) {
                if (hasPermission) {
                  // API says no, but our plan check says yes - trust the plan check
                  // Keep hasPermission = true (don't override)
                } else {
                  // API says no and plan check also says no - lock it
                  hasPermission = false;
                }
              } else if (template.can_download === true && !hasPermission) {
                // API says yes but plan check says no - trust the plan check (more restrictive)
                // Keep hasPermission = false (don't override)
              }
              
              // Check 2: Remaining downloads (per-template or plan-level)
              const hasRemainingDownloads = template.remaining_downloads === undefined || 
                                           template.remaining_downloads === null || 
                                           template.remaining_downloads > 0;
              
              // Final check: Both permission AND remaining downloads must be true
              const canDownload = hasPermission && hasRemainingDownloads;
              const isLocked = !canDownload;
              
              return (
                <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(status?.status || 'idle')}
                      <div className="flex-1 min-w-0">
                        {/* Template Display Name */}
                        <h4 className="font-medium text-base">{displayName}</h4>
                        
                        {/* Plan Information - Show if user is logged in or template requires a plan */}
                        {planName && (
                          <div className="mt-1">
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium text-primary">Plan:</span> {planName}
                              {!canDownload && (
                                <span className="ml-2 text-xs text-orange-600 dark:text-orange-400">
                                  (Required)
                                </span>
                              )}
                            </p>
                          </div>
                        )}
                        
                        {/* Description - Always show */}
                        <div className="mt-1.5">
                          {description && description.trim() ? (
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                              {description}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground/60 italic">
                              No description available
                            </p>
                          )}
                        </div>
                        
                        {/* Download Counter - Per-template limit display */}
                        {user?.id && (
                          <div className="mt-2">
                            {/* Only show unlimited if max_downloads is explicitly null */}
                            {template.max_downloads === null ? (
                              <div className="text-xs text-muted-foreground">
                                <span className="font-medium">Downloads for {displayName}:</span> <span className="text-blue-600 dark:text-blue-400 font-semibold">Unlimited</span>
                              </div>
                            ) : template.max_downloads !== undefined && template.max_downloads !== null ? (
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 text-xs">
                                  <span className="font-medium text-muted-foreground">
                                    {template.remaining_downloads !== undefined && 
                                     template.remaining_downloads !== null 
                                      ? `${template.remaining_downloads} / ${template.max_downloads} downloads remaining for ${displayName}`
                                      : `${template.max_downloads} downloads per month for ${displayName}`}
                                  </span>
                                  <span className={`font-semibold ${
                                    template.remaining_downloads !== undefined && 
                                    template.remaining_downloads !== null && 
                                    template.remaining_downloads > 0 
                                      ? 'text-green-600 dark:text-green-400' 
                                      : template.remaining_downloads === 0
                                      ? 'text-red-600 dark:text-red-400'
                                      : 'text-gray-600 dark:text-gray-400'
                                  }`}>
                                  </span>
                                </div>
                                {template.remaining_downloads !== undefined && 
                                 template.remaining_downloads !== null && 
                                 template.remaining_downloads === 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    Limit Reached
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground">
                                <span className="font-medium">Downloads for {displayName}:</span> <span className="text-gray-500">Loading limit...</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Enhanced Lock Message - Show if cannot download */}
                        {isLocked && (
                          <div className="flex items-center gap-2 mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                            <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                            <div className="flex-1">
                              {template.remaining_downloads !== undefined && 
                               template.remaining_downloads !== null && 
                               template.remaining_downloads <= 0 ? (
                                <div>
                                <span className="text-xs font-medium text-amber-800 dark:text-amber-200 block">
                                    🔒 Locked: Your monthly downloads for {displayName} are finished
                                </span>
                                  {template.max_downloads !== null && template.max_downloads !== undefined && (
                                    <span className="text-xs text-amber-700 dark:text-amber-300 mt-1 block">
                                      Used: {template.max_downloads} / {template.max_downloads} downloads this month
                                    </span>
                                  )}
                                  {planName && (
                                    <span className="text-xs text-amber-700 dark:text-amber-300 mt-1 block">
                                      Upgrade to <strong>{planName}</strong> plan for more downloads
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div>
                                  <span className="text-xs font-medium text-amber-800 dark:text-amber-200 block">
                                    🔒 Locked: This template is not available in your current plan
                                  </span>
                                  {planName && (
                                    <span className="text-xs text-amber-700 dark:text-amber-300 mt-1 block">
                                      Upgrade to <strong>{planName}</strong> plan to download this document
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Processing Status */}
                        {status && (
                          <div className="mt-3">
                            {status.status === 'processing' && status.progress !== undefined && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                    {status.message}
                                  </span>
                                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                    {status.progress}%
                                  </span>
                                </div>
                                <Progress value={status.progress} className="h-2" />
                              </div>
                            )}
                            {status.status !== 'processing' && (
                              <div className="flex items-center gap-2 mt-2">
                                <Badge className={getStatusColor(status.status)}>
                                  {status.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {status.message}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => {
                        if (isLocked) {
                          // Open upgrade dialog instead of processing
                          setLockedTemplate(template);
                          setUpgradeDialogOpen(true);
                        } else if (!isProcessing) {
                          // Process document only if not locked and not processing
                          processDocument(template);
                        }
                      }}
                      disabled={isProcessing}
                      className={`${
                        isLocked 
                          ? 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 cursor-pointer' 
                          : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                      } text-white transition-colors`}
                      title={isLocked ? (
                        template.remaining_downloads !== undefined && 
                        template.remaining_downloads !== null && 
                        template.remaining_downloads <= 0
                          ? `🔒 Click to upgrade: Your monthly downloads for ${displayName} are finished (${template.max_downloads || 0}/${template.max_downloads || 0} used)`
                          : planName 
                            ? `🔒 Click to upgrade to ${planName} plan`
                            : '🔒 Click to view upgrade options'
                      ) : canDownload 
                        ? `Download ${displayName}`
                        : ''}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Downloading...
                        </>
                      ) : isLocked ? (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Upgrade to Unlock
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Upgrade Dialog for Locked Templates */}
        <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-amber-600" />
                Upgrade Required
              </DialogTitle>
              <DialogDescription>
                {lockedTemplate && (
                  <div className="mt-2">
                    <p className="font-medium text-base text-foreground mb-2">
                      {lockedTemplate.metadata?.display_name || lockedTemplate.name || lockedTemplate.title || 'This template'}
                    </p>
                    {lockedTemplate.remaining_downloads !== undefined && 
                     lockedTemplate.remaining_downloads !== null && 
                     lockedTemplate.remaining_downloads <= 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Your monthly download limit for this template has been reached.
                        </p>
                        {lockedTemplate.max_downloads !== null && lockedTemplate.max_downloads !== undefined && (
                          <p className="text-sm text-muted-foreground">
                            You've used <strong>{lockedTemplate.max_downloads}</strong> out of <strong>{lockedTemplate.max_downloads}</strong> downloads for this month.
                          </p>
                        )}
                      </div>
                    ) : lockedTemplate.plan_name ? (
                      <p className="text-sm text-muted-foreground">
                        This template requires the <strong>{lockedTemplate.plan_name}</strong> plan to access.
                        Upgrade your plan to download this document.
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        This template is not available in your current plan. Upgrade to access this document.
                      </p>
                    )}
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                      Benefits of Upgrading:
                    </h4>
                    <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1 list-disc list-inside">
                      {lockedTemplate?.plan_name && (
                        <li>Access to <strong>{lockedTemplate.plan_name}</strong> plan templates</li>
                      )}
                      <li>Unlock all premium document templates</li>
                      <li>Increase or remove download limits</li>
                      <li>Get priority support</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setUpgradeDialogOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setUpgradeDialogOpen(false);
                  navigate('/subscription');
                }}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 group"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                View Plans & Upgrade
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}

