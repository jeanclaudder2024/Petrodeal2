import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ship, TestTube } from 'lucide-react';

const VesselTest: React.FC = () => {
  const handleTest = () => {
    console.log('Vessel test clicked');
    // Add your test logic here
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Vessel Test Component
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Ship className="h-8 w-8 text-blue-500" />
          <div>
            <p className="text-sm text-gray-600">
              This is a temporary test component for vessel functionality.
            </p>
            <Button 
              onClick={handleTest}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Run Test
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VesselTest;
