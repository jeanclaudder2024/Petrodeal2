import { Ship } from 'lucide-react';

const LoadingFallback = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6">
            <img 
              src="/lovable-uploads/92162cb9-ec10-41e2-bb64-5e35030478d1.png" 
              alt="PetroDeallHub" 
              className="h-12 w-auto mx-auto"
            />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">
            Loading Platform...
          </h2>
          <p className="text-muted-foreground">Loading your trading platform...</p>
        <div className="mt-4 flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingFallback;