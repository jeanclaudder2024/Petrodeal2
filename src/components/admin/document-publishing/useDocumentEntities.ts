import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BuyerCompany {
  id: string;
  name: string;
  trade_name?: string;
  country?: string;
}

export interface SellerCompany {
  id: string;
  name: string;
  trade_name?: string;
  country?: string;
}

export interface Port {
  id: number;
  name: string;
  country?: string;
  city?: string;
}

export interface Product {
  id: string;
  product_code?: string;
  commodity_name?: string;
}

export interface Vessel {
  id: number;
  name: string;
  imo?: string;
  vessel_type?: string;
  flag?: string;
}

export interface BankAccount {
  id: string;
  bank_name: string;
  account_name: string;
  company_id: string;
}

export interface Refinery {
  id: string;
  name: string;
  country?: string;
}

export function useDocumentEntities() {
  const [buyers, setBuyers] = useState<BuyerCompany[]>([]);
  const [sellers, setSellers] = useState<SellerCompany[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [buyerBanks, setBuyerBanks] = useState<BankAccount[]>([]);
  const [sellerBanks, setSellerBanks] = useState<BankAccount[]>([]);
  const [refineries, setRefineries] = useState<Refinery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all entities in parallel
      const [
        buyersResult,
        sellersResult,
        portsResult,
        productsResult,
        vesselsResult,
        buyerBanksResult,
        sellerBanksResult,
        refineriesResult,
      ] = await Promise.all([
        supabase.from('buyer_companies').select('id, name, trade_name, country').order('name').limit(100),
        supabase.from('seller_companies').select('id, name, trade_name, country').order('name').limit(100),
        supabase.from('ports').select('id, name, country, city').order('name').limit(500),
        supabase.from('oil_products').select('id, product_code, commodity_name').order('commodity_name').limit(100),
        supabase.from('vessels').select('id, name, imo, vessel_type, flag').order('name').limit(300),
        supabase.from('buyer_company_bank_accounts').select('id, bank_name, account_name, company_id').order('bank_name').limit(100),
        supabase.from('seller_company_bank_accounts').select('id, bank_name, account_name, company_id').order('bank_name').limit(100),
        supabase.from('refineries').select('id, name, country').order('name').limit(100),
      ]);

      if (buyersResult.data) setBuyers(buyersResult.data);
      if (sellersResult.data) setSellers(sellersResult.data);
      if (portsResult.data) setPorts(portsResult.data);
      if (productsResult.data) setProducts(productsResult.data);
      if (vesselsResult.data) setVessels(vesselsResult.data);
      if (buyerBanksResult.data) setBuyerBanks(buyerBanksResult.data);
      if (sellerBanksResult.data) setSellerBanks(sellerBanksResult.data);
      if (refineriesResult.data) setRefineries(refineriesResult.data);

    } catch (err) {
      console.error('Failed to fetch entities:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch entities');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  // Table info for Data Sources tab
  const tableInfo = [
    { name: 'vessels', label: 'Vessels', count: vessels.length, prefix: 'vessel_' },
    { name: 'ports', label: 'Ports', count: ports.length, prefix: 'port_, departure_port_, destination_port_' },
    { name: 'buyer_companies', label: 'Buyer Companies', count: buyers.length, prefix: 'buyer_' },
    { name: 'seller_companies', label: 'Seller Companies', count: sellers.length, prefix: 'seller_' },
    { name: 'oil_products', label: 'Oil Products', count: products.length, prefix: 'product_' },
    { name: 'refineries', label: 'Refineries', count: refineries.length, prefix: 'refinery_' },
    { name: 'buyer_company_bank_accounts', label: 'Buyer Bank Accounts', count: buyerBanks.length, prefix: 'buyer_bank_' },
    { name: 'seller_company_bank_accounts', label: 'Seller Bank Accounts', count: sellerBanks.length, prefix: 'seller_bank_' },
  ];

  return {
    buyers,
    sellers,
    ports,
    products,
    vessels,
    buyerBanks,
    sellerBanks,
    refineries,
    tableInfo,
    loading,
    error,
    refetch: fetchEntities,
  };
}

// Detect which table a placeholder belongs to based on prefix
export function detectPlaceholderSource(placeholder: string): { table: string; field: string } | null {
  const lowerPlaceholder = placeholder.toLowerCase();
  
  const prefixMappings: Record<string, string> = {
    'vessel_': 'vessels',
    'buyer_bank_': 'buyer_company_bank_accounts',
    'seller_bank_': 'seller_company_bank_accounts',
    'buyer_': 'buyer_companies',
    'seller_': 'seller_companies',
    'departure_port_': 'ports',
    'destination_port_': 'ports',
    'port_': 'ports',
    'product_': 'oil_products',
    'refinery_': 'refineries',
  };

  for (const [prefix, table] of Object.entries(prefixMappings)) {
    if (lowerPlaceholder.startsWith(prefix)) {
      const field = lowerPlaceholder.replace(prefix, '');
      return { table, field };
    }
  }

  return null;
}
