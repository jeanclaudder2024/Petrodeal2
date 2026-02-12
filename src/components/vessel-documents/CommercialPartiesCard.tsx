import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, MapPin, Landmark, CreditCard } from 'lucide-react';
import { CommercialParty } from './types';

interface CommercialPartiesCardProps {
  buyer?: CommercialParty | null;
  seller?: CommercialParty | null;
  loading?: boolean;
}

export default function CommercialPartiesCard({
  buyer,
  seller,
  loading
}: CommercialPartiesCardProps) {
  if (loading) {
    return (
      <Card className="bg-muted/30">
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Commercial Parties
          </CardTitle>
        </CardHeader>
        <CardContent className="py-3">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!buyer && !seller) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-transparent to-primary/5 border-primary/20">
      <CardHeader className="py-3 pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-primary">
          <Building2 className="h-4 w-4" />
          Commercial Parties
        </CardTitle>
      </CardHeader>
      <CardContent className="py-3 pt-0">
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Buyer */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Buyer
            </p>
            {buyer ? (
              <div className="space-y-1">
                <p className="font-semibold text-sm">{buyer.name}</p>
                {buyer.country && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {buyer.country}
                  </p>
                )}
                {buyer.bank_name && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Landmark className="h-3 w-3" />
                    {buyer.bank_name}
                    {buyer.swift_code && (
                      <span className="font-mono text-[10px] bg-muted px-1 rounded">
                        {buyer.swift_code}
                      </span>
                    )}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Not assigned</p>
            )}
          </div>

          {/* Seller */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Seller
            </p>
            {seller ? (
              <div className="space-y-1">
                <p className="font-semibold text-sm">{seller.name}</p>
                {seller.country && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {seller.country}
                  </p>
                )}
                {seller.bank_name && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Landmark className="h-3 w-3" />
                    {seller.bank_name}
                    {seller.swift_code && (
                      <span className="font-mono text-[10px] bg-muted px-1 rounded">
                        {seller.swift_code}
                      </span>
                    )}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Not assigned</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
