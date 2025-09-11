import React from 'react';
import OilPricesComponent from '@/components/dashboard/OilPrices';

const OilPrices = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Oil Prices</h1>
        <p className="text-muted-foreground mt-2">
          Real-time oil price feeds and market analysis
        </p>
      </div>
      <OilPricesComponent />
    </div>
  );
};

export default OilPrices;