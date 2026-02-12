import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types for Supabase data
export interface BuyerCompany {
  id: string;
  name: string;
  trade_name?: string;
  address?: string;
  city?: string;
  country?: string;
  registration_number?: string;
  representative_name?: string;
  representative_title?: string;
  email?: string;
  phone?: string;
}

export interface SellerCompany {
  id: string;
  name: string;
  trade_name?: string;
  address?: string;
  city?: string;
  country?: string;
  registration_number?: string;
  representative_name?: string;
  representative_title?: string;
  email?: string;
  phone?: string;
}

export interface Port {
  id: number;
  name: string;
  country?: string;
  city?: string;
  address?: string;
  lat?: number;
  lng?: number;
}

export interface Refinery {
  id: string;
  name: string;
  country?: string;
  capacity?: number;
  operator?: string;
}

export interface OilProduct {
  id: string;
  product_code?: string;
  commodity_name?: string;
  price_basis?: string;
  incoterms?: string;
}

export interface BankAccount {
  id: string;
  company_id: string;
  bank_name: string;
  account_name: string;
  account_number?: string;
  iban?: string;
  swift_code?: string;
  bank_address?: string;
  currency?: string;
  beneficiary_address?: string;
  is_primary?: boolean;
}

export interface Vessel {
  id: number;
  name: string;
  imo: string;
  vessel_type?: string;
  flag?: string;
  deadweight?: number;
}

export interface SubscriptionPlan {
  id: string;
  plan_name: string;
  plan_tier: string;
  is_active: boolean;
}

// Hook to fetch all document-related data from Supabase
export function useSupabaseData() {
  const [loading, setLoading] = useState(false);
  const [buyerCompanies, setBuyerCompanies] = useState<BuyerCompany[]>([]);
  const [sellerCompanies, setSellerCompanies] = useState<SellerCompany[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [refineries, setRefineries] = useState<Refinery[]>([]);
  const [products, setProducts] = useState<OilProduct[]>([]);
  const [buyerBankAccounts, setBuyerBankAccounts] = useState<BankAccount[]>([]);
  const [sellerBankAccounts, setSellerBankAccounts] = useState<BankAccount[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

  const fetchBuyerCompanies = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('buyer_companies')
        .select('id, name, trade_name, address, city, country, registration_number, representative_name, representative_title, email, phone')
        .order('name');
      
      if (error) throw error;
      setBuyerCompanies(data || []);
      return data || [];
    } catch (error) {
      console.error('Failed to fetch buyer companies:', error);
      return [];
    }
  }, []);

  const fetchSellerCompanies = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('seller_companies')
        .select('id, name, trade_name, address, city, country, registration_number, representative_name, representative_title, email, phone')
        .order('name');
      
      if (error) throw error;
      setSellerCompanies(data || []);
      return data || [];
    } catch (error) {
      console.error('Failed to fetch seller companies:', error);
      return [];
    }
  }, []);

  const fetchPorts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('ports')
        .select('id, name, country, city, address, lat, lng')
        .order('name')
        .limit(500);
      
      if (error) throw error;
      setPorts(data || []);
      return data || [];
    } catch (error) {
      console.error('Failed to fetch ports:', error);
      return [];
    }
  }, []);

  const fetchRefineries = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('refineries')
        .select('id, name, country, capacity, operator')
        .order('name');
      
      if (error) throw error;
      setRefineries(data || []);
      return data || [];
    } catch (error) {
      console.error('Failed to fetch refineries:', error);
      return [];
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('oil_products')
        .select('id, product_code, commodity_name, price_basis, incoterms')
        .order('commodity_name');
      
      if (error) throw error;
      setProducts(data || []);
      return data || [];
    } catch (error) {
      console.error('Failed to fetch products:', error);
      return [];
    }
  }, []);

  const fetchBuyerBankAccounts = useCallback(async (companyId?: string) => {
    try {
      let query = supabase
        .from('buyer_company_bank_accounts')
        .select('id, company_id, bank_name, account_name, account_number, iban, swift_code, bank_address, currency, beneficiary_address, is_primary');
      
      if (companyId) {
        query = query.eq('company_id', companyId);
      }
      
      const { data, error } = await query.order('is_primary', { ascending: false });
      
      if (error) throw error;
      setBuyerBankAccounts(data || []);
      return data || [];
    } catch (error) {
      console.error('Failed to fetch buyer bank accounts:', error);
      return [];
    }
  }, []);

  const fetchSellerBankAccounts = useCallback(async (companyId?: string) => {
    try {
      let query = supabase
        .from('seller_company_bank_accounts')
        .select('id, company_id, bank_name, account_name, account_number, iban, swift_code, bank_address, currency, beneficiary_address, is_primary');
      
      if (companyId) {
        query = query.eq('company_id', companyId);
      }
      
      const { data, error } = await query.order('is_primary', { ascending: false });
      
      if (error) throw error;
      setSellerBankAccounts(data || []);
      return data || [];
    } catch (error) {
      console.error('Failed to fetch seller bank accounts:', error);
      return [];
    }
  }, []);

  const fetchVessels = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('vessels')
        .select('id, name, imo, vessel_type, flag, deadweight')
        .order('name')
        .limit(300);
      
      if (error) throw error;
      setVessels(data || []);
      return data || [];
    } catch (error) {
      console.error('Failed to fetch vessels:', error);
      return [];
    }
  }, []);

  const fetchPlans = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('id, plan_name, plan_tier, is_active')
        .eq('is_active', true)
        .order('plan_name');
      
      if (error) throw error;
      setPlans(data || []);
      return data || [];
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      return [];
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchBuyerCompanies(),
        fetchSellerCompanies(),
        fetchPorts(),
        fetchRefineries(),
        fetchProducts(),
        fetchBuyerBankAccounts(),
        fetchSellerBankAccounts(),
        fetchVessels(),
        fetchPlans(),
      ]);
    } catch (error) {
      console.error('Failed to fetch all data:', error);
      toast.error('Failed to load data from database');
    } finally {
      setLoading(false);
    }
  }, [
    fetchBuyerCompanies,
    fetchSellerCompanies,
    fetchPorts,
    fetchRefineries,
    fetchProducts,
    fetchBuyerBankAccounts,
    fetchSellerBankAccounts,
    fetchVessels,
    fetchPlans,
  ]);

  // Get table schema for placeholder mapping
  const getTableColumns = useCallback(async (tableName: string): Promise<string[]> => {
    // Map of known table columns for document placeholders
    const tableColumns: Record<string, string[]> = {
      vessels: ['id', 'name', 'imo', 'vessel_type', 'flag', 'deadweight', 'gross_tonnage', 'length_overall', 'beam', 'draft', 'year_built', 'owner', 'operator'],
      ports: ['id', 'name', 'country', 'city', 'address', 'latitude', 'longitude', 'port_type', 'facilities'],
      refineries: ['id', 'name', 'country', 'capacity', 'operator', 'city', 'address', 'status'],
      buyer_companies: ['id', 'name', 'trade_name', 'address', 'city', 'country', 'registration_number', 'representative_name', 'representative_title', 'email', 'phone', 'legal_address', 'passport_number', 'passport_country'],
      seller_companies: ['id', 'name', 'trade_name', 'address', 'city', 'country', 'registration_number', 'representative_name', 'representative_title', 'email', 'phone', 'legal_address', 'passport_number', 'passport_country'],
      oil_products: ['id', 'product_code', 'commodity_name', 'price_basis', 'incoterms', 'quality_specs', 'api_gravity', 'sulfur_content'],
      buyer_company_bank_accounts: ['id', 'company_id', 'bank_name', 'account_name', 'account_number', 'iban', 'swift_code', 'bank_address', 'currency', 'beneficiary_address', 'is_primary'],
      seller_company_bank_accounts: ['id', 'company_id', 'bank_name', 'account_name', 'account_number', 'iban', 'swift_code', 'bank_address', 'currency', 'beneficiary_address', 'is_primary'],
      broker_profiles: ['id', 'full_name', 'company_name', 'email', 'phone', 'city', 'country', 'specializations', 'license_number'],
    };

    return tableColumns[tableName] || [];
  }, []);

  // Get data counts for overview
  const getDataCounts = useCallback(() => {
    return {
      buyers: buyerCompanies.length,
      sellers: sellerCompanies.length,
      ports: ports.length,
      refineries: refineries.length,
      products: products.length,
      buyerBanks: buyerBankAccounts.length,
      sellerBanks: sellerBankAccounts.length,
      vessels: vessels.length,
      plans: plans.length,
    };
  }, [buyerCompanies, sellerCompanies, ports, refineries, products, buyerBankAccounts, sellerBankAccounts, vessels, plans]);

  return {
    loading,
    buyerCompanies,
    sellerCompanies,
    ports,
    refineries,
    products,
    buyerBankAccounts,
    sellerBankAccounts,
    vessels,
    plans,
    fetchBuyerCompanies,
    fetchSellerCompanies,
    fetchPorts,
    fetchRefineries,
    fetchProducts,
    fetchBuyerBankAccounts,
    fetchSellerBankAccounts,
    fetchVessels,
    fetchPlans,
    fetchAllData,
    getTableColumns,
    getDataCounts,
  };
}

// Available database tables for placeholder mapping
export const AVAILABLE_TABLES = [
  { id: 'vessels', name: 'Vessels', prefix: 'vessel_' },
  { id: 'ports', name: 'Ports', prefix: 'port_' },
  { id: 'refineries', name: 'Refineries', prefix: 'refinery_' },
  { id: 'buyer_companies', name: 'Buyer Companies', prefix: 'buyer_' },
  { id: 'seller_companies', name: 'Seller Companies', prefix: 'seller_' },
  { id: 'oil_products', name: 'Oil Products', prefix: 'product_' },
  { id: 'buyer_company_bank_accounts', name: 'Buyer Bank Accounts', prefix: 'buyer_bank_' },
  { id: 'seller_company_bank_accounts', name: 'Seller Bank Accounts', prefix: 'seller_bank_' },
  { id: 'broker_profiles', name: 'Broker Profiles', prefix: 'broker_' },
] as const;

// Helper to detect table from placeholder name
export function detectTableFromPlaceholder(placeholder: string): { table: string; field: string } | null {
  const lowerPlaceholder = placeholder.toLowerCase();
  
  for (const table of AVAILABLE_TABLES) {
    if (lowerPlaceholder.startsWith(table.prefix)) {
      const field = lowerPlaceholder.replace(table.prefix, '');
      return { table: table.id, field };
    }
  }
  
  return null;
}
