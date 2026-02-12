// Types for Trade Documentation Center

export interface DocumentTemplate {
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
  plan_tiers?: string[];
  remaining_downloads?: number;
  _user_plan_tier?: string | null;
  _user_plan_name?: string | null;
  max_downloads?: number;
  current_downloads?: number;
  metadata?: {
    description?: string;
    display_name?: string;
  };
}

export interface ProcessingStatus {
  status: 'idle' | 'verifying' | 'validating' | 'downloading' | 'completed' | 'failed';
  message: string;
  progress?: number;
}

export interface CommercialParty {
  id: string;
  name: string;
  country?: string;
  bank_name?: string;
  swift_code?: string;
}

export interface VesselInfo {
  imo: string;
  name: string;
  buyer?: CommercialParty;
  seller?: CommercialParty;
}

export type DocumentStatus = 'ready' | 'processing' | 'completed' | 'locked' | 'premium';

export interface DocumentCardProps {
  template: DocumentTemplate;
  status: ProcessingStatus | undefined;
  isLocked: boolean;
  isProcessing: boolean;
  onDownload: () => void;
  onUpgrade: () => void;
}
