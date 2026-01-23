import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SelectedCompany {
  id: string;
  companyId: number;
  companyName: string;
  country: string | null;
  role: string;
  productTags: string[];
  isVerified: boolean;
}

interface DealFlowContextType {
  selectedCompany: SelectedCompany | null;
  setSelectedCompany: (company: SelectedCompany | null) => void;
  clearFlow: () => void;
}

const DealFlowContext = createContext<DealFlowContextType | undefined>(undefined);

export const DealFlowProvider = ({ children }: { children: ReactNode }) => {
  const [selectedCompany, setSelectedCompany] = useState<SelectedCompany | null>(null);

  const clearFlow = () => {
    setSelectedCompany(null);
  };

  return (
    <DealFlowContext.Provider value={{ selectedCompany, setSelectedCompany, clearFlow }}>
      {children}
    </DealFlowContext.Provider>
  );
};

export const useDealFlow = () => {
  const context = useContext(DealFlowContext);
  if (context === undefined) {
    throw new Error('useDealFlow must be used within a DealFlowProvider');
  }
  return context;
};
