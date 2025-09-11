-- Create oil_prices table to store real-time oil price data
CREATE TABLE public.oil_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  oil_type TEXT NOT NULL,
  symbol TEXT NOT NULL,
  current_price NUMERIC(10,2) NOT NULL,
  previous_price NUMERIC(10,2),
  price_change NUMERIC(10,2),
  price_change_percent NUMERIC(5,2),
  currency TEXT NOT NULL DEFAULT 'USD',
  unit TEXT NOT NULL DEFAULT 'barrel',
  exchange TEXT,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Add unique constraint to prevent duplicate entries for the same oil type
  UNIQUE(oil_type, symbol)
);

-- Enable Row Level Security
ALTER TABLE public.oil_prices ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to view oil prices
CREATE POLICY "Anyone can view oil prices" 
ON public.oil_prices 
FOR SELECT 
USING (true);

-- Create policy for service role to insert/update oil prices
CREATE POLICY "Service role can manage oil prices" 
ON public.oil_prices 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_oil_prices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_oil_prices_updated_at
    BEFORE UPDATE ON public.oil_prices
    FOR EACH ROW
    EXECUTE FUNCTION public.update_oil_prices_updated_at();

-- Create index for better performance on queries
CREATE INDEX idx_oil_prices_symbol ON public.oil_prices(symbol);
CREATE INDEX idx_oil_prices_last_updated ON public.oil_prices(last_updated DESC);
CREATE INDEX idx_oil_prices_oil_type ON public.oil_prices(oil_type);

-- Insert some initial oil types that we'll track
INSERT INTO public.oil_prices (oil_type, symbol, current_price, currency, unit, exchange) VALUES
  ('Brent Crude Oil', 'BRENT', 75.50, 'USD', 'barrel', 'ICE'),
  ('WTI Crude Oil', 'WTI', 72.30, 'USD', 'barrel', 'NYMEX'),
  ('Natural Gas', 'NG', 2.85, 'USD', 'MMBtu', 'NYMEX'),
  ('Heating Oil', 'HO', 2.45, 'USD', 'gallon', 'NYMEX'),
  ('Gasoline', 'RB', 2.15, 'USD', 'gallon', 'NYMEX'),
  ('Diesel', 'ULSD', 2.55, 'USD', 'gallon', 'NYMEX')
ON CONFLICT (oil_type, symbol) DO NOTHING;