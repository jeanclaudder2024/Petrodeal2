import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Database, Ship, Anchor, Building2, Package, Factory, Landmark, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDocumentEntities } from './useDocumentEntities';

const tableIcons: Record<string, React.ReactNode> = {
  vessels: <Ship className="h-4 w-4 text-blue-500" />,
  ports: <Anchor className="h-4 w-4 text-cyan-500" />,
  buyer_companies: <Building2 className="h-4 w-4 text-green-500" />,
  seller_companies: <Building2 className="h-4 w-4 text-orange-500" />,
  oil_products: <Package className="h-4 w-4 text-amber-500" />,
  refineries: <Factory className="h-4 w-4 text-red-500" />,
  buyer_company_bank_accounts: <Landmark className="h-4 w-4 text-emerald-500" />,
  seller_company_bank_accounts: <Landmark className="h-4 w-4 text-rose-500" />,
};

export default function DataSourcesTab() {
  const { tableInfo, loading, refetch } = useDocumentEntities();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Available Data Sources
            </CardTitle>
            <CardDescription>
              Database tables available for document placeholder mapping
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Table</TableHead>
              <TableHead>Records</TableHead>
              <TableHead>Placeholder Prefix</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableInfo.map((table) => (
              <TableRow key={table.name}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {tableIcons[table.name] || <Database className="h-4 w-4" />}
                    <span className="font-medium">{table.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{table.name}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{table.count}</Badge>
                </TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{table.prefix}</code>
                </TableCell>
                <TableCell>
                  {table.count > 0 ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Ready
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Empty
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">How Placeholder Mapping Works</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Placeholders starting with <code className="bg-muted px-1">vessel_</code> → vessels table</li>
            <li>• Placeholders starting with <code className="bg-muted px-1">buyer_</code> → buyer_companies table</li>
            <li>• Placeholders starting with <code className="bg-muted px-1">seller_</code> → seller_companies table</li>
            <li>• Placeholders starting with <code className="bg-muted px-1">buyer_bank_</code> → buyer_company_bank_accounts table</li>
            <li>• Placeholders starting with <code className="bg-muted px-1">seller_bank_</code> → seller_company_bank_accounts table</li>
            <li>• Placeholders without matching prefix → AI generated (fallback)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
