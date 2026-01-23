import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { DatabaseColumn } from '../types';
import { AVAILABLE_TABLES } from '../types';

export function useDatabaseSchema() {
  const [tableColumns, setTableColumns] = useState<Record<string, DatabaseColumn[]>>({});
  const [loading, setLoading] = useState(true);

  const fetchSchema = useCallback(async () => {
    try {
      setLoading(true);
      const columns: Record<string, DatabaseColumn[]> = {};

      for (const tableName of AVAILABLE_TABLES) {
        // Fetch a single row to get column names (simple approach)
        const { data, error } = await supabase
          .from(tableName as any)
          .select('*')
          .limit(1);

        if (!error && data && data.length > 0) {
          columns[tableName] = Object.keys(data[0]).map(col => ({
            column_name: col,
            data_type: typeof data[0][col],
            is_nullable: 'YES'
          }));
        } else {
          // Fallback: use known common columns
          columns[tableName] = getDefaultColumns(tableName);
        }
      }

      setTableColumns(columns);
    } catch (err) {
      console.error('Error fetching schema:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchema();
  }, [fetchSchema]);

  return {
    tableColumns,
    loading,
    availableTables: AVAILABLE_TABLES,
    getColumnsForTable: (table: string) => tableColumns[table] || []
  };
}

function getDefaultColumns(tableName: string): DatabaseColumn[] {
  const commonColumns: Record<string, string[]> = {
    vessels: ['id', 'name', 'imo', 'mmsi', 'vessel_type', 'flag', 'status', 'gross_tonnage', 'deadweight', 'length', 'beam', 'draft', 'year_built', 'call_sign', 'owner', 'operator'],
    ports: ['id', 'name', 'country', 'city', 'port_type', 'latitude', 'longitude', 'timezone', 'status'],
    refineries: ['id', 'name', 'country', 'city', 'capacity', 'operator', 'status', 'products'],
    companies: ['id', 'name', 'email', 'phone', 'country', 'city', 'address', 'website', 'industry', 'description'],
    buyer_companies: ['id', 'name', 'email', 'phone', 'country', 'city', 'address', 'website', 'trading_regions'],
    seller_companies: ['id', 'name', 'email', 'phone', 'country', 'city', 'address', 'website', 'trading_regions'],
    broker_profiles: ['id', 'full_name', 'email', 'phone', 'company_name', 'country', 'city', 'specializations'],
    oil_products: ['id', 'name', 'category', 'description', 'specifications']
  };

  const cols = commonColumns[tableName] || ['id', 'name', 'created_at'];
  return cols.map(col => ({
    column_name: col,
    data_type: 'text',
    is_nullable: 'YES'
  }));
}
